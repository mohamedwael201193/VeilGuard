import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <motion.header
      className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="h-8 w-8 text-primary transition-all group-hover:text-accent" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-accent/30 transition-all" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-violet to-accent bg-clip-text text-transparent">
              VeilGuard
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
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
          </nav>

          <div className="flex items-center gap-3">
            <NetworkSwitcher />
            <ConnectButton />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
