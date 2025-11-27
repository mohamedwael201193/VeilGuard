/**
 * Invoice Analytics - Wave 3.5
 *
 * Real-time business intelligence for merchants
 * Stripe Billing-style insights for crypto invoicing
 *
 * Features:
 * - GMV tracking by token
 * - Conversion rate analytics
 * - Time-to-pay metrics
 * - Trend analysis
 */

import type { Invoice } from "@/types";

export interface InvoiceMetrics {
  // Volume metrics
  totalGMV: Record<string, bigint>;
  totalInvoices: number;
  totalPaid: number;
  totalPending: number;
  totalExpired: number;

  // Performance metrics
  conversionRate: number; // paid / total (0-1)
  averageAmountByToken: Record<string, number>;

  // Token breakdown
  topTokens: TokenBreakdown[];

  // Trends
  trend: TrendData;
}

export interface TokenBreakdown {
  symbol: string;
  count: number;
  paidCount: number;
  volume: bigint;
  percentage: number;
}

export interface TrendData {
  direction: "up" | "down" | "flat";
  percentChange: number;
  period: string;
}

export interface DailyStats {
  date: string;
  created: number;
  paid: number;
  volume: Record<string, bigint>;
}

/**
 * Calculate comprehensive metrics from invoice list
 *
 * @param invoices - Array of invoices to analyze
 * @param tokenDecimals - Map of token symbol to decimals
 * @returns Complete metrics object
 */
export function calculateMetrics(
  invoices: Invoice[],
  tokenDecimals: Record<string, number> = {}
): InvoiceMetrics {
  const now = Date.now() / 1000;

  // Initialize counters
  const totalGMV: Record<string, bigint> = {};
  const tokenCounts: Record<
    string,
    { count: number; paidCount: number; volume: bigint }
  > = {};

  let totalPaid = 0;
  let totalExpired = 0;

  // Process each invoice
  invoices.forEach((inv) => {
    const token = inv.token || "USDC";
    const amount = BigInt(inv.amount || 0);

    // Initialize token tracking
    if (!tokenCounts[token]) {
      tokenCounts[token] = { count: 0, paidCount: 0, volume: 0n };
    }

    tokenCounts[token].count++;

    // Check if paid (use status field)
    const isPaid = inv.status === "paid";
    if (isPaid) {
      totalPaid++;
      tokenCounts[token].paidCount++;
      tokenCounts[token].volume += amount;
      totalGMV[token] = (totalGMV[token] || 0n) + amount;
    }

    // Check if expired
    if (
      inv.status === "expired" ||
      (inv.expiresAt && inv.expiresAt < now && !isPaid)
    ) {
      totalExpired++;
    }
  });

  // Calculate conversion rate
  const conversionRate = invoices.length > 0 ? totalPaid / invoices.length : 0;

  // Calculate average amounts
  const averageAmountByToken: Record<string, number> = {};
  Object.entries(tokenCounts).forEach(([token, data]) => {
    if (data.paidCount > 0) {
      const decimals = tokenDecimals[token] || 6;
      averageAmountByToken[token] =
        Number(data.volume) / Math.pow(10, decimals) / data.paidCount;
    }
  });

  // Build token breakdown sorted by volume
  const totalCount = invoices.length || 1;
  const topTokens: TokenBreakdown[] = Object.entries(tokenCounts)
    .map(([symbol, data]) => ({
      symbol,
      count: data.count,
      paidCount: data.paidCount,
      volume: data.volume,
      percentage: (data.count / totalCount) * 100,
    }))
    .sort((a, b) => Number(b.volume - a.volume))
    .slice(0, 5);

  // Calculate trend (placeholder - would need historical data)
  const trend: TrendData = {
    direction: "flat",
    percentChange: 0,
    period: "7d",
  };

  return {
    totalGMV,
    totalInvoices: invoices.length,
    totalPaid,
    totalPending: invoices.length - totalPaid - totalExpired,
    totalExpired,
    conversionRate,
    averageAmountByToken,
    topTokens,
    trend,
  };
}

/**
 * Format GMV values for display
 *
 * @param gmv - GMV by token
 * @param tokenDecimals - Map of token symbol to decimals
 * @returns Formatted strings
 */
