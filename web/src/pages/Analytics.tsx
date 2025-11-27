/**
 * Analytics Page - Wave 3.5
 *
 * Real-time merchant analytics dashboard
 * Stripe Billing-style insights for crypto invoicing
 */

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateMetrics,
  calculatePerformanceScore,
  calculateTotalUSD,
  exportToCSV,
  formatGMV,
  groupByDay,
} from "@/lib/analytics";
import { useInvoiceStore } from "@/store/invoiceStore";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Minus,
  PieChart,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

// Token decimals mapping
const TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6,
  "USDC.e": 6,
  USDCe: 6,
  USDT: 6,
  DAI: 18,
  WETH: 18,
  WPOL: 18,
  tUSDC: 6,
  tUSDT: 6,
};

export default function Analytics() {
  const { invoices } = useInvoiceStore();

  // Calculate metrics
  const metrics = useMemo(
    () => calculateMetrics(invoices, TOKEN_DECIMALS),
    [invoices]
  );

  const performanceScore = useMemo(
    () => calculatePerformanceScore(metrics),
    [metrics]
  );

  const totalUSD = useMemo(
    () => calculateTotalUSD(metrics.totalGMV, TOKEN_DECIMALS),
    [metrics.totalGMV]
  );

  const formattedGMV = useMemo(
    () => formatGMV(metrics.totalGMV, TOKEN_DECIMALS),
    [metrics.totalGMV]
  );

  const dailyStats = useMemo(() => groupByDay(invoices, 7), [invoices]);

  // Trend icon
  const TrendIcon =
    metrics.trend.direction === "up"
      ? ArrowUp
      : metrics.trend.direction === "down"
      ? ArrowDown
      : Minus;

  const trendColor =
    metrics.trend.direction === "up"
      ? "text-green-400"
      : metrics.trend.direction === "down"
      ? "text-red-400"
      : "text-slate-400";

  // Handle CSV export
  const handleExport = () => {
    const csv = exportToCSV(metrics, invoices);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veilguard-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-purple-400" />
                Analytics
              </h1>
              <p className="text-slate-400 mt-1">
                Real-time invoice performance metrics
              </p>
            </div>

            <Button
              onClick={handleExport}
              variant="outline"
              className="border-slate-700 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Performance Score */}
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Performance Score</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-5xl font-bold text-white">
                      {performanceScore}
                    </span>
                    <span className="text-2xl text-slate-500">/100</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Based on conversion rate, expiry rate, and token diversity
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <TrendIcon className={`w-6 h-6 ${trendColor}`} />
                  <span className={`text-lg font-medium ${trendColor}`}>
                    {metrics.trend.percentChange > 0 ? "+" : ""}
                    {metrics.trend.percentChange}%
                  </span>
                  <span className="text-slate-500 text-sm">
                    vs last {metrics.trend.period}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total GMV */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total GMV</p>
                    <p className="text-2xl font-bold text-white">
                      $
                      {totalUSD.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Invoices */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Invoices</p>
                    <p className="text-2xl font-bold text-white">
                      {metrics.totalInvoices}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Conversion Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {(metrics.conversionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expired */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Expired</p>
                    <p className="text-2xl font-bold text-white">
                      {metrics.totalExpired}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token Breakdown */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  Token Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.topTokens.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    No invoice data yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {metrics.topTokens.map((token) => (
                      <div key={token.symbol} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">
                            {token.symbol}
                          </span>
                          <span className="text-slate-400">
                            {token.paidCount}/{token.count} paid
                          </span>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${token.percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className="absolute h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          />
                        </div>
                        <p className="text-sm text-slate-500">
                          {token.percentage.toFixed(1)}% of all invoices
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GMV by Token */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  GMV by Token
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formattedGMV.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    No revenue data yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formattedGMV.map((item) => (
                      <div
                        key={item.token}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                      >
                        <span className="text-white font-medium">
                          {item.token}
                        </span>
                        <span className="text-green-400 font-mono">
                          {item.formatted}
                        </span>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Total (USD)</span>
                        <span className="text-xl font-bold text-white">
                          $
                          {totalUSD.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice Status Summary */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-blue-400" />
                Invoice Status Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-3xl font-bold text-green-400">
                    {metrics.totalPaid}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Paid</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-3xl font-bold text-yellow-400">
                    {metrics.totalPending}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Pending</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-3xl font-bold text-red-400">
                    {metrics.totalExpired}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Dashboard */}
          <div className="flex justify-center pt-4">
            <Link to="/dashboard">
              <Button
                variant="outline"
                className="border-slate-700 hover:bg-slate-800"
              >
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
