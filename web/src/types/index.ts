export interface Invoice {
  id: string;
  onChainInvoiceId?: string; // bytes32 invoice ID from contract
  amount: string;
  token: string;
  tokenAddress: string;
  tokenDecimals: number; // Wave 3: Support multi-token decimals
  stealthAddress: string;
  ephemeralPubKey: string;
  viewTag: string;
  memo?: string;
  encryptedMemo?: string; // Wave 3: ECIES encrypted memo
  status: "pending" | "confirming" | "paid" | "expired";
  createdAt: number;
  expiresAt?: number; // Wave 3: Invoice expiry timestamp
  paidAt?: number;
  txHash?: string;
  merchantAddress: string;
}

export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
  icon?: string; // Wave 3: Token icon URL
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

// Wave 3: Yield integration types
export interface YieldPosition {
  protocol: "aave" | "compound" | "morpho";
  token: string;
  amount: string;
  apy: number;
  depositedAt: number;
}

// Wave 3: Settings for auto-yield
export interface MerchantSettings {
  autoYieldEnabled: boolean;
  yieldProtocol: "aave" | "compound" | "morpho";
  minSweepAmount: string; // Minimum amount to trigger auto-yield
}
