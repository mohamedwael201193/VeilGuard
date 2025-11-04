export interface Invoice {
  id: string;
  onChainInvoiceId?: string; // bytes32 invoice ID from contract
  amount: string;
  token: string;
  tokenAddress: string;
  stealthAddress: string;
  ephemeralPubKey: string;
  viewTag: string;
  memo?: string;
  status: "pending" | "confirming" | "paid" | "expired";
  createdAt: number;
  paidAt?: number;
  txHash?: string;
  merchantAddress: string;
}

export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
}

export interface ChainConfig {
  id: number;
  name: string;
  tokens: TokenConfig[];
  invoiceRegistry: string;
  stealthHelper: string;
  receiptStore: string;
  explorer: string;
}

export interface StealthMetaAddress {
  spendingPubKey: string;
  viewingPubKey: string;
}

export interface StealthAddress {
  address: string;
  ephemeralPubKey: string;
  viewTag: string;
  metadata: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalGMV: string;
  successRate: number;
  medianTimeToPayMinutes: number;
}
