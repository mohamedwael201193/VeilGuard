/**
 * Selective-Disclosure Receipts
 * Generate cryptographic commitments for invoice payments
 * Reveal only when needed for auditing or proof of payment
 */

import {
  createPublicClient,
  encodePacked,
  http,
  keccak256,
  parseAbi,
  type Address,
} from "viem";
import { CHAINS } from "./contracts";

/**
 * Create a commitment hash for a paid invoice
 * Commitment = keccak256(invoiceId || txHash)
 *
 * @param invoiceId - Invoice ID (bytes32)
 * @param txHash - Payment transaction hash
 * @returns Commitment hash
 */
export function makeCommitment(
  invoiceId: `0x${string}`,
  txHash: `0x${string}`
): `0x${string}` {
  return keccak256(encodePacked(["bytes32", "bytes32"], [invoiceId, txHash]));
}

/**
 * Store commitment on-chain in ReceiptStore contract
 *
 * @param chainId - Chain ID
 * @param receiptStoreAddress - ReceiptStore contract address
 * @param invoiceId - Invoice ID
 * @param commitment - Commitment hash
 * @param walletClient - Viem wallet client for transaction
 * @returns Transaction hash
 */
export async function storeCommitment({
  chainId,
  receiptStoreAddress,
  invoiceId,
  commitment,
  walletClient,
}: {
  chainId: number;
  receiptStoreAddress: Address;
  invoiceId: `0x${string}`;
  commitment: `0x${string}`;
  walletClient: any; // WalletClient from wagmi
}): Promise<`0x${string}`> {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const receiptStoreAbi = parseAbi([
    "function store(bytes32 invoiceId, bytes32 receiptHash) external",
  ]);

  const hash = await walletClient.writeContract({
    address: receiptStoreAddress,
    abi: receiptStoreAbi,
    functionName: "store",
    args: [invoiceId, commitment],
    gas: 100000n,
  });

  return hash;
}

/**
 * Verify a commitment on-chain
 * Recomputes commitment from invoiceId + txHash and checks against stored value
 *
 * @param chainId - Chain ID
 * @param receiptStoreAddress - ReceiptStore contract address
 * @param invoiceId - Invoice ID
 * @param txHash - Payment transaction hash
 * @returns True if commitment matches on-chain value
 */
export async function verifyCommitmentOnChain(
  chainId: number,
  receiptStoreAddress: Address,
  invoiceId: `0x${string}`,
  txHash: `0x${string}`
): Promise<{
  valid: boolean;
  storedCommitment: `0x${string}`;
  computedCommitment: `0x${string}`;
}> {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  // Use Alchemy RPC for reliable access
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";
  const rpcUrl =
    chainId === 80002
      ? `https://polygon-amoy.g.alchemy.com/v2/${apiKey}`
      : `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;

  const chainConfig = {
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
  };

  const publicClient = createPublicClient({
    chain: chainConfig,
    transport: http(),
  });

  const receiptStoreAbi = parseAbi([
    "function receiptOf(bytes32) view returns (bytes32)",
  ]);

  // Read stored commitment
  const storedCommitment = (await publicClient.readContract({
    address: receiptStoreAddress,
    abi: receiptStoreAbi,
    functionName: "receiptOf",
    args: [invoiceId],
    authorizationList: undefined,
  })) as `0x${string}`;

  // Compute expected commitment
  const computedCommitment = makeCommitment(invoiceId, txHash);

  // Check if they match
  const valid =
    storedCommitment.toLowerCase() === computedCommitment.toLowerCase() &&
    storedCommitment !==
      "0x0000000000000000000000000000000000000000000000000000000000000000";

  return {
    valid,
    storedCommitment,
    computedCommitment,
  };
}

/**
 * Generate a shareable receipt link with encoded proof data
 *
 * @param invoiceId - Invoice ID
 * @param txHash - Payment transaction hash
 * @param baseUrl - Base URL of the application (e.g., https://veilguard.app)
 * @returns Shareable URL with encoded receipt data
 */
export function generateReceiptLink(
  invoiceId: `0x${string}`,
  txHash: `0x${string}`,
  baseUrl: string = window.location.origin
): string {
  const params = new URLSearchParams({
    invoiceId,
    txHash,
  });
  return `${baseUrl}/verify?${params.toString()}`;
}

/**
 * Parse receipt link to extract invoice ID and transaction hash
 *
 * @param url - Receipt verification URL or search params
 * @returns Parsed invoice ID and transaction hash
 */
export function parseReceiptLink(url: string | URLSearchParams): {
  invoiceId: `0x${string}` | null;
  txHash: `0x${string}` | null;
} {
  const params =
    typeof url === "string" ? new URLSearchParams(url.split("?")[1]) : url;

  const invoiceId = params.get("invoiceId") as `0x${string}` | null;
  const txHash = params.get("txHash") as `0x${string}` | null;

  return { invoiceId, txHash };
}
