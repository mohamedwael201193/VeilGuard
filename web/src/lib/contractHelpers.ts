import { createWalletClient, custom } from "viem";

export function getWalletClient() {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No wallet");
  return createWalletClient({ transport: custom(ethereum) });
}

export function as6(amountStr: string) {
  const [i, f = ""] = amountStr.split(".");
  const cents = (f + "000000").slice(0, 6);
  return BigInt(i) * 1000000n + BigInt(cents);
}
