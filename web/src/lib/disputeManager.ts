/**
 * Dispute Manager — Wave 6
 * On-chain dispute arbitration interactions with VeilDispute contract
 */

import type { DisputeData } from "@/types";
import { getChainConfig } from "@/lib/contracts";
import { createPublicClient, http, type Address, type WalletClient } from "viem";
import { polygon } from "viem/chains";
import VeilDisputeABI from "@/abi/VeilDispute.abi.json";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const RESOLUTION_MAP: Record<number, DisputeData["resolution"]> = {
  0: "Pending",
  1: "BuyerWins",
  2: "SellerWins",
  3: "SplitDecision",
  4: "Expired",
};

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
  return (chain?.dispute || ZERO_ADDR) as Address;
}

/**
 * Open a dispute for an escrow that is in Disputed status
 */
export async function openDispute(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  escrowId: number;
  buyer: Address;
  seller: Address;
  token: Address;
  amount: bigint;
  evidence: string;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilDisputeABI,
    functionName: "openDispute",
    args: [
      BigInt(params.escrowId),
      params.buyer,
      params.seller,
      params.token,
      params.amount,
      params.evidence,
    ],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Submit evidence for a dispute (buyer or seller)
 */
export async function submitEvidence(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  disputeId: number;
  evidence: string;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilDisputeABI,
    functionName: "submitEvidence",
    args: [BigInt(params.disputeId), params.evidence],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Resolve a dispute (arbitrator or owner only)
 */
export async function resolveDispute(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  disputeId: number;
  resolution: 1 | 2 | 3; // BuyerWins, SellerWins, SplitDecision
  buyerPercent: number;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilDisputeABI,
    functionName: "resolve",
    args: [BigInt(params.disputeId), params.resolution, BigInt(params.buyerPercent)],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Claim an expired dispute (auto-resolves in buyer's favor)
 */
export async function claimExpiredDispute(params: {
  chainId: number;
  walletClient: WalletClient;
  account: Address;
  disputeId: number;
}): Promise<`0x${string}`> {
  const address = getContractAddress(params.chainId);
  return await params.walletClient.writeContract({
    address,
    abi: VeilDisputeABI,
    functionName: "claimExpiredDispute",
    args: [BigInt(params.disputeId)],
    chain: polygon,
    account: params.account,
  });
}

/**
 * Get a dispute by ID (combines getDispute + getDisputeEvidence + getDisputeAmounts)
 */
export async function getDispute(
  chainId: number,
  disputeId: number
): Promise<DisputeData> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);

  const [core, evidence, amounts] = await Promise.all([
    publicClient.readContract({
      address,
      abi: VeilDisputeABI,
      functionName: "getDispute",
      args: [BigInt(disputeId)],
    } as any) as Promise<readonly [bigint, string, string, string, number, bigint, bigint, boolean]>,
    publicClient.readContract({
      address,
      abi: VeilDisputeABI,
      functionName: "getDisputeEvidence",
      args: [BigInt(disputeId)],
    } as any) as Promise<readonly [string, string]>,
    publicClient.readContract({
      address,
      abi: VeilDisputeABI,
      functionName: "getDisputeAmounts",
      args: [BigInt(disputeId)],
    } as any) as Promise<readonly [string, bigint, bigint]>,
  ]);

  return {
    id: disputeId,
    escrowId: Number(core[0]),
    buyer: core[1],
    seller: core[2],
    arbitrator: core[3],
    resolution: RESOLUTION_MAP[core[4]] || "Pending",
    buyerPercent: Number(core[5]),
    deadline: Number(core[6]),
    resolved: core[7],
    buyerEvidence: evidence[0],
    sellerEvidence: evidence[1],
    token: amounts[0],
    amount: amounts[1].toString(),
    createdAt: Number(amounts[2]),
  };
}

/**
 * Get all dispute IDs for a buyer
 */
export async function getBuyerDisputes(
  chainId: number,
  buyer: Address
): Promise<number[]> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const ids = (await publicClient.readContract({
    address,
    abi: VeilDisputeABI,
    functionName: "getBuyerDisputes",
    args: [buyer],
  } as any)) as readonly bigint[];
  return ids.map((id) => Number(id));
}

/**
 * Get all dispute IDs for a seller
 */
export async function getSellerDisputes(
  chainId: number,
  seller: Address
): Promise<number[]> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const ids = (await publicClient.readContract({
    address,
    abi: VeilDisputeABI,
    functionName: "getSellerDisputes",
    args: [seller],
  } as any)) as readonly bigint[];
  return ids.map((id) => Number(id));
}

/**
 * Get dispute linked to a specific escrow
 */
export async function getDisputeForEscrow(
  chainId: number,
  escrowId: number
): Promise<number> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const id = (await publicClient.readContract({
    address,
    abi: VeilDisputeABI,
    functionName: "getDisputeForEscrow",
    args: [BigInt(escrowId)],
  } as any)) as bigint;
  return Number(id);
}

/**
 * Get total dispute count
 */
export async function getTotalDisputes(chainId: number): Promise<number> {
  const publicClient = getPublicClient();
  const address = getContractAddress(chainId);
  const total = (await publicClient.readContract({
    address,
    abi: VeilDisputeABI,
    functionName: "totalDisputes",
    args: [],
  } as any)) as bigint;
  return Number(total);
}
