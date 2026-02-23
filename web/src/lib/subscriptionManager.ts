/**
 * Subscription Manager — Wave 6
 * On-chain recurring payment interactions with VeilSubscription contract
 */

import type { SubscriptionData } from "@/types";
import { getChainConfig } from "@/lib/contracts";
import { createPublicClient, http, type Address, type WalletClient } from "viem";
import { polygon } from "viem/chains";
import VeilSubscriptionABI from "@/abi/VeilSubscription.abi.json";

const ZERO = "0x0000000000000000000000000000000000000000";

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
  return (chain?.subscription || ZERO) as Address;
}

const STATUS_MAP: Record<number, SubscriptionData["status"]> = {
  0: "Active",
  1: "Paused",
  2: "Cancelled",
  3: "Completed",
};

/**
 * Create a new subscription on-chain
 */
export async function createSubscription(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  merchant: Address;
  token: Address;
  amount: bigint;
  intervalSeconds: number;
  maxCycles: number;
  memo: string;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  const hash = await params.walletClient.writeContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "createSubscription",
    args: [
      params.merchant,
      params.token,
      params.amount,
      BigInt(params.intervalSeconds),
      BigInt(params.maxCycles),
      params.memo,
    ],
    chain: polygon,
    account: params.account,
  });
  return hash;
}

/**
 * Charge a subscription (merchant or payer)
 */
export async function chargeSubscription(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  subscriptionId: number;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "charge",
    args: [BigInt(params.subscriptionId)],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  subscriptionId: number;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "cancel",
    args: [BigInt(params.subscriptionId)],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  subscriptionId: number;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "pause",
    args: [BigInt(params.subscriptionId)],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  subscriptionId: number;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "resume",
    args: [BigInt(params.subscriptionId)],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Check if a subscription is chargeable now
 */
export async function isChargeable(
  chainId: number,
  subscriptionId: number
): Promise<boolean> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  return (await publicClient.readContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "isChargeable",
    args: [BigInt(subscriptionId)],
  } as any)) as boolean;
}

/**
 * Get a subscription by ID
 */
export async function getSubscription(
  chainId: number,
  subscriptionId: number
): Promise<SubscriptionData> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const result = (await publicClient.readContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "getSubscription",
    args: [BigInt(subscriptionId)],
  } as any)) as readonly [string, string, string, bigint, bigint, bigint, bigint, bigint, bigint, number, string, bigint];

  return {
    id: subscriptionId,
    payer: result[0],
    merchant: result[1],
    token: result[2],
    amount: result[3].toString(),
    interval: Number(result[4]),
    nextChargeAt: Number(result[5]),
    totalCharged: result[6].toString(),
    maxCycles: Number(result[7]),
    cyclesCompleted: Number(result[8]),
    status: STATUS_MAP[result[9]] || "Active",
    memo: result[10],
    createdAt: Number(result[11]),
  };
}

/**
 * Get all subscription IDs for a payer
 */
export async function getPayerSubscriptions(
  chainId: number,
  payer: Address
): Promise<number[]> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const ids = (await publicClient.readContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "getPayerSubscriptions",
    args: [payer],
  } as any)) as readonly bigint[];
  return ids.map((id) => Number(id));
}

/**
 * Get all subscription IDs for a merchant
 */
export async function getMerchantSubscriptions(
  chainId: number,
  merchant: Address
): Promise<number[]> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const ids = (await publicClient.readContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "getMerchantSubscriptions",
    args: [merchant],
  } as any)) as readonly bigint[];
  return ids.map((id) => Number(id));
}

/**
 * Get total subscription count
 */
export async function getTotalSubscriptions(chainId: number): Promise<number> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const total = (await publicClient.readContract({
    address,
    abi: VeilSubscriptionABI,
    functionName: "totalSubscriptions",
    args: [],
  } as any)) as bigint;
  return Number(total);
}

/**
 * Format interval to human-readable string
 */
export function formatInterval(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 604800) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 2592000) return `${Math.round(seconds / 604800)} weeks`;
  return `${Math.round(seconds / 2592000)} months`;
}
