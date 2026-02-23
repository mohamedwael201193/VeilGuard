/**
 * Split Pay Page — Wave 6
 * Create and execute split payments via VeilSplitPay contract
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Upload, Loader2, RefreshCw,
  Users, CheckCircle2, ArrowRight, Split,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getChainConfig, ERC20_ABI } from "@/lib/contracts";
import {
  createAndExecuteSplit,
  getSplit,
  getPayerSplits,
  parseSplitCSV,
  calculateTotal,
} from "@/lib/splitPayManager";
import type { SplitPaymentData } from "@/types";

interface RecipientRow {
  address: string;
  amount: string;
}

export default function SplitPayPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const chainConfig = getChainConfig(chainId);

  const [tab, setTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [splits, setSplits] = useState<SplitPaymentData[]>([]);

  // Create form
  const [token, setToken] = useState(chainConfig?.tokens[0]?.address || "");
  const [memo, setMemo] = useState("");
  const [recipients, setRecipients] = useState<RecipientRow[]>([
    { address: "", amount: "" },
  ]);
  const [csvInput, setCsvInput] = useState("");

  const selectedToken = chainConfig?.tokens.find((t) => t.address === token);

  const loadSplits = useCallback(async () => {
    if (!address) return;
    setRefreshing(true);
    try {
      const ids = await getPayerSplits(chainId, address);
      const data = await Promise.all(ids.map((id) => getSplit(chainId, id)));
      setSplits(data.reverse());
    } catch (err) {
      console.error("Failed to load splits:", err);
    } finally {
      setRefreshing(false);
    }
  }, [address, chainId]);

  useEffect(() => {
    loadSplits();
  }, [loadSplits]);

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "" }]);
  };

  const removeRecipient = (idx: number) => {
    setRecipients(recipients.filter((_, i) => i !== idx));
  };

  const updateRecipient = (idx: number, field: keyof RecipientRow, val: string) => {
    const updated = [...recipients];
    updated[idx] = { ...updated[idx], [field]: val };
    setRecipients(updated);
  };

  const handleCSVImport = () => {
    const parsed = parseSplitCSV(csvInput);
    if (parsed.recipients.length === 0) {
      toast.error("No valid rows found. Format: address,amount per line");
      return;
    }
    setRecipients(
      parsed.recipients.map((addr, i) => ({
        address: addr,
        amount: parsed.amounts[i],
      }))
    );
    setCsvInput("");
    toast.success(`Imported ${parsed.recipients.length} recipients`);
  };

  const totalAmount = recipients.reduce((sum, r) => {
    const n = parseFloat(r.amount);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const handleExecute = async () => {
    if (!walletClient || !address) {
      toast.error("Connect wallet first");
      return;
    }

    const validRecipients = recipients.filter((r) => r.address && r.amount);
    if (validRecipients.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }

    setLoading(true);
    try {
      const decimals = selectedToken?.decimals || 6;
      const addrs = validRecipients.map((r) => r.address as Address);
      const amts = validRecipients.map((r) => parseUnits(r.amount, decimals));
      const total = calculateTotal(amts);

      // Approve the SplitPay contract
      toast.loading("Approving token...", { id: "split" });
      const splitAddr = chainConfig?.splitPay as Address;
      await walletClient.writeContract({
        address: token as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [splitAddr, total],
        chain: undefined,
        account: address,
      });

      toast.loading("Executing split payment...", { id: "split" });
      const hash = await createAndExecuteSplit({
        chainId,
        walletClient,
        account: address,
        token: token as Address,
        recipients: addrs,
        amounts: amts,
        memo,
      });

      toast.success(`Split payment executed! TX: ${hash.slice(0, 10)}...`, { id: "split" });
      setRecipients([{ address: "", amount: "" }]);
      setMemo("");
      setTab("history");
      loadSplits();
    } catch (err: any) {
      toast.error(err.message || "Split payment failed", { id: "split" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Split className="h-7 w-7 text-primary" />
              Split Pay
            </h1>
            <p className="text-muted-foreground mt-1">
              Pay multiple recipients in a single transaction
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="create">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Split
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({splits.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create Split Payment</CardTitle>
                <CardDescription>
                  Add recipients and amounts. All transfers happen atomically in one transaction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label>Memo (optional)</Label>
                    <Input
                      placeholder="Team payroll Feb 2026"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Recipients</Label>
                    <Button variant="ghost" size="sm" onClick={addRecipient} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add Row
                    </Button>
                  </div>

                  {recipients.map((r, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        className="flex-1 font-mono text-xs"
                        placeholder="0x recipient address"
                        value={r.address}
                        onChange={(e) => updateRecipient(idx, "address", e.target.value)}
                      />
                      <Input
                        className="w-32"
                        type="number"
                        placeholder="Amount"
                        value={r.amount}
                        onChange={(e) => updateRecipient(idx, "amount", e.target.value)}
                      />
                      {recipients.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeRecipient(idx)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* CSV Import */}
                <details className="border border-white/[0.06] rounded-lg p-3">
                  <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5" /> CSV Import
                  </summary>
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder={"0xAddress1,10.00\n0xAddress2,25.50\n0xAddress3,5.00"}
                      value={csvInput}
                      onChange={(e) => setCsvInput(e.target.value)}
                      rows={4}
                      className="font-mono text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={handleCSVImport}>
                      Import
                    </Button>
                  </div>
                </details>

                {/* Summary */}
                <div className="border border-white/[0.06] rounded-lg p-4 bg-card/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recipients</span>
                    <span className="font-medium">{recipients.filter((r) => r.address).length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-bold text-lg">
                      {totalAmount.toFixed(2)} {selectedToken?.symbol || ""}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleExecute}
                  disabled={loading || recipients.filter((r) => r.address && r.amount).length === 0}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><ArrowRight className="h-4 w-4 mr-2" /> Execute Split Payment</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={loadSplits} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {splits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p>No split payments yet</p>
                </CardContent>
              </Card>
            ) : (
              splits.map((s) => {
                const tokenInfo = chainConfig?.tokens.find(
                  (t) => t.address.toLowerCase() === s.token.toLowerCase()
                );
                const formattedTotal = tokenInfo
                  ? formatUnits(BigInt(s.totalAmount), tokenInfo.decimals)
                  : s.totalAmount;

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-white/[0.06] rounded-xl p-4 bg-card/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-medium">Split #{s.id}</span>
                        <Badge variant="outline" className={
                          s.executed
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        }>
                          {s.executed ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Executed</> : "Pending"}
                        </Badge>
                      </div>
                      <span className="font-bold">
                        {formattedTotal} {tokenInfo?.symbol || "TOKEN"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.recipients.length} recipients • {new Date(s.createdAt * 1000).toLocaleDateString()}
                    </div>
                    {s.memo && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{s.memo}"</p>
                    )}
                  </motion.div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
