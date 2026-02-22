import { BuyCryptoCTA } from "@/components/FiatOnRamp";
import { SharePaymentLink } from "@/components/SharePaymentLink";
import { TokenSelector, TokenBadge } from "@/components/TokenSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChainConfig } from "@/lib/contracts";
import { generatePaymentURI, generatePOSWebLink } from "@/lib/eip681";
import { usePaymentDetection } from "@/lib/usePaymentWatcher";
import type { TokenConfig } from "@/types";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  MonitorSmartphone,
  QrCode,
  Receipt,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { encodePacked, keccak256 } from "viem";
import { useAccount, useChainId } from "wagmi";

interface POSTransaction {
  id: string;
  amount: string;
  token: string;
  txHash: string;
  timestamp: number;
}

export default function POS() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainConfig = getChainConfig(chainId);

  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
  const [stealthAddress, setStealthAddress] = useState<string | null>(null);
  const [paymentURI, setPaymentURI] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [transactions, setTransactions] = useState<POSTransaction[]>(() => {
    const stored = localStorage.getItem("veilguard-pos-history");
    return stored ? JSON.parse(stored) : [];
  });
  const [shareURL, setShareURL] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const token =
    selectedToken?.symbol || chainConfig?.tokens[0]?.symbol || "USDC";
  const tokenConfig =
    selectedToken || chainConfig?.tokens.find((t) => t.symbol === token);

  // Live payment detection
  const { detected, txHash, receivedAmount } = usePaymentDetection({
    tokenAddress: tokenConfig?.address || "",
    stealthAddress: stealthAddress || "",
    tokenDecimals: tokenConfig?.decimals || 6,
    chainId,
    enabled: showQR && !!stealthAddress,
  });

  // Handle payment detection
  useEffect(() => {
    if (detected && txHash) {
      const newTx: POSTransaction = {
        id: `pos-${Date.now()}`,
        amount: receivedAmount || amount,
        token,
        txHash,
        timestamp: Date.now(),
      };
      const updated = [newTx, ...transactions].slice(0, 50);
      setTransactions(updated);
      localStorage.setItem("veilguard-pos-history", JSON.stringify(updated));

      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      toast.success(`Payment received! ${receivedAmount || amount} ${token}`);

      // Reset after 5 seconds
      setTimeout(() => {
        setShowQR(false);
        setStealthAddress(null);
        setPaymentURI(null);
        setShareURL(null);
        setAmount("");
      }, 5000);
    }
  }, [detected, txHash]);

  const handleGenerateQR = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0 || !tokenConfig || !address) {
      toast.error("Enter a valid amount");
      return;
    }

    try {
      // Generate a simple stealth address for POS (demo-mode compatible)
      const salt = keccak256(
        encodePacked(
          ["address", "uint256", "uint256"],
          [address as `0x${string}`, BigInt(Date.now()), BigInt(Math.floor(Math.random() * 1e9))]
        )
      );

      // For POS, use the merchant address directly (simpler UX)
      const posAddress = address;

      const uri = generatePaymentURI(
        tokenConfig.address,
        posAddress,
        amount,
        chainId,
        tokenConfig.decimals
      );

      const webLink = generatePOSWebLink({
        recipientAddress: posAddress,
        amount,
        tokenAddress: tokenConfig.address,
        tokenSymbol: tokenConfig.symbol,
        chainId,
      });

      setStealthAddress(posAddress);
      setPaymentURI(uri);
      setShareURL(webLink);
      setShowQR(true);
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate QR");
    }
  }, [amount, tokenConfig, address, chainId]);

  const todayTotal = transactions
    .filter((tx) => {
      const today = new Date();
      const txDate = new Date(tx.timestamp);
      return txDate.toDateString() === today.toDateString();
    })
    .reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-md glass p-12 rounded-lg"
          >
            <MonitorSmartphone className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">POS Mode</h2>
            <p className="text-muted-foreground">
              Connect your wallet to start accepting payments.
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main POS Panel */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {!showQR ? (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass p-8 rounded-2xl space-y-8"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-8 w-8 text-primary" />
                      <div>
                        <h1 className="text-3xl font-bold">Point of Sale</h1>
                        <p className="text-muted-foreground">
                          Accept crypto payments instantly
                        </p>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-4">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-center text-6xl font-bold h-32 border-2 border-primary/30 focus:border-primary"
                      />

                      {/* Token Selector */}
                      <TokenSelector
                        value={token}
                        onChange={(t) => setSelectedToken(t)}
                        className="w-full"
                      />
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-3">
                      {["5", "10", "25", "50"].map((amt) => (
                        <Button
                          key={amt}
                          variant="outline"
                          size="lg"
                          onClick={() => setAmount(amt)}
                          className="text-lg font-semibold"
                        >
                          ${amt}
                        </Button>
                      ))}
                    </div>

                    <Button
                      onClick={handleGenerateQR}
                      disabled={!amount || parseFloat(amount) <= 0}
                      className="w-full h-16 text-xl font-bold magnetic bg-primary hover:bg-primary/90 glow-lime"
                    >
                      <QrCode className="h-6 w-6 mr-3" />
                      Generate Payment QR
                    </Button>

                    {address && (
                      <div className="text-center pt-2">
                        <BuyCryptoCTA
                          walletAddress={address}
                          cryptoCurrency={token}
                        />
                      </div>
                    )}
                  </motion.div>
                ) : detected ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-12 rounded-2xl text-center space-y-6"
                  >
                    <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto" />
                    <h2 className="text-4xl font-bold text-green-400">
                      Payment Received!
                    </h2>
                    <p className="text-2xl">
                      {receivedAmount || amount} <TokenBadge symbol={token} />
                    </p>
                    <a
                      href={`https://polygonscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline text-sm"
                    >
                      View on Explorer
                    </a>
                  </motion.div>
                ) : (
                  <motion.div
                    key="qr"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass p-8 rounded-2xl text-center space-y-6"
                  >
                    <h2 className="text-2xl font-bold">Scan to Pay</h2>
                    <p className="text-4xl font-bold text-primary">
                      {amount} <TokenBadge symbol={token} />
                    </p>

                    {/* QR Code */}
                    <div className="bg-white p-6 rounded-2xl inline-block mx-auto">
                      <QRCodeSVG
                        value={paymentURI || ""}
                        size={280}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    <div className="flex items-center justify-center gap-2 text-yellow-400 animate-pulse">
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      Waiting for payment...
                    </div>

                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowShareModal(true)}
                      >
                        Share Link
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowQR(false);
                          setStealthAddress(null);
                          setPaymentURI(null);
                          setShareURL(null);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar - Today's Sales */}
            <div className="space-y-6">
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-2">Today's Sales</h3>
                <p className="text-4xl font-bold text-primary">
                  ${todayTotal.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transactions.filter((tx) => {
                    const today = new Date();
                    return (
                      new Date(tx.timestamp).toDateString() ===
                      today.toDateString()
                    );
                  }).length}{" "}
                  transactions
                </p>
              </div>

              <div className="glass p-6 rounded-2xl max-h-[500px] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Recent
                </h3>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">
                            {tx.amount} {tx.token}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <a
                          href={`https://polygonscan.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary"
                        >
                          {tx.txHash.slice(0, 8)}...
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && shareURL && (
        <SharePaymentLink
          url={shareURL}
          amount={amount}
          token={token}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
