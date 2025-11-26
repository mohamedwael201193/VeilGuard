import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { TokenBadge } from "@/components/TokenSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getChainConfig } from "@/lib/contracts";
import { getOptimalGasFunding } from "@/lib/gasManager";
import { ArrowRight, CheckCircle2, Clock, Loader2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Address, parseUnits } from "viem";
import { useAccount, useConfig, usePublicClient, useWalletClient } from "wagmi";

interface InvoiceData {
  stealthAddress: Address;
  amount: string;
  token: Address;
  tokenSymbol: string; // Wave 3: token symbol
  tokenDecimals: number; // Wave 3: token decimals
  ephemeralPubKey: `0x${string}`;
  merchantName?: string;
  description?: string;
  chainId: number;
  expiresAt?: number; // Wave 3: invoice expiry
}

// Helper to get token info from address
function getTokenSymbol(
  chainId: number,
  tokenAddress: string
): { symbol: string; decimals: number } {
  const chainConfig = getChainConfig(chainId);
  if (!chainConfig) return { symbol: "TOKEN", decimals: 18 };

  const token = chainConfig.tokens.find(
    (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  return token
    ? { symbol: token.symbol, decimals: token.decimals }
    : { symbol: "TOKEN", decimals: 18 };
}

export default function PayInvoice() {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const config = useConfig();

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [gasEstimate, setGasEstimate] = useState<{
    amount: string;
    shouldFund: boolean;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Parse invoice data from URL
  useEffect(() => {
    try {
      const stealthAddress = searchParams.get("to") as Address;
      const amount = searchParams.get("amount") || "0";
      const token = searchParams.get("token") as Address;
      const ephemeralPubKey = searchParams.get(
        "ephemeralPubKey"
      ) as `0x${string}`;
      const merchantName = searchParams.get("merchant") || undefined;
      const description = searchParams.get("description") || undefined;
      const invoiceChainId = searchParams.get("chainId");
      const expiresAtStr = searchParams.get("expiresAt");

      if (!stealthAddress || !token || !ephemeralPubKey) {
        toast.error("Invalid invoice link");
        return;
      }

      const parsedChainId = invoiceChainId ? parseInt(invoiceChainId) : 80002;
      const { symbol, decimals } = getTokenSymbol(parsedChainId, token);
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr) : undefined;

      // Check if expired
      if (expiresAt && Date.now() > expiresAt) {
        setIsExpired(true);
      }

      setInvoiceData({
        stealthAddress,
        amount,
        token,
        tokenSymbol: symbol,
        tokenDecimals: decimals,
        ephemeralPubKey,
        merchantName,
        description,
        chainId: parsedChainId,
        expiresAt,
      });
    } catch (error) {
      console.error("Error parsing invoice:", error);
      toast.error("Failed to parse invoice data");
    }
  }, [searchParams]);

  const handlePay = async () => {
    if (!invoiceData || !walletClient || !address || !publicClient) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsPaying(true);

    try {
      const chainConfig = getChainConfig(invoiceData.chainId);
      if (!chainConfig) {
        throw new Error("Chain not supported");
      }

      toast.loading("Announcing payment...", { id: "payment" });

      // Step 1: Announce to StealthHelper (creates the event for inbox scanning)
      const announceHash = await walletClient.writeContract({
        address: chainConfig.stealthHelper as Address,
        chain: config.chains.find((c) => c.id === invoiceData.chainId),
        account: address,
        abi: [
          {
            name: "announce",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "schemeId", type: "uint256" },
              { name: "stealthAddress", type: "address" },
              { name: "ephemeralPubKey", type: "bytes" },
              { name: "metadata", type: "bytes" },
            ],
            outputs: [],
          },
        ],
        functionName: "announce",
        args: [
          BigInt(0), // SECP256K1 scheme
          invoiceData.stealthAddress,
          invoiceData.ephemeralPubKey,
          "0x00", // Metadata (at least 1 byte required by contract)
        ],
      });

      toast.loading("Waiting for announcement confirmation...", {
        id: "payment",
      });
      await publicClient.waitForTransactionReceipt({ hash: announceHash });

      toast.loading("Sending payment + gas...", { id: "payment" });

      // Step 2: Smart gas funding (Wave 3) - only send what's needed
      const gasFunding = await getOptimalGasFunding(
        invoiceData.chainId,
        invoiceData.stealthAddress
      );

      if (gasFunding.shouldFund && gasFunding.amount > 0n) {
        toast.loading(`Sending ${gasFunding.amountEther} POL for gas...`, {
          id: "payment",
        });

        const gasHash = await walletClient.sendTransaction({
          to: invoiceData.stealthAddress,
          value: gasFunding.amount,
        } as any);

        await publicClient.waitForTransactionReceipt({ hash: gasHash });
      } else {
        console.log("Skipping gas funding:", gasFunding.reason);
      }

      // Step 3: Send the actual token payment with correct decimals
      const amountInSmallestUnit = parseUnits(
        invoiceData.amount,
        invoiceData.tokenDecimals
      );

      const paymentHash = await walletClient.writeContract({
        address: invoiceData.token,
        chain: config.chains.find((c) => c.id === invoiceData.chainId),
        account: address,
        abi: [
          {
            name: "transfer",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "transfer",
        args: [invoiceData.stealthAddress, amountInSmallestUnit],
      });

      toast.loading("Waiting for payment confirmation...", { id: "payment" });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: paymentHash,
      });

      // Store payment tx hash in localStorage for merchant to auto-fill
      const invoiceKey = `invoice_payment_${invoiceId}`;
      localStorage.setItem(
        invoiceKey,
        JSON.stringify({
          txHash: paymentHash,
          timestamp: Date.now(),
          amount: invoiceData.amount,
        })
      );

      setTxHash(paymentHash);
      setPaymentComplete(true);

      toast.success(
        <div>
          <div className="font-semibold">Payment Successful! 🎉</div>
          <div className="text-sm mt-1">
            Your payment is now private and secure
          </div>
        </div>,
        { id: "payment", duration: 5000 }
      );
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Payment failed", { id: "payment" });
    } finally {
      setIsPaying(false);
    }
  };

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-400">Loading invoice...</p>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Complete!
            </h1>
            <p className="text-gray-400 mb-6">
              Your payment has been sent privately using stealth addresses
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Amount Paid</span>
                <span className="text-white font-semibold flex items-center gap-2">
                  {invoiceData.amount}{" "}
                  <TokenBadge symbol={invoiceData.tokenSymbol} />
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Transaction</span>
                <a
                  href={`https://${
                    invoiceData.chainId === 80002 ? "amoy." : ""
                  }polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  View on Explorer ↗
                </a>
              </div>
              {invoiceData.merchantName && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Merchant</span>
                  <span className="text-white">{invoiceData.merchantName}</span>
                </div>
              )}
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6">
              <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">
                <strong>Privacy Protected:</strong> Your wallet address is not
                linked to this payment on-chain. The merchant will receive funds
                without knowing who paid.
              </p>
            </div>

            <Button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Done
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Pay Invoice</h1>
          <p className="text-gray-400">
            Complete your payment with full privacy protection
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 space-y-4">
          {invoiceData.merchantName && (
            <div>
              <div className="text-sm text-gray-400 mb-1">Merchant</div>
              <div className="text-xl font-semibold text-white">
                {invoiceData.merchantName}
              </div>
            </div>
          )}

          {invoiceData.description && (
            <div>
              <div className="text-sm text-gray-400 mb-1">Description</div>
              <div className="text-white">{invoiceData.description}</div>
            </div>
          )}

          <div className="border-t border-gray-700 pt-4">
            <div className="text-sm text-gray-400 mb-1">Amount Due</div>
            <div className="text-4xl font-bold text-white flex items-center gap-3">
              {invoiceData.amount}{" "}
              <TokenBadge
                symbol={invoiceData.tokenSymbol}
                className="text-xl"
              />
            </div>
            {invoiceData.expiresAt && !isExpired && (
              <div className="flex items-center gap-2 mt-2 text-yellow-400 text-sm">
                <Clock className="w-4 h-4" />
                Expires: {new Date(invoiceData.expiresAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <strong className="text-purple-300">Privacy Features:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Payment sent to unique stealth address</li>
                <li>Your wallet address remains private</li>
                <li>Merchant can verify without revealing identities</li>
              </ul>
            </div>
          </div>
        </div>

        {!address ? (
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Connect your wallet to continue
            </p>
            <ConnectButton />
          </div>
        ) : chainId !== invoiceData.chainId ? (
          <div className="text-center">
            <p className="text-yellow-400 mb-4">
              ⚠️ Please switch to Polygon Amoy network
            </p>
            <NetworkSwitcher />
          </div>
        ) : isExpired ? (
          <div className="text-center">
            <p className="text-red-400 mb-4">⚠️ This invoice has expired</p>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Return Home
            </Button>
          </div>
        ) : (
          <Button
            onClick={handlePay}
            disabled={isPaying}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing Payment...
              </>
            ) : (
              <>
                Pay {invoiceData.amount} {invoiceData.tokenSymbol}
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          Powered by VeilGuard • ERC-5564 Stealth Addresses
        </p>
      </Card>
    </div>
  );
}
