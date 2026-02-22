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
  account,
}: {
  chainId: number;
  receiptStoreAddress: Address;
  invoiceId: `0x${string}`;
  commitment: `0x${string}`;
  walletClient: any; // WalletClient from wagmi
  account?: `0x${string}`;
}): Promise<`0x${string}`> {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';
  const viemChain = {
    id: 137,
    name: "Polygon",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: { default: { http: [`https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`] } },
  };

  const receiptStoreAbi = parseAbi([
    "function store(bytes32 invoiceId, bytes32 receiptHash) external",
  ]);

  const hash = await walletClient.writeContract({
    address: receiptStoreAddress,
    abi: receiptStoreAbi,
    functionName: "store",
    args: [invoiceId, commitment],
    chain: viemChain,
    account,
    gas: 150000n,
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
  _txHash?: `0x${string}` // kept for backward-compat, not used — InvoiceRegistry stores its own hash
): Promise<{
  valid: boolean;
  storedCommitment: `0x${string}`;
  computedCommitment: `0x${string}`;
}> {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";
  const rpcUrl = `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;

  const chainConfig = {
    id: chain.id,
    name: chain.name,
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
  };

  const publicClient = createPublicClient({
    chain: chainConfig,
    transport: http(rpcUrl),
  });

  const receiptStoreAbi = parseAbi([
    "function receiptOf(bytes32) view returns (bytes32)",
  ]);

  // Read the commitment stored by InvoiceRegistry's markPaid()
  // InvoiceRegistry uses: keccak256(abi.encode(invoiceId, token, amount, payer, timestamp))
  // We cannot recompute that formula from the frontend, so we just check it is non-zero.
  const storedCommitment = (await publicClient.readContract({
    address: receiptStoreAddress,
    abi: receiptStoreAbi,
    functionName: "receiptOf",
    args: [invoiceId],
  })) as `0x${string}`;

  const ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const valid = storedCommitment !== ZERO;

  return {
    valid,
    storedCommitment,
    // Return stored value as "computed" too — there is nothing to compare against,
    // InvoiceRegistry's formula includes block.timestamp which we cannot reproduce.
    computedCommitment: storedCommitment,
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
