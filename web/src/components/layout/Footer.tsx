import { CHAINS, DEFAULT_CHAIN_ID } from "@/lib/contracts";
import {
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Github,
  Inbox,
  Lock,
  Map,
  Scale,
  Shield,
  Twitter,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const chain = CHAINS[DEFAULT_CHAIN_ID];

  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-background to-card/30 backdrop-blur-sm mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all duration-300" />
                <Shield className="h-7 w-7 text-primary relative z-10" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary via-violet to-accent bg-clip-text text-transparent">
                VeilGuard
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Private invoicing powered by ERC-5564 stealth addresses on
              Polygon. Pay privately, prove it happened.
            </p>
            <div className="flex gap-3 pt-2">
              <a
                href="https://github.com/mohamedwael201193/VeilGuard"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-card hover:bg-accent transition-colors group"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-card hover:bg-accent transition-colors group"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/90">
              Navigation
            </h3>
            <nav className="flex flex-col gap-3">
              <Link
                to="/dashboard"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <FileText className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                Dashboard
              </Link>
              <Link
                to="/inbox"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <Inbox className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                Inbox
              </Link>
              <Link
                to="/security"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <Lock className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                Security
              </Link>
              <Link
                to="/roadmap"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <Map className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                Roadmap
              </Link>
              <Link
                to="/receipts"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <FileCheck className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                Receipts
              </Link>
              <Link
                to="/legal"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <Scale className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                Legal
              </Link>
            </nav>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/90">
              Features
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4 text-primary" />
                <span>Stealth Addresses</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                <span>ERC-5564 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4 text-primary" />
                <span>Instant Settlement</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileCheck className="h-4 w-4 text-primary" />
                <span>Cryptographic Receipts</span>
              </div>
            </div>
          </div>

          {/* Smart Contracts */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/90">
              Smart Contracts
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              <a
                href={`${chain.explorer}/address/${chain.invoiceRegistry}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <FileText className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="flex-1">Invoice Registry</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a
                href={`${chain.explorer}/address/${chain.stealthHelper}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <Shield className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="flex-1">Stealth Helper</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {chain.receiptStore && (
                <a
                  href={`${chain.explorer}/address/${chain.receiptStore}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <FileCheck className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="flex-1">Receipt Store</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 VeilGuard. Built for privacy-first merchants.</p>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <a
              href="https://polygon.technology/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet hover:text-violet/80 transition-colors"
            >
              Polygon
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
