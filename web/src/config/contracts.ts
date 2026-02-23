export const addresses = {
  137: {
    INVOICE_REGISTRY: import.meta.env.VITE_INVOICE_REGISTRY_137,
    STEALTH_HELPER: import.meta.env.VITE_STEALTH_HELPER_137,
    RECEIPT_STORE: import.meta.env.VITE_RECEIPT_STORE_137,
    ESCROW: import.meta.env.VITE_ESCROW_137,
    SUBSCRIPTION: import.meta.env.VITE_SUBSCRIPTION_137,
    SPLIT_PAY: import.meta.env.VITE_SPLIT_PAY_137,
    DISPUTE: import.meta.env.VITE_DISPUTE_137,
    BATCH_PROCESSOR: import.meta.env.VITE_BATCH_PROCESSOR_137,
    MERCHANT_INDEX: import.meta.env.VITE_MERCHANT_INDEX_137,
  },
};

export const TOKENS_137 = (import.meta.env.VITE_ALLOWED_TOKENS_137 || "")
  .split(";")
  .filter(Boolean)
  .map((x) => x.split(":"));
