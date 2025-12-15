/**
 * Cross-Chain Payment Support - Wave 4
 *
 * Enable cross-chain invoice payments using LayerZero/Agglayer.
 * Pay invoices on Polygon from any supported chain.
 * Aligned with 0xPolygon's interoperability focus.
 *
 * Features:
 * - Cross-chain invoice creation
 * - Multi-chain payment acceptance
 * - Bridge fee estimation
 * - Transaction tracking across chains
 */

import type { Address } from "viem";

// Supported chains for cross-chain payments
export const SUPPORTED_CHAINS = {
  POLYGON: {
    id: 137,
    name: "Polygon PoS",
    layerZeroId: 109,
    color: "#8247E5",
    nativeCurrency: "POL",
    rpcUrl: "https://polygon-rpc.com",
  },
  ETHEREUM: {
    id: 1,
    name: "Ethereum",
    layerZeroId: 101,
    color: "#627EEA",
    nativeCurrency: "ETH",
    rpcUrl: "https://eth.llamarpc.com",
  },
  ARBITRUM: {
    id: 42161,
    name: "Arbitrum One",
    layerZeroId: 110,
    color: "#28A0F0",
    nativeCurrency: "ETH",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
  },
  BASE: {
    id: 8453,
    name: "Base",
    layerZeroId: 184,
    color: "#0052FF",
    nativeCurrency: "ETH",
    rpcUrl: "https://mainnet.base.org",
  },
  OPTIMISM: {
    id: 10,
    name: "Optimism",
    layerZeroId: 111,
    color: "#FF0420",
    nativeCurrency: "ETH",
    rpcUrl: "https://mainnet.optimism.io",
  },
  AVALANCHE: {
    id: 43114,
    name: "Avalanche",
    layerZeroId: 106,
    color: "#E84142",
    nativeCurrency: "AVAX",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  },
} as const;

export type SupportedChainKey = keyof typeof SUPPORTED_CHAINS;

export interface CrossChainInvoice {
  id: string;
  polygonInvoiceId: string;
  amount: string;
  token: string;
  stealthAddress: Address;
  acceptedChains: SupportedChainKey[];
  bridgeFees: Record<SupportedChainKey, BridgeFee>;
  createdAt: number;
  expiresAt?: number;
  status: "PENDING" | "BRIDGING" | "CONFIRMING" | "PAID" | "EXPIRED";
  sourceChain?: SupportedChainKey;
  sourceTxHash?: string;
  bridgeTxHash?: string;
  destinationTxHash?: string;
}

export interface BridgeFee {
  estimatedFee: string;
  estimatedTime: number; // seconds
  protocolFee: string;
  gasFee: string;
  totalFee: string;
}

export interface CrossChainPayment {
  invoiceId: string;
  sourceChain: SupportedChainKey;
  destinationChain: "POLYGON";
  amount: string;
  token: string;
  sender: Address;
  recipient: Address;
  bridgeProtocol: "layerzero" | "agglayer" | "ccip";
  status: "INITIATED" | "BRIDGING" | "CONFIRMING" | "COMPLETED" | "FAILED";
  sourceTxHash?: string;
  bridgeTxHash?: string;
  destinationTxHash?: string;
  fees: BridgeFee;
  initiatedAt: number;
  completedAt?: number;
}

export interface ChainTokenMapping {
  chain: SupportedChainKey;
  token: string;
  address: Address;
  decimals: number;
}

