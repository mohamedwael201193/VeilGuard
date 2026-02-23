/**
 * Disputes Page — Wave 6
 * Open, manage, and resolve escrow disputes via VeilDispute contract
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { formatUnits, type Address } from "viem";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ShieldAlert, Loader2, RefreshCw, FileText,
  Clock, CheckCircle2, XCircle, Scale, Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getChainConfig } from "@/lib/contracts";
import {
  openDispute,
  submitEvidence,
  getDispute,
  getBuyerDisputes,
  getSellerDisputes,
} from "@/lib/disputeManager";
import type { DisputeData } from "@/types";

const RESOLUTION_STYLES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Pending: { label: "Open", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-3 w-3 mr-1" /> },
  BuyerWins: { label: "Buyer Wins", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
  SellerWins: { label: "Seller Wins", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
  SplitDecision: { label: "Split", color: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: <Scale className="h-3 w-3 mr-1" /> },
  Expired: { label: "Expired", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3 mr-1" /> },
};

export default function DisputesPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const chainConfig = getChainConfig(chainId);

  const [tab, setTab] = useState("cases");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [disputes, setDisputes] = useState<DisputeData[]>([]);

  // Open form
  const [escrowId, setEscrowId] = useState("");
  const [buyerAddr, setBuyerAddr] = useState("");
  const [sellerAddr, setSellerAddr] = useState("");
  const [tokenAddr, setTokenAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  // Evidence form (per dispute)
  const [evidenceMap, setEvidenceMap] = useState<Record<string, string>>({});

  const loadDisputes = useCallback(async () => {
    if (!address) return;
    setRefreshing(true);
    try {
      const [buyerIds, sellerIds] = await Promise.all([
        getBuyerDisputes(chainId, address),
        getSellerDisputes(chainId, address),
      ]);
      const allIds = [...new Set([...buyerIds, ...sellerIds])];
      const data = await Promise.all(allIds.map((id) => getDispute(chainId, id)));
      // Sort newest first
      data.sort((a, b) => b.createdAt - a.createdAt);
      setDisputes(data);
    } catch (err) {
      console.error("Failed to load disputes:", err);
    } finally {
      setRefreshing(false);
    }
  }, [address, chainId]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const handleOpenDispute = async () => {
    if (!walletClient || !address) {
      toast.error("Connect wallet first");
      return;
    }
    if (!escrowId || !buyerAddr || !sellerAddr || !tokenAddr || !amount || !reason) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      toast.loading("Opening dispute...", { id: "dispute" });
      const decimals = chainConfig?.tokens.find(
        (t) => t.address.toLowerCase() === tokenAddr.toLowerCase()
      )?.decimals || 6;
      const hash = await openDispute({
        chainId,
        walletClient,
        account: address,
        escrowId: Number(escrowId),
        buyer: buyerAddr as Address,
        seller: sellerAddr as Address,
        token: tokenAddr as Address,
        amount: BigInt(Math.round(parseFloat(amount) * 10 ** decimals)),
        evidence: reason,
      });
      toast.success(`Dispute opened! TX: ${hash.slice(0, 10)}...`, { id: "dispute" });
      setEscrowId("");
      setBuyerAddr("");
      setSellerAddr("");
      setTokenAddr("");
      setAmount("");
      setReason("");
      setTab("cases");
      loadDisputes();
    } catch (err: any) {
      toast.error(err.message || "Failed to open dispute", { id: "dispute" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvidence = async (disputeId: number) => {
    if (!walletClient || !address) return;
    const ev = evidenceMap[disputeId.toString()] || "";
    if (!ev.trim()) {
      toast.error("Enter evidence text");
      return;
    }
    try {
      toast.loading("Submitting evidence...", { id: "evidence" });
      await submitEvidence({
        chainId,
        walletClient,
        account: address,
        disputeId,
        evidence: ev,
      });
      toast.success("Evidence submitted", { id: "evidence" });
      setEvidenceMap({ ...evidenceMap, [disputeId.toString()]: "" });
      loadDisputes();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit evidence", { id: "evidence" });
    }
  };

  const isParty = (d: DisputeData) =>
    d.buyer.toLowerCase() === address?.toLowerCase() ||
    d.seller.toLowerCase() === address?.toLowerCase();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-primary" />
              Disputes
            </h1>
            <p className="text-muted-foreground mt-1">
              Resolve escrow disagreements on-chain with arbitration
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="cases">
              <Scale className="h-3.5 w-3.5 mr-1" /> My Cases ({disputes.length})
            </TabsTrigger>
            <TabsTrigger value="open">
              <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Open Dispute
            </TabsTrigger>
          </TabsList>

          {/* Cases */}
          <TabsContent value="cases" className="space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={loadDisputes} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {disputes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Scale className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p>No disputes found</p>
                </CardContent>
              </Card>
            ) : (
              disputes.map((d) => {
                const statusInfo = RESOLUTION_STYLES[d.resolution] || RESOLUTION_STYLES.Pending;
                const tokenInfo = chainConfig?.tokens.find(
                  (t) => t.address.toLowerCase() === d.token.toLowerCase()
                );
                const formattedAmount = tokenInfo
                  ? formatUnits(BigInt(d.amount), tokenInfo.decimals)
                  : d.amount;
                const isBuyer = d.buyer.toLowerCase() === address?.toLowerCase();
                const deadlineDate = new Date(d.deadline * 1000);
                const expired = Date.now() > d.deadline * 1000;

                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-white/[0.06] rounded-xl p-5 bg-card/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        <span className="font-medium">Dispute #{d.id.toString()}</span>
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {isBuyer ? "You: Buyer" : "You: Seller"}
                        </Badge>
                      </div>
                      <span className="font-bold">
                        {formattedAmount} {tokenInfo?.symbol || "TOKEN"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div>Escrow #{d.escrowId.toString()}</div>
                      <div className="text-right">
                        {expired && d.resolution === "Pending"
                          ? "Deadline passed"
                          : `Deadline: ${deadlineDate.toLocaleDateString()}`}
                      </div>
                      <div className="truncate">
                        Buyer: {d.buyer.slice(0, 8)}...{d.buyer.slice(-6)}
                      </div>
                      <div className="truncate text-right">
                        Seller: {d.seller.slice(0, 8)}...{d.seller.slice(-6)}
                      </div>
                    </div>

                    {d.buyerEvidence && (
                      <div className="text-sm bg-background/50 rounded-lg p-3 mb-3">
                        <span className="text-muted-foreground text-xs block mb-1">
                          <FileText className="h-3 w-3 inline mr-1" />Buyer Evidence
                        </span>
                        <p>{d.buyerEvidence}</p>
                      </div>
                    )}

                    {d.sellerEvidence && (
                      <div className="text-sm bg-background/50 rounded-lg p-3 mb-3">
                        <span className="text-muted-foreground text-xs block mb-1">
                          <FileText className="h-3 w-3 inline mr-1" />Seller Evidence
                        </span>
                        <p>{d.sellerEvidence}</p>
                      </div>
                    )}

                    {d.resolved && (
                      <div className="mt-3 text-sm border-t border-white/[0.06] pt-3">
                        <span className="text-muted-foreground">Resolution: </span>
                        <span className="font-medium">{d.resolution} — Buyer {d.buyerPercent}% / Seller {100 - d.buyerPercent}%</span>
                      </div>
                    )}

                    {/* Submit evidence if open and user is party */}
                    {d.resolution === "Pending" && isParty(d) && (
                      <div className="mt-3 flex gap-2">
                        <Input
                          placeholder="Submit evidence or statement..."
                          className="flex-1 text-sm"
                          value={evidenceMap[d.id.toString()] || ""}
                          onChange={(e) =>
                            setEvidenceMap({ ...evidenceMap, [d.id.toString()]: e.target.value })
                          }
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSubmitEvidence(d.id)}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" /> Submit
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Open Dispute */}
          <TabsContent value="open">
            <Card>
              <CardHeader>
                <CardTitle>Open a Dispute</CardTitle>
                <CardDescription>
                  Initiate arbitration for an escrow transaction. An arbitrator will review and resolve.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Escrow ID</Label>
                  <Input
                    type="number"
                    placeholder="Escrow ID from your transaction"
                    value={escrowId}
                    onChange={(e) => setEscrowId(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Buyer Address</Label>
                    <Input
                      className="font-mono text-xs"
                      placeholder="0x..."
                      value={buyerAddr}
                      onChange={(e) => setBuyerAddr(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Seller Address</Label>
                    <Input
                      className="font-mono text-xs"
                      placeholder="0x..."
                      value={sellerAddr}
                      onChange={(e) => setSellerAddr(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Select value={tokenAddr} onValueChange={setTokenAddr}>
                      <SelectTrigger><SelectValue placeholder="Select token" /></SelectTrigger>
                      <SelectContent>
                        {chainConfig?.tokens.map((t) => (
                          <SelectItem key={t.address} value={t.address}>
                            {t.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Disputed Amount</Label>
                    <Input
                      type="number"
                      placeholder="100.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason for dispute</Label>
                  <Textarea
                    placeholder="Describe why you are disputing this transaction..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleOpenDispute}
                  disabled={loading || !escrowId || !reason}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening Dispute...</>
                  ) : (
                    <><ShieldAlert className="h-4 w-4 mr-2" /> Open Dispute</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
