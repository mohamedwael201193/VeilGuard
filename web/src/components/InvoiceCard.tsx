import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Invoice } from '@/types';
import { formatDistance } from 'date-fns';

interface InvoiceCardProps {
  invoice: Invoice;
  delay?: number;
}

export function InvoiceCard({ invoice, delay = 0 }: InvoiceCardProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-cyan',
      bg: 'bg-cyan/10',
      label: 'Pending',
    },
    confirming: {
      icon: Clock,
      color: 'text-violet',
      bg: 'bg-violet/10',
      label: 'Confirming',
    },
    paid: {
      icon: CheckCircle,
      color: 'text-primary',
      bg: 'bg-primary/10',
      label: 'Paid',
    },
    expired: {
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      label: 'Expired',
    },
  };

  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Link to={`/invoice/${invoice.id}`}>
        <div className="glass p-4 rounded-lg border-l-4 border-l-primary hover:glow-lime transition-all magnetic group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 ${status.bg} rounded`}>
                <StatusIcon className={`h-4 w-4 ${status.color}`} />
              </div>
              <Badge variant="outline" className="text-xs">
                {status.label}
              </Badge>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {invoice.amount}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.token}
              </p>
            </div>

            {invoice.memo && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {invoice.memo}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span className="font-mono truncate max-w-[140px]">
                {invoice.stealthAddress.slice(0, 10)}...
              </span>
              <span>
                {formatDistance(invoice.createdAt, Date.now(), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
