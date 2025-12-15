import { AnimatedBlob } from "@/components/AnimatedBlob";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  ChevronRight,
  Fuel,
  Globe,
  Lock,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 -z-10">
            <AnimatedBlob
              color="violet"
              size={500}
              delay={0}
              className="top-20 -left-20"
            />
            <AnimatedBlob
              color="cyan"
              size={400}
              delay={1}
              className="bottom-20 -right-20"
            />
            <AnimatedBlob
              color="lime"
              size={350}
              delay={2}
              className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Badges */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-wrap justify-center gap-2"
              >
                <Badge variant="outline" className="glass text-primary">
                  Polygon PoS Mainnet
                </Badge>
                <Badge variant="outline" className="glass text-violet">
                  ERC-5564
                </Badge>
                <Badge variant="outline" className="glass text-cyan">
                  USDC Ready
                </Badge>
              </motion.div>

              {/* Hero Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-4"
              >
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                  Pay privately.{" "}
                  <span className="bg-gradient-to-r from-primary via-violet to-accent bg-clip-text text-transparent">
                    Prove it happened.
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                  One-time stealth address per invoice. Cryptographic receipts
                  included.
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <Link to="/invoice/new">
                  <Button
                    size="lg"
                    className="magnetic bg-primary hover:bg-primary/90 text-primary-foreground glow-lime group"
                  >
                    Create Invoice
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="magnetic glass"
                  >
                    View Dashboard
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0 }}
                className="glass p-8 rounded-lg border-brutalist space-y-4 hover:glow-lime transition-all"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Stealth Addresses</h3>
                <p className="text-muted-foreground">
                  Each invoice gets a unique one-time address. No payment
                  history linkage.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="glass p-8 rounded-lg border-brutalist space-y-4 hover:glow-violet transition-all"
              >
                <div className="p-3 bg-violet/10 rounded-lg w-fit">
                  <Lock className="h-8 w-8 text-violet" />
                </div>
                <h3 className="text-xl font-bold">Zero PII</h3>
                <p className="text-muted-foreground">
                  No personal data on-chain. Minimal metadata. Privacy by
                  design.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="glass p-8 rounded-lg border-brutalist space-y-4 hover:glow-cyan transition-all"
              >
                <div className="p-3 bg-cyan/10 rounded-lg w-fit">
                  <Zap className="h-8 w-8 text-cyan" />
                </div>
                <h3 className="text-xl font-bold">Instant Settlement</h3>
                <p className="text-muted-foreground">
                  Polygon PoS speed. USDC stablecoin. Real-time payment
                  tracking.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Advanced Features Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-4 mb-12"
            >
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Advanced Features
              </Badge>
              <h2 className="text-4xl font-bold">
                Enhanced{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Privacy + DeFi
                </span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Smart analytics, automated payments, cross-chain support, and
                gasless transactions
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0 }}
                className="glass p-6 rounded-lg space-y-4 hover:border-purple-500/30 hover:shadow-purple-500/10 hover:shadow-lg transition-all group"
              >
                <div className="p-3 bg-purple-500/20 rounded-lg w-fit group-hover:scale-110 transition-transform">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold">Smart Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligent fraud detection, payment prediction, and merchant
                  reputation scoring.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Risk Score
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Anomaly Detection
                  </Badge>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="glass p-6 rounded-lg space-y-4 hover:border-cyan-500/30 hover:shadow-cyan-500/10 hover:shadow-lg transition-all group"
              >
                <div className="p-3 bg-cyan-500/20 rounded-lg w-fit group-hover:scale-110 transition-transform">
                  <Bot className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold">Automated Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule recurring payments with budget controls and smart
                  automation.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Recurring
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Budget Limits
                  </Badge>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="glass p-6 rounded-lg space-y-4 hover:border-blue-500/30 hover:shadow-blue-500/10 hover:shadow-lg transition-all group"
              >
                <div className="p-3 bg-blue-500/20 rounded-lg w-fit group-hover:scale-110 transition-transform">
                  <Globe className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">Cross-Chain</h3>
                <p className="text-sm text-muted-foreground">
                  Pay from any chain. LayerZero bridges USDC from Ethereum,
                  Arbitrum, Base & more.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    6 Chains
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    LayerZero
                  </Badge>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="glass p-6 rounded-lg space-y-4 hover:border-yellow-500/30 hover:shadow-yellow-500/10 hover:shadow-lg transition-all group"
              >
                <div className="p-3 bg-yellow-500/20 rounded-lg w-fit group-hover:scale-110 transition-transform">
                  <Fuel className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold">Gasless</h3>
                <p className="text-sm text-muted-foreground">
                  ERC-4337 Account Abstraction. Zero gas fees. "Grandma UX"
                  simplicity.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Biconomy
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Sponsored
                  </Badge>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center mt-8"
            >
              <Link to="/features">
                <Button variant="outline" className="glass group">
                  Explore All Features
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto space-y-12">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center space-y-4"
              >
                <h2 className="text-4xl font-bold">How It Works</h2>
                <p className="text-muted-foreground text-lg">
                  Private invoicing in four simple steps
                </p>
              </motion.div>

              <div className="space-y-6">
                {[
                  {
                    step: "01",
                    title: "Create Invoice",
                    description:
                      "Set amount, token, and optional memo. System generates a unique stealth address using ERC-5564.",
                  },
                  {
                    step: "02",
                    title: "Share Payment Link",
                    description:
                      "Send the invoice link or scan QR code. Customer pays with any Web3 wallet. Zero personal data exposed.",
                  },
                  {
                    step: "03",
                    title: "Sweep Funds Privately",
                    description:
                      "Use your private keys to sweep funds from stealth address to your merchant wallet. Self-custodial and secure.",
                  },
                  {
                    step: "04",
                    title: "Generate Receipt",
                    description:
                      "Create cryptographic receipt stored on-chain. Prove payment happened without revealing transaction details.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="glass p-6 rounded-lg flex gap-6 items-start hover:border-l-4 hover:border-l-primary transition-all"
                  >
                    <div className="text-4xl font-bold text-primary/30">
                      {item.step}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
