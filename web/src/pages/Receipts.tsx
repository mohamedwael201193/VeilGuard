import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileCheck,
  FileText,
  Lock,
  Loader2,
  Search,
  Shield,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useChainId } from "wagmi";
import { createPublicClient, http, parseAbi, type Address } from "viem";
import { polygon } from "viem/chains";
import { getChainConfig } from "@/lib/contracts";
import { toast } from "sonner";

interface ReceiptResult {
  invoiceId: string;
  receiptHash: string;
  verified: boolean;
}

export default function Receipts() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const chainId = useChainId();
  const chainConfig = getChainConfig(chainId);

  const [lookupId, setLookupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);

  const handleLookup = async () => {
    if (!lookupId.trim()) {
      toast.error("Enter an invoice ID (bytes32)");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";
      const publicClient = createPublicClient({
        chain: polygon,
        transport: http(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`),
      });

      const receiptStoreAddr = chainConfig?.receiptStore as Address;
      if (!receiptStoreAddr) throw new Error("ReceiptStore address not configured");

      const abi = parseAbi([
        "function receiptOf(bytes32 invoiceId) view returns (bytes32)",
      ]);

      const invoiceIdBytes = lookupId.startsWith("0x")
        ? (lookupId as `0x${string}`)
        : (`0x${lookupId}` as `0x${string}`);

      const receiptHash = (await publicClient.readContract({
        address: receiptStoreAddr,
        abi,
        functionName: "receiptOf",
        args: [invoiceIdBytes],
      })) as `0x${string}`;

      const isZero = receiptHash === "0x0000000000000000000000000000000000000000000000000000000000000000";

      setResult({
        invoiceId: invoiceIdBytes,
        receiptHash: receiptHash,
        verified: !isZero,
      });

      if (isZero) {
        toast.info("No receipt found for this invoice");
      } else {
        toast.success("Receipt found on-chain!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <Badge
                variant="default"
                className="bg-primary text-primary-foreground"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Live & Functional
              </Badge>
              <h1 className="text-4xl font-bold">Cryptographic Receipts</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Generate verifiable on-chain receipts for your stealth payments.
                Prove payment happened without revealing sensitive details.
              </p>
            </div>

            {/* Receipt Lookup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  On-Chain Receipt Lookup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Invoice ID (bytes32)</Label>
                  <div className="flex gap-2">
                    <Input
                      className="font-mono text-xs flex-1"
                      placeholder="0x..."
                      value={lookupId}
                      onChange={(e) => setLookupId(e.target.value)}
                    />
                    <Button onClick={handleLookup} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Search className="h-4 w-4 mr-2" /> Lookup</>
                      )}
                    </Button>
                  </div>
                </div>

                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 border ${
                      result.verified
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-yellow-500/30 bg-yellow-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.verified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-yellow-400" />
                      )}
                      <span className="font-medium">
                        {result.verified ? "Receipt Verified" : "No Receipt Found"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="truncate">Invoice: {result.invoiceId}</div>
                      {result.verified && (
                        <div className="truncate">Receipt Hash: {result.receiptHash}</div>
                      )}
                    </div>
                    {result.verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => navigate(`/verify?invoiceId=${result.invoiceId}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Full Verification
                      </Button>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Create Receipt
              </Button>
              <Button
                onClick={() => navigate("/verify")}
                size="lg"
                variant="outline"
              >
                <Shield className="h-4 w-4 mr-2" />
                Verify Receipt
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass p-6 rounded-lg space-y-4 border-l-4 border-l-violet"
              >
                <div className="p-3 bg-violet/10 rounded-lg w-fit">
                  <Lock className="h-6 w-6 text-violet" />
                </div>
                <h3 className="text-xl font-semibold">
                  Privacy-Preserving Proofs
                </h3>
                <p className="text-muted-foreground">
                  Cryptographic commitments stored on-chain. Verify payments
                  without exposing transaction details.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-6 rounded-lg space-y-4 border-l-4 border-l-cyan"
              >
                <div className="p-3 bg-cyan/10 rounded-lg w-fit">
                  <Shield className="h-6 w-6 text-cyan" />
                </div>
                <h3 className="text-xl font-semibold">On-Chain Verification</h3>
                <p className="text-muted-foreground">
                  Receipts are stored in smart contracts on Polygon. Anyone can
                  independently verify them.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass p-6 rounded-lg space-y-4 border-l-4 border-l-primary"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Shareable Links</h3>
                <p className="text-muted-foreground">
                  Generate secure receipt links to share with auditors,
                  accountants, or business partners.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glass p-6 rounded-lg space-y-4 border-l-4 border-l-primary"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Future: zk-Proofs</h3>
                <p className="text-muted-foreground">
                  Wave 4 will add zero-knowledge proofs with Noir circuits for
                  advanced privacy guarantees.
                </p>
              </motion.div>
            </div>

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass p-8 rounded-lg space-y-6"
            >
              <h2 className="text-2xl font-semibold">How It Works</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Complete Payment</h3>
                    <p className="text-sm text-muted-foreground">
                      Customer pays invoice using stealth address. Transaction
                      is completed on-chain.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Sweep Funds</h3>
                    <p className="text-sm text-muted-foreground">
                      Merchant sweeps funds from stealth address to their wallet
                      using spending keys.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Generate Receipt</h3>
                    <p className="text-sm text-muted-foreground">
                      Create cryptographic commitment linking invoice ID to
                      transaction hash. Store on-chain.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold">Share & Verify</h3>
                    <p className="text-sm text-muted-foreground">
                      Anyone with the receipt link can verify the commitment
                      on-chain without seeing private details.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="glass p-12 rounded-lg text-center space-y-4"
            >
              <FileCheck className="h-16 w-16 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">
                Ready to Create Receipts?
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete a payment, sweep the funds, then generate a
                cryptographic receipt to prove the transaction.
              </p>
              <Button
                onClick={() => navigate("/invoice/new")}
                size="lg"
                className="mt-4"
              >
                Create New Invoice
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
