import { parseAbi } from "viem";

const abi = parseAbi([
  "function announce(uint256 schemeId, address stealthAddress, bytes ephemeralPubKey, bytes metadata)",
]);

export async function announceStealth(
  helper: `0x${string}`,
  stealthAddress: `0x${string}`,
  ephemeralPubKey: `0x${string}`,
  metadata: `0x${string}`,
  chainId: number = 80002,
  walletClient: any
) {
  if (!walletClient) throw new Error("Wallet client required");

  try {
    // Define chain for the transaction
    const chain =
      chainId === 137
        ? {
            id: 137,
            name: "Polygon",
            nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
            rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
          }
        : {
            id: 80002,
            name: "Polygon Amoy",
            nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
            rpcUrls: {
              default: { http: ["https://rpc-amoy.polygon.technology"] },
            },
          };

    // Call the contract with explicit gas limit
    const hash = await walletClient.writeContract({
      address: helper,
      abi,
      functionName: "announce",
      args: [1n, stealthAddress, ephemeralPubKey, metadata],
      chain,
      gas: 150000n, // Set explicit gas limit to avoid estimation issues
    });

    return hash;
  } catch (error: any) {
    console.error("Announcement error:", error);
    // Don't throw - just log and continue
    console.warn("Announcement failed but invoice can still be created");
    return null;
  }
}
