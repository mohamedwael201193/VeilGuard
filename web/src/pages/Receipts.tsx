import { motion } from 'framer-motion';
import { FileText, Lock, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';

export default function Receipts() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <Badge variant="outline" className="glass text-violet">
                Coming in Wave 4
              </Badge>
              <h1 className="text-4xl font-bold">zk-Receipts</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Zero-knowledge proofs for private payment verification without revealing transaction details.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass p-6 rounded-lg space-y-4 border-l-4 border-l-violet"
              >
                <div className="p-3 bg-violet/10 rounded-lg w-fit">
                  <Lock className="h-6 w-6 text-violet" />
                </div>
                <h3 className="text-xl font-semibold">Privacy-Preserving Proofs</h3>
                <p className="text-muted-foreground">
                  Prove payment was made without revealing amount, sender, or recipient details.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-6 rounded-lg space-y-4 border-l-4 border-l-cyan"
              >
                <div className="p-3 bg-cyan/10 rounded-lg w-fit">
                  <Sparkles className="h-6 w-6 text-cyan" />
                </div>
                <h3 className="text-xl font-semibold">Noir Circuits</h3>
                <p className="text-muted-foreground">
                  Powered by Noir zero-knowledge proof system for efficient verification.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass p-6 rounded-lg space-y-4 border-l-4 border-l-primary"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Verifiable Receipts</h3>
                <p className="text-muted-foreground">
                  Generate cryptographic receipts that can be independently verified.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glass p-6 rounded-lg space-y-4 border-l-4 border-l-primary"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Privacy-Aware Refunds</h3>
                <p className="text-muted-foreground">
                  Process refunds while maintaining privacy guarantees for all parties.
                </p>
              </motion.div>
            </div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass p-8 rounded-lg space-y-6"
            >
              <h2 className="text-2xl font-semibold">Development Roadmap</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-primary glow-lime" />
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <div className="pb-8">
                    <h3 className="font-semibold">Wave 4: Q4 2025</h3>
                    <p className="text-sm text-muted-foreground">
                      Initial zk-Receipt implementation with Noir circuits
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                    <div className="flex-1 w-px bg-border mt-2" />
                  </div>
                  <div className="pb-8">
                    <h3 className="font-semibold">Wave 5: Q1 2026</h3>
                    <p className="text-sm text-muted-foreground">
                      RWA-linked attestations and verifier staking
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Wave 6+</h3>
                    <p className="text-sm text-muted-foreground">
                      Advanced features and enterprise integrations
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Placeholder for future receipts */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="glass p-12 rounded-lg text-center space-y-4"
            >
              <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">No Receipts Yet</h3>
              <p className="text-muted-foreground">
                zk-Receipt generation will be available in Wave 4. Check the roadmap for updates.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
