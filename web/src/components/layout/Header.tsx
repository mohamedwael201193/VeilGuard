import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Inbox,
  LayoutDashboard,
  Lock,
  Map,
  Menu,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Shield },
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/features", label: "Pro", icon: Sparkles },
    { path: "/inbox", label: "Inbox", icon: Inbox },
    { path: "/security", label: "Security", icon: Lock },
    { path: "/roadmap", label: "Roadmap", icon: Map },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header
      className="border-b border-border/40 bg-background/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all duration-300" />
              <Shield className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-violet to-accent bg-clip-text text-transparent">
                VeilGuard
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1">
                Private Invoicing
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 relative group
                    ${
                      active
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-primary/5 rounded-lg border border-primary/20"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <NetworkSwitcher />
              <ConnectButton />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden mt-4 pb-4 border-t border-border/40 pt-4"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${
                        active
                          ? "text-primary bg-primary/10 border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border/40">
              <NetworkSwitcher />
              <ConnectButton />
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
