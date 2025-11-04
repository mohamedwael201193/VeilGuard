import type { ChainConfig, TokenConfig } from "@/types";

// Environment configuration
export const STEALTH_MODE = (import.meta.env.VITE_STEALTH_MODE || "demo") as
  | "demo"
  | "spec";
export const MERCHANT_SAFE = (import.meta.env.VITE_MERCHANT_SAFE ||
  "") as string;
export const isSpecMode = () => STEALTH_MODE === "spec";

// Chain configurations
export const CHAINS: Record<number, ChainConfig> = {
  137: {
    id: 137,
    name: "Polygon PoS",
    tokens: [
      {
        symbol: "USDC",
        address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        decimals: 6,
      },
      {
        symbol: "USDC.e",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6,
      },
    ],
    invoiceRegistry:
      import.meta.env.VITE_INVOICE_REGISTRY_137 ||
      "0x0000000000000000000000000000000000000000",
    stealthHelper:
      import.meta.env.VITE_STEALTH_HELPER_137 ||
      "0x0000000000000000000000000000000000000000",
    receiptStore:
      import.meta.env.VITE_RECEIPT_STORE_137 ||
      "0x0000000000000000000000000000000000000000",
    explorer: "https://polygonscan.com",
  },
  80002: {
    id: 80002,
    name: "Polygon Amoy",
    tokens: [
      {
        symbol: "tUSDC",
        address: "0x3156F6E761D7c9dA0a88A6165864995f2b58854f",
        decimals: 6,
      },
    ],
    invoiceRegistry:
      import.meta.env.VITE_INVOICE_REGISTRY_80002 ||
      "0x0000000000000000000000000000000000000000",
    stealthHelper:
      import.meta.env.VITE_STEALTH_HELPER_80002 ||
      "0x0000000000000000000000000000000000000000",
    receiptStore:
      import.meta.env.VITE_RECEIPT_STORE_80002 ||
      "0x0000000000000000000000000000000000000000",
    explorer: "https://amoy.polygonscan.com",
  },
};

export const DEFAULT_CHAIN_ID =
  Number(import.meta.env.VITE_CHAIN_DEFAULT) || 137;

// Contract ABIs
export const INVOICE_REGISTRY_ABI = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "stealthAddress", type: "address" },
      { name: "memo", type: "string" },
    ],
    name: "createInvoice",
    outputs: [{ name: "invoiceId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "invoiceId", type: "uint256" }],
    name: "getInvoice",
    outputs: [
      {
        components: [
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "stealthAddress", type: "address" },
          { name: "merchant", type: "address" },
          { name: "memo", type: "string" },
          { name: "paid", type: "bool" },
          { name: "createdAt", type: "uint256" },
          { name: "paidAt", type: "uint256" },
        ],
        name: "invoice",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const STEALTH_HELPER_ABI = [
  {
    inputs: [
      { name: "schemeId", type: "uint256" },
      { name: "stealthAddress", type: "address" },
      { name: "ephemeralPubKey", type: "bytes" },
      { name: "metadata", type: "bytes" },
    ],
    name: "announce",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return CHAINS[chainId];
}

export function getTokenConfig(
  chainId: number,
  tokenSymbol: string
): TokenConfig | undefined {
  const chain = getChainConfig(chainId);
  return chain?.tokens.find((t) => t.symbol === tokenSymbol);
}
