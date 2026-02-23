/**
 * Subscriptions Page — Wave 6
 * Create, manage, and charge on-chain recurring payments via VeilSubscription
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  RefreshCw, Plus, Pause, Play, XCircle, Zap,
  Clock, ArrowRight, Loader2, CalendarClock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getChainConfig, ERC20_ABI } from "@/lib/contracts";
import {
  createSubscription,
  chargeSubscription,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  getSubscription,
  getPayerSubscriptions,
  getMerchantSubscriptions,
  isChargeable,
  formatInterval,
} from "@/lib/subscriptionManager";
import type { SubscriptionData } from "@/types";

const INTERVALS = [
  { label: "Hourly", seconds: 3600 },
  { label: "Daily", seconds: 86400 },
  { label: "Weekly", seconds: 604800 },
  { label: "Monthly (30d)", seconds: 2592000 },
  { label: "Yearly (365d)", seconds: 31536000 },
];

export default function Subscriptions() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const chainConfig = getChainConfig(chainId);

  const [tab, setTab] = useState("manage");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [payerSubs, setPayerSubs] = useState<SubscriptionData[]>([]);
  const [merchantSubs, setMerchantSubs] = useState<SubscriptionData[]>([]);
  const [chargeableMap, setChargeableMap] = useState<Record<number, boolean>>({});

  // Create form
  const [merchant, setMerchant] = useState("");
  const [token, setToken] = useState(chainConfig?.tokens[0]?.address || "");
  const [amount, setAmount] = useState("");
  const [interval, setInterval_] = useState(INTERVALS[3].seconds.toString());
  const [maxCycles, setMaxCycles] = useState("0");
  const [memo, setMemo] = useState("");

  const selectedToken = chainConfig?.tokens.find((t) => t.address === token);

  const loadSubscriptions = useCallback(async () => {
    if (!address) return;
    setRefreshing(true);
    try {
      const [payerIds, merchantIds] = await Promise.all([
        getPayerSubscriptions(chainId, address),
        getMerchantSubscriptions(chainId, address),
      ]);

      const payerData = await Promise.all(
        payerIds.map((id) => getSubscription(chainId, id))
      );
      const merchantData = await Promise.all(
        merchantIds.map((id) => getSubscription(chainId, id))
      );

      setPayerSubs(payerData);
      setMerchantSubs(merchantData);

      // Check chargeability for merchant subs
      const allSubs = [...payerData, ...merchantData];
      const activeSubs = allSubs.filter((s) => s.status === "Active");
      const chargeResults: Record<number, boolean> = {};
      await Promise.all(
        activeSubs.map(async (s) => {
          chargeResults[s.id] = await isChargeable(chainId, s.id);
        })
      );
      setChargeableMap(chargeResults);
    } catch (err: any) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setRefreshing(false);
    }
  }, [address, chainId]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleCreate = async () => {
    if (!walletClient || !address || !merchant || !amount || !token) {
      toast.error("Fill all fields and connect wallet");
      return;
    }

    setLoading(true);
    try {
      const decimals = selectedToken?.decimals || 6;
      const amountWei = parseUnits(amount, decimals);

      // First approve the subscription contract for the token
      toast.loading("Approving token...", { id: "sub" });
      const subAddr = chainConfig?.subscription as Address;
      const maxApproval = amountWei * BigInt(maxCycles === "0" ? 1000 : Number(maxCycles));

      await walletClient.writeContract({
        address: token as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [subAddr, maxApproval],
        chain: undefined,
        account: address,
      });

      toast.loading("Creating subscription...", { id: "sub" });
      const hash = await createSubscription({
        chainId,
        walletClient,
        account: address,
        merchant: merchant as Address,
        token: token as Address,
        amount: amountWei,
        intervalSeconds: Number(interval),
        maxCycles: Number(maxCycles),
        memo,
      });

      toast.success(`Subscription created! TX: ${hash.slice(0, 10)}...`, { id: "sub" });
      setMerchant("");
      setAmount("");
      setMemo("");
      setTab("manage");
      loadSubscriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to create subscription", { id: "sub" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    action: "charge" | "pause" | "resume" | "cancel",
    subId: number
  ) => {
    if (!walletClient || !address) return;
    const toastId = `sub-${action}-${subId}`;
    toast.loading(`Processing ${action}...`, { id: toastId });

    try {
      const fns = { charge: chargeSubscription, pause: pauseSubscription, resume: resumeSubscription, cancel: cancelSubscription };
      await fns[action]({ chainId, walletClient, account: address, subscriptionId: subId });
      toast.success(`${action} successful!`, { id: toastId });
      loadSubscriptions();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action}`, { id: toastId });
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "Active": return "bg-green-500/10 text-green-400 border-green-500/30";
      case "Paused": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "Cancelled": return "bg-red-500/10 text-red-400 border-red-500/30";
      case "Completed": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      default: return "";
    }
  };

  const renderSubCard = (sub: SubscriptionData, role: "payer" | "merchant") => {
    const tokenInfo = chainConfig?.tokens.find(
      (t) => t.address.toLowerCase() === sub.token.toLowerCase()
    );
    const formattedAmount = tokenInfo
      ? formatUnits(BigInt(sub.amount), tokenInfo.decimals)
      : sub.amount;

    return (
      <motion.div
        key={sub.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-white/[0.06] rounded-xl p-4 bg-card/50 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">#{sub.id}</span>
            <Badge variant="outline" className={statusColor(sub.status)}>
              {sub.status}
            </Badge>
          </div>
          <span className="text-lg font-bold">
            {formattedAmount} {tokenInfo?.symbol || "TOKEN"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span className="block text-[10px] uppercase tracking-wider">
              {role === "payer" ? "Merchant" : "Payer"}
            </span>
            <span className="font-mono text-foreground">
              {(role === "payer" ? sub.merchant : sub.payer).slice(0, 6)}...
              {(role === "payer" ? sub.merchant : sub.payer).slice(-4)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider">Interval</span>
            <span className="text-foreground">{formatInterval(sub.interval)}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider">Cycles</span>
            <span className="text-foreground">
              {sub.cyclesCompleted} / {sub.maxCycles === 0 ? "∞" : sub.maxCycles}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider">Next Charge</span>
            <span className="text-foreground">
              {sub.status === "Active"
                ? new Date(sub.nextChargeAt * 1000).toLocaleDateString()
                : "—"
              }
            </span>
          </div>
        </div>

        {sub.memo && (
          <p className="text-xs text-muted-foreground italic">"{sub.memo}"</p>
        )}

        <div className="flex gap-2 pt-1">
          {sub.status === "Active" && chargeableMap[sub.id] && (
            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleAction("charge", sub.id)}>
              <Zap className="h-3 w-3 mr-1" /> Charge
            </Button>
          )}
          {sub.status === "Active" && role === "payer" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAction("pause", sub.id)}>
              <Pause className="h-3 w-3 mr-1" /> Pause
            </Button>
          )}
          {sub.status === "Paused" && role === "payer" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAction("resume", sub.id)}>
              <Play className="h-3 w-3 mr-1" /> Resume
            </Button>
          )}
          {(sub.status === "Active" || sub.status === "Paused") && (
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleAction("cancel", sub.id)}>
              <XCircle className="h-3 w-3 mr-1" /> Cancel
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
            <p className="text-muted-foreground mt-1">On-chain recurring payments</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadSubscriptions} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="manage">My Subscriptions</TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="h-3.5 w-3.5 mr-1" /> New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-6">
            {/* As Payer */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Paying ({payerSubs.length})
              </h2>
              {payerSubs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subscriptions as payer</p>
              ) : (
                <div className="grid gap-3">
                  {payerSubs.map((s) => renderSubCard(s, "payer"))}
                </div>
              )}
            </div>

            {/* As Merchant */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Receiving ({merchantSubs.length})
              </h2>
              {merchantSubs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subscriptions as merchant</p>
              ) : (
                <div className="grid gap-3">
                  {merchantSubs.map((s) => renderSubCard(s, "merchant"))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create Subscription</CardTitle>
                <CardDescription>
                  Set up a recurring payment. You'll approve the token first, then the merchant can charge each cycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Merchant Address</Label>
                  <Input
                    placeholder="0x..."
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Select value={token} onValueChange={setToken}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Label>Amount per Cycle</Label>
                    <Input
                      type="number"
                      placeholder="10.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Interval</Label>
                    <Select value={interval} onValueChange={setInterval_}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INTERVALS.map((i) => (
                          <SelectItem key={i.seconds} value={i.seconds.toString()}>
                            {i.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Cycles (0 = ∞)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={maxCycles}
                      onChange={(e) => setMaxCycles(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Memo (optional)</Label>
                  <Input
                    placeholder="Monthly service fee"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={loading || !merchant || !amount}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" /> Create Subscription</>
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
