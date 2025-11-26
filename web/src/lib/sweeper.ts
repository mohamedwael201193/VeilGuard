/**
 * Self-Custodial Sweeper - Wave 3
 * Locally derive stealth private keys and sweep funds to merchant safe
 * No backend, no custody - keys stay in browser memory only
 *
 * Wave 3 Updates:
 * - Fixed approve() → transfer() bug
 * - Multi-token support with dynamic decimals
 * - Auto-yield integration for swept funds
 */

import {
  type Address,
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAINS, ERC20_ABI, MERCHANT_SAFE } from "./contracts";
import { deriveStealthKeys } from "./stealthSpec";

// Token decimals mapping for formatting
const TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6,
  "USDC.e": 6,
  USDT: 6,
  DAI: 18,
  WETH: 18,
  WPOL: 18,
  tUSDC: 6,
  tUSDT: 6,
  tDAI: 18,
};

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
 * Derive the stealth private key from merchant meta keys and ephemeral public key
 * This is the key that controls funds sent to the stealth address
 *
 * @param meta - Merchant's spend and view private keys
 * @param ephemeralPubKey - Ephemeral public key from the announcement
 * @returns Stealth private key (never persisted)
 */
export function deriveStealthPriv(
  meta: { spendPriv: `0x${string}`; viewPriv: `0x${string}` },
  ephemeralPubKey: `0x${string}`
): { stealthPriv: `0x${string}`; stealthAddress: string } {
  const { stealthPriv, stealthAddress } = deriveStealthKeys(
    meta,
    ephemeralPubKey
  );
  return { stealthPriv, stealthAddress };
}

/**
 * Sweep tokens from stealth address to merchant safe
 * Wave 3: Supports multiple tokens with correct decimals
 *
 * @param stealthPriv - Derived stealth private key
 * @param chainId - Chain ID
 * @param tokenAddress - ERC20 token address
 * @param tokenSymbol - Token symbol for decimal lookup
 * @param amount - Amount to sweep (optional, defaults to full balance)
 * @returns Transaction hash
 */
export async function sweepTokens({
  stealthPriv,
  stealthAddress,
  chainId,
  tokenAddress,
  tokenSymbol = "USDC",
  amount,
}: {
  stealthPriv: `0x${string}`;
  stealthAddress: string;
  chainId: number;
  tokenAddress: Address;
  tokenSymbol?: string;
  amount?: bigint;
}): Promise<`0x${string}`> {
  if (!MERCHANT_SAFE) {
    throw new Error("MERCHANT_SAFE not configured in environment");
  }

  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  // Create wallet client from stealth private key
  const account = privateKeyToAccount(stealthPriv);

  const chainConfig = {
    id: chain.id,
    name: chain.name,
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: {
      default: {
        http: [getRpcUrl(chainId)],
      },
      public: {
        http: [getRpcUrl(chainId)],
      },
    },
  };

  const walletClient = createWalletClient({
    account,
    chain: chainConfig,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: chainConfig,
    transport: http(),
  });

  // Get balance with error handling
  let sweepAmount = amount;
  if (!sweepAmount) {
    try {
      console.log("Checking balance for address:", stealthAddress);
      console.log("Token address:", tokenAddress);

      sweepAmount = (await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [stealthAddress as Address],
        authorizationList: undefined,
      })) as bigint;

      console.log("Balance:", sweepAmount.toString());
    } catch (error) {
      console.error("Error reading balance:", error);
      throw new Error("Failed to read token balance");
    }
  }

  if (sweepAmount === 0n) {
    throw new Error("No funds to sweep");
  }

  // Get token decimals for formatting
  const decimals = TOKEN_DECIMALS[tokenSymbol] || 18;

  console.log(
    `Sweeping ${formatUnits(
      sweepAmount,
      decimals
    )} ${tokenSymbol} from ${stealthAddress} to ${MERCHANT_SAFE}`
  );

  // Transfer to merchant safe (fixed: was incorrectly using approve)
  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [MERCHANT_SAFE as Address, sweepAmount],
    account,
    chain: chainConfig,
  });

  return hash;
}

// Keep legacy function name for backwards compatibility
export const sweepUsdc = sweepTokens;

/**
 * Refund USDC from stealth address back to the original payer
 *
 * @param stealthPriv - Derived stealth private key
 * @param chainId - Chain ID
 * @param tokenAddress - ERC20 token address (USDC)
 * @param payerAddress - Original payer's address (from Transfer event)
 * @param amount - Amount to refund (optional, defaults to full balance)
 * @returns Transaction hash
 */
export async function refundUsdc({
  stealthPriv,
  chainId,
  tokenAddress,
  payerAddress,
  amount,
}: {
  stealthPriv: `0x${string}`;
  chainId: number;
  tokenAddress: Address;
  payerAddress: Address;
  amount?: bigint;
}): Promise<`0x${string}`> {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  // Create wallet client from stealth private key
  const account = privateKeyToAccount(stealthPriv);

  const chainConfig = {
    id: chain.id,
    name: chain.name,
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: {
      default: {
        http: [getRpcUrl(chainId)],
      },
      public: {
        http: [getRpcUrl(chainId)],
      },
    },
  };

  const walletClient = createWalletClient({
    account,
    chain: chainConfig,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: chainConfig,
    transport: http(),
  });

  // Get balance if amount not specified
  let refundAmount = amount;
  if (!refundAmount) {
    try {
      refundAmount = (await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
        authorizationList: undefined,
      })) as bigint;
    } catch (error) {
      console.error("Error reading balance:", error);
      throw new Error("Failed to read token balance");
    }
  }

  if (refundAmount === 0n) {
    throw new Error("No funds to refund");
  }

  console.log(
    `Refunding ${formatUnits(refundAmount, 6)} USDC from ${
      account.address
    } to ${payerAddress}`
  );

  // Transfer back to original payer (fixed: was incorrectly using approve)
  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [payerAddress, refundAmount],
    account,
    chain: chainConfig,
  });

  return hash;
}

/**
 * Get balance of a stealth address without revealing private key
 * Uses public RPC to check balance
 *
 * @param chainId - Chain ID
 * @param tokenAddress - ERC20 token address
 * @param stealthAddress - Stealth address to check
 * @returns Balance in token's smallest unit (e.g., 1000000 = 1 USDC)
 */
export async function getStealthBalance(
  chainId: number,
  tokenAddress: Address,
  stealthAddress: Address
): Promise<bigint> {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const chainConfig = {
    id: chain.id,
    name: chain.name,
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: {
      default: {
        http: [getRpcUrl(chainId)],
      },
      public: {
        http: [getRpcUrl(chainId)],
      },
    },
  };

  const publicClient = createPublicClient({
    chain: chainConfig,
    transport: http(),
  });

  try {
    const balance = (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [stealthAddress],
      authorizationList: undefined,
    })) as bigint;

    return balance;
  } catch (error) {
    console.error("Error reading balance:", error);
    throw new Error("Failed to read token balance");
  }
}
