/**
 * SharePaymentLink Component - Wave 5
 *
 * Modal overlay for sharing payment links/QR codes via
 * WhatsApp, Telegram, Email, Copy, and native Web Share API.
 */

import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  Send,
  Share2,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface SharePaymentLinkProps {
  url: string;
  amount: string;
  token: string;
  invoiceId?: string;
  onClose: () => void;
}

export function SharePaymentLink({
  url,
  amount,
  token,
  invoiceId,
  onClose,
}: SharePaymentLinkProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Pay ${amount} ${token} securely via VeilGuard`;
  const shareTitle = invoiceId
    ? `VeilGuard Invoice #${invoiceId.slice(0, 8)}`
    : "VeilGuard Payment";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — try selecting the text manually");
    }
  }, [url]);

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(shareText);
    const link = encodeURIComponent(url);
    window.open(
      `https://t.me/share/url?url=${link}&text=${text}`,
      "_blank"
    );
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.error("Web Share not supported on this device");
      return;
    }
    try {
      await navigator.share({ title: shareTitle, text: shareText, url });
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error("Sharing failed");
    }
  };

  const channels = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      action: handleWhatsApp,
      color: "bg-green-600 hover:bg-green-500",
    },
    {
      label: "Telegram",
      icon: Send,
      action: handleTelegram,
      color: "bg-blue-500 hover:bg-blue-400",
    },
    {
      label: "Email",
      icon: Mail,
      action: handleEmail,
      color: "bg-violet-600 hover:bg-violet-500",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass border border-border/40 rounded-2xl p-8 w-full max-w-md mx-4 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Payment Link
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {amount} {token}
            </p>
          </div>

          {/* Copy Link */}
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              className="flex-1 bg-slate-800/50 border border-border/40 rounded-lg px-3 py-2 text-xs font-mono truncate"
            />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Social Channels */}
          <div className="grid grid-cols-3 gap-3">
            {channels.map((ch) => {
              const Icon = ch.icon;
              return (
                <Button
                  key={ch.label}
                  onClick={ch.action}
                  className={`${ch.color} text-white flex flex-col gap-1 h-auto py-3`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{ch.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Native Share (mobile) */}
          {"share" in navigator && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleNativeShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              More sharing options
            </Button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
