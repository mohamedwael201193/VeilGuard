import { motion } from 'framer-motion';
import { Shield, Zap, Lock, TrendingUp, Network, AlertTriangle, Wallet, Users, Database } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';

const waves = [
  {
    number: 2,
    title: 'Mainnet Private Invoices',
    period: 'Nov 4–18, 2025',
    status: 'current',
    icon: Shield,
    color: 'primary',
    features: [
      'Stealth address payments on Polygon PoS',
      'Verified smart contracts',
      'Public stats dashboard',
      'USDC payment support',
    ],
  },
  {
    number: 3,
    title: 'Katana APR & vbPaymaster',
    period: 'Nov 19–Dec 3, 2025',
    status: 'planned',
    icon: Zap,
    color: 'violet',
    features: [
      'Katana APR widget integration',
      'vbPaymaster alpha release',
      'Basic Shield compliance checks',
      'Multi-token support expansion',
    ],
  },
  {
    number: 4,
    title: 'zk-Receipt V1',
    period: 'Dec 4–18, 2025',
    status: 'planned',
    icon: Lock,
    color: 'cyan',
    features: [
      'Noir-based zero-knowledge proofs',
      'Privacy-aware refund system',
      'Verifiable receipt generation',
      'Receipt verification API',
    ],
  },
  {
    number: 5,
    title: 'RWA Attestations',
    period: 'Dec 19, 2025–Jan 2, 2026',
    status: 'planned',
    icon: TrendingUp,
    color: 'primary',
    features: [
      'Real-world asset linking',
      'Verifier staking mechanism',
      'Enhanced attestation system',
      'Cross-chain verification',
    ],
  },
  {
    number: 6,
    title: 'AggLayer & AgentPay',
    period: 'Jan 3–17, 2026',
    status: 'planned',
    icon: Network,
    color: 'violet',
    features: [
      'AggLayer routing integration',
      'AgentPay SDK release',
      'Multi-chain payment flows',
      'Developer documentation',
    ],
  },
  {
    number: 7,
    title: 'Fraud Shield V2',
    period: 'Jan 18–Feb 1, 2026',
    status: 'planned',
    icon: AlertTriangle,
    color: 'cyan',
    features: [
      'Advanced fraud detection',
      'Risk assessment dashboard',
      'Merchant protection tools',
      'Automated dispute resolution',
    ],
  },
  {
    number: 8,
    title: 'Treasury Agent V2',
    period: 'Feb 2–16, 2026',
    status: 'planned',
    icon: Wallet,
    color: 'primary',
    features: [
      'AI-powered treasury management',
      'Strategy marketplace',
      'Yield optimization',
      'Risk-adjusted returns',
    ],
  },
  {
    number: 9,
    title: 'Multi-Merchant Pilots',
    period: 'Feb 17–Mar 3, 2026',
    status: 'planned',
    icon: Users,
    color: 'violet',
    features: [
      'Enterprise merchant onboarding',
      'Compliance memo system',
      'Multi-signature support',
      'Advanced analytics',
    ],
  },
  {
    number: 10,
    title: 'CDK Validium Scale',
    period: 'Mar 4–18, 2026',
    status: 'planned',
    icon: Database,
    color: 'cyan',
    features: [
      'CDK validium deployment roadmap',
      'Scaling strategy implementation',
      'Performance optimization',
      'Production readiness assessment',
    ],
  },
];

const statusConfig = {
  current: {
    badge: 'In Progress',
    badgeClass: 'bg-primary/10 text-primary border-primary',
  },
  planned: {
    badge: 'Planned',
    badgeClass: 'bg-muted text-muted-foreground',
  },
};

export default function Roadmap() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold">Development Roadmap</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                VeilGuard's journey from private invoices to full-stack privacy infrastructure
              </p>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />

              <div className="space-y-8">
                {waves.map((wave, index) => {
                  const Icon = wave.icon;
                  const statusInfo = statusConfig[wave.status];

                  return (
                    <motion.div
                      key={wave.number}
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="relative"
                    >
                      <div className="flex gap-6 items-start">
                        {/* Icon */}
                        <div className="hidden md:flex relative z-10 shrink-0">
                          <div className={`glass p-4 rounded-lg border-2 ${
                            wave.status === 'current' ? 'border-primary glow-lime' : 'border-border'
                          }`}>
                            <Icon className={`h-6 w-6 text-${wave.color}`} />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 glass p-6 rounded-lg space-y-4 hover:glow-lime transition-all border-l-4 border-l-primary">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={statusInfo.badgeClass}>
                                  {statusInfo.badge}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {wave.period}
                                </span>
                              </div>
                              <h3 className="text-2xl font-bold">
                                Wave {wave.number}: {wave.title}
                              </h3>
                            </div>
                          </div>

                          <ul className="space-y-2">
                            {wave.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass p-8 rounded-lg text-center space-y-4"
            >
              <h2 className="text-2xl font-bold">Stay Updated</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow our progress as we build the future of private payments. 
                Join our community to get notified about new releases and features.
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <a href="#" className="text-primary hover:underline">Twitter</a>
                <span className="text-muted-foreground">•</span>
                <a href="#" className="text-primary hover:underline">Discord</a>
                <span className="text-muted-foreground">•</span>
                <a href="#" className="text-primary hover:underline">GitHub</a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
