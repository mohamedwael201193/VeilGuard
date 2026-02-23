/**
 * Split Pay Manager — Wave 6
 * On-chain split payment interactions with VeilSplitPay contract
 */

import type { SplitPaymentData } from "@/types";
import { getChainConfig } from "@/lib/contracts";
import { createPublicClient, http, type Address, type WalletClient } from "viem";
import { polygon } from "viem/chains";
import VeilSplitPayABI from "@/abi/VeilSplitPay.abi.json";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

function getRpcUrl(): string {
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";
  return `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;
}

function getPublicClient() {
  return createPublicClient({
    chain: polygon,
    transport: http(getRpcUrl()),
  });
}

function getContractAddress(chainId: number): Address {
  const chain = getChainConfig(chainId);
  return (chain?.splitPay || ZERO_ADDR) as Address;
}

/**
 * Create and execute a split payment in a single transaction
 */
export async function createAndExecuteSplit(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  invoiceId?: `0x${string}`;
  token: Address;
  recipients: Address[];
  amounts: bigint[];
  memo: string;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  const invoiceId = params.invoiceId || (ZERO_BYTES32 as `0x${string}`);

  return await params.walletClient.writeContract({
    address,
    abi: VeilSplitPayABI,
    functionName: "createAndExecute",
    args: [invoiceId, params.token, params.recipients, params.amounts, params.memo],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Create a split payment definition (without executing)
 */
export async function createSplit(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  invoiceId?: `0x${string}`;
  token: Address;
  recipients: Address[];
  amounts: bigint[];
  memo: string;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  const invoiceId = params.invoiceId || (ZERO_BYTES32 as `0x${string}`);

  return await params.walletClient.writeContract({
    address,
    abi: VeilSplitPayABI,
    functionName: "createSplit",
    args: [invoiceId, params.token, params.recipients, params.amounts, params.memo],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Execute an existing split payment
 */
export async function executeSplit(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  splitId: number;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilSplitPayABI,
    functionName: "executeSplit",
    args: [BigInt(params.splitId)],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Get a split payment by ID
 */
export async function getSplit(
  chainId: number,
  splitId: number
): Promise<SplitPaymentData> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const result = (await publicClient.readContract({
    address,
    abi: VeilSplitPayABI,
    functionName: "getSplit",
    args: [BigInt(splitId)],
  } as any)) as readonly [string, string, string, readonly string[], readonly bigint[], bigint, boolean, string, bigint];

  return {
    id: splitId,
    invoiceId: result[0],
    token: result[1],
    payer: result[2],
    recipients: [...result[3]],
    amounts: result[4].map((a) => a.toString()),
    totalAmount: result[5].toString(),
    executed: result[6],
    memo: result[7],
    createdAt: Number(result[8]),
  };
}

/**
 * Get all split IDs for a payer
 */
export async function getPayerSplits(
  chainId: number,
  payer: Address
): Promise<number[]> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const ids = (await publicClient.readContract({
    address,
    abi: VeilSplitPayABI,
    functionName: "getPayerSplits",
    args: [payer],
  } as any)) as readonly bigint[];
  return ids.map((id) => Number(id));
}

/**
 * Get total split count
 */
export async function getTotalSplits(chainId: number): Promise<number> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const total = (await publicClient.readContract({
    address,
    abi: VeilSplitPayABI,
    functionName: "totalSplits",
    args: [],
  } as any)) as bigint;
  return Number(total);
}

/**
 * Calculate total from amounts array
 */
export function calculateTotal(amounts: bigint[]): bigint {
  return amounts.reduce((sum, a) => sum + a, 0n);
}

/**
 * Parse CSV for split recipients: address,amount per line
 */
export function parseSplitCSV(csv: string): { recipients: string[]; amounts: string[] } {
  const lines = csv.trim().split("\n").filter(Boolean);
  const recipients: string[] = [];
  const amounts: string[] = [];

  for (const line of lines) {
    const parts = line.split(",").map((s) => s.trim());
    if (parts.length >= 2 && parts[0].startsWith("0x")) {
      recipients.push(parts[0]);
      amounts.push(parts[1]);
    }
  }

  return { recipients, amounts };
}
