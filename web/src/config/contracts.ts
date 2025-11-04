export const addresses = {
  80002: {
    INVOICE_REGISTRY: import.meta.env.VITE_INVOICE_REGISTRY_80002,
    STEALTH_HELPER: import.meta.env.VITE_STEALTH_HELPER_80002,
    RECEIPT_STORE: import.meta.env.VITE_RECEIPT_STORE_80002,
  },
  137: {
    INVOICE_REGISTRY: import.meta.env.VITE_INVOICE_REGISTRY_137,
    STEALTH_HELPER: import.meta.env.VITE_STEALTH_HELPER_137,
    RECEIPT_STORE: import.meta.env.VITE_RECEIPT_STORE_137,
  },
};

export const TOKENS_80002 = (import.meta.env.VITE_ALLOWED_TOKENS_80002 || "")
  .split(";")
  .filter(Boolean)
  .map((x) => x.split(":"));

export const TOKENS_137 = (import.meta.env.VITE_ALLOWED_TOKENS_137 || "")
  .split(";")
  .filter(Boolean)
  .map((x) => x.split(":"));
