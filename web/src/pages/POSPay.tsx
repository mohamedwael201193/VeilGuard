/**
 * POSPay - Customer-facing payment page for POS-generated links.
 *
 * URL format: /pay/pos?to=...&amount=...&token=...&symbol=...&chainId=...
 *
 * Shows the payment details and lets the customer pay directly
 * via ERC-20 transfer or copy the address for manual payment.
 */

import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { TokenBadge } from "@/components/TokenSelector";
import { Button } from "@/components/ui/button";
import { getChainConfig } from "@/lib/contracts";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Loader2,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { type Address, encodeFunctionData, parseUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export default function POSPay() {
  const [searchParams] = useSearchParams();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const to = searchParams.get("to") as Address | null;
  const amount = searchParams.get("amount") || "0";
  const tokenAddress = searchParams.get("token") as Address | null;
  const symbol = searchParams.get("symbol") || "USDC";
  const chainId = parseInt(searchParams.get("chainId") || "137", 10);

  // Resolve decimals from chain config
  const chainConfig = getChainConfig(chainId);
  const tokenConfig = chainConfig?.tokens.find(
    (t) => t.address.toLowerCase() === tokenAddress?.toLowerCase()
  );
  const decimals = tokenConfig?.decimals || 6;

  const [isPaying, setIsPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handlePay = useCallback(async () => {
    if (!walletClient || !publicClient || !to || !tokenAddress) {
      toast.error("Connect wallet first");
      return;
    }
    setIsPaying(true);
    try {
      const amountWei = parseUnits(amount, decimals);

      const hash = await walletClient.sendTransaction({
        to: tokenAddress,
        data: encodeFunctionData({
          abi: ERC20_TRANSFER_ABI,
          functionName: "transfer",
          args: [to, amountWei],
        }),
      } as any);

      toast.info("Transaction sent — waiting for confirmation...");
      await publicClient.waitForTransactionReceipt({ hash });

      setTxHash(hash);
      setDone(true);
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      toast.success("Payment complete!");
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || "Payment failed");
    } finally {
      setIsPaying(false);
    }
  }, [walletClient, publicClient, to, tokenAddress, amount, decimals]);

  const handleCopyAddress = async () => {
    if (!to) return;
    await navigator.clipboard.writeText(to);
    toast.success("Address copied");
  };

  if (!to || !tokenAddress) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center">
          <div className="glass p-12 rounded-2xl text-center space-y-4 max-w-md">
            <ShoppingBag className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold">Invalid Payment Link</h2>
            <p className="text-muted-foreground">
              This link is missing required payment details.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-10 rounded-2xl w-full max-w-md mx-4 space-y-6 text-center"
        >
          {done ? (
            <>
              <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
              <h2 className="text-3xl font-bold text-green-400">
                Payment Sent!
              </h2>
              <p className="text-xl">
                {amount} <TokenBadge symbol={symbol} />
              </p>
              <a
                href={`https://polygonscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline text-sm"
              >
                View on PolygonScan
              </a>
            </>
          ) : (
            <>
              <ShoppingBag className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Payment Requested</h2>

              <div className="py-4">
                <p className="text-5xl font-bold text-primary">{amount}</p>
                <div className="mt-2">
                  <TokenBadge symbol={symbol} />
                </div>
              </div>

              <div className="text-left bg-slate-800/40 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-mono text-xs">
                    {to.slice(0, 8)}...{to.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span>Polygon</span>
                </div>
              </div>

              {!isConnected ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to pay
                  </p>
                  <div className="flex justify-center gap-3">
                    <NetworkSwitcher />
                    <ConnectButton />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={handlePay}
                    disabled={isPaying}
                    className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 glow-lime"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Paying...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-5 w-5 mr-2" />
                        Pay {amount} {symbol}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy address for manual transfer
                  </Button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
