import InvoiceRegistryAbi from "@/abi/InvoiceRegistry.abi.json";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getChainConfig, isSpecMode } from "@/lib/contracts";
import {
  generateInvoiceLink,
  generatePaymentLink,
  generatePaymentURI,
} from "@/lib/eip681";
import {
  generateReceiptLink,
  verifyCommitmentOnChain,
} from "@/lib/receipts";
import { deriveStealthPriv, refundUsdc, sweepUsdc } from "@/lib/sweeper";
import { usePaymentDetection } from "@/lib/usePaymentWatcher";
import { useInvoiceStore } from "@/store/invoiceStore";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Receipt,
  Wallet,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
} from "wagmi";

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const chainId = useChainId();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { getInvoice, updateInvoice } = useInvoiceStore();
  const [invoice, setInvoice] = useState(getInvoice(id!));
  const [isMarking, setIsMarking] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  // Sweeper state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [sweepMode, setSweepMode] = useState<"sweep" | "refund" | null>(null);
  const [spendPriv, setSpendPriv] = useState("");
  const [viewPriv, setViewPriv] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [payerAddress, setPayerAddress] = useState<string>("");

  // Receipt state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);
  const [receiptCommitment, setReceiptCommitment] = useState<string | null>(
    null
  );
  const [receiptLink, setReceiptLink] = useState<string | null>(null);

  // Mark as Paid modal state
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markPaidTxHash, setMarkPaidTxHash] = useState("");

  // Use refs to store keys in memory only (never persisted)
  const keysRef = useRef<{ spend: string; view: string } | null>(null);

  // Live payment detection via ERC-20 Transfer events
  const { detected: paymentDetected, txHash: detectedTxHash, receivedAmount, payerAddress: detectedPayer } =
    usePaymentDetection({
      tokenAddress: invoice?.tokenAddress || "",
      stealthAddress: invoice?.stealthAddress || "",
      expectedAmount: invoice?.amount,
      tokenDecimals: invoice?.tokenDecimals || 6,
      chainId,
      enabled: !!invoice && invoice.status !== "paid",
    });

  // When payment detected, auto-update invoice
  useEffect(() => {
    if (paymentDetected && detectedTxHash && invoice && invoice.status !== "paid") {
      // Store payment tx hash for mark-paid
      localStorage.setItem(
        `invoice_payment_${invoice.id}`,
        JSON.stringify({ txHash: detectedTxHash, timestamp: Date.now(), amount: receivedAmount })
      );

      if (detectedPayer) setPayerAddress(detectedPayer);

      toast.success("Payment detected! 🎉", { description: `${receivedAmount} received` });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [paymentDetected, detectedTxHash]);

  useEffect(() => {
    if (id) {
      setInvoice(getInvoice(id));
    }
  }, [id, getInvoice]);

  const handleMarkPaid = async () => {
    if (!invoice || !walletClient || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      toast.error("Unsupported network");
      return;
    }

    // Pre-fill tx hash from localStorage if available
    const invoiceKey = `invoice_payment_${invoice.id}`;
    const storedPayment = localStorage.getItem(invoiceKey);
    let suggestedTxHash = "";

    if (storedPayment) {
      try {
        const payment = JSON.parse(storedPayment);
        suggestedTxHash = payment.txHash || "";
      } catch (e) {
        console.error("Error parsing stored payment:", e);
      }
    }

    setMarkPaidTxHash(suggestedTxHash);
    setShowMarkPaidModal(true);
  };

  const handleConfirmMarkPaid = async () => {
    if (!invoice || !walletClient || !address) return;

    const txHash = markPaidTxHash.trim();
    if (!txHash || !txHash.startsWith("0x")) {
      toast.error("Please enter a valid transaction hash starting with 0x");
      return;
    }

    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) return;

    setShowMarkPaidModal(false);
    setIsMarking(true);

    try {
      toast.loading("Marking invoice as paid...", { id: "mark-paid" });

      // Use the on-chain invoice ID if available, otherwise fall back to tx hash
      const onChainInvoiceId = (invoice.onChainInvoiceId ||
        invoice.txHash) as `0x${string}`;

      if (!onChainInvoiceId) {
        throw new Error("Invoice ID not found. Please recreate the invoice.");
      }

      // Get token config to get decimals
      const tokenConfig = chainConfig.tokens.find(
        (t) => t.symbol === invoice.token
      );

      if (!tokenConfig) {
        throw new Error("Token configuration not found");
      }

      // Convert amount to smallest unit (e.g., 100 USDC = 100000000 with 6 decimals)
      const amountInSmallestUnit = parseUnits(
        invoice.amount,
        tokenConfig.decimals
      );

      // Use the provided transaction hash
      const txHashHint = txHash as `0x${string}`;

      const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';
      const chain = {
        id: 137,
        name: "Polygon",
        nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
        rpcUrls: { default: { http: [`https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`] } },
      };

      const hash = await walletClient.writeContract({
        address: chainConfig.invoiceRegistry as `0x${string}`,
        abi: InvoiceRegistryAbi,
        functionName: "markPaid",
        args: [onChainInvoiceId, amountInSmallestUnit, txHashHint],
        account: address,
        chain,
        gas: 100000n, // Explicit gas limit to avoid estimation issues
      });

      toast.success("Invoice marked as paid!", { id: "mark-paid" });

      // Update local store
      updateInvoice(invoice.id, {
        status: "paid",
        paidAt: Date.now(),
        txHash: hash,
      });

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Refresh invoice
      setInvoice(getInvoice(invoice.id));
    } catch (error: any) {
      console.error("Error marking paid:", error);
      const message = error?.message || "Failed to mark invoice as paid";
      toast.error(message, { id: "mark-paid" });
    } finally {
      setIsMarking(false);
    }
  };

  const handleSweep = async () => {
    if (!isSpecMode()) {
      toast.error("Sweep is only available in spec mode");
      return;
    }
    setSweepMode("sweep");
    setShowKeyModal(true);
  };

  const handleRefund = async () => {
    if (!isSpecMode()) {
      toast.error("Refund is only available in spec mode");
      return;
    }
    if (!payerAddress) {
      toast.error(
        "Payer address not detected. Payment must be completed first."
      );
      return;
    }
    setSweepMode("refund");
    setShowKeyModal(true);
  };

  const executeSweeperAction = async () => {
    if (!spendPriv || !viewPriv) {
      toast.error("Please enter both spend and view private keys");
      return;
    }

    if (
      !/^0x[0-9a-fA-F]{64}$/.test(spendPriv) ||
      !/^0x[0-9a-fA-F]{64}$/.test(viewPriv)
    ) {
      toast.error("Invalid key format");
      return;
    }

    if (!invoice.ephemeralPubKey) {
      toast.error("Ephemeral public key not found for this invoice");
      return;
    }

    setIsSweeping(true);

    try {
      console.log("Sweep - Using meta keys:");
      console.log("Spending:", spendPriv);
      console.log("Viewing:", viewPriv);
      console.log("Ephemeral pub key:", invoice.ephemeralPubKey);

      // Derive stealth private key
      const { stealthPriv, stealthAddress: derivedAddress } = deriveStealthPriv(
        {
          spendPriv: spendPriv as `0x${string}`,
          viewPriv: viewPriv as `0x${string}`,
        },
        invoice.ephemeralPubKey as `0x${string}`
      );

      console.log("Returned stealth private key:", stealthPriv);
      console.log("Returned stealth address:", derivedAddress);

      // Verify the derived address matches the invoice stealth address
      console.log("Invoice stealth address:", invoice.stealthAddress);

      if (
        derivedAddress.toLowerCase() !== invoice.stealthAddress.toLowerCase()
      ) {
        throw new Error(
          `Key mismatch! The keys you entered don't match this invoice. ` +
            `Expected address: ${invoice.stealthAddress}, ` +
            `but derived: ${derivedAddress}`
        );
      }

      const chainConfig = getChainConfig(chainId);
      const tokenAddress = invoice.tokenAddress as `0x${string}`;

      if (sweepMode === "sweep") {
        toast.loading("Sweeping funds to merchant safe...", { id: "sweep" });

        const hash = await sweepUsdc({
          stealthPriv,
          stealthAddress: derivedAddress,
          chainId,
          tokenAddress,
        });

        toast.success(`Funds swept! Tx: ${hash.slice(0, 10)}...`, {
          id: "sweep",
        });
      } else if (sweepMode === "refund") {
        toast.loading("Refunding to original payer...", { id: "refund" });

        const hash = await refundUsdc({
          stealthPriv,
          chainId,
          tokenAddress,
          payerAddress: payerAddress as `0x${string}`,
        });

        toast.success(`Refund sent! Tx: ${hash.slice(0, 10)}...`, {
          id: "refund",
        });
      }

      // Close modal and clear keys
      setShowKeyModal(false);
      setSpendPriv("");
      setViewPriv("");
      keysRef.current = null;
    } catch (error: any) {
      console.error("Sweeper error:", error);
      toast.error(error.message || "Operation failed", {
        id: sweepMode || "sweep",
      });
    } finally {
      setIsSweeping(false);
    }
  };

  const handleCreateReceipt = async () => {
    if (!invoice?.onChainInvoiceId && !invoice?.txHash) {
      toast.error("No on-chain invoice ID available");
      return;
    }

    setIsCreatingReceipt(true);

    try {
      toast.loading("Checking on-chain receipt...", { id: "receipt" });

      const chainConfig = getChainConfig(chainId);
      if (!chainConfig?.receiptStore) {
        throw new Error("ReceiptStore not configured");
      }

      const invoiceIdBytes = (invoice.onChainInvoiceId ||
        invoice.txHash) as `0x${string}`;

      if (
        !invoiceIdBytes ||
        invoiceIdBytes ===
          "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        throw new Error("Invoice ID not available. Please ensure the invoice has been created on-chain.");
      }

      // InvoiceRegistry.markPaid() already stored the commitment — just READ it.
      // Do NOT call store() — it would fail with "receipt exists".
      const verification = await verifyCommitmentOnChain(
        chainId,
        chainConfig.receiptStore as `0x${string}`,
        invoiceIdBytes
      );

      if (!verification.valid) {
        throw new Error(
          "Receipt not yet on-chain. Make sure the invoice has been marked as paid on-chain first."
        );
      }

      setReceiptCommitment(verification.storedCommitment);

      // Generate shareable link — use invoiceId + txHash for display on verify page
      const link = generateReceiptLink(
        invoiceIdBytes,
        (invoice.txHash || invoiceIdBytes) as `0x${string}`
      );
      setReceiptLink(link);

      toast.success("Receipt verified on-chain!", { id: "receipt" });
      setShowReceiptModal(true);
    } catch (error: any) {
      console.error("Receipt error:", error);
      toast.error(error.message || "Failed to load receipt", { id: "receipt" });
    } finally {
      setIsCreatingReceipt(false);
    }
  };

  // Clear keys on unmount
  useEffect(() => {
    return () => {
      keysRef.current = null;
      setSpendPriv("");
      setViewPriv("");
    };
  }, []);

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center glass p-12 rounded-lg"
          >
            <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
            <p className="text-muted-foreground">
              This invoice doesn't exist or has been removed.
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  const chainConfig = getChainConfig(chainId);
  const tokenConfig = chainConfig?.tokens.find(
    (t) => t.symbol === invoice.token
  );

  const paymentURI = tokenConfig
    ? generatePaymentURI(
        invoice.tokenAddress,
        invoice.stealthAddress,
        invoice.amount,
        chainId,
        tokenConfig.decimals
      )
    : "";

  const invoiceLink = generateInvoiceLink(invoice.id);

  // Generate user-friendly payment link for customers
  const paymentLink =
    invoice.stealthAddress && invoice.ephemeralPubKey
      ? generatePaymentLink(
          invoice.id,
          invoice.stealthAddress,
          invoice.amount,
          tokenConfig.address,
          invoice.ephemeralPubKey,
          chainId,
          "VeilGuard Merchant",
          `Invoice #${invoice.id.slice(0, 8)}`
        )
      : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handlePaid = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  useEffect(() => {
    if (invoice.status === "paid") {
      handlePaid();
    }
  }, [invoice.status]);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-cyan",
      bg: "bg-cyan/10",
      label: "Awaiting Payment",
      animate: false,
    },
    confirming: {
      icon: Loader2,
      color: "text-violet",
      bg: "bg-violet/10",
      label: "Confirming Transaction",
      animate: true,
    },
    paid: {
      icon: CheckCircle,
      color: "text-primary",
      bg: "bg-primary/10",
      label: "Payment Received",
      animate: false,
    },
    expired: {
      icon: Clock,
      color: "text-destructive",
      bg: "bg-destructive/10",
      label: "Expired",
      animate: false,
    },
  };

  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Status Header */}
            <div className="text-center space-y-4">
              <div
                className={`inline-flex items-center gap-2 ${status.bg} px-4 py-2 rounded-full`}
              >
                <StatusIcon
                  className={`h-5 w-5 ${status.color} ${
                    status.animate ? "animate-spin" : ""
                  }`}
                />
                <span className={`font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Payment Details */}
              <div className="glass p-8 rounded-lg space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Amount Due
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-bold">{invoice.amount}</p>
                    <p className="text-xl text-muted-foreground">
                      {invoice.token}
                    </p>
                  </div>
                </div>

                {invoice.memo && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Memo</p>
                    <p className="text-foreground">{invoice.memo}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Stealth Address
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-2 rounded flex-1 truncate font-mono">
                        {invoice.stealthAddress}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(invoice.stealthAddress, "Address")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {paymentLink && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        🔗 Payment Link (Share with Customer)
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted p-2 rounded flex-1 truncate font-mono">
                          {paymentLink}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(paymentLink, "Payment Link")
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ✨ Customers can pay directly from this link with full
                        privacy
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Invoice Link (For Merchants)
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-2 rounded flex-1 truncate font-mono">
                        {invoiceLink}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(invoiceLink, "Link")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  {paymentLink && (
                    <Button
                      className="w-full magnetic bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white glow-lime"
                      onClick={() => window.open(paymentLink, "_blank")}
                      disabled={invoice.status === "paid"}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Payment Page
                    </Button>
                  )}
                  <Button
                    className="w-full magnetic bg-primary hover:bg-primary/90"
                    onClick={() => window.open(paymentURI, "_blank")}
                    disabled={invoice.status === "paid"}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Wallet
                  </Button>

                  {invoice.status === "pending" &&
                    address === invoice.merchantAddress && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleMarkPaid}
                        disabled={isMarking}
                      >
                        {isMarking ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Marking...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Paid
                          </>
                        )}
                      </Button>
                    )}

                  {/* Sweep and Refund buttons (spec mode only, when paid) */}
                  {invoice.status === "paid" &&
                    address === invoice.merchantAddress &&
                    isSpecMode() && (
                      <>
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={handleSweep}
                          disabled={isSweeping}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Sweep to Safe
                        </Button>
                        {payerAddress && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleRefund}
                            disabled={isSweeping}
                          >
                            <ArrowDownLeft className="h-4 w-4 mr-2" />
                            Refund Payer
                          </Button>
                        )}
                      </>
                    )}

                  {/* Create Receipt button */}
                  {invoice.status === "paid" &&
                    address === invoice.merchantAddress &&
                    !receiptCommitment && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleCreateReceipt}
                        disabled={isCreatingReceipt}
                      >
                        {isCreatingReceipt ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Receipt className="h-4 w-4 mr-2" />
                            Get On-Chain Receipt
                          </>
                        )}
                      </Button>
                    )}
                </div>
              </div>

              {/* QR Code */}
              <div className="glass p-8 rounded-lg space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Scan to Pay
                  </p>
                  <div className="bg-white p-6 rounded-lg inline-block">
                    <QRCodeSVG
                      value={paymentURI}
                      size={256}
                      level="H"
                      includeMargin
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    Chain: {chainConfig?.name}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    This QR code contains an EIP-681 payment request. Scan with
                    a compatible wallet to pay.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass p-6 rounded-lg"
            >
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Privacy Notice:</strong>{" "}
                This invoice uses a unique stealth address. Payment to this
                address cannot be linked to other transactions. No personal
                information is stored on-chain.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Mark as Paid Modal */}
      <Dialog open={showMarkPaidModal} onOpenChange={setShowMarkPaidModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-5 w-5 text-primary" />
              Mark Invoice as Paid
            </DialogTitle>
            <DialogDescription>
              Confirm the payment by providing the transaction hash from the
              blockchain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {markPaidTxHash && (
              <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary">
                    Payment auto-detected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 break-all font-mono">
                    {markPaidTxHash}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="txHashInput" className="text-sm font-medium">
                Transaction Hash
              </Label>
              <Input
                id="txHashInput"
                placeholder="0x..."
                value={markPaidTxHash}
                onChange={(e) => setMarkPaidTxHash(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The on-chain transaction hash of the USDC payment to the stealth
                address.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowMarkPaidModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleConfirmMarkPaid}
              disabled={!markPaidTxHash || !markPaidTxHash.startsWith("0x")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm &amp; Mark Paid
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Key Entry Modal for Sweep/Refund */}
      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {sweepMode === "sweep" ? "Sweep Funds" : "Refund Payer"}
            </DialogTitle>
            <DialogDescription>
              Enter your merchant keys to{" "}
              {sweepMode === "sweep"
                ? "sweep funds to your merchant safe"
                : "refund the original payer"}
              . Keys are used only for this transaction and never stored.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              ⚠️ Keys are processed locally and never leave your browser. They
              will be cleared after this operation.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="spendPriv">Spend Private Key</Label>
              <div className="relative">
                <Input
                  id="spendPriv"
                  type={showKeys ? "text" : "password"}
                  placeholder="0x..."
                  value={spendPriv}
                  onChange={(e) => setSpendPriv(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showKeys ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="viewPriv">View Private Key</Label>
              <Input
                id="viewPriv"
                type={showKeys ? "text" : "password"}
                placeholder="0x..."
                value={viewPriv}
                onChange={(e) => setViewPriv(e.target.value)}
              />
            </div>

            {sweepMode === "refund" && payerAddress && (
              <div>
                <Label>Refund To</Label>
                <code className="text-xs bg-muted p-2 rounded block">
                  {payerAddress}
                </code>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowKeyModal(false);
                  setSpendPriv("");
                  setViewPriv("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={executeSweeperAction}
                disabled={isSweeping || !spendPriv || !viewPriv}
              >
                {isSweeping ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    {sweepMode === "sweep" ? "Sweep" : "Refund"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Success Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-500" />
              Receipt Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your payment receipt has been committed on-chain with selective
              disclosure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {receiptCommitment && (
              <div>
                <Label>Commitment Hash</Label>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                  {receiptCommitment}
                </code>
              </div>
            )}

            {receiptLink && (
              <div>
                <Label>Shareable Verification Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={receiptLink}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(receiptLink, "Receipt link")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Share this link to prove payment without revealing stealth
                  address or payer identity.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => {
                if (receiptLink) {
                  window.open(receiptLink, "_blank");
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Verify Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
