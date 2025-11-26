/**
 * Token Selector Component - Wave 3 Multi-Token Support
 *
 * Dropdown component for selecting payment token from supported tokens
 * Shows token icon, symbol, and balance (if connected)
 * Uses @web3icons/react for professional token icons
 */

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getChainConfig } from "@/lib/contracts";
import type { TokenConfig } from "@/types";
import {
  TokenDAI,
  TokenETH,
  TokenMATIC,
  TokenUSDC,
  TokenUSDT,
} from "@web3icons/react";
import { Coins } from "lucide-react";
import { useAccount, useChainId } from "wagmi";

// Token icon components mapping using @web3icons/react
const getTokenIcon = (symbol: string, size: number = 24) => {
  const props = { variant: "branded" as const, size };

  switch (symbol.toUpperCase()) {
    case "USDC":
    case "USDC.E":
    case "USDCE":
    case "TUSDC":
      return <TokenUSDC {...props} />;
    case "USDT":
    case "TUSDT":
      return <TokenUSDT {...props} />;
    case "DAI":
    case "TDAI":
      return <TokenDAI {...props} />;
    case "WETH":
    case "ETH":
      return <TokenETH {...props} />;
    case "WPOL":
    case "POL":
    case "MATIC":
      return <TokenMATIC {...props} />;
    default:
      return <Coins className="w-6 h-6 text-slate-400" />;
  }
};

// Token colors for badges
const TOKEN_COLORS: Record<string, string> = {
  USDC: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "USDC.e": "bg-blue-400/20 text-blue-300 border-blue-400/30",
  USDT: "bg-green-500/20 text-green-400 border-green-500/30",
  DAI: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  WETH: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  WPOL: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  tUSDC: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tUSDT: "bg-green-500/20 text-green-400 border-green-500/30",
  tDAI: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

interface TokenSelectorProps {
  value: string;
  onChange: (token: TokenConfig) => void;
  disabled?: boolean;
  showBalance?: boolean;
  className?: string;
}

export function TokenSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: TokenSelectorProps) {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const chainConfig = getChainConfig(chainId);

  if (!chainConfig) {
    return <div className="text-red-400 text-sm">Unsupported network</div>;
  }

  const tokens = chainConfig.tokens;
  const selectedToken = tokens.find((t) => t.symbol === value) || tokens[0];

  const handleChange = (symbol: string) => {
    const token = tokens.find((t) => t.symbol === symbol);
    if (token) {
      onChange(token);
    }
  };

  return (
    <Select
      value={selectedToken?.symbol}
      onValueChange={handleChange}
      disabled={disabled || !isConnected}
    >
      <SelectTrigger
        className={`bg-slate-800/50 border-slate-700 ${className}`}
      >
        <SelectValue placeholder="Select token">
          <div className="flex items-center gap-2">
            {getTokenIcon(selectedToken?.symbol, 20)}
            <span className="font-medium">{selectedToken?.symbol}</span>
            <Badge
              variant="outline"
              className={`text-xs ml-1 ${
                TOKEN_COLORS[selectedToken?.symbol] || "bg-slate-500/20"
              }`}
            >
              {selectedToken?.decimals}d
            </Badge>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-slate-700">
        {tokens.map((token) => (
          <SelectItem
            key={token.address}
            value={token.symbol}
            className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
          >
            <div className="flex items-center gap-3 py-1">
              {getTokenIcon(token.symbol, 24)}
              <div className="flex flex-col">
                <span className="font-medium text-white">{token.symbol}</span>
                <span className="text-xs text-slate-400 font-mono">
                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ml-auto ${
                  TOKEN_COLORS[token.symbol] || "bg-slate-500/20"
                }`}
              >
                {token.decimals === 6 ? "Stablecoin" : "ERC20"}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Compact token display for readonly views
 */
export function TokenBadge({
  symbol,
  className = "",
}: {
  symbol: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={`${
        TOKEN_COLORS[symbol] || "bg-slate-500/20 text-slate-300"
      } ${className} flex items-center gap-1`}
    >
      {getTokenIcon(symbol, 16)}
      {symbol}
    </Badge>
  );
}

/**
 * Token icon component
 */
export function TokenIcon({
  symbol,
  size = 24,
  className = "",
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  return <span className={className}>{getTokenIcon(symbol, size)}</span>;
}
