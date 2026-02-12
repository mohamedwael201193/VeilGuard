/**
 * Fiat On-Ramp - Wave 5
 *
 * Multi-provider on-ramp selector with wallet address copy.
 * User copies their address → opens provider → pastes address → buys crypto.
 */

import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface OnRampProvider {
  name: string;
  logo: string;
  description: string;
  fees: string;
  url: string;
}

const PROVIDERS: OnRampProvider[] = [
  {
    name: "MoonPay",
    logo: "🌙",
    description: "Card & bank transfer · 160+ countries",
    fees: "~3.5% fee",
    url: "https://www.moonpay.com/buy",
  },
  {
    name: "Coinbase",
    logo: "🔵",
    description: "Most trusted exchange · US & EU",
    fees: "~1.5% fee",
    url: "https://www.coinbase.com/price/usd-coin",
  },
  {
    name: "Binance",
    logo: "🟡",
    description: "Lowest fees · Global coverage",
    fees: "~1% fee",
    url: "https://www.binance.com/en/crypto/buy/USDC",
  },
  {
    name: "ChangeNOW",
    logo: "⚡",
    description: "No registration · Instant swap",
    fees: "~0.5% fee",
    url: "https://changenow.io/exchange/txs/fiat",
  },
];

interface FiatOnRampProps {
  walletAddress?: string;
  cryptoCurrency?: string;
  fiatAmount?: string;
  fiatCurrency?: string;
  className?: string;
}

/**
 * Inline CTA button — opens provider picker modal
 */
export function BuyCryptoCTA({
  walletAddress,
  cryptoCurrency = "USDC",
  className = "",
}: FiatOnRampProps) {
  const [showPicker, setShowPicker] = useState(false);

  if (!walletAddress) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPicker(true)}
        className={`gap-2 border-primary/30 hover:bg-primary/10 ${className}`}
      >
        <CreditCard className="h-4 w-4 text-primary" />
        Buy {cryptoCurrency}
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </Button>

      {showPicker && (
        <FiatOnRampModal
          walletAddress={walletAddress}
          cryptoCurrency={cryptoCurrency}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

/**
 * Provider selection modal with wallet address copy
 */
export function FiatOnRampModal({
  walletAddress,
  cryptoCurrency = "USDC",
  fiatAmount,
  onClose,
}: FiatOnRampProps & { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Wallet address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [walletAddress]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass border border-border/40 rounded-2xl w-full max-w-md mx-4 p-6 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Buy {cryptoCurrency}
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Step 1: Copy wallet address */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                Step 1
              </span>
              <span className="text-sm font-medium">Copy your wallet address</span>
            </div>
            <div className="flex gap-2">
              <code className="flex-1 bg-slate-800/70 rounded-lg px-3 py-2 text-xs font-mono truncate border border-border/30">
                {walletAddress}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Network: <span className="text-primary font-medium">Polygon</span> · Token: <span className="text-primary font-medium">{cryptoCurrency}</span>
            </p>
          </div>

          {/* Step 2: Choose provider */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                Step 2
              </span>
              <span className="text-sm font-medium">Buy from a provider</span>
            </div>

            {PROVIDERS.map((provider) => (
              <button
                key={provider.name}
                onClick={() => window.open(provider.url, "_blank")}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-border/30 hover:border-primary/50 hover:bg-slate-800/80 transition-all text-left group"
              >
                <span className="text-2xl">{provider.logo}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {provider.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground bg-slate-700/50 px-1.5 py-0.5 rounded">
                      {provider.fees}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {provider.description}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
            ))}
          </div>

          {/* Step 3 hint */}
          <div className="bg-slate-800/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Step 3:</span>{" "}
              Buy {cryptoCurrency} on <span className="text-primary">Polygon</span> network, paste your address above as the destination.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Insufficient balance banner — shown when user can't afford payment
 */
export function InsufficientBalanceBanner({
  requiredAmount,
  currentBalance,
  token,
  walletAddress,
}: {
  requiredAmount: string;
  currentBalance: string;
  token: string;
  walletAddress?: string;
}) {
  const [showRamp, setShowRamp] = useState(false);
  const shortfall = (
    parseFloat(requiredAmount) - parseFloat(currentBalance)
  ).toFixed(2);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between gap-4"
      >
        <div>
          <p className="font-semibold text-yellow-300">Insufficient Balance</p>
          <p className="text-sm text-yellow-400/80">
            You need {shortfall} more {token} to complete this payment.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowRamp(true)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black shrink-0"
        >
          <CreditCard className="h-4 w-4 mr-1" />
          Buy {token}
        </Button>
      </motion.div>

      {showRamp && walletAddress && (
        <FiatOnRampModal
          walletAddress={walletAddress}
          cryptoCurrency={token}
          fiatAmount={shortfall}
          onClose={() => setShowRamp(false)}
        />
      )}
    </>
  );
}
