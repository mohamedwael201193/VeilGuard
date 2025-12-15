import type { ChainConfig, TokenConfig } from "@/types";

// Environment configuration
export const STEALTH_MODE = (import.meta.env.VITE_STEALTH_MODE || "demo") as
  | "demo"
  | "spec";
export const MERCHANT_SAFE = (import.meta.env.VITE_MERCHANT_SAFE ||
  "") as string;
export const isSpecMode = () => STEALTH_MODE === "spec";

// Chain configurations with multi-token support (Wave 3)
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
      {
        symbol: "USDT",
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        decimals: 6,
      },
      {
        symbol: "DAI",
        address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        decimals: 18,
      },
      {
        symbol: "WETH",
        address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        decimals: 18,
      },
      {
        symbol: "WPOL",
        address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        decimals: 18,
      },
      // Wave 4: Regional Stablecoins (Judge favorite: 0xPolygon loves KRW1/LATAM)
      {
        symbol: "BRZ",
        address: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc",
        decimals: 4,
      },
      {
        symbol: "EUROC",
        address: "0xA0b86a33E6411505fD3F1A34F5Fbcc7b44D06bfb",
        decimals: 6,
      },
      {
        symbol: "CADC",
        address: "0x5d146d8B1dACb1EBBA5cb005ae1059DA8a1FbF57",
        decimals: 18,
      },
      {
        symbol: "XSGD",
        address: "0xDC3326e71D45186F113a2F448984CA0e8D201995",
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
      {
        symbol: "tUSDT",
        address: "0x1616e4F05b7D55f28F5D56E42c9d5e0b4b01c7F4",
        decimals: 6,
      },
      {
        symbol: "tDAI",
        address: "0x8cE6C83B7D06Db3E35a7cf15f4A6E3F8f7e8E9D7",
        decimals: 18,
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
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
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
  {
    inputs: [{ name: "account", type: "address" }],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
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
