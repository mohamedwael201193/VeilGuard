/**
 * Escrow Page - Wave 5
 *
 * Trustless on-chain escrow for secure ERC-20 payments.
 * Fully functional with real VeilEscrow contract on Polygon mainnet.
 */

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { TokenSelector, TokenBadge } from "@/components/TokenSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getChainConfig } from "@/lib/contracts";
import type { TokenConfig } from "@/types";
import ESCROW_ABI from "@/abi/VeilEscrow.abi.json";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Handshake,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { encodeFunctionData, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  useConfig,
  usePublicClient,
  useWalletClient,
} from "wagmi";

const ESCROW_ADDRESS =
  (import.meta.env.VITE_ESCROW_137 as `0x${string}`) ||
  "0x4675f8567d1D6236F76Fe48De2450D5599156af1";

interface EscrowData {
  id: number;
  buyer: string;
  seller: string;
  token: string;
  amount: bigint;
  deadline: number;
  description: string;
  status: number; // 0=Active, 1=Released, 2=Refunded, 3=Disputed
  createdAt: number;
}

const STATUS_MAP: Record<number, { label: string; color: string; icon: any }> = {
  0: { label: "Active", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  1: { label: "Released", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  2: { label: "Refunded", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: RefreshCw },
  3: { label: "Disputed", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
};

export default function EscrowPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const wagmiConfig = useConfig();
  const chainConfig = getChainConfig(chainId);
  const chain = wagmiConfig.chains.find((c) => c.id === chainId);

  const [tab, setTab] = useState<"create" | "manage">("create");

  // Create form state
  const [sellerAddr, setSellerAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Escrow list
  const [myEscrows, setMyEscrows] = useState<EscrowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const token = selectedToken || chainConfig?.tokens[0];

  // Load user's escrows
  const loadEscrows = useCallback(async () => {
    if (!publicClient || !address) return;
    setIsLoading(true);
    try {
      const total = (await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "totalEscrows",
      } as any)) as bigint;

      const escrows: EscrowData[] = [];
      const count = Number(total);
      // Read last 50 max
      const start = Math.max(0, count - 50);
      for (let i = count - 1; i >= start; i--) {
        try {
          const result = (await publicClient.readContract({
            address: ESCROW_ADDRESS,
            abi: ESCROW_ABI,
            functionName: "getEscrow",
            args: [BigInt(i)],
          } as any)) as [string, string, string, bigint, bigint, string, number, bigint];

          const [buyer, seller, tok, amt, deadline, desc, status, createdAt] = result;
          // Only show escrows involving current user
          if (
            buyer.toLowerCase() === address.toLowerCase() ||
            seller.toLowerCase() === address.toLowerCase()
          ) {
            escrows.push({
              id: i,
              buyer,
              seller,
              token: tok,
              amount: amt,
              deadline: Number(deadline),
              description: desc,
              status,
              createdAt: Number(createdAt),
            });
          }
        } catch {
          // skip errors
        }
      }
      setMyEscrows(escrows);
    } catch (err: any) {
      console.error("Failed to load escrows:", err);
    }
    setIsLoading(false);
  }, [publicClient, address]);

  useEffect(() => {
    if (isConnected && tab === "manage") loadEscrows();
  }, [isConnected, tab, loadEscrows]);

  // Create escrow
  const handleCreate = useCallback(async () => {
    if (!walletClient || !publicClient || !token || !address) return;
    if (!sellerAddr || !amount || !description) {
      toast.error("Fill all fields");
      return;
    }

    setIsCreating(true);
    try {
      const amountWei = parseUnits(amount, token.decimals);
      const deadlineUnix = BigInt(
        Math.floor(Date.now() / 1000) + parseInt(deadlineDays) * 86400
      );

      // Step 1: Approve token spending
      toast.info("Step 1/2: Approving token transfer...");
      const approveTx = await walletClient.writeContract({
        address: token.address as `0x${string}`,
        chain,
        account: address,
        abi: [
          {
            name: "approve",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ type: "bool" }],
          },
        ],
        functionName: "approve",
        args: [ESCROW_ADDRESS, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Step 2: Create escrow
      toast.info("Step 2/2: Creating escrow...");
      const createTx = await walletClient.writeContract({
        address: ESCROW_ADDRESS,
        chain,
        account: address,
        abi: ESCROW_ABI,
        functionName: "createEscrow",
        args: [
          sellerAddr as `0x${string}`,
          token.address as `0x${string}`,
          amountWei,
          deadlineUnix,
          description,
        ],
      } as any);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: createTx });

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      toast.success("Escrow created on-chain!");

      // Reset form
      setSellerAddr("");
      setAmount("");
      setDescription("");
      setTab("manage");
      loadEscrows();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.shortMessage || err?.message || "Transaction failed");
    }
    setIsCreating(false);
  }, [walletClient, publicClient, token, address, sellerAddr, amount, description, deadlineDays, loadEscrows]);

  // Release escrow (buyer only)
  const handleRelease = useCallback(
    async (escrowId: number) => {
      if (!walletClient || !publicClient) return;
      setActionLoading(escrowId);
      try {
        const tx = await walletClient.writeContract({
          address: ESCROW_ADDRESS,
          chain,
          account: address,
          abi: ESCROW_ABI,
          functionName: "release",
          args: [BigInt(escrowId)],
        } as any);
        await publicClient.waitForTransactionReceipt({ hash: tx });
        confetti({ particleCount: 80, spread: 60 });
        toast.success("Funds released to seller!");
        loadEscrows();
      } catch (err: any) {
        toast.error(err?.shortMessage || "Release failed");
      }
      setActionLoading(null);
    },
    [walletClient, publicClient, loadEscrows]
  );

  // Refund escrow (buyer only)
  const handleRefund = useCallback(
    async (escrowId: number) => {
      if (!walletClient || !publicClient) return;
      setActionLoading(escrowId);
      try {
        const tx = await walletClient.writeContract({
          address: ESCROW_ADDRESS,
          chain,
          account: address,
          abi: ESCROW_ABI,
          functionName: "refund",
          args: [BigInt(escrowId)],
        } as any);
        await publicClient.waitForTransactionReceipt({ hash: tx });
        toast.success("Funds refunded!");
        loadEscrows();
      } catch (err: any) {
        toast.error(err?.shortMessage || "Refund failed");
      }
      setActionLoading(null);
    },
    [walletClient, publicClient, loadEscrows]
  );

  // Claim expired (seller only)
  const handleClaim = useCallback(
    async (escrowId: number) => {
      if (!walletClient || !publicClient) return;
      setActionLoading(escrowId);
      try {
        const tx = await walletClient.writeContract({
          address: ESCROW_ADDRESS,
          chain,
          account: address,
          abi: ESCROW_ABI,
          functionName: "claimExpired",
          args: [BigInt(escrowId)],
        } as any);
        await publicClient.waitForTransactionReceipt({ hash: tx });
        confetti({ particleCount: 80, spread: 60 });
        toast.success("Funds claimed!");
        loadEscrows();
      } catch (err: any) {
        toast.error(err?.shortMessage || "Claim failed");
      }
      setActionLoading(null);
    },
    [walletClient, publicClient, loadEscrows]
  );

  // Dispute (buyer only)
  const handleDispute = useCallback(
    async (escrowId: number) => {
      if (!walletClient || !publicClient) return;
      setActionLoading(escrowId);
      try {
        const tx = await walletClient.writeContract({
          address: ESCROW_ADDRESS,
          chain,
          account: address,
          abi: ESCROW_ABI,
          functionName: "dispute",
          args: [BigInt(escrowId)],
        } as any);
        await publicClient.waitForTransactionReceipt({ hash: tx });
        toast.warning("Escrow disputed. Contact the other party.");
        loadEscrows();
      } catch (err: any) {
        toast.error(err?.shortMessage || "Dispute failed");
      }
      setActionLoading(null);
    },
    [walletClient, publicClient, loadEscrows]
  );

  // Resolve token symbol from address
  const getTokenSymbol = (tokenAddr: string) => {
    const found = chainConfig?.tokens.find(
      (t) => t.address.toLowerCase() === tokenAddr.toLowerCase()
    );
    return found?.symbol || "TOKEN";
  };

  const getTokenDecimals = (tokenAddr: string) => {
    const found = chainConfig?.tokens.find(
      (t) => t.address.toLowerCase() === tokenAddr.toLowerCase()
    );
    return found?.decimals || 6;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-md glass p-12 rounded-lg"
          >
            <Handshake className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Trustless Escrow</h2>
            <p className="text-muted-foreground">
              Connect your wallet to create or manage escrow payments.
            </p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-3">
              <Handshake className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Trustless Escrow</h1>
            </div>
            <p className="text-muted-foreground">
              Secure on-chain payments — buyer deposits, seller delivers, funds release.
            </p>
            <a
              href={`https://polygonscan.com/address/${ESCROW_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Contract: {ESCROW_ADDRESS.slice(0, 8)}...{ESCROW_ADDRESS.slice(-6)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </motion.div>

          {/* Tab Switcher */}
          <div className="flex gap-2 justify-center">
            <Button
              variant={tab === "create" ? "default" : "outline"}
              onClick={() => setTab("create")}
              className={tab === "create" ? "bg-primary" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Escrow
            </Button>
            <Button
              variant={tab === "manage" ? "default" : "outline"}
              onClick={() => setTab("manage")}
              className={tab === "manage" ? "bg-primary" : ""}
            >
              <Shield className="h-4 w-4 mr-2" />
              My Escrows
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "create" ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="glass p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-semibold">New Escrow</h2>
                  </div>

                  {/* Seller Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seller Address</label>
                    <Input
                      placeholder="0x..."
                      value={sellerAddr}
                      onChange={(e) => setSellerAddr(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  {/* Amount + Token */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token</label>
                      <TokenSelector
                        value={token?.symbol || "USDC"}
                        onChange={(t) => setSelectedToken(t)}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      placeholder="e.g. Logo design, Freelance work, Product purchase..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Deadline */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Auto-release deadline (days)
                    </label>
                    <div className="flex gap-2">
                      {["1", "3", "7", "14", "30"].map((d) => (
                        <Button
                          key={d}
                          variant={deadlineDays === d ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDeadlineDays(d)}
                          className={deadlineDays === d ? "bg-primary" : ""}
                        >
                          {d}d
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seller can auto-claim after {deadlineDays} day{parseInt(deadlineDays) > 1 ? "s" : ""} if buyer doesn't act.
                    </p>
                  </div>

                  {/* Summary */}
                  {amount && sellerAddr && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">You deposit:</span>{" "}
                        <span className="font-bold text-primary">{amount} {token?.symbol}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Seller:</span>{" "}
                        <span className="font-mono text-xs">{sellerAddr.slice(0, 10)}...{sellerAddr.slice(-8)}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Auto-release:</span>{" "}
                        {new Date(Date.now() + parseInt(deadlineDays) * 86400000).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleCreate}
                    disabled={isCreating || !sellerAddr || !amount || !description}
                    className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 glow-lime"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Creating Escrow...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Deposit & Create Escrow
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* How it works */}
                  <div className="border-t border-border/30 pt-4">
                    <p className="text-xs text-muted-foreground font-medium mb-3">How it works:</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="space-y-1">
                        <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center mx-auto text-primary font-bold text-sm">1</div>
                        <p className="text-xs text-muted-foreground">Buyer deposits tokens into escrow</p>
                      </div>
                      <div className="space-y-1">
                        <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center mx-auto text-primary font-bold text-sm">2</div>
                        <p className="text-xs text-muted-foreground">Seller delivers goods/services</p>
                      </div>
                      <div className="space-y-1">
                        <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center mx-auto text-primary font-bold text-sm">3</div>
                        <p className="text-xs text-muted-foreground">Buyer releases or auto-release at deadline</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="manage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">My Escrows</h2>
                  <Button variant="outline" size="sm" onClick={loadEscrows} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>

                {isLoading ? (
                  <div className="glass p-12 rounded-xl text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground mt-3">Loading escrows from chain...</p>
                  </div>
                ) : myEscrows.length === 0 ? (
                  <Card className="glass p-12 text-center">
                    <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No escrows found. Create your first one!</p>
                  </Card>
                ) : (
                  myEscrows.map((esc) => {
                    const statusInfo = STATUS_MAP[esc.status] || STATUS_MAP[0];
                    const StatusIcon = statusInfo.icon;
                    const isBuyer = esc.buyer.toLowerCase() === address?.toLowerCase();
                    const isSeller = esc.seller.toLowerCase() === address?.toLowerCase();
                    const isExpired = Date.now() / 1000 > esc.deadline;
                    const tokenSymbol = getTokenSymbol(esc.token);
                    const tokenDecimals = getTokenDecimals(esc.token);
                    const formattedAmount = formatUnits(esc.amount, tokenDecimals);

                    return (
                      <motion.div
                        key={esc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="glass p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg font-bold">#{esc.id}</span>
                                <Badge className={statusInfo.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                                {isBuyer && (
                                  <Badge variant="outline" className="text-xs">You're Buyer</Badge>
                                )}
                                {isSeller && (
                                  <Badge variant="outline" className="text-xs">You're Seller</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{esc.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">
                                {formattedAmount} <TokenBadge symbol={tokenSymbol} />
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Buyer: </span>
                              <span className="font-mono">
                                {esc.buyer.slice(0, 8)}...{esc.buyer.slice(-6)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Seller: </span>
                              <span className="font-mono">
                                {esc.seller.slice(0, 8)}...{esc.seller.slice(-6)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Created: </span>
                              {new Date(esc.createdAt * 1000).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Deadline: </span>
                              <span className={isExpired ? "text-red-400" : ""}>
                                {new Date(esc.deadline * 1000).toLocaleDateString()}
                                {isExpired && " (expired)"}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          {esc.status === 0 && (
                            <div className="flex gap-2 pt-2 border-t border-border/30">
                              {isBuyer && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRelease(esc.id)}
                                    disabled={actionLoading === esc.id}
                                    className="bg-green-600 hover:bg-green-500"
                                  >
                                    {actionLoading === esc.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                    )}
                                    Release Funds
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRefund(esc.id)}
                                    disabled={actionLoading === esc.id}
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Refund
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDispute(esc.id)}
                                    disabled={actionLoading === esc.id}
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Dispute
                                  </Button>
                                </>
                              )}
                              {isSeller && isExpired && (
                                <Button
                                  size="sm"
                                  onClick={() => handleClaim(esc.id)}
                                  disabled={actionLoading === esc.id}
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  {actionLoading === esc.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  )}
                                  Claim (Expired)
                                </Button>
                              )}
                              {isSeller && !isExpired && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Waiting for buyer to release or deadline to pass
                                </p>
                              )}
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
