import InvoiceRegistryAbi from "@/abi/InvoiceRegistry.abi.json";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { announceStealth } from "@/lib/announce";
import { getChainConfig } from "@/lib/contracts";
import { genStealth } from "@/lib/stealthDemo";
import { genInvoiceStealth } from "@/lib/stealthSpec";
import { useInvoiceStore } from "@/store/invoiceStore";
import type { Invoice } from "@/types";
import { motion } from "framer-motion";
import { Info, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  createPublicClient,
  decodeEventLog,
  encodePacked,
  http,
  keccak256,
  parseUnits,
} from "viem";
import { useAccount, useChainId, useWalletClient } from "wagmi";

export default function NewInvoice() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { addInvoice } = useInvoiceStore();

  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDC");
  const [memo, setMemo] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const chainConfig = getChainConfig(chainId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address || !walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!chainConfig) {
      toast.error("Unsupported network");
      return;
    }

    setIsCreating(true);

    try {
      // Get token config
      const tokenConfig = chainConfig.tokens.find((t) => t.symbol === token);
      if (!tokenConfig) {
        throw new Error("Token not found");
      }

      // Check stealth mode from environment
      const stealthMode = import.meta.env.VITE_STEALTH_MODE || "demo";

      let stealthData: {
        stealthAddress: `0x${string}`;
        ephemeralPubKey: `0x${string}`;
        metadata: `0x${string}`;
      };

      if (stealthMode === "spec") {
        // Use ERC-5564 compliant stealth derivation
        // Derive deterministic private keys from wallet address for meta-address
        const spendingPriv = keccak256(
          encodePacked(
            ["string", "address"],
            ["spending", address as `0x${string}`]
          )
        ) as `0x${string}`;

        const viewingPriv = keccak256(
          encodePacked(
            ["string", "address"],
            ["viewing", address as `0x${string}`]
          )
        ) as `0x${string}`;

        console.log("NewInvoice - Using keys:");
        console.log("Spending:", spendingPriv);
        console.log("Viewing:", viewingPriv);

        // Generate spec-compliant stealth address
        stealthData = genInvoiceStealth({
          spendPriv: spendingPriv,
          viewPriv: viewingPriv,
        });

        console.log(
          "NewInvoice - Generated stealth address:",
          stealthData.stealthAddress
        );
        console.log(
          "NewInvoice - Ephemeral pub key:",
          stealthData.ephemeralPubKey
        );
      } else {
        // Legacy demo mode
        const spendingSeed = keccak256(
          encodePacked(
            ["string", "address"],
            ["spending", address as `0x${string}`]
          )
        );
        const viewingSeed = keccak256(
          encodePacked(
            ["string", "address"],
            ["viewing", address as `0x${string}`]
          )
        );

        stealthData = genStealth({
          spendPubKey: spendingSeed,
          viewPubKey: viewingSeed,
        });
      }

      // Convert amount to token decimals (USDC = 6 decimals)
      const amountInWei = parseUnits(amount, tokenConfig.decimals);

      // Step 1: Try to announce stealth address on-chain (optional, won't fail invoice creation)
      try {
        toast.loading("Announcing stealth address...", { id: "announce" });
        await announceStealth(
          chainConfig.stealthHelper as `0x${string}`,
          stealthData.stealthAddress,
          stealthData.ephemeralPubKey,
          stealthData.metadata,
          chainId,
          walletClient
        );
        toast.success("Stealth address announced!", { id: "announce" });
      } catch (err) {
        console.warn("Announcement failed (non-critical):", err);
        toast.dismiss("announce");
      }

      // Step 2: Create invoice on-chain
      toast.loading("Creating invoice on-chain...", { id: "create" });

      const chain =
        chainId === 137
          ? {
              id: 137,
              name: "Polygon",
              nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
              rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
            }
          : {
              id: 80002,
              name: "Polygon Amoy",
              nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
              rpcUrls: {
                default: { http: ["https://rpc-amoy.polygon.technology"] },
              },
            };

      const hash = await walletClient.writeContract({
        address: chainConfig.invoiceRegistry as `0x${string}`,
        abi: InvoiceRegistryAbi,
        functionName: "createInvoice",
        args: [
          tokenConfig.address as `0x${string}`,
          amountInWei,
          stealthData.stealthAddress,
          memo || "",
        ],
        account: address,
        chain,
        gas: 200000n, // Explicit gas limit to avoid estimation issues
      });

      toast.success("Invoice created! Waiting for confirmation...", {
        id: "create",
      });

      // Wait for transaction to be mined
      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Decode the InvoiceCreated event to get the actual invoice ID
      let onChainInvoiceId = hash; // Fallback to tx hash

      try {
        // Find the InvoiceCreated event in the logs
        const invoiceCreatedLog = receipt.logs.find(
          (log) =>
            log.address.toLowerCase() ===
            chainConfig.invoiceRegistry.toLowerCase()
        );

        if (invoiceCreatedLog && "topics" in invoiceCreatedLog) {
          // Decode the event to get the invoiceId
          const decoded = decodeEventLog({
            abi: InvoiceRegistryAbi,
            data: invoiceCreatedLog.data,
            topics: invoiceCreatedLog.topics as [
              `0x${string}`,
              ...`0x${string}`[]
            ],
          });

          if (
            decoded.eventName === "InvoiceCreated" &&
            decoded.args &&
            typeof decoded.args === "object" &&
            "invoiceId" in decoded.args
          ) {
            // The first indexed parameter (invoiceId) is in the decoded args
            onChainInvoiceId = decoded.args.invoiceId as `0x${string}`;
          }
        }
      } catch (error) {
        console.warn(
          "Could not decode InvoiceCreated event, using tx hash:",
          error
        );
      }

      // Create invoice object for local store
      const invoice: Invoice = {
        id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        onChainInvoiceId, // Store the actual on-chain invoice ID from the event
        amount,
        token,
        tokenAddress: tokenConfig.address,
        stealthAddress: stealthData.stealthAddress,
        ephemeralPubKey: stealthData.ephemeralPubKey,
        viewTag: stealthData.metadata, // metadata is the view tag
        memo: memo || undefined,
        status: "pending",
        createdAt: Date.now(),
        merchantAddress: address,
        txHash: hash,
      };

      // Save to store
      addInvoice(invoice);

      toast.success("Invoice created successfully!");
      navigate(`/invoice/${invoice.id}`);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      const message = error?.message || "Failed to create invoice";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-md glass p-12 rounded-lg"
          >
            <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to create an invoice.
            </p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl font-bold">Create Invoice</h1>
              <p className="text-muted-foreground mt-2">
                Generate a private payment request with stealth address
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="glass p-8 rounded-lg space-y-6"
            >
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="text-lg"
                />
              </div>

              {/* Token */}
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Select value={token} onValueChange={setToken}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chainConfig?.tokens.map((t) => (
                      <SelectItem key={t.symbol} value={t.symbol}>
                        {t.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Memo */}
              <div className="space-y-2">
                <Label htmlFor="memo">Memo (Optional)</Label>
                <Textarea
                  id="memo"
                  placeholder="Invoice for services rendered..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full magnetic bg-primary hover:bg-primary/90 glow-lime"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </form>

            {/* Info Panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass p-6 rounded-lg space-y-4"
            >
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold">How It Works</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • A unique stealth address is generated for this invoice
                    </li>
                    <li>
                      • Payment can only be linked to this specific invoice
                    </li>
                    <li>• No personal information is stored on-chain</li>
                    <li>• You'll be notified when payment is received</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
