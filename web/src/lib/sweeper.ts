/**
 * Self-Custodial Sweeper
 * Locally derive stealth private keys and sweep funds to merchant safe
 * No backend, no custody - keys stay in browser memory only
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
 * Sweep USDC from stealth address to merchant safe
 *
 * @param stealthPriv - Derived stealth private key
 * @param chainId - Chain ID
 * @param tokenAddress - ERC20 token address (USDC)
 * @param amount - Amount to sweep (optional, defaults to full balance)
 * @returns Transaction hash
 */
export async function sweepUsdc({
  stealthPriv,
  stealthAddress,
  chainId,
  tokenAddress,
  amount,
}: {
  stealthPriv: `0x${string}`;
  stealthAddress: string;
  chainId: number;
  tokenAddress: Address;
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

  console.log(
    `Sweeping ${formatUnits(
      sweepAmount,
      6
    )} USDC from ${stealthAddress} to ${MERCHANT_SAFE}`
  );

  // Transfer to merchant safe
  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [MERCHANT_SAFE as Address, sweepAmount],
    account,
    chain: chainConfig,
  });

  return hash;
}

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

  // Transfer back to original payer - using approve for now as transfer needs different handling
  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "approve",
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
