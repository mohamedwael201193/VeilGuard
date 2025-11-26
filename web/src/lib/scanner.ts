/**
 * Event Scanner for View-Key Inbox - Wave 3
 * Scans Announcement and Transfer events to detect incoming stealth payments
 *
 * Wave 3 Updates:
 * - Added encrypted memo decryption support
 * - Enhanced payment matching with token info
 */

import { createPublicClient, http, parseAbiItem } from "viem";
import { CHAINS } from "./contracts";
import { decryptMemo, isEncryptedMemo } from "./encryptedMemo";
import { deriveStealthKeys } from "./stealthSpec";

export type AnnouncementLog = {
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  schemeId: bigint;
  stealthAddress: `0x${string}`;
  initiator: `0x${string}`;
  ephemeralPubKey: `0x${string}`;
  metadata: `0x${string}`;
  isMine?: boolean;
  decryptedMemo?: string; // Wave 3: decrypted memo
};

export type TransferLog = {
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  tokenAddress?: `0x${string}`; // Wave 3: token address
};

/**
 * Get Announcement events from StealthHelper contract
 *
 * @param chainId - Chain ID to scan
 * @param stealthHelperAddress - StealthHelper contract address
 * @param fromBlock - Starting block number (default: 0)
 * @param toBlock - Ending block (default: 'latest')
 */
