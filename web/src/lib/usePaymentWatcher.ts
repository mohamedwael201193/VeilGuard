import { createPublicClient, Hex, http, parseAbiItem } from "viem";
import { polygon } from "viem/chains";

const transfer = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export function watchUsdcPayment({
  token,
  to,
  onDetect,
}: {
  token: `0x${string}`;
  to: `0x${string}`;
  onDetect: (log: { txHash: Hex; value: bigint }) => void;
}) {
  const client = createPublicClient({ chain: polygon, transport: http() });

  return client.watchContractEvent({
    address: token,
    abi: [transfer],
    eventName: "Transfer",
    args: { to },
    pollingInterval: 5000,
    onLogs: (logs) =>
      logs.forEach((l) =>
        onDetect({
          txHash: l.transactionHash!,
          value: l.args?.value as bigint,
        })
      ),
  });
}