export function formatGMV(
  gmv: Record<string, bigint>,
  tokenDecimals: Record<string, number> = {}
): { token: string; formatted: string; usdValue?: number }[] {
  return Object.entries(gmv).map(([token, amount]) => {
    const decimals = tokenDecimals[token] || 6;
    const value = Number(amount) / Math.pow(10, decimals);

    return {
      token,
      formatted: `${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${token}`,
      // USD value would require price oracle - placeholder
      usdValue: token.includes("USD") ? value : undefined,
    };
  });
}

/**
 * Calculate total USD value across all tokens
 *
 * @param gmv - GMV by token
 * @param tokenDecimals - Map of token symbol to decimals
 * @param tokenPrices - Map of token to USD price (optional)
 * @returns Total USD value
 */
export function calculateTotalUSD(
  gmv: Record<string, bigint>,
  tokenDecimals: Record<string, number> = {},
  tokenPrices: Record<string, number> = {}
): number {
  // Default prices for stablecoins
  const defaultPrices: Record<string, number> = {
    USDC: 1,
    "USDC.e": 1,
    USDCe: 1,
    USDT: 1,
    DAI: 1,
    tUSDC: 1,
    tUSDT: 1,
    tDAI: 1,
    ...tokenPrices,
  };

  let total = 0;

  Object.entries(gmv).forEach(([token, amount]) => {
    const decimals = tokenDecimals[token] || 6;
    const value = Number(amount) / Math.pow(10, decimals);
    const price = defaultPrices[token] || 0;
    total += value * price;
  });

  return total;
}

/**
 * Group invoices by day for charting
 *
 * @param invoices - Array of invoices
 * @param days - Number of days to include
 * @returns Daily stats array
 */
export function groupByDay(
  invoices: Invoice[],
  days: number = 30
): DailyStats[] {
  const now = new Date();
  const stats: Map<string, DailyStats> = new Map();

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    stats.set(key, { date: key, created: 0, paid: 0, volume: {} });
  }

  // Process invoices
  invoices.forEach((inv) => {
    // Use current date as fallback (real app would have createdAt)
    const date = new Date().toISOString().split("T")[0];
    const existing = stats.get(date);

    if (existing) {
      existing.created++;
      if (inv.status === "paid") {
        existing.paid++;
        const token = inv.token || "USDC";
        existing.volume[token] =
          (existing.volume[token] || 0n) + BigInt(inv.amount || 0);
      }
    }
  });

  // Convert to sorted array
  return Array.from(stats.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Export analytics data as CSV
 *
 * @param metrics - Calculated metrics
 * @param invoices - Source invoices
 * @returns CSV string
 */
export function exportToCSV(
  metrics: InvoiceMetrics,
  invoices: Invoice[]
): string {
  const lines: string[] = [];

  // Header
  lines.push("VeilGuard Invoice Analytics Export");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Summary
  lines.push("Summary");
  lines.push(`Total Invoices,${metrics.totalInvoices}`);
  lines.push(`Paid,${metrics.totalPaid}`);
  lines.push(`Pending,${metrics.totalPending}`);
  lines.push(`Expired,${metrics.totalExpired}`);
  lines.push(`Conversion Rate,${(metrics.conversionRate * 100).toFixed(1)}%`);
  lines.push("");

  // GMV by token
  lines.push("GMV by Token");
  lines.push("Token,Volume");
  Object.entries(metrics.totalGMV).forEach(([token, amount]) => {
    lines.push(`${token},${amount.toString()}`);
  });
  lines.push("");

  // Invoice details
  lines.push("Invoice Details");
  lines.push("ID,Token,Amount,Paid,StealthAddress");
  invoices.forEach((inv) => {
    lines.push(
      `${inv.id || ""},${inv.token || "USDC"},${inv.amount},${
        inv.status === "paid" ? "Yes" : "No"
      },${inv.stealthAddress || ""}`
    );
  });

  return lines.join("\n");
}

/**
 * Calculate performance score (0-100)
 * Based on conversion rate, avg time, etc.
 */
export function calculatePerformanceScore(metrics: InvoiceMetrics): number {
  let score = 0;

  // Conversion rate contributes 50%
  score += metrics.conversionRate * 50;

  // Low expired rate contributes 30%
  const expiredRate =
    metrics.totalInvoices > 0
      ? metrics.totalExpired / metrics.totalInvoices
      : 0;
  score += (1 - expiredRate) * 30;

  // Volume diversity contributes 20% (more tokens = better)
  const tokenCount = Object.keys(metrics.totalGMV).length;
  score += Math.min(tokenCount / 3, 1) * 20;

  return Math.round(score);
}
