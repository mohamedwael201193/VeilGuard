import { http, createConfig } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';
export const ALCHEMY_RPC = `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`;

// Configure chains — Polygon mainnet only
export const chains = [polygon] as const;

// Wagmi configuration
export const config = createConfig({
  chains,
  connectors: [
    injected(),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo',
    }),
  ],
  transports: {
    [polygon.id]: http(ALCHEMY_RPC),
  },
});
