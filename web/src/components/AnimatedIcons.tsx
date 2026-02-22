/**
 * AnimatedIcons — Unique SVG animated icons for features
 * Each icon has subtle looping animations via CSS classes.
 */

import { motion } from "framer-motion";

const iconWrap = "relative flex items-center justify-center";

/* ── Shield Icon (Privacy) ── */
export function IconShield({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`${iconWrap} ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.path
          d="M24 4L6 12v12c0 11 8 18 18 20 10-2 18-9 18-20V12L24 4z"
          stroke="hsl(69 100% 62%)"
          strokeWidth="2"
          fill="hsl(69 100% 62% / 0.08)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        <motion.path
          d="M17 24l4 4 10-10"
          stroke="hsl(69 100% 62%)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />
        {/* Pulse ring */}
        <motion.circle
          cx="24" cy="24" r="22"
          stroke="hsl(69 100% 62% / 0.2)"
          strokeWidth="1"
          fill="none"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
}

/* ── Lock Icon (Stealth) ── */
export function IconLock({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`${iconWrap} ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.rect
          x="12" y="22" width="24" height="18" rx="4"
          stroke="hsl(252 100% 68%)"
          strokeWidth="2"
          fill="hsl(252 100% 68% / 0.08)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.path
          d="M16 22v-6a8 8 0 0116 0v6"
          stroke="hsl(252 100% 68%)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <motion.circle
          cx="24" cy="31" r="2.5"
          fill="hsl(252 100% 68%)"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
}

/* ── Bolt Icon (Speed/Settlement) ── */
export function IconBolt({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`${iconWrap} ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.path
          d="M26 4L10 28h12l-2 16 16-24H24l2-16z"
          stroke="hsl(188 100% 55%)"
          strokeWidth="2"
          fill="hsl(188 100% 55% / 0.1)"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.path
          d="M26 4L10 28h12l-2 16 16-24H24l2-16z"
          fill="hsl(188 100% 55% / 0.15)"
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
}

/* ── Receipt/Document Icon ── */
export function IconReceipt({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`${iconWrap} ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.rect
          x="10" y="6" width="28" height="36" rx="4"
          stroke="hsl(69 100% 62%)"
          strokeWidth="2"
          fill="hsl(69 100% 62% / 0.05)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        {/* Lines */}
        <motion.line x1="17" y1="16" x2="31" y2="16" stroke="hsl(69 100% 62% / 0.4)" strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.4 }} />
        <motion.line x1="17" y1="22" x2="28" y2="22" stroke="hsl(69 100% 62% / 0.3)" strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.4 }} />
        <motion.line x1="17" y1="28" x2="25" y2="28" stroke="hsl(69 100% 62% / 0.2)" strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1, duration: 0.4 }} />
        {/* Checkmark */}
        <motion.path d="M30 30l3 3 6-6" stroke="hsl(69 100% 62%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.2, duration: 0.5 }} />
      </motion.svg>
    </div>
  );
}

/* ── Escrow/Handshake Icon ── */
export function IconEscrow({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`${iconWrap} ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.path
          d="M6 24c4-4 10-6 14-2s4 8 8 6 6-6 10-4"
          stroke="hsl(252 100% 68%)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2 }}
        />
        <motion.circle cx="12" cy="28" r="3" fill="hsl(252 100% 68% / 0.3)" stroke="hsl(252 100% 68%)" strokeWidth="1.5"
          animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="36" cy="22" r="3" fill="hsl(69 100% 62% / 0.3)" stroke="hsl(69 100% 62%)" strokeWidth="1.5"
          animate={{ y: [0, 2, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
      </motion.svg>
    </div>
  );
}

/* ── QR / POS Icon ── */
export function IconPOS({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`${iconWrap} ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* QR frame */}
        <motion.rect x="8" y="8" width="14" height="14" rx="2" stroke="hsl(188 100% 55%)" strokeWidth="2" fill="hsl(188 100% 55% / 0.08)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
        <motion.rect x="26" y="8" width="14" height="14" rx="2" stroke="hsl(188 100% 55%)" strokeWidth="2" fill="hsl(188 100% 55% / 0.08)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.2 }} />
        <motion.rect x="8" y="26" width="14" height="14" rx="2" stroke="hsl(188 100% 55%)" strokeWidth="2" fill="hsl(188 100% 55% / 0.08)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.4 }} />
        {/* Dots */}
        <motion.rect x="12" y="12" width="6" height="6" rx="1" fill="hsl(188 100% 55%)"
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.rect x="30" y="12" width="6" height="6" rx="1" fill="hsl(188 100% 55%)"
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
        <motion.rect x="12" y="30" width="6" height="6" rx="1" fill="hsl(188 100% 55%)"
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.8 }} />
        {/* Scan line */}
        <motion.line x1="6" y1="24" x2="42" y2="24" stroke="hsl(69 100% 62% / 0.5)" strokeWidth="1.5" strokeDasharray="4 3"
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} />
      </motion.svg>
    </div>
  );
}

/* ── Yield / Chart Icon ── */
export function IconYield({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`${iconWrap} ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.polyline
          points="6,38 16,26 24,30 34,14 42,18"
          stroke="hsl(69 100% 62%)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        {/* Arrow tip */}
        <motion.path d="M38 14l4 4-6 2" stroke="hsl(69 100% 62%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.3 }} />
        {/* Gradient fill under line */}
        <motion.path
          d="M6,38 L16,26 L24,30 L34,14 L42,18 L42,42 L6,42 Z"
          fill="url(#yieldGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ delay: 1, duration: 0.5 }}
        />
        <defs>
          <linearGradient id="yieldGrad" x1="24" y1="14" x2="24" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(69 100% 62%)" />
            <stop offset="100%" stopColor="hsl(69 100% 62% / 0)" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}
