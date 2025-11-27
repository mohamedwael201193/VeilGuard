/**
 * Yield Manager - Wave 3
 *
 * Integration with Aave V3 on Polygon for productive TVL
 * Allows merchants to earn yield on swept funds
 *
 * Inspired by Katana's "death to idle assets" philosophy
 * Makes swept funds productive instead of sitting idle
 */

import type { YieldPosition } from "@/types";
import { type Address, createPublicClient, formatUnits, http } from "viem";
import { CHAINS, ERC20_ABI } from "./contracts";

// Aave V3 Pool on Polygon PoS
const AAVE_V3_POOL_POLYGON = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

// Aave aTokens on Polygon (receipt tokens)
const AAVE_ATOKENS: Record<string, Address> = {
  // Polygon Mainnet
  USDC: "0x625E7708f30cA75bfd92586e17077590C60eb4cD", // aPolUSDC
  "USDC.e": "0xA4D94019934D8333Ef880ABFFbF2FDd611C762BD", // aPolUSDC.e (bridged)
  USDT: "0x6ab707Aca953eDAeFBc4fD23bA73294241490620", // aPolUSDT
  DAI: "0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE", // aPolDAI
  WETH: "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8", // aPolWETH
};

// Aave Pool ABI (minimal for supply/withdraw)
const AAVE_POOL_ABI = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveData",
    outputs: [
      {
        components: [
          { name: "configuration", type: "uint256" },
          { name: "liquidityIndex", type: "uint128" },
          { name: "currentLiquidityRate", type: "uint128" },
          { name: "variableBorrowIndex", type: "uint128" },
          { name: "currentVariableBorrowRate", type: "uint128" },
          { name: "currentStableBorrowRate", type: "uint128" },
          { name: "lastUpdateTimestamp", type: "uint40" },
          { name: "id", type: "uint16" },
          { name: "aTokenAddress", type: "address" },
          { name: "stableDebtTokenAddress", type: "address" },
          { name: "variableDebtTokenAddress", type: "address" },
          { name: "interestRateStrategyAddress", type: "address" },
          { name: "accruedToTreasury", type: "uint128" },
          { name: "unbacked", type: "uint128" },
          { name: "isolationModeTotalDebt", type: "uint128" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Ray = 10^27 (Aave's precision)
const RAY = 10n ** 27n;

/**
 * Get RPC URL for the given chain
 */
function getRpcUrl(chainId: number): string {
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";
  return chainId === 80002
    ? `https://polygon-amoy.g.alchemy.com/v2/${apiKey}`
    : `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;
}

/**
 * Get current APY for a token on Aave
 *
 * @param chainId - Chain ID (137 for Polygon mainnet)
 * @param tokenAddress - Token address
 * @returns Current supply APY as percentage (e.g., 3.5 = 3.5%)
 */
export async function getAaveApy(
  chainId: number,
  tokenAddress: Address
): Promise<number> {
  if (chainId !== 137) {
    // Aave V3 not on testnet
    return 0;
  }

  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

  const client = createPublicClient({
    chain: {
      id: chain.id,
      name: chain.name,
      nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
      rpcUrls: {
        default: { http: [getRpcUrl(chainId)] },
        public: { http: [getRpcUrl(chainId)] },
      },
    },
    transport: http(),
  });

  try {
    const reserveData = await client.readContract({
      address: AAVE_V3_POOL_POLYGON,
      abi: AAVE_POOL_ABI,
      functionName: "getReserveData",
      args: [tokenAddress],
      authorizationList: undefined,
    });

    // currentLiquidityRate is in RAY (10^27), convert to APY %
    const liquidityRate = reserveData.currentLiquidityRate;
    const apy = (Number(liquidityRate) / Number(RAY)) * 100;

    return Math.round(apy * 100) / 100; // Round to 2 decimals
  } catch (error) {
    console.error("Failed to get Aave APY:", error);
    return 0;
  }
}

/**
 * Get aToken balance (deposited + accrued interest)
 *
 * @param chainId - Chain ID
 * @param tokenSymbol - Token symbol (USDC, USDT, etc.)
 * @param userAddress - User's wallet address
 * @returns aToken balance (includes accrued interest)
 */
export async function getAaveBalance(
  chainId: number,
  tokenSymbol: string,
  userAddress: Address
): Promise<{ balance: bigint; balanceFormatted: string }> {
  if (chainId !== 137) {
    return { balance: 0n, balanceFormatted: "0" };
  }

  const aTokenAddress = AAVE_ATOKENS[tokenSymbol];
  if (!aTokenAddress) {
    return { balance: 0n, balanceFormatted: "0" };
  }

  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

  const client = createPublicClient({
    chain: {
      id: chain.id,
      name: chain.name,
      nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
      rpcUrls: {
        default: { http: [getRpcUrl(chainId)] },
        public: { http: [getRpcUrl(chainId)] },
      },
    },
    transport: http(),
  });

  try {
    const balance = (await client.readContract({
      address: aTokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress],
      authorizationList: undefined,
    })) as bigint;

    // Get decimals based on token
    const decimals =
      tokenSymbol.includes("DAI") || tokenSymbol.includes("ETH") ? 18 : 6;
    const balanceFormatted = formatUnits(balance, decimals);

    return { balance, balanceFormatted };
  } catch (error) {
    console.error("Failed to get Aave balance:", error);
    return { balance: 0n, balanceFormatted: "0" };
  }
}

/**
 * Deposit tokens into Aave to earn yield
 *
 * @param chainId - Chain ID
 * @param tokenAddress - Token to deposit
 * @param amount - Amount to deposit
 * @param walletClient - Wallet client with signer
 * @returns Transaction hash
 */
export async function depositToAave({
  chainId,
  tokenAddress,
  amount,
  userAddress,
  walletClient,
}: {
  chainId: number;
  tokenAddress: Address;
  amount: bigint;
  userAddress: Address;
  walletClient: any;
}): Promise<`0x${string}`> {
  if (chainId !== 137) {
    throw new Error("Aave deposits only supported on Polygon mainnet");
  }

  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

  const chainConfig = {
    id: chain.id,
    name: chain.name,
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl(chainId)] },
      public: { http: [getRpcUrl(chainId)] },
    },
  };

  // Step 1: Approve Aave Pool to spend tokens
  const approveHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [AAVE_V3_POOL_POLYGON, amount],
    account: userAddress,
    chain: chainConfig,
  });

  // Wait for approval
  const publicClient = createPublicClient({
    chain: chainConfig,
    transport: http(),
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  // Step 2: Supply to Aave
  const supplyHash = await walletClient.writeContract({
    address: AAVE_V3_POOL_POLYGON,
    abi: AAVE_POOL_ABI,
    functionName: "supply",
    args: [tokenAddress, amount, userAddress, 0], // 0 = no referral
    account: userAddress,
    chain: chainConfig,
  });

  return supplyHash;
}

/**
 * Withdraw tokens from Aave
 *
 * @param chainId - Chain ID
 * @param tokenAddress - Token to withdraw
 * @param amount - Amount to withdraw (use MaxUint256 for all)
 * @param walletClient - Wallet client with signer
 * @returns Transaction hash
 */
export async function withdrawFromAave({
  chainId,
  tokenAddress,
  amount,
  userAddress,
  walletClient,
}: {
  chainId: number;
  tokenAddress: Address;
  amount: bigint;
  userAddress: Address;
  walletClient: any;
}): Promise<`0x${string}`> {
  if (chainId !== 137) {
    throw new Error("Aave withdrawals only supported on Polygon mainnet");
  }

  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);

  const chainConfig = {
    id: chain.id,
    name: chain.name,
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: {
      default: { http: [getRpcUrl(chainId)] },
      public: { http: [getRpcUrl(chainId)] },
    },
  };

  const hash = await walletClient.writeContract({
    address: AAVE_V3_POOL_POLYGON,
    abi: AAVE_POOL_ABI,
    functionName: "withdraw",
    args: [tokenAddress, amount, userAddress],
    account: userAddress,
    chain: chainConfig,
  });

  return hash;
}

/**
 * Get yield positions for all supported tokens
 *
 * @param chainId - Chain ID
 * @param userAddress - User's wallet address
 * @returns Array of yield positions with balances and APYs
 */
export async function getYieldPositions(
  chainId: number,
  userAddress: Address
): Promise<YieldPosition[]> {
  if (chainId !== 137) {
    return [];
  }

  const positions: YieldPosition[] = [];

  for (const [symbol, aTokenAddress] of Object.entries(AAVE_ATOKENS)) {
    try {
      // Find token config
      const chain = CHAINS[chainId];
      const tokenConfig = chain?.tokens.find((t) => t.symbol === symbol);
      if (!tokenConfig) continue;

      const { balance, balanceFormatted } = await getAaveBalance(
        chainId,
        symbol,
        userAddress
      );

      if (balance > 0n) {
        const apy = await getAaveApy(chainId, tokenConfig.address as Address);
        positions.push({
          protocol: "aave",
          token: symbol,
          apy,
          balance: balanceFormatted,
          amount: balanceFormatted,
          value: balanceFormatted, // For stablecoins, 1:1 with USD
        });
      }
    } catch (error) {
      console.error(`Failed to get position for ${symbol}:`, error);
    }
  }

  return positions;
}

/**
 * Calculate projected annual yield
 *
 * @param principal - Amount deposited
 * @param apy - Current APY percentage
 * @returns Projected annual yield
 */
export function calculateProjectedYield(
  principal: string,
  apy: number
): string {
  const principalNum = parseFloat(principal);
  const yield_ = principalNum * (apy / 100);
  return yield_.toFixed(2);
}

/**
 * Check if auto-yield should be enabled for a token
 * Returns true if:
 * - Token is supported on Aave
 * - Chain is Polygon mainnet
 * - APY is above minimum threshold
 */
export async function shouldEnableAutoYield(
  chainId: number,
  tokenAddress: Address,
  minApyThreshold: number = 1.0 // Default 1% minimum
): Promise<{ enabled: boolean; reason: string; apy: number }> {
  if (chainId !== 137) {
    return {
      enabled: false,
      reason: "Only available on Polygon mainnet",
      apy: 0,
    };
  }

  const apy = await getAaveApy(chainId, tokenAddress);

  if (apy < minApyThreshold) {
    return {
      enabled: false,
      reason: `APY (${apy}%) below threshold (${minApyThreshold}%)`,
      apy,
    };
  }

  return { enabled: true, reason: `Current APY: ${apy}%`, apy };
}

// ============================================================================
// MULTI-VAULT YIELD AGGREGATOR - Wave 3.5
// Routes funds to highest APY across Aave, Morpho, Compound
// Inspired by Katana's "productive TVL" philosophy
// ============================================================================

/**
 * Yield vault information for routing decisions
 */
export interface YieldVault {
  protocol: "aave" | "morpho" | "compound";
  name: string;
  address: Address;
  apy: number;
  tvl?: bigint;
  riskScore: number; // 1-10, lower is safer
}

// Protocol addresses on Polygon mainnet
const PROTOCOL_ADDRESSES = {
  aave: AAVE_V3_POOL_POLYGON as Address,
  // Morpho Blue on Polygon (when available)
  morpho: "0x0000000000000000000000000000000000000000" as Address,
  // Compound V3 USDC on Polygon (when available)
  compound: "0x0000000000000000000000000000000000000000" as Address,
};

/**
 * Get APY comparison across all supported protocols
 *
 * @param chainId - Chain ID
 * @param tokenAddress - Token to compare
 * @returns Array of vault options sorted by APY
 */
export async function compareYieldVaults(
  chainId: number,
  tokenAddress: Address
): Promise<YieldVault[]> {
  if (chainId !== 137) {
    return [];
  }

  const vaults: YieldVault[] = [];

  // Get Aave APY (primary protocol)
  try {
    const aaveApy = await getAaveApy(chainId, tokenAddress);
    vaults.push({
      protocol: "aave",
      name: "Aave V3",
      address: PROTOCOL_ADDRESSES.aave,
      apy: aaveApy,
      riskScore: 2, // Very safe, battle-tested
    });
  } catch (e) {
    console.warn("Aave APY fetch failed:", e);
  }

  // Morpho placeholder (when available on Polygon)
  // Typically offers higher APY with matched lending
  vaults.push({
    protocol: "morpho",
    name: "Morpho Blue",
    address: PROTOCOL_ADDRESSES.morpho,
    apy: 0, // Would fetch from Morpho API
    riskScore: 3,
  });

  // Compound placeholder (when available on Polygon)
  vaults.push({
    protocol: "compound",
    name: "Compound V3",
    address: PROTOCOL_ADDRESSES.compound,
    apy: 0, // Would fetch from Compound API
    riskScore: 2,
  });

  // Sort by APY descending
  return vaults
    .filter((v) => v.apy > 0 || v.protocol === "aave") // Include Aave even if 0
    .sort((a, b) => b.apy - a.apy);
}

/**
 * Get the best yield vault for a token
 *
 * @param chainId - Chain ID
 * @param tokenAddress - Token address
 * @param maxRiskScore - Maximum acceptable risk (1-10)
 * @returns Best vault or null
 */
export async function getBestYieldVault(
  chainId: number,
  tokenAddress: Address,
  maxRiskScore: number = 5
): Promise<YieldVault | null> {
  const vaults = await compareYieldVaults(chainId, tokenAddress);

  // Filter by risk tolerance and get highest APY
  const eligible = vaults.filter((v) => v.riskScore <= maxRiskScore);

  return eligible.length > 0 ? eligible[0] : null;
}

/**
 * Auto-route deposit to best yield vault
 *
 * @param params - Deposit parameters
 * @returns Transaction hash and selected vault
 */
export async function autoRouteDeposit(params: {
  chainId: number;
  tokenAddress: Address;
  amount: bigint;
  userAddress: Address;
  walletClient: unknown;
  maxRiskScore?: number;
}): Promise<{ hash: Address; vault: YieldVault }> {
  const {
    chainId,
    tokenAddress,
    amount,
    userAddress,
    walletClient,
    maxRiskScore = 5,
  } = params;

  const bestVault = await getBestYieldVault(
    chainId,
    tokenAddress,
    maxRiskScore
  );

  if (!bestVault) {
    throw new Error("No eligible yield vault found");
  }

  // Currently only Aave is implemented
  if (bestVault.protocol === "aave") {
    const hash = await depositToAave({
      chainId,
      tokenAddress,
      amount,
      userAddress,
      walletClient,
    });
    return { hash, vault: bestVault };
  }

  // Future: Add Morpho and Compound deposit implementations
  throw new Error(`Protocol ${bestVault.protocol} not yet implemented`);
}

/**
 * Get total yield positions across all protocols
 *
 * @param chainId - Chain ID
 * @param userAddress - User address
 * @returns Combined positions from all protocols
 */
export async function getAllYieldPositions(
  chainId: number,
  userAddress: Address
): Promise<{
  positions: YieldPosition[];
  totalValueUSD: number;
  weightedAvgApy: number;
}> {
  // Get Aave positions
  const aavePositions = await getYieldPositions(chainId, userAddress);

  // Future: Aggregate from Morpho, Compound, etc.
  const allPositions = [...aavePositions];

  // Calculate totals
  let totalValue = 0;
  let weightedApySum = 0;

  allPositions.forEach((pos) => {
    const value = parseFloat(pos.balance);
    totalValue += value;
    weightedApySum += value * pos.apy;
  });

  const weightedAvgApy = totalValue > 0 ? weightedApySum / totalValue : 0;

  return {
    positions: allPositions,
    totalValueUSD: totalValue,
    weightedAvgApy: Math.round(weightedAvgApy * 100) / 100,
  };
}

/**
 * Suggest rebalancing opportunities across protocols
 *
 * @param chainId - Chain ID
 * @param userAddress - User address
 * @returns Rebalancing suggestions
 */
export async function suggestRebalancing(
  chainId: number,
  userAddress: Address
): Promise<{
  suggestion: string;
  potentialGain: number;
  fromVault?: YieldVault;
  toVault?: YieldVault;
}> {
  const { positions } = await getAllYieldPositions(chainId, userAddress);

  if (positions.length === 0) {
    return { suggestion: "No positions to rebalance", potentialGain: 0 };
  }

  // Check if there's a better vault available
  for (const pos of positions) {
    // Get token address from known mappings
    const tokenAddress = Object.entries(AAVE_ATOKENS).find(
      ([symbol]) => symbol === pos.token
    )?.[1];

    if (!tokenAddress) continue;

    const vaults = await compareYieldVaults(chainId, tokenAddress as Address);
    const currentVault = vaults.find((v) => v.protocol === "aave");
    const betterVault = vaults.find(
      (v) => v.protocol !== "aave" && v.apy > (currentVault?.apy || 0)
    );

    if (betterVault && currentVault) {
      const apyDiff = betterVault.apy - currentVault.apy;
      const balance = parseFloat(pos.balance);
      const potentialGain = (balance * apyDiff) / 100;

      if (apyDiff > 0.5) {
        // At least 0.5% improvement
        return {
          suggestion: `Move ${pos.token} from ${currentVault.name} to ${
            betterVault.name
          } for +${apyDiff.toFixed(2)}% APY`,
          potentialGain,
          fromVault: currentVault,
          toVault: betterVault,
        };
      }
    }
  }

  return { suggestion: "Positions are optimally allocated", potentialGain: 0 };
}
