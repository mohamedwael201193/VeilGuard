import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Legal() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">Privacy & Legal</h1>
              <p className="text-muted-foreground text-lg">
                Understanding VeilGuard's privacy commitments and data practices
              </p>
            </div>

            <div className="space-y-8">
              {/* Privacy First */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass p-8 rounded-lg space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Privacy-First Design</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    VeilGuard is built with privacy as a core principle, not an afterthought. Our architecture 
                    ensures that sensitive payment information remains confidential.
                  </p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Each invoice uses a unique stealth address (ERC-5564)</li>
                    <li>No payment history linkage between invoices</li>
                    <li>Zero personal identifiable information (PII) stored on-chain</li>
                    <li>Optional zk-receipts for verifiable privacy (Wave 4)</li>
                  </ul>
                </div>
              </motion.div>

              {/* Data Collection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-8 rounded-lg space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-violet/10 rounded-lg">
                    <Database className="h-6 w-6 text-violet" />
                  </div>
                  <h2 className="text-2xl font-bold">Minimal Data Collection</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    VeilGuard collects only the minimum data necessary to provide the service:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">On-Chain Data:</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Invoice amount and token</li>
                        <li>• Stealth address (one-time use)</li>
                        <li>• Ephemeral public key</li>
                        <li>• Optional memo (merchant-provided)</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Off-Chain Data:</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Local browser storage for UI state</li>
                        <li>• No server-side user database</li>
                        <li>• No tracking or analytics cookies</li>
                        <li>• No email or contact information</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Your Rights */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass p-8 rounded-lg space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan/10 rounded-lg">
                    <Eye className="h-6 w-6 text-cyan" />
                  </div>
                  <h2 className="text-2xl font-bold">Your Privacy Rights</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    As a VeilGuard user, you have the following rights:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      <span><strong className="text-foreground">Control:</strong> You control your wallet and private keys</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      <span><strong className="text-foreground">Transparency:</strong> All smart contract code is verified and public</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      <span><strong className="text-foreground">Portability:</strong> Export your invoice data at any time</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      <span><strong className="text-foreground">Deletion:</strong> Clear local storage to remove all off-chain data</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Security */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glass p-8 rounded-lg space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Security Practices</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    VeilGuard implements industry best practices for security:
                  </p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Audited smart contracts with verified source code</li>
                    <li>Client-side stealth address generation (no server exposure)</li>
                    <li>HTTPS encryption for all web traffic</li>
                    <li>No server-side storage of sensitive payment data</li>
                    <li>Regular security updates and monitoring</li>
                  </ul>
                </div>
              </motion.div>

              {/* Disclaimer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="glass p-6 rounded-lg border-l-4 border-l-destructive"
              >
                <h3 className="font-semibold mb-2">Important Disclaimer</h3>
                <p className="text-sm text-muted-foreground">
                  VeilGuard is experimental software currently in Wave 2 development. While we implement 
                  best practices for privacy and security, users should conduct their own due diligence 
                  and only use VeilGuard for amounts they can afford to risk. Never share your private 
                  keys or seed phrases with anyone.
                </p>
              </motion.div>

              {/* Contact */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center space-y-4"
              >
                <p className="text-muted-foreground">
                  Questions about our privacy practices? Reach out via our community channels.
                </p>
                <div className="flex justify-center gap-4">
                  <a href="#" className="text-primary hover:underline">Discord</a>
                  <span className="text-muted-foreground">•</span>
                  <a href="#" className="text-primary hover:underline">Twitter</a>
                  <span className="text-muted-foreground">•</span>
                  <a href="#" className="text-primary hover:underline">GitHub</a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
