/**
 * Home Page — VeilGuard Redesign
 * 
 * Premium dark-space aesthetic with video hero background,
 * animated SVG icons, and a focused showcase of the project's strength.
 */

import {
  IconBolt,
  IconEscrow,
  IconLock,
  IconPOS,
  IconReceipt,
  IconShield,
  IconYield,
} from "@/components/AnimatedIcons";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronRight, ExternalLink, Users } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

/* ── Fade-in variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.55, 1]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 -mt-[72px]">
        {/* ════════════════════════════════════════════
            HERO — Video background
        ════════════════════════════════════════════ */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Video BG */}
          <motion.div className="absolute inset-0 z-0" style={{ scale: videoScale }}>
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster="/placeholder.svg"
            >
              <source src="/bg.mp4" type="video/mp4" />
            </video>
          </motion.div>

          {/* Gradient overlay */}
          <motion.div
            className="absolute inset-0 z-[1]"
            style={{ opacity: overlayOpacity }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
          </motion.div>

          {/* Noise grain */}
          <div className="absolute inset-0 z-[2] noise-overlay pointer-events-none" />

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 py-32 text-center max-w-5xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-8"
            >
              {/* Tag line */}
              <motion.div variants={fadeUp} custom={0} className="flex justify-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Live on Polygon Mainnet
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]"
              >
                Private payments
                <br />
                <span className="text-gradient-primary">made simple.</span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                One-time stealth address per invoice. Cryptographic receipts.
                Trustless escrow. All on Polygon — for fractions of a cent.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-4 pt-2">
                <Link to="/dashboard">
                  <Button
                    size="lg"
                    className="magnetic h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full glow-lime group"
                  >
                    Get Started
                    <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="magnetic h-14 px-8 text-base font-semibold rounded-full glass hover:bg-white/5"
                  >
                    Explore Features
                  </Button>
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="flex flex-wrap justify-center gap-8 md:gap-12 pt-6"
              >
                {[
                  { value: "4", label: "Contracts" },
                  { value: "10+", label: "Tokens" },
                  { value: "$0.006", label: "Avg Gas" },
                  { value: "16", label: "Pages" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-1.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════
            FEATURES — Left-aligned cards (Weblex style)
        ════════════════════════════════════════════ */}
        <section className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet/5 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left — Feature list */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={stagger}
                className="space-y-8"
              >
                {[
                  {
                    icon: <IconShield size={40} />,
                    title: "Stealth Addresses",
                    desc: "Each invoice gets a unique ERC-5564 address. Zero payment history linkage — cryptographically unlinkable.",
                  },
                  {
                    icon: <IconLock size={40} />,
                    title: "Zero Knowledge",
                    desc: "No personal data on-chain. Encrypted memos. Self-custodial keys. Your privacy, enforced by math.",
                  },
                  {
                    icon: <IconBolt size={40} />,
                    title: "Instant Settlement",
                    desc: "Polygon PoS speed at $0.006 per transaction. 10+ stablecoins supported. Real-time payment detection.",
                  },
                ].map((f, i) => (
                  <motion.div
                    key={f.title}
                    variants={fadeUp}
                    custom={i}
                    className="flex gap-5 items-start group"
                  >
                    <div className="shrink-0 mt-1 p-2 rounded-xl bg-card group-hover:bg-primary/10 transition-colors duration-300">
                      {f.icon}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-bold">{f.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Right — Headline */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="space-y-6"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05]">
                  Your payments
                  <br />
                  deserve{" "}
                  <span className="text-gradient-primary">privacy</span>
                  <br />— we enforce it.
                </h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  VeilGuard combines ERC-5564 stealth addresses with on-chain verification
                  to deliver truly private commerce on Polygon.
                </p>
                <Link to="/invoice/new">
                  <Button className="magnetic h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold glow-lime group">
                    Create Invoice
                    <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            PRODUCTS GRID — Escrow, POS, Receipts, Yield
        ════════════════════════════════════════════ */}
        <section className="py-28 bg-card/30 relative">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="text-center space-y-4 mb-16"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-violet/10 text-violet border border-violet/20">
                Full Product Suite
              </span>
              <h2 className="text-4xl md:text-5xl font-bold">
                Everything you need to{" "}
                <span className="text-gradient-purple">get paid</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                From invoicing to escrow, POS to analytics — all deployed on Polygon mainnet.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <IconEscrow size={36} />,
                  title: "Trustless Escrow",
                  desc: "On-chain escrow with release, refund & dispute. No intermediaries needed.",
                  href: "/escrow",
                  accent: "violet",
                },
                {
                  icon: <IconPOS size={36} />,
                  title: "POS Terminal",
                  desc: "QR code payments, real-time detection, daily sales tracking & share links.",
                  href: "/pos",
                  accent: "cyan",
                },
                {
                  icon: <IconReceipt size={36} />,
                  title: "Crypto Receipts",
                  desc: "Keccak256 commitment receipts stored on-chain. Publicly verifiable.",
                  href: "/receipts",
                  accent: "primary",
                },
                {
                  icon: <IconYield size={36} />,
                  title: "Yield Routing",
                  desc: "Idle funds earn APY via Aave V3. Smart vault selection, auto-compounding.",
                  href: "/features",
                  accent: "primary",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link to={card.href} className="block h-full">
                    <div className="h-full glass rounded-2xl p-6 space-y-4 border-glow hover:bg-white/[0.02] transition-colors duration-300 group cursor-pointer">
                      <div className="mb-2">{card.icon}</div>
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{card.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                      <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            HOW IT WORKS — Numbered steps
        ════════════════════════════════════════════ */}
        <section className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[120px]" />
          </div>

          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-4 mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold">
                How it <span className="text-gradient-primary">works</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Private invoicing in four simple steps
              </p>
            </motion.div>

            <div className="space-y-1">
              {[
                {
                  step: "01",
                  title: "Create Invoice",
                  desc: "Set amount, token, and optional encrypted memo. A unique stealth address is generated using ERC-5564.",
                },
                {
                  step: "02",
                  title: "Share Payment Link",
                  desc: "Send via WhatsApp, Telegram, Email or QR code. Customer pays with any Web3 wallet. Zero PII exposed.",
                },
                {
                  step: "03",
                  title: "Sweep Funds Privately",
                  desc: "Use your private keys to sweep from stealth address to your wallet. Fully self-custodial.",
                },
                {
                  step: "04",
                  title: "Generate Receipt",
                  desc: "Cryptographic receipt stored on-chain. Prove payment happened without revealing any details.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex gap-6 items-start p-6 rounded-2xl hover:bg-card/60 transition-colors group"
                >
                  <div className="shrink-0 text-5xl font-bold text-primary/15 group-hover:text-primary/30 transition-colors font-mono">
                    {item.step}
                  </div>
                  <div className="space-y-2 border-l border-border/40 pl-6 group-hover:border-primary/30 transition-colors">
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            CONTRACTS — Deployed on Polygon
        ════════════════════════════════════════════ */}
        <section className="py-28 bg-card/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-4 mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold">
                Deployed & <span className="text-gradient-primary">verified</span>
              </h2>
              <p className="text-muted-foreground text-lg">4 smart contracts live on Polygon Mainnet</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: "InvoiceRegistry", addr: "0x241D6923036aD1888734ca6C0E5DEdDC044CF1FC", desc: "Invoice creation, batch ops, status tracking" },
                { name: "StealthHelper", addr: "0x25A435D4bfF2729639C2937854372Ba099F4bf42", desc: "ERC-5564 stealth address announcements" },
                { name: "ReceiptStore", addr: "0x24DcE95d6DcC3101256B787a6c19569672260B5E", desc: "On-chain cryptographic receipt storage" },
                { name: "VeilEscrow", addr: "0x4675f8567d1D6236F76Fe48De2450D5599156af1", desc: "Trustless escrow with release/refund/dispute" },
              ].map((c, i) => (
                <motion.a
                  key={c.name}
                  href={`https://polygonscan.com/address/${c.addr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="glass rounded-2xl p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm font-mono">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{c.name}</h3>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                    <p className="text-xs font-mono text-primary/60 truncate">{c.addr}</p>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            SOCIAL PROOF / CLIENT SAY
        ════════════════════════════════════════════ */}
        <section className="py-28 relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-wide uppercase text-muted-foreground/80">
                Built for Builders
              </h2>

              {/* Avatars */}
              <div className="flex justify-center -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-card flex items-center justify-center"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  +35
                </div>
              </div>

              <blockquote className="max-w-2xl mx-auto font-mono text-lg md:text-xl text-foreground/80 leading-relaxed">
                "VeilGuard solved the #1 problem in crypto payments — merchants
                don't want their entire payment history public. Stealth addresses
                + on-chain receipts is the answer."
              </blockquote>

              <p className="font-semibold">Web3 Payment Builders Community</p>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════════ */}
        <section className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
          </div>

          <div className="container mx-auto px-4 max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-strong rounded-3xl p-12 md:p-16 space-y-6 border-glow"
            >
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to go <span className="text-gradient-primary">private</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Create your first stealth invoice in seconds. No registration. No backend. Just you and the blockchain.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link to="/invoice/new">
                  <Button
                    size="lg"
                    className="magnetic h-14 px-10 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full glow-lime group"
                  >
                    Create Invoice
                    <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Button>
                </Link>
                <a
                  href="https://github.com/mohamedwael201193/VeilGuard"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="magnetic h-14 px-10 text-base font-semibold rounded-full glass group"
                  >
                    View on GitHub
                    <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