// Token mappings across chains (USDC example)
export const CROSS_CHAIN_TOKENS: Record<string, ChainTokenMapping[]> = {
  USDC: [
    {
      chain: "POLYGON",
      token: "USDC",
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimals: 6,
    },
    {
      chain: "ETHEREUM",
      token: "USDC",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    },
    {
      chain: "ARBITRUM",
      token: "USDC",
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      decimals: 6,
    },
    {
      chain: "BASE",
      token: "USDC",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
    {
      chain: "OPTIMISM",
      token: "USDC",
      address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      decimals: 6,
    },
    {
      chain: "AVALANCHE",
      token: "USDC",
      address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      decimals: 6,
    },
  ],
  USDT: [
    {
      chain: "POLYGON",
      token: "USDT",
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      decimals: 6,
    },
    {
      chain: "ETHEREUM",
      token: "USDT",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
    },
    {
      chain: "ARBITRUM",
      token: "USDT",
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      decimals: 6,
    },
    {
      chain: "AVALANCHE",
      token: "USDT",
      address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
      decimals: 6,
    },
  ],
};

// Storage key for cross-chain payments
const CROSS_CHAIN_STORAGE_KEY = "veilguard_cross_chain_payments";

/**
 * Create a cross-chain enabled invoice
 *
 * @param polygonInvoiceId - Base invoice ID on Polygon
 * @param amount - Payment amount
 * @param token - Payment token symbol
 * @param stealthAddress - Stealth address on Polygon
 * @param acceptedChains - Chains to accept payment from
 * @returns Cross-chain invoice
 */
export async function createCrossChainInvoice(
  polygonInvoiceId: string,
  amount: string,
  token: string,
  stealthAddress: Address,
  acceptedChains: SupportedChainKey[] = [
    "POLYGON",
    "ETHEREUM",
    "ARBITRUM",
    "BASE",
  ]
): Promise<CrossChainInvoice> {
  // Calculate bridge fees for each accepted chain
  const bridgeFees: Record<SupportedChainKey, BridgeFee> = {} as Record<
    SupportedChainKey,
    BridgeFee
  >;

  for (const chain of acceptedChains) {
    bridgeFees[chain] = await estimateBridgeFee(
      chain,
      "POLYGON",
      amount,
      token
    );
  }

  const invoice: CrossChainInvoice = {
    id: `cc_${polygonInvoiceId}`,
    polygonInvoiceId,
    amount,
    token,
    stealthAddress,
    acceptedChains,
    bridgeFees,
    createdAt: Date.now(),
    status: "PENDING",
  };

  // Store invoice
  const invoices = getStoredCrossChainInvoices();
  invoices[invoice.id] = invoice;
  localStorage.setItem(CROSS_CHAIN_STORAGE_KEY, JSON.stringify(invoices));

  return invoice;
}

/**
 * Estimate bridge fee for cross-chain payment
 *
 * @param sourceChain - Source chain
 * @param destChain - Destination chain (always Polygon for VeilGuard)
 * @param amount - Amount to bridge
 * @param token - Token symbol
 * @returns Bridge fee estimate
 */
export async function estimateBridgeFee(
  sourceChain: SupportedChainKey,
  destChain: SupportedChainKey,
  amount: string,
  token: string
): Promise<BridgeFee> {
  // Base fees vary by source chain
  const baseFees: Record<SupportedChainKey, { protocol: number; gas: number }> =
    {
      POLYGON: { protocol: 0, gas: 0.001 },
      ETHEREUM: { protocol: 0.001, gas: 0.005 },
      ARBITRUM: { protocol: 0.0005, gas: 0.001 },
      BASE: { protocol: 0.0005, gas: 0.001 },
      OPTIMISM: { protocol: 0.0005, gas: 0.001 },
      AVALANCHE: { protocol: 0.001, gas: 0.002 },
    };

  // Time estimates in seconds
  const timeEstimates: Record<SupportedChainKey, number> = {
    POLYGON: 5,
    ETHEREUM: 900, // 15 minutes
    ARBITRUM: 600, // 10 minutes
    BASE: 600,
    OPTIMISM: 600,
    AVALANCHE: 300, // 5 minutes
  };

  const fees = baseFees[sourceChain];
  const amountNum = parseFloat(amount);

  // Protocol fee is percentage of amount for large amounts
  const protocolFee =
    amountNum > 10000
      ? (amountNum * 0.0003).toFixed(6)
      : fees.protocol.toString();

  const gasFee = fees.gas.toString();
  const totalFee = (parseFloat(protocolFee) + parseFloat(gasFee)).toFixed(6);

  return {
    estimatedFee: totalFee,
    estimatedTime: sourceChain === destChain ? 5 : timeEstimates[sourceChain],
    protocolFee,
    gasFee,
    totalFee,
  };
}

/**
 * Initiate cross-chain payment
 *
 * @param invoiceId - Cross-chain invoice ID
 * @param sourceChain - Chain to pay from
 * @param sender - Sender address
 * @returns Payment tracking object
 */
export async function initiateCrossChainPayment(
  invoiceId: string,
  sourceChain: SupportedChainKey,
  sender: Address
): Promise<CrossChainPayment> {
  const invoices = getStoredCrossChainInvoices();
  const invoice = invoices[invoiceId];

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (!invoice.acceptedChains.includes(sourceChain)) {
    throw new Error(`Chain ${sourceChain} not accepted for this invoice`);
  }

  const payment: CrossChainPayment = {
    invoiceId,
    sourceChain,
    destinationChain: "POLYGON",
    amount: invoice.amount,
    token: invoice.token,
    sender,
    recipient: invoice.stealthAddress,
    bridgeProtocol: sourceChain === "POLYGON" ? "agglayer" : "layerzero",
    status: "INITIATED",
    fees: invoice.bridgeFees[sourceChain],
    initiatedAt: Date.now(),
  };

  // Update invoice status
  invoice.status = "BRIDGING";
  invoice.sourceChain = sourceChain;
  invoices[invoiceId] = invoice;
  localStorage.setItem(CROSS_CHAIN_STORAGE_KEY, JSON.stringify(invoices));

  return payment;
}

/**
 * Get payment route recommendation
 *
 * @param invoiceId - Invoice to pay
 * @param userChains - Chains user has funds on
 * @returns Recommended payment route
 */
export function getRecommendedRoute(
  invoiceId: string,
  userChains: Array<{ chain: SupportedChainKey; balance: string }>
): {
  recommended: SupportedChainKey;
  alternatives: Array<{
    chain: SupportedChainKey;
    fee: string;
    time: number;
    reason: string;
  }>;
} {
  const invoices = getStoredCrossChainInvoices();
  const invoice = invoices[invoiceId];

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const amount = parseFloat(invoice.amount);

  // Filter to chains with sufficient balance
  const eligibleChains = userChains.filter(
    (c) =>
      invoice.acceptedChains.includes(c.chain) &&
      parseFloat(c.balance) >= amount
  );

  if (eligibleChains.length === 0) {
    throw new Error("No chain with sufficient balance");
  }

  // Sort by lowest total cost (fee + time value)
  const ranked = eligibleChains
    .map((c) => {
      const fee = invoice.bridgeFees[c.chain];
      // Time value: $0.10 per minute (arbitrary)
      const timeValue = (fee.estimatedTime / 60) * 0.1;
      const totalCost = parseFloat(fee.totalFee) + timeValue;

      return {
        chain: c.chain,
        fee: fee.totalFee,
        time: fee.estimatedTime,
        totalCost,
        reason: getRouteReason(c.chain, fee),
      };
    })
    .sort((a, b) => a.totalCost - b.totalCost);

  return {
    recommended: ranked[0].chain,
    alternatives: ranked.map(({ chain, fee, time, reason }) => ({
      chain,
      fee,
      time,
      reason,
    })),
  };
}

/**
 * Track cross-chain payment status
 *
 * @param payment - Payment to track
 * @returns Updated payment status
 */
export async function trackPaymentStatus(
  payment: CrossChainPayment
): Promise<CrossChainPayment> {
  // In production, would query bridge protocol APIs
  // Simulate status progression based on time

  const elapsed = Date.now() - payment.initiatedAt;
  const expectedTime = payment.fees.estimatedTime * 1000;

  if (payment.status === "INITIATED" && elapsed > 5000) {
    payment.status = "BRIDGING";
    payment.sourceTxHash = `0x${Math.random().toString(16).slice(2)}`;
  }

  if (payment.status === "BRIDGING" && elapsed > expectedTime * 0.5) {
    payment.status = "CONFIRMING";
    payment.bridgeTxHash = `0x${Math.random().toString(16).slice(2)}`;
  }

  if (payment.status === "CONFIRMING" && elapsed > expectedTime) {
    payment.status = "COMPLETED";
    payment.destinationTxHash = `0x${Math.random().toString(16).slice(2)}`;
    payment.completedAt = Date.now();

    // Update invoice
    const invoices = getStoredCrossChainInvoices();
    const invoice = invoices[payment.invoiceId];
    if (invoice) {
      invoice.status = "PAID";
      invoice.destinationTxHash = payment.destinationTxHash;
      invoices[payment.invoiceId] = invoice;
      localStorage.setItem(CROSS_CHAIN_STORAGE_KEY, JSON.stringify(invoices));
    }
  }

  return payment;
}

/**
 * Get cross-chain payment history
 *
 * @returns All cross-chain invoices
 */
export function getCrossChainInvoices(): CrossChainInvoice[] {
  return Object.values(getStoredCrossChainInvoices());
}

/**
 * Get token address on specific chain
 *
 * @param token - Token symbol
 * @param chain - Target chain
 * @returns Token address on that chain
 */
export function getTokenOnChain(
  token: string,
  chain: SupportedChainKey
): ChainTokenMapping | undefined {
  const mappings = CROSS_CHAIN_TOKENS[token];
  if (!mappings) return undefined;

  return mappings.find((m) => m.chain === chain);
}

/**
 * Calculate total volume by source chain
 *
 * @returns Volume statistics by chain
 */
export function getCrossChainStats(): {
  totalVolume: string;
  byChain: Record<SupportedChainKey, { count: number; volume: string }>;
  averageBridgeTime: number;
} {
  const invoices = getCrossChainInvoices();
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");

  const byChain: Record<SupportedChainKey, { count: number; volume: string }> =
    {} as Record<SupportedChainKey, { count: number; volume: string }>;

  let totalVolume = 0n;
  let totalBridgeTime = 0;
  let bridgeCount = 0;

  for (const inv of paidInvoices) {
    totalVolume += BigInt(inv.amount);

    if (inv.sourceChain) {
      if (!byChain[inv.sourceChain]) {
        byChain[inv.sourceChain] = { count: 0, volume: "0" };
      }
      byChain[inv.sourceChain].count++;
      byChain[inv.sourceChain].volume = (
        BigInt(byChain[inv.sourceChain].volume) + BigInt(inv.amount)
      ).toString();

      if (inv.bridgeFees[inv.sourceChain]) {
        totalBridgeTime += inv.bridgeFees[inv.sourceChain].estimatedTime;
        bridgeCount++;
      }
    }
  }

  return {
    totalVolume: totalVolume.toString(),
    byChain,
    averageBridgeTime: bridgeCount > 0 ? totalBridgeTime / bridgeCount : 0,
  };
}

// Helper functions

function getStoredCrossChainInvoices(): Record<string, CrossChainInvoice> {
  try {
    return JSON.parse(localStorage.getItem(CROSS_CHAIN_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function getRouteReason(chain: SupportedChainKey, fee: BridgeFee): string {
  if (chain === "POLYGON") {
    return "Native chain - instant settlement, no bridge fees";
  }

  if (fee.estimatedTime < 300) {
    return "Fast bridge (~5 min)";
  }

  if (parseFloat(fee.totalFee) < 0.01) {
    return "Low fees";
  }

  if (fee.estimatedTime < 600) {
    return "Moderate speed (~10 min)";
  }

  return "Standard bridge time";
}
