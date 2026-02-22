import { CHAINS, DEFAULT_CHAIN_ID } from "@/lib/contracts";
import {
  ExternalLink,
  Github,
  Twitter,
} from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const chain = CHAINS[DEFAULT_CHAIN_ID];

  const contracts = [
    { name: "InvoiceRegistry", addr: chain.invoiceRegistry },
    { name: "StealthHelper", addr: chain.stealthHelper },
    ...(chain.receiptStore ? [{ name: "ReceiptStore", addr: chain.receiptStore }] : []),
  ];

  return (
    <footer className="relative border-t border-white/[0.04] bg-background">
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Veil<span className="text-primary">Guard</span><span className="text-primary">.</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Privacy-first invoicing powered by ERC-5564 stealth addresses.
              Deployed on Polygon.
            </p>
            <div className="flex gap-2 pt-1">
              <a
                href="https://github.com/mohamedwael201193/VeilGuard"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-all duration-200 group"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
              <a
                href="#"
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-all duration-200 group"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            </div>
          </div>

          {/* Navigate */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
              Navigate
            </h3>
            <nav className="flex flex-col gap-2.5">
              {[
                { path: "/dashboard", label: "Dashboard" },
                { path: "/inbox", label: "Inbox" },
                { path: "/receipts", label: "Receipts" },
                { path: "/security", label: "Security" },
                { path: "/legal", label: "Legal" },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
              Products
            </h3>
            <nav className="flex flex-col gap-2.5">
              {[
                { path: "/invoice/new", label: "Create Invoice" },
                { path: "/escrow", label: "Escrow" },
                { path: "/pos", label: "Point of Sale" },
                { path: "/features", label: "Pro Features" },
                { path: "/verify", label: "Verify Receipt" },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 w-fit"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contracts */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
              Contracts
            </h3>
            <div className="flex flex-col gap-2.5">
              {contracts.map((c) => (
                <a
                  key={c.name}
                  href={`${chain.explorer}/address/${c.addr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1.5 w-fit group"
                >
                  {c.name}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-6 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/50">
            © 2025 VeilGuard. Built for privacy-first merchants.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <span>Powered by</span>
            <a
              href="https://polygon.technology/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary/60 hover:text-primary transition-colors"
            >
              Polygon
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