export async function getAnnouncements(
  chainId: number,
  stealthHelperAddress: `0x${string}`,
  fromBlock: bigint = 0n,
  toBlock: bigint | "latest" = "latest"
): Promise<AnnouncementLog[]> {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

  // Use Alchemy RPC for better block range support
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";
  const rpcUrl =
    chainId === 80002
      ? `https://polygon-amoy.g.alchemy.com/v2/${apiKey}`
      : `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;

  const client = createPublicClient({
    chain: {
      id: chain.id,
      name: chain.name,
      nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
      rpcUrls: {
        default: {
          http: [rpcUrl],
        },
        public: {
          http: [rpcUrl],
        },
      },
    },
    transport: http(),
  });

  // Get latest block for range calculation
  const latestBlockNum = await client.getBlockNumber();
  const toBlockNum = toBlock === "latest" ? latestBlockNum : toBlock;

  // If scanning from block 0, limit to recent blocks
  if (fromBlock === 0n) {
    // Scan last 10,000 blocks (~5 hours on Polygon) for recent payments
    // With 10-block chunks, this is 1000 API calls (acceptable for Alchemy free tier)
    const blocksToScan = 10000n;
    fromBlock =
      latestBlockNum > blocksToScan ? latestBlockNum - blocksToScan : 0n;
    console.log(`Scanning recent blocks: ${fromBlock} to latest`);
  }

  // Alchemy free tier: STRICT 10 block limit per request
  const chunkSize = 10n;
  const allLogs: any[] = [];

  // Announcement event signature (matches StealthHelper.sol)
  const announcementEvent = parseAbiItem(
    "event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed initiator, bytes ephemeralPubKey, bytes metadata)"
  );

  // Create array of chunk ranges
  const chunks: Array<{ start: bigint; end: bigint }> = [];
  for (let start = fromBlock; start <= toBlockNum; start += chunkSize) {
    const end =
      start + chunkSize - 1n > toBlockNum ? toBlockNum : start + chunkSize - 1n;
    chunks.push({ start, end });
  }

  console.log(`Scanning ${chunks.length} chunks in batches...`);

  // Scan chunks in parallel (batches of 3 to avoid rate limits)
  // Add delay between batches to stay under Alchemy free tier rate limits
  const batchSize = 3;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const promises = batch.map(async ({ start, end }) => {
      try {
        const logs = await client.getLogs({
          address: stealthHelperAddress,
          event: announcementEvent,
          fromBlock: start,
          toBlock: end,
        });
        return logs;
      } catch (error) {
        console.warn(`Failed to scan blocks ${start}-${end}:`, error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach((logs) => allLogs.push(...logs));

    // Progress indicator
    if (chunks.length > 100) {
      console.log(
        `Progress: ${Math.min(i + batchSize, chunks.length)}/${
          chunks.length
        } chunks`
      );
    }

    // Longer delay between batches to avoid rate limits (200ms)
    if (i + batchSize < chunks.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`Found ${allLogs.length} announcements`);

  return allLogs.map((log) => ({
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
    schemeId: log.args.schemeId!,
    stealthAddress: log.args.stealthAddress!,
    initiator: log.args.initiator!,
    ephemeralPubKey: log.args.ephemeralPubKey! as `0x${string}`,
    metadata: log.args.metadata! as `0x${string}`,
  }));
}

/**
 * Filter announcements that belong to the merchant (using view key)
 * Wave 3: Also decrypts encrypted memos
 *
 * @param announcements - List of announcement logs
 * @param viewPriv - Merchant's view private key
 * @param spendPriv - Merchant's spend private key (for address derivation)
 * @returns Filtered list with isMine flag set and decrypted memos
 */
export async function filterMine(
  announcements: AnnouncementLog[],
  meta: { spendPriv: `0x${string}`; viewPriv: `0x${string}` }
): Promise<AnnouncementLog[]> {
  const results: AnnouncementLog[] = [];

  for (const ann of announcements) {
    try {
      // Recompute stealth address using view key and ephemeral public key
      const { stealthAddress } = deriveStealthKeys(meta, ann.ephemeralPubKey);

      // Check if recomputed address matches announced address
      const isMine =
        stealthAddress.toLowerCase() === ann.stealthAddress.toLowerCase();

      if (isMine) {
        let decryptedMemo: string | undefined;

        // Wave 3: Try to decrypt memo if it looks encrypted
        if (ann.metadata && isEncryptedMemo(ann.metadata)) {
          try {
            decryptedMemo = await decryptMemo(
              ann.metadata,
              meta.viewPriv,
              ann.ephemeralPubKey
            );
          } catch (e) {
            console.warn("Failed to decrypt memo:", e);
            decryptedMemo = "[encrypted]";
          }
        }

        results.push({ ...ann, isMine: true, decryptedMemo });
      }
    } catch (error) {
      console.error("Error filtering announcement:", error);
    }
  }

  return results;
}

// Legacy sync version for backwards compatibility
export function filterMineSync(
  announcements: AnnouncementLog[],
  meta: { spendPriv: `0x${string}`; viewPriv: `0x${string}` }
): AnnouncementLog[] {
  return announcements
    .map((ann) => {
      try {
        const { stealthAddress } = deriveStealthKeys(meta, ann.ephemeralPubKey);
        const isMine =
          stealthAddress.toLowerCase() === ann.stealthAddress.toLowerCase();
        return { ...ann, isMine };
      } catch (error) {
        console.error("Error filtering announcement:", error);
        return { ...ann, isMine: false };
      }
    })
    .filter((ann) => ann.isMine);
}

/**
 * Get incoming Transfer events for a specific address (stealth address)
 *
 * @param chainId - Chain ID to scan
 * @param tokenAddress - ERC20 token address
 * @param toAddress - Recipient address (stealth address)
 * @param fromBlock - Starting block number (default: 0)
 * @param toBlock - Ending block (default: 'latest')
 */
export async function getIncomingTransfers(
  chainId: number,
  tokenAddress: `0x${string}`,
  toAddress: `0x${string}`,
  fromBlock: bigint = 0n,
  toBlock: bigint | "latest" = "latest"
): Promise<TransferLog[]> {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

  // Use Alchemy RPC for better block range support
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";
  const rpcUrl =
    chainId === 80002
      ? `https://polygon-amoy.g.alchemy.com/v2/${apiKey}`
      : `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;

  const client = createPublicClient({
    chain: {
      id: chain.id,
      name: chain.name,
      nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
      rpcUrls: {
        default: {
          http: [rpcUrl],
        },
        public: {
          http: [rpcUrl],
        },
      },
    },
    transport: http(),
  });

  // Get latest block for range calculation
  const latestBlockNum = await client.getBlockNumber();
  const toBlockNum = toBlock === "latest" ? latestBlockNum : toBlock;

  // If scanning from block 0, limit to recent blocks
  if (fromBlock === 0n) {
    // Scan last 10,000 blocks (~5 hours on Polygon) for recent transfers
    const blocksToScan = 10000n;
    fromBlock =
      latestBlockNum > blocksToScan ? latestBlockNum - blocksToScan : 0n;
  }

  // Alchemy free tier: STRICT 10 block limit per request
  const chunkSize = 10n;
  const allLogs: any[] = [];

  // Transfer event signature
  const transferEvent = parseAbiItem(
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  );

  // Create array of chunk ranges (10 blocks each)
  const chunks: Array<{ start: bigint; end: bigint }> = [];
  for (let start = fromBlock; start <= toBlockNum; start += chunkSize) {
    const end =
      start + chunkSize - 1n > toBlockNum ? toBlockNum : start + chunkSize - 1n;
    chunks.push({ start, end });
  }

  // Scan chunks in parallel (batches of 3 to avoid rate limits)
  const batchSize = 3;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const promises = batch.map(async ({ start, end }) => {
      try {
        const logs = await client.getLogs({
          address: tokenAddress,
          event: transferEvent,
          args: {
            to: toAddress,
          },
          fromBlock: start,
          toBlock: end,
        });
        return logs;
      } catch (error) {
        console.warn(`Failed to scan transfers ${start}-${end}:`, error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach((logs) => allLogs.push(...logs));

    // Progress indicator
    if (chunks.length > 100) {
      console.log(
        `Transfer progress: ${Math.min(i + batchSize, chunks.length)}/${
          chunks.length
        } chunks`
      );
    }

    // Longer delay between batches to avoid rate limits (200ms)
    if (i + batchSize < chunks.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`Found ${allLogs.length} transfers`);

  return allLogs.map((log) => ({
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
    from: log.args.from!,
    to: log.args.to!,
    value: log.args.value!,
  }));
}

/**
 * Match transfers to announcements
 * Returns announcements with their corresponding transfers
 */
export function matchTransfersToAnnouncements(
  announcements: AnnouncementLog[],
  transfers: TransferLog[]
): Array<AnnouncementLog & { transfer?: TransferLog }> {
  return announcements.map((ann) => {
    const transfer = transfers.find(
      (t) => t.to.toLowerCase() === ann.stealthAddress.toLowerCase()
    );
    return { ...ann, transfer };
  });
}
