/**
 * Smart Gas Manager - Wave 3
 *
 * Dynamic gas calculation for stealth address funding
 * Replaces fixed 0.1 POL with intelligent gas-price-aware calculation
 * Skips funding if stealth address already has sufficient balance
 */

import {
  createPublicClient,
  formatEther,
  formatGwei,
  http,
  parseEther,
} from "viem";
import { CHAINS } from "./contracts";

// Gas costs for sweep operation (transfer + overhead)
const SWEEP_GAS_UNITS = 65000n; // ERC20 transfer ~52k + safety margin
const GAS_BUFFER_MULTIPLIER = 1.5; // 50% buffer for gas price fluctuations

// Minimum gas to keep (avoid dust)
const MIN_GAS_THRESHOLD = parseEther("0.001"); // 0.001 POL minimum

/**
 * Get current gas price from the network
 */
export async function getCurrentGasPrice(chainId: number): Promise<bigint> {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

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
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
      },
    },
    transport: http(),
  });

  const gasPrice = await client.getGasPrice();
  return gasPrice;
}

/**
 * Get native balance (POL) for an address
 */
export async function getNativeBalance(
  chainId: number,
  address: `0x${string}`
): Promise<bigint> {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

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
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
      },
    },
    transport: http(),
  });

  const balance = await client.getBalance({ address });
  return balance;
}

/**
 * Calculate required gas funding for a stealth address sweep
 *
 * @param chainId - Chain ID
 * @returns Required gas amount in wei
 */
export async function calculateRequiredGas(chainId: number): Promise<{
  gasPrice: bigint;
  gasPriceGwei: string;
  requiredGas: bigint;
  requiredGasEther: string;
  recommendedFunding: bigint;
  recommendedFundingEther: string;
}> {
  const gasPrice = await getCurrentGasPrice(chainId);

  // Base gas cost: gas units * gas price
  const requiredGas = SWEEP_GAS_UNITS * gasPrice;

  // Add buffer for price fluctuations
  const recommendedFunding = BigInt(
    Math.ceil(Number(requiredGas) * GAS_BUFFER_MULTIPLIER)
  );

  return {
    gasPrice,
    gasPriceGwei: formatGwei(gasPrice),
    requiredGas,
    requiredGasEther: formatEther(requiredGas),
    recommendedFunding,
    recommendedFundingEther: formatEther(recommendedFunding),
  };
}

/**
 * Check if stealth address needs gas funding
 *
 * @param chainId - Chain ID
 * @param stealthAddress - Stealth address to check
 * @returns Whether funding is needed and how much
 */
export async function checkGasFundingNeeded(
  chainId: number,
  stealthAddress: `0x${string}`
): Promise<{
  needsFunding: boolean;
  currentBalance: bigint;
  currentBalanceEther: string;
  requiredFunding: bigint;
  requiredFundingEther: string;
  skipReason?: string;
}> {
  // Get current balance
  const currentBalance = await getNativeBalance(chainId, stealthAddress);

  // Get required gas
  const { recommendedFunding } = await calculateRequiredGas(chainId);

  // Check if already funded
  if (currentBalance >= recommendedFunding) {
    return {
      needsFunding: false,
      currentBalance,
      currentBalanceEther: formatEther(currentBalance),
      requiredFunding: 0n,
      requiredFundingEther: "0",
      skipReason: "Already funded",
    };
  }

  // Check if partial funding needed
  const deficit = recommendedFunding - currentBalance;

  // Skip tiny top-ups (dust)
  if (deficit < MIN_GAS_THRESHOLD) {
    return {
      needsFunding: false,
      currentBalance,
      currentBalanceEther: formatEther(currentBalance),
      requiredFunding: 0n,
      requiredFundingEther: "0",
      skipReason: "Deficit too small",
    };
  }

  return {
    needsFunding: true,
    currentBalance,
    currentBalanceEther: formatEther(currentBalance),
    requiredFunding: deficit,
    requiredFundingEther: formatEther(deficit),
  };
}

/**
 * Get optimal gas funding amount (considers current price trends)
 *
 * @param chainId - Chain ID
 * @param stealthAddress - Stealth address to fund
 * @returns Optimal funding amount
 */
export async function getOptimalGasFunding(
  chainId: number,
  stealthAddress: `0x${string}`
): Promise<{
  amount: bigint;
  amountEther: string;
  gasPriceGwei: string;
  shouldFund: boolean;
  reason: string;
}> {
  const fundingCheck = await checkGasFundingNeeded(chainId, stealthAddress);

  if (!fundingCheck.needsFunding) {
    return {
      amount: 0n,
      amountEther: "0",
      gasPriceGwei: "0",
      shouldFund: false,
      reason: fundingCheck.skipReason || "No funding needed",
    };
  }

  const { gasPriceGwei, recommendedFunding } = await calculateRequiredGas(
    chainId
  );

  // If existing balance, only top up the difference
  const fundingAmount = fundingCheck.requiredFunding;

  return {
    amount: fundingAmount,
    amountEther: formatEther(fundingAmount),
    gasPriceGwei,
    shouldFund: true,
    reason: `Current gas price: ${gasPriceGwei} gwei`,
  };
}

/**
 * Format gas info for display in UI
 */
export function formatGasInfo(
  gasInfo: Awaited<ReturnType<typeof calculateRequiredGas>>
): string {
  return `Gas: ${gasInfo.gasPriceGwei} gwei → ${gasInfo.recommendedFundingEther} POL`;
}

/**
 * Estimate total cost for invoice creation
 * Includes: tx gas + stealth funding
 */
export async function estimateInvoiceCost(chainId: number): Promise<{
  txGasCost: string;
  stealthFunding: string;
  totalCost: string;
  gasPriceGwei: string;
}> {
  const { gasPrice, gasPriceGwei, recommendedFunding } =
    await calculateRequiredGas(chainId);

  // Invoice creation tx ~100k gas
  const invoiceTxGas = 100000n * gasPrice;

  // Total
  const total = invoiceTxGas + recommendedFunding;

  return {
    txGasCost: formatEther(invoiceTxGas),
    stealthFunding: formatEther(recommendedFunding),
    totalCost: formatEther(total),
    gasPriceGwei,
  };
}
