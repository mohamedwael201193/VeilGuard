import { ConnectButton } from "@/components/ConnectButton";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
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
    { path: "/escrow", label: "Escrow" },
    { path: "/subscriptions", label: "Subscriptions" },
    { path: "/split", label: "Split Pay" },
    { path: "/disputes", label: "Disputes" },
    { path: "/pos", label: "POS" },
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
          <nav className="hidden lg:flex items-center gap-0">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-3 py-2 text-[13px] font-medium transition-colors duration-200"
                >
                  <span
                    className={
                      active
                        ? "text-primary"
                        : "text-white/80 hover:text-white"
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
              <ConnectButton />
            </div>

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
                            : "text-white/80 hover:text-white hover:bg-white/[0.05]"
                        }
                      `}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex flex-col gap-3 pb-4 pt-2 border-t border-white/[0.06]">
                <ConnectButton />
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
