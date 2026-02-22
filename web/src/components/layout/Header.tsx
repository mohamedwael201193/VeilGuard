import { ConnectButton } from "@/components/ConnectButton";
import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/features", label: "Features" },
    { path: "/pos", label: "POS" },
    { path: "/escrow", label: "Escrow" },
    { path: "/security", label: "Security" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-2xl border-b border-white/[0.04] shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo — Text only, Weblex style */}
          <Link to="/" className="flex items-center gap-1 group">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Veil<span className="text-primary">Guard</span><span className="text-primary">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
                >
                  <span
                    className={
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    {item.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6 bg-primary rounded-full"
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

            <Link to="/invoice/new" className="hidden lg:block">
              <Button
                size="sm"
                className="h-9 px-5 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full glow-lime group"
              >
                New Invoice
                <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10"
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
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <nav className="flex flex-col gap-1 mt-4 pb-4 border-t border-white/[0.06] pt-4">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                        ${
                          active
                            ? "text-primary bg-primary/[0.08]"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                        }
                      `}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex flex-col gap-3 pb-4 pt-2 border-t border-white/[0.06]">
                <NetworkSwitcher />
                <ConnectButton />
                <Link to="/invoice/new" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    size="sm"
                    className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full glow-lime"
                  >
                    New Invoice
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
    {/* Spacer for fixed header */}
    <div className="h-[72px]" />
    </>
  );
}
