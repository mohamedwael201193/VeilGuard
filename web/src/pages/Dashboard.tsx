import { InvoiceCard } from "@/components/InvoiceCard";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { useInvoiceStore } from "@/store/invoiceStore";
import { motion } from "framer-motion";
import { CheckCircle, Clock, FileText, Plus, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { invoices, getStats } = useInvoiceStore();
  const stats = getStats();

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
              Please connect your wallet to access the merchant dashboard.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/invoice/new">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Invoice
                </Button>
              </Link>
              <Link to="/receipts">
                <Button
                  variant="outline"
                  className="w-full justify-start magnetic"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Receipts
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start magnetic"
                disabled
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Export CSV
                <span className="ml-auto text-xs text-muted-foreground">
                  Coming Soon
                </span>
              </Button>
            </div>
          </motion.div>

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

      <Footer />
    </div>
  );
}
