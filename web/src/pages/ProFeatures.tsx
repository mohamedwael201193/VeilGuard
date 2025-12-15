import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createRecurringPayment,
  getAgentStats,
  getRecurringPayments,
  registerAgent,
} from "@/lib/agentPayments";
import {
  estimateBridgeFee,
  getCrossChainStats,
  SUPPORTED_CHAINS,
} from "@/lib/crossChain";
import {
  checkSponsorshipEligibility,
  getGaslessConfig,
  getGaslessStats,
  initializeGasless,
} from "@/lib/gasless";
import {
  assessInvoiceRisk,
  getInvoiceInsights,
} from "@/lib/invoiceIntelligence";
import { useInvoiceStore } from "@/store/invoiceStore";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bot,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  Coins,
  Fuel,
  Globe,
  LineChart,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useChainId } from "wagmi";

export default function ProFeatures() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { invoices } = useInvoiceStore();

  // AI Intelligence State
  const [aiInsights, setAiInsights] = useState<ReturnType<
    typeof getInvoiceInsights
  > | null>(null);
  const [selectedInvoiceRisk, setSelectedInvoiceRisk] = useState<ReturnType<
    typeof assessInvoiceRisk
  > | null>(null);

  // Agent Payments State
  const [agentRegistered, setAgentRegistered] = useState(false);
  const [agentStats, setAgentStats] = useState<ReturnType<
    typeof getAgentStats
  > | null>(null);
  const [recurringPayments, setRecurringPayments] = useState<
    ReturnType<typeof getRecurringPayments>
  >([]);

  // Cross-Chain State
  const [selectedSourceChain, setSelectedSourceChain] =
    useState<string>("ETHEREUM");
  const [bridgeFee, setBridgeFee] = useState<Awaited<
    ReturnType<typeof estimateBridgeFee>
  > | null>(null);
  const [crossChainStats, setCrossChainStats] = useState<ReturnType<
    typeof getCrossChainStats
  > | null>(null);

  // Gasless State
  const [gaslessEnabled, setGaslessEnabled] = useState(false);
  const [gaslessStats, setGaslessStats] = useState<ReturnType<
    typeof getGaslessStats
  > | null>(null);
  const [sponsorshipCheck, setSponsorshipCheck] = useState<ReturnType<
    typeof checkSponsorshipEligibility
  > | null>(null);

  // Load AI Insights
  useEffect(() => {
    if (invoices.length > 0) {
      const insights = getInvoiceInsights(invoices);
      setAiInsights(insights);

      // Assess risk of latest invoice
      const latestInvoice = invoices[invoices.length - 1];
      const risk = assessInvoiceRisk(latestInvoice, invoices.slice(0, -1));
      setSelectedInvoiceRisk(risk);
    }
  }, [invoices]);

  // Load Agent Data
  useEffect(() => {
    const stats = getAgentStats("demo-agent");
    setAgentStats(stats);
    setRecurringPayments(getRecurringPayments());
  }, [agentRegistered]);

  // Load Cross-Chain Data
  useEffect(() => {
    const loadCrossChain = async () => {
      const fee = await estimateBridgeFee(
        selectedSourceChain as keyof typeof SUPPORTED_CHAINS,
        "POLYGON",
        "100000000", // 100 USDC
        "USDC"
      );
      setBridgeFee(fee);
      setCrossChainStats(getCrossChainStats());
    };
    loadCrossChain();
  }, [selectedSourceChain]);

  // Load Gasless Data
  useEffect(() => {
    const config = getGaslessConfig();
    setGaslessEnabled(config?.enabled || false);
    setGaslessStats(getGaslessStats());
    setSponsorshipCheck(
      checkSponsorshipEligibility("PAY_INVOICE", "100", "USDC")
    );
  }, [gaslessEnabled]);

  // Demo Functions
  const handleRegisterAgent = () => {
    registerAgent(
      "demo-agent",
      "0x" + Math.random().toString(16).slice(2),
      [
        {
          action: "PAY",
          maxAmount: "1000000000",
          allowedTokens: ["USDC", "USDT"],
        },
        { action: "VIEW" },
      ],
      { daily: "500000000", weekly: "2000000000", monthly: "5000000000" }
    );
    setAgentRegistered(true);
  };

  const handleCreateRecurring = () => {
    if (!address) return;
    createRecurringPayment(
      "demo-agent",
      address,
      "10000000", // 10 USDC
      "USDC",
      "WEEKLY"
    );
    setRecurringPayments(getRecurringPayments());
  };

  const handleEnableGasless = () => {
    initializeGasless("biconomy", {
      type: "FULL",
      maxSponsoredPerDay: "10",
      allowedOperations: ["CREATE_INVOICE", "PAY_INVOICE", "SWEEP", "RECEIPT"],
    });
    setGaslessEnabled(true);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "text-green-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "HIGH":
        return "text-orange-400";
      case "CRITICAL":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 space-y-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              Pro Features
            </Badge>
            <h1 className="text-5xl font-bold">
              Advanced{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Privacy + DeFi
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI Intelligence, Automated Payments, Cross-Chain Support & Gasless
              Transactions
            </p>
          </motion.div>

          {/* Feature Tabs */}
          <Tabs defaultValue="ai" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 glass">
              <TabsTrigger value="ai" className="gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">AI Intelligence</span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden md:inline">Agent Payments</span>
              </TabsTrigger>
              <TabsTrigger value="crosschain" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden md:inline">Cross-Chain</span>
              </TabsTrigger>
              <TabsTrigger value="gasless" className="gap-2">
                <Fuel className="h-4 w-4" />
                <span className="hidden md:inline">Gasless</span>
              </TabsTrigger>
            </TabsList>

            {/* AI Intelligence Tab */}
            <TabsContent value="ai" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Invoice Health Score */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="glass p-6 space-y-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <LineChart className="h-5 w-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        Invoice Health Score
                      </h3>
                    </div>

                    <div className="flex items-center justify-center py-8">
                      <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-700"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="url(#gradient)"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${
                              ((aiInsights?.healthScore || 75) / 100) * 352
                            } 352`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient
                              id="gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%"
                            >
                              <stop offset="0%" stopColor="#a855f7" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold">
                            {aiInsights?.healthScore || 75}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {aiInsights?.trends.map((trend, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span>{trend}</span>
                        </div>
                      ))}
                      {aiInsights?.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          <span>{rec}</span>
                        </div>
                      ))}
                      {!aiInsights && (
                        <p className="text-sm text-muted-foreground">
                          Create invoices to see AI-powered insights
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>

                {/* Risk Assessment */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="glass p-6 space-y-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <Shield className="h-5 w-5 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        Fraud Risk Assessment
                      </h3>
                    </div>

                    {selectedInvoiceRisk ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Risk Level
                          </span>
                          <Badge
                            className={`${getRiskColor(
                              selectedInvoiceRisk.level
                            )} bg-transparent`}
                          >
                            {selectedInvoiceRisk.level}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Risk Score</span>
                            <span>{selectedInvoiceRisk.score}/100</span>
                          </div>
                          <Progress
                            value={selectedInvoiceRisk.score}
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <span className="text-sm font-medium">
                            Risk Factors
                          </span>
                          {selectedInvoiceRisk.factors.map((factor, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-sm p-2 rounded bg-slate-800/50"
                            >
                              <span>{factor.name}</span>
                              <span
                                className={
                                  factor.score > 50
                                    ? "text-orange-400"
                                    : "text-green-400"
                                }
                              >
                                {factor.score}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 rounded-lg bg-slate-800/50 text-sm">
                          {selectedInvoiceRisk.recommendation}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Create an invoice to see risk assessment</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              </div>

              {/* Feature Highlights */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Brain,
                    title: "ML-Powered Analysis",
                    description: "5-factor risk scoring with confidence levels",
                  },
                  {
                    icon: TrendingUp,
                    title: "Payment Prediction",
                    description: "Predict payment likelihood and timing",
                  },
                  {
                    icon: AlertTriangle,
                    title: "Anomaly Detection",
                    description: "Automatic alerts for suspicious patterns",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="glass p-4 rounded-lg flex items-start gap-3"
                  >
                    <item.icon className="h-5 w-5 text-purple-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Agent Payments Tab */}
            <TabsContent value="agents" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Agent Registration */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="glass p-6 space-y-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Bot className="h-5 w-5 text-cyan-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        x402 Agent Registration
                      </h3>
                    </div>

                    {!agentRegistered ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Register an AI agent to automate invoice payments with
                          budget controls and rate limiting.
                        </p>

                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-slate-800/50">
                            <div className="text-sm font-medium">
                              Daily Budget
                            </div>
                            <div className="text-lg">500 USDC</div>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/50">
                            <div className="text-sm font-medium">
                              Allowed Actions
                            </div>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">PAY</Badge>
                              <Badge variant="outline">VIEW</Badge>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleRegisterAgent}
                          className="w-full bg-cyan-500 hover:bg-cyan-600"
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Register Agent
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="h-5 w-5" />
                          <span>Agent Registered</span>
                        </div>

                        {agentStats && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-slate-800/50">
                              <div className="text-sm text-muted-foreground">
                                Total Payments
                              </div>
                              <div className="text-xl font-semibold">
                                {agentStats.totalPayments}
                              </div>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50">
                              <div className="text-sm text-muted-foreground">
                                Success Rate
                              </div>
                              <div className="text-xl font-semibold">
                                {(agentStats.successRate * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>

                {/* Recurring Payments */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="glass p-6 space-y-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <RefreshCw className="h-5 w-5 text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        Recurring Payments
                      </h3>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Set up automated recurring payments for subscriptions and
                      regular invoices.
                    </p>

                    {recurringPayments.length > 0 ? (
                      <div className="space-y-3">
                        {recurringPayments.slice(0, 3).map((payment) => (
                          <div
                            key={payment.id}
                            className="p-3 rounded-lg bg-slate-800/50 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium">
                                {(parseInt(payment.amount) / 1e6).toFixed(2)}{" "}
                                {payment.token}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payment.frequency}
                              </div>
                            </div>
                            <Badge
                              variant={
                                payment.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-muted-foreground">
                        No recurring payments yet
                      </div>
                    )}

                    <Button
                      onClick={handleCreateRecurring}
                      variant="outline"
                      className="w-full"
                      disabled={!agentRegistered || !address}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Recurring Payment
                    </Button>
                  </Card>
                </motion.div>
              </div>

              {/* Feature Highlights */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Bot,
                    title: "AI Agent Support",
                    description: "Machine-to-machine payment automation",
                  },
                  {
                    icon: Wallet,
                    title: "Budget Controls",
                    description: "Daily/weekly/monthly spending limits",
                  },
                  {
                    icon: Clock,
                    title: "Payment Scheduling",
                    description: "Schedule payments with retry logic",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="glass p-4 rounded-lg flex items-start gap-3"
                  >
                    <item.icon className="h-5 w-5 text-cyan-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Cross-Chain Tab */}
            <TabsContent value="crosschain" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Chain Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="glass p-6 space-y-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <ArrowLeftRight className="h-5 w-5 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        Cross-Chain Bridge
                      </h3>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Pay invoices from any supported chain. Funds bridge
                      automatically to Polygon.
                    </p>

                    <div className="space-y-3">
                      <div className="text-sm font-medium">Source Chain</div>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(SUPPORTED_CHAINS)
                          .filter(([key]) => key !== "POLYGON")
                          .map(([key, chain]) => (
                            <Button
                              key={key}
                              variant={
                                selectedSourceChain === key
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setSelectedSourceChain(key)}
                              className="text-xs"
                            >
                              {chain.name.split(" ")[0]}
                            </Button>
                          ))}
                      </div>
                    </div>

                    {bridgeFee && (
                      <div className="space-y-2 p-4 rounded-lg bg-slate-800/50">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Bridge Fee
                          </span>
                          <span>{bridgeFee.totalFee} ETH</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Est. Time
                          </span>
                          <span>
                            ~{Math.round(bridgeFee.estimatedTime / 60)} min
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Protocol
                          </span>
                          <span>LayerZero V2</span>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>

                {/* Supported Chains */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="glass p-6 space-y-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Globe className="h-5 w-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        Supported Chains
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: chain.color }}
                            />
                            <span>{chain.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {chain.nativeCurrency}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Feature Highlights */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Globe,
                    title: "6 Chains Supported",
                    description: "Polygon, ETH, Arbitrum, Base, OP, Avalanche",
                  },
                  {
                    icon: Zap,
                    title: "Fast Bridging",
                    description: "5-15 minute cross-chain settlement",
                  },
                  {
                    icon: Coins,
                    title: "Multi-Token",
                    description: "USDC, USDT bridging across chains",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="glass p-4 rounded-lg flex items-start gap-3"
                  >
                    <item.icon className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Gasless Tab */}
            <TabsContent value="gasless" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Gasless Config */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="glass p-6 space-y-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <Fuel className="h-5 w-5 text-yellow-400" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        Gasless Transactions
                      </h3>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Pay invoices without holding native tokens. Gas sponsored
                      by paymasters.
                    </p>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                      <div>
                        <div className="font-medium">Enable Gasless Mode</div>
                        <div className="text-sm text-muted-foreground">
                          Powered by Biconomy
                        </div>
                      </div>
                      <Switch
                        checked={gaslessEnabled}
                        onCheckedChange={(checked) => {
                          if (checked) handleEnableGasless();
                          setGaslessEnabled(checked);
                        }}
                      />
                    </div>

                    {sponsorshipCheck && (
                      <div
                        className={`p-4 rounded-lg ${
                          sponsorshipCheck.eligible
                            ? "bg-green-500/10 border border-green-500/20"
                            : "bg-yellow-500/10 border border-yellow-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {sponsorshipCheck.eligible ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          )}
                          <span className="font-medium">
                            {sponsorshipCheck.reason}
                          </span>
                        </div>
                        {sponsorshipCheck.eligible && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {sponsorshipCheck.sponsoredPercent}% of gas will be
                            sponsored
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>

                {/* Gasless Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="glass p-6 space-y-4 h-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold">Gas Savings</h3>
                    </div>

                    {gaslessStats ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-slate-800/50 text-center">
                            <div className="text-3xl font-bold text-green-400">
                              {gaslessStats.totalSponsored}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Sponsored Txns
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-slate-800/50 text-center">
                            <div className="text-3xl font-bold text-green-400">
                              {gaslessStats.todayRemaining}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Remaining Today
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-cyan-500/20">
                          <div className="text-sm text-muted-foreground">
                            Total Gas Saved
                          </div>
                          <div className="text-2xl font-bold">
                            {(
                              parseInt(gaslessStats.totalGasSaved) / 1e18
                            ).toFixed(4)}{" "}
                            ETH
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        Enable gasless mode to see savings
                      </div>
                    )}
                  </Card>
                </motion.div>
              </div>

              {/* Feature Highlights */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Fuel,
                    title: "Zero Gas Fees",
                    description: "100% sponsored transactions available",
                  },
                  {
                    icon: Shield,
                    title: "Session Keys",
                    description: "Delegated signing for better UX",
                  },
                  {
                    icon: Zap,
                    title: "ERC-4337",
                    description: "Account Abstraction support",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="glass p-4 rounded-lg flex items-start gap-3"
                  >
                    <item.icon className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass p-8 rounded-lg text-center space-y-4"
          >
            <h2 className="text-2xl font-bold">Ready to Experience Wave 4?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Create your first invoice and explore AI intelligence, agent
              payments, cross-chain support, and gasless transactions.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/invoice/new">
                <Button className="bg-primary hover:bg-primary/90 glow-lime">
                  Create Invoice
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline">View Dashboard</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Missing Plus icon
function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
