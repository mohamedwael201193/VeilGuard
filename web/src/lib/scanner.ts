/**
 * Event Scanner for View-Key Inbox
 * Scans Announcement and Transfer events to detect incoming stealth payments
 */

import { createPublicClient, http, parseAbiItem } from "viem";
import { CHAINS } from "./contracts";
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
};

export type TransferLog = {
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
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

  // Use public RPC to avoid Alchemy free tier block range limits
  const rpcUrl = "https://rpc-amoy.polygon.technology/";

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

  // If scanning from block 0, limit to recent blocks to avoid timeout
  // Scan last 10,000 blocks (~7 hours on Polygon) to balance speed and coverage
  if (fromBlock === 0n) {
    const latestBlock = await client.getBlockNumber();
    const blocksToScan = 10000n;
    fromBlock = latestBlock > blocksToScan ? latestBlock - blocksToScan : 0n;
    console.log(`Scanning recent blocks: ${fromBlock} to latest`);
  }

  // Announcement event signature (matches StealthHelper.sol)
  const announcementEvent = parseAbiItem(
    "event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed initiator, bytes ephemeralPubKey, bytes metadata)"
  );

  const logs = await client.getLogs({
    address: stealthHelperAddress,
    event: announcementEvent,
    fromBlock,
    toBlock,
  });

  return logs.map((log) => ({
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
 *
 * @param announcements - List of announcement logs
 * @param viewPriv - Merchant's view private key
 * @param spendPriv - Merchant's spend private key (for address derivation)
 * @returns Filtered list with isMine flag set
 */
export function filterMine(
  announcements: AnnouncementLog[],
  meta: { spendPriv: `0x${string}`; viewPriv: `0x${string}` }
): AnnouncementLog[] {
  return announcements
    .map((ann) => {
      try {
        // Recompute stealth address using view key and ephemeral public key
        const { stealthAddress } = deriveStealthKeys(meta, ann.ephemeralPubKey);

        // Check if recomputed address matches announced address
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

  // Use public RPC to avoid Alchemy free tier block range limits
  const rpcUrl = "https://rpc-amoy.polygon.technology/";

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

  // Transfer event signature
  const transferEvent = parseAbiItem(
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  );

  const logs = await client.getLogs({
    address: tokenAddress,
    event: transferEvent,
    args: {
      to: toAddress,
    },
    fromBlock,
    toBlock,
  });

  return logs.map((log) => ({
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
