/**
 * Yield Manager - Wave 3
 *
 * Integration with Aave V3 on Polygon for productive TVL
 * Allows merchants to earn yield on swept funds
 *
 * Inspired by Katana's "death to idle assets" philosophy
 * Makes swept funds productive instead of sitting idle
 */

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
): Promise<
  Array<{
    token: string;
    apy: number;
    balance: string;
    value: string;
  }>
> {
  if (chainId !== 137) {
    return [];
  }

  const positions = [];

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
          token: symbol,
          apy,
          balance: balanceFormatted,
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
