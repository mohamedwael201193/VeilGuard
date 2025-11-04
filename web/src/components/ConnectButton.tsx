import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2"
      >
        <div className="glass px-3 py-2 rounded text-sm font-mono text-primary">
          {truncateAddress(address)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="magnetic"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <Button
      onClick={() => connect({ connector: connectors[0] })}
      className="magnetic bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
