/**
 * Merchant Index Manager — Wave 6
 * On-chain merchant registry and invoice enumeration via VeilMerchantIndex
 */

import type { MerchantProfile } from "@/types";
import { getChainConfig } from "@/lib/contracts";
import { createPublicClient, http, type Address, type WalletClient } from "viem";
import { polygon } from "viem/chains";
import VeilMerchantIndexABI from "@/abi/VeilMerchantIndex.abi.json";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

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
  return (chain?.merchantIndex || ZERO_ADDR) as Address;
}

/**
 * Register a merchant profile on-chain
 */
export async function registerMerchant(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  name: string;
  metadataURI: string;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "registerMerchant",
    args: [params.name, params.metadataURI],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Update merchant profile
 */
export async function updateMerchantProfile(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  name: string;
  metadataURI: string;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "updateProfile",
    args: [params.name, params.metadataURI],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Index an invoice for a merchant
 */
export async function indexInvoice(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  merchant: Address;
  invoiceId: `0x${string}`;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "indexInvoice",
    args: [params.merchant, params.invoiceId],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Mark an indexed invoice as paid
 */
export async function markInvoicePaidOnIndex(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  merchant: Address;
  invoiceId: `0x${string}`;
  amount: bigint;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "markInvoicePaid",
    args: [params.merchant, params.invoiceId, params.amount],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Get merchant profile from chain
 */
export async function getMerchantProfile(
  chainId: number,
  merchant: Address
): Promise<MerchantProfile> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const result = (await publicClient.readContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "getMerchantProfile",
    args: [merchant],
  } as any)) as readonly [string, string, bigint, bigint, bigint, bigint, boolean];

  return {
    address: merchant,
    name: result[0],
    metadataURI: result[1],
    totalInvoices: Number(result[2]),
    totalPaid: Number(result[3]),
    totalVolume: result[4].toString(),
    registeredAt: Number(result[5]),
    active: result[6],
  };
}

/**
 * Get paginated invoice IDs for a merchant
 */
export async function getMerchantInvoices(
  chainId: number,
  merchant: Address,
  offset: number = 0,
  limit: number = 50
): Promise<string[]> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const ids = (await publicClient.readContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "getMerchantInvoices",
    args: [merchant, BigInt(offset), BigInt(limit)],
  } as any)) as readonly string[];
  return [...ids];
}

/**
 * Get total invoice count for a merchant
 */
export async function getMerchantInvoiceCount(
  chainId: number,
  merchant: Address
): Promise<number> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const count = (await publicClient.readContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "getMerchantInvoiceCount",
    args: [merchant],
  } as any)) as bigint;
  return Number(count);
}

/**
 * Check if a merchant is registered
 */
export async function isMerchantRegistered(
  chainId: number,
  merchant: Address
): Promise<boolean> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  return (await publicClient.readContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "isMerchantRegistered",
    args: [merchant],
  } as any)) as boolean;
}

/**
 * Check if an invoice is already indexed
 */
export async function isInvoiceIndexed(
  chainId: number,
  merchant: Address,
  invoiceId: `0x${string}`
): Promise<boolean> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  return (await publicClient.readContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "isInvoiceIndexed",
    args: [merchant, invoiceId],
  } as any)) as boolean;
}

/**
 * Get total merchant count
 */
export async function getMerchantCount(chainId: number): Promise<number> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const count = (await publicClient.readContract({
    address,
    abi: VeilMerchantIndexABI,
    functionName: "getMerchantCount",
    args: [],
  } as any)) as bigint;
  return Number(count);
}
