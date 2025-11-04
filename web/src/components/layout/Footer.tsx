import { CHAINS, DEFAULT_CHAIN_ID } from "@/lib/contracts";
import { FileText, Github, Shield, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const chain = CHAINS[DEFAULT_CHAIN_ID];

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">VeilGuard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Private invoicing powered by ERC-5564 stealth addresses on
              Polygon.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Navigation</h3>
            <nav className="flex flex-col gap-2">
              <Link
                to="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/inbox"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                📬 Inbox
              </Link>
              <Link
                to="/security"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                🔐 Security
              </Link>
              <Link
                to="/roadmap"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Roadmap
              </Link>
              <Link
                to="/receipts"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Receipts
              </Link>
              <Link
                to="/legal"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Legal
              </Link>
            </nav>
          </div>

          {/* Contracts */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Smart Contracts</h3>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href={`${chain.explorer}/address/${chain.invoiceRegistry}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
              >
                <span className="truncate max-w-[140px]">Invoice Registry</span>
                <FileText className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a
                href={`${chain.explorer}/address/${chain.stealthHelper}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
              >
                <span className="truncate max-w-[140px]">Stealth Helper</span>
                <FileText className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Community</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 VeilGuard. Built for privacy-first merchants.</p>
        </div>
      </div>
    </footer>
  );
}
