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
  balance: string; // Human-readable balance
  amount: string; // Raw amount (for compatibility)
  apy: number;
  value: string; // USD value (for stablecoins = balance)
  depositedAt?: number;
}

// Wave 3: Settings for auto-yield
export interface MerchantSettings {
  autoYieldEnabled: boolean;
  yieldProtocol: "aave" | "compound" | "morpho";
  minSweepAmount: string; // Minimum amount to trigger auto-yield
}

// Wave 3.5: Batch operations
export interface BatchInvoiceResult {
  successful: number;
  failed: number;
  hashes: string[];
  errors: string[];
}

// Wave 3.5: Analytics types
export interface InvoiceAnalytics {
  totalGMV: Record<string, bigint>;
  totalInvoices: number;
  totalPaid: number;
  totalPending: number;
  totalExpired: number;
  conversionRate: number;
  topTokens: TokenBreakdown[];
}

export interface TokenBreakdown {
  symbol: string;
  count: number;
  paidCount: number;
  volume: bigint;
  percentage: number;
}

// Wave 3.5: Yield vault comparison
export interface YieldVault {
  protocol: "aave" | "morpho" | "compound";
  name: string;
  address: string;
  apy: number;
  tvl?: bigint;
  riskScore: number;
}
