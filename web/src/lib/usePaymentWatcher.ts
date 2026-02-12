import { useEffect, useRef, useState } from "react";
import { createPublicClient, formatUnits, Hex, http, parseAbiItem } from "viem";
import { polygon, polygonAmoy } from "viem/chains";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

/**
 * Watch for ERC-20 Transfer events arriving at a stealth address.
 * Polls every 5 s via eth_getLogs. Returns the first detected payment.
 */
export function watchUsdcPayment({
  token,
  to,
  chainId = 137,
  onDetect,
}: {
  token: `0x${string}`;
  to: `0x${string}`;
  chainId?: number;
  onDetect: (log: { txHash: Hex; value: bigint; from: string }) => void;
}) {
  const chain = chainId === 80002 ? polygonAmoy : polygon;
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";
  const rpc =
    chainId === 80002
      ? `https://polygon-amoy.g.alchemy.com/v2/${apiKey}`
      : `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;

  const client = createPublicClient({
    chain,
    transport: http(rpc),
  });

  return client.watchContractEvent({
    address: token,
    abi: [transferEvent],
    eventName: "Transfer",
    args: { to },
    pollingInterval: 5_000,
    onLogs: (logs) =>
      logs.forEach((l) =>
        onDetect({
          txHash: l.transactionHash!,
          value: (l.args as any)?.value as bigint,
          from: (l.args as any)?.from as string,
        })
      ),
  });
}

/**
 * React hook: live payment detection for a stealth address.
 */
export function usePaymentDetection({
  tokenAddress,
  stealthAddress,
  expectedAmount,
  tokenDecimals = 6,
  chainId = 137,
  enabled = true,
}: {
  tokenAddress: string;
  stealthAddress: string;
  expectedAmount?: string;
  tokenDecimals?: number;
  chainId?: number;
  enabled?: boolean;
}) {
  const [detected, setDetected] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string | null>(null);
  const [payerAddress, setPayerAddress] = useState<string | null>(null);
  const unwatchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (
      !enabled ||
      !tokenAddress ||
      !stealthAddress ||
      detected
    )
      return;

    const unwatch = watchUsdcPayment({
      token: tokenAddress as `0x${string}`,
      to: stealthAddress as `0x${string}`,
      chainId,
      onDetect: ({ txHash: hash, value, from }) => {
        const formatted = formatUnits(value, tokenDecimals);
        setDetected(true);
        setTxHash(hash);
        setReceivedAmount(formatted);
        setPayerAddress(from);
      },
    });

    unwatchRef.current = unwatch;

    return () => {
      unwatch();
    };
  }, [tokenAddress, stealthAddress, chainId, enabled, detected, tokenDecimals]);

  return { detected, txHash, receivedAmount, payerAddress };
}

