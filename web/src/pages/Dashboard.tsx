import { InvoiceCard } from "@/components/InvoiceCard";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getAaveApy, getYieldPositions } from "@/lib/yieldManager";
import { useInvoiceStore } from "@/store/invoiceStore";
import {
  registerMerchant,
  getMerchantProfile,
  isMerchantRegistered,
  getMerchantInvoiceCount,
} from "@/lib/merchantIndex";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle,
  Clock,
  Coins,
  FileText,
  Percent,
  Plus,
  RefreshCw,
  ShieldAlert,
  Split,
  Store,
  TrendingUp,
  Wallet,
  Repeat,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { toast } from "sonner";

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { invoices, getStats } = useInvoiceStore();
  const stats = getStats();

  // Merchant index state
  const [merchantRegistered, setMerchantRegistered] = useState(false);
  const [onChainInvoiceCount, setOnChainInvoiceCount] = useState(0);
  const [registeringMerchant, setRegisteringMerchant] = useState(false);

  // Wave 3: Yield integration state
  const [autoYieldEnabled, setAutoYieldEnabled] = useState(() => {
    return localStorage.getItem("veilguard_auto_yield") === "true";
  });
  const [currentApy, setCurrentApy] = useState<number>(0);
  const [yieldPositions, setYieldPositions] = useState<any[]>([]);
  const [isLoadingYield, setIsLoadingYield] = useState(false);

  // Fetch APY and positions on load
  useEffect(() => {
    const fetchYieldData = async () => {
      if (chainId !== 137 || !address) return;

      setIsLoadingYield(true);
      try {
        // Get current USDC APY
        const apy = await getAaveApy(
          chainId,
          "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
        );
        setCurrentApy(apy);

        // Get positions
        const positions = await getYieldPositions(chainId, address);
        setYieldPositions(positions);
      } catch (e) {
        console.error("Failed to fetch yield data:", e);
      } finally {
        setIsLoadingYield(false);
      }
    };

    fetchYieldData();
  }, [chainId, address]);

  // Save auto-yield preference
  const handleAutoYieldToggle = (enabled: boolean) => {
    setAutoYieldEnabled(enabled);
    localStorage.setItem("veilguard_auto_yield", enabled ? "true" : "false");
  };

  // Fetch merchant index data
  useEffect(() => {
    const fetchMerchantData = async () => {
      if (!address || chainId !== 137) return;
      try {
        const registered = await isMerchantRegistered(chainId, address);
        setMerchantRegistered(registered);
        if (registered) {
          const count = await getMerchantInvoiceCount(chainId, address);
          setOnChainInvoiceCount(count);
        }
      } catch (e) {
        console.error("Merchant index fetch failed:", e);
      }
    };
    fetchMerchantData();
  }, [address, chainId]);

  const handleRegisterMerchant = async () => {
    if (!walletClient || !address) return;
    setRegisteringMerchant(true);
    try {
      toast.loading("Registering merchant...", { id: "merchant-reg" });
      await registerMerchant({
        chainId,
        walletClient,
        account: address,
        name: `Merchant-${address.slice(0, 6)}`,
        metadataURI: "",
      });
      setMerchantRegistered(true);
      toast.success("Merchant registered on-chain!", { id: "merchant-reg" });
    } catch (e: any) {
      toast.error(e.message || "Registration failed", { id: "merchant-reg" });
    } finally {
      setRegisteringMerchant(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-md glass p-12 rounded-lg"
          >
            <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access the merchant dashboard.
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl font-bold">Merchant Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Manage your private invoices and track payments
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link to="/invoice/new">
                <Button className="magnetic bg-primary hover:bg-primary/90 glow-lime">
                  <Plus className="h-5 w-5 mr-2" />
                  New Invoice
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Invoices"
              value={stats.totalInvoices}
              icon={FileText}
              delay={0}
            />
            <StatsCard
              title="Total GMV"
              value={`$${stats.totalGMV}`}
              description="USDC"
              icon={TrendingUp}
              trend="up"
              delay={0.1}
            />
            <StatsCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              icon={CheckCircle}
              trend={stats.successRate > 80 ? "up" : "neutral"}
              delay={0.2}
            />
            <StatsCard
              title="Median Time to Pay"
              value={`${stats.medianTimeToPayMinutes}m`}
              icon={Clock}
              delay={0.3}
            />
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass p-6 rounded-lg space-y-4"
          >
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/invoice/new">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
              <Link to="/receipts">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Receipts
                </Button>
              </Link>
              <Link to="/subscriptions">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Subscriptions
                </Button>
              </Link>
              <Link to="/split">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <Split className="h-4 w-4 mr-2" />
                  Split Pay
                </Button>
              </Link>
              <Link to="/disputes">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Disputes
                </Button>
              </Link>
              <Link to="/escrow">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Escrow
                </Button>
              </Link>
              <Link to="/analytics">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link to="/inbox">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Scan Inbox
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Merchant Index Panel */}
          {chainId === 137 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
            >
              <Card className="glass p-6 space-y-4 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Merchant Index</h2>
                      <p className="text-sm text-muted-foreground">
                        On-chain merchant registry & invoice enumeration
                      </p>
                    </div>
                  </div>
                  {merchantRegistered ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      <CheckCircle className="h-3 w-3 mr-1" /> Registered
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={handleRegisterMerchant} disabled={registeringMerchant}>
                      {registeringMerchant ? (
                        <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Registering...</>
                      ) : (
                        <><Store className="h-3.5 w-3.5 mr-1" /> Register</>
                      )}
                    </Button>
                  )}
                </div>
                {merchantRegistered && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/[0.06]">
                    <div className="p-3 rounded-lg bg-background/50 text-center">
                      <p className="text-2xl font-bold">{onChainInvoiceCount}</p>
                      <p className="text-xs text-muted-foreground">Indexed On-Chain</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">via MerchantIndex</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 text-center">
                      <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                      <p className="text-xs text-muted-foreground">Total Created</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">in this browser</p>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Wave 3: Yield Integration Panel */}
          {chainId === 137 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Card className="glass p-6 space-y-4 border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Coins className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">
                        Yield Integration
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Earn yield on swept funds via Aave V3
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {currentApy > 0 && (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Percent className="h-4 w-4" />
                        <span className="font-semibold">{currentApy}% APY</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Auto-stake
                      </span>
                      <Switch
                        checked={autoYieldEnabled}
                        onCheckedChange={handleAutoYieldToggle}
                      />
                    </div>
                  </div>
                </div>

                {/* Yield Positions */}
                {yieldPositions.length > 0 && (
                  <div className="pt-4 border-t border-slate-700">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Active Positions
                    </h3>
                    <div className="space-y-2">
                      {yieldPositions.map((pos) => (
                        <div
                          key={pos.token}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{pos.token}</span>
                            <span className="text-xs text-emerald-400">
                              {pos.apy}% APY
                            </span>
                          </div>
                          <span className="font-semibold">{pos.balance}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {autoYieldEnabled &&
                  yieldPositions.length === 0 &&
                  !isLoadingYield && (
                    <div className="text-sm text-muted-foreground italic">
                      Auto-stake enabled. Swept funds will be deposited to Aave
                      automatically.
                    </div>
                  )}
              </Card>
            </motion.div>
          )}

          {/* Invoices List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-semibold">Recent Invoices</h2>

            {invoices.length === 0 ? (
              <div className="glass p-12 rounded-lg text-center space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  No invoices yet. Create your first one!
                </p>
                <Link to="/invoice/new">
                  <Button className="magnetic bg-primary hover:bg-primary/90">
                    Create Invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {invoices.map((invoice, i) => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    delay={i * 0.05}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
