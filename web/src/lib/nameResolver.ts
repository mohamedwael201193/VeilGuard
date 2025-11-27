/**
 * Name Resolver - Wave 3.5
 *
 * ENS and Polygon ID resolution for human-readable addresses
 * Aligns with Mastercard-style username transfers theme
 *
 * Features:
 * - ENS name resolution (alice.eth → 0x...)
 * - Polygon ID support (future)
 * - Address formatting utilities
 */

import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

export interface ResolutionResult {
  address: string | null;
  source: "ens" | "polygonid" | "raw" | null;
  error?: string;
}

// Create a public client for ENS resolution (ENS is on mainnet)
const ensClient = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com"),
});

/**
 * Resolve an ENS name to an Ethereum address
 *
 * @param ensName - ENS name like "vitalik.eth"
 * @returns Resolution result with address or error
 */
export async function resolveEnsName(
  ensName: string
): Promise<ResolutionResult> {
  try {
    // Validate ENS name format
    if (!ensName.endsWith(".eth")) {
      return {
        address: null,
        source: null,
        error: "Invalid ENS name (must end with .eth)",
      };
    }

    // Normalize the name (handles unicode, etc.)
    const normalized = normalize(ensName);

    // Resolve via ENS
    const address = await ensClient.getEnsAddress({ name: normalized });

    if (!address) {
      return {
        address: null,
        source: null,
        error: `No address found for ${ensName}`,
      };
    }

    return { address, source: "ens" };
  } catch (error) {
    return {
      address: null,
      source: null,
      error: `ENS resolution failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Resolve any input to an address
 * Handles: ENS names, raw addresses, Polygon ID (future)
 *
 * @param input - User input (address, ENS name, etc.)
 * @returns Resolution result
 */
export async function resolveToAddress(
  input: string
): Promise<ResolutionResult> {
  const trimmed = input.trim().toLowerCase();

  // Check if it's already a valid address
  if (isValidAddress(trimmed)) {
    return { address: trimmed, source: "raw" };
  }

  // Check if it's an ENS name
  if (isEnsName(trimmed)) {
    return resolveEnsName(trimmed);
  }

  // Future: Add Polygon ID resolution here
  // if (isPolygonId(trimmed)) {
  //   return resolvePolygonId(trimmed);
  // }

  return {
    address: null,
    source: null,
    error:
      "Invalid address format. Enter a valid Ethereum address or ENS name.",
  };
}

/**
 * Check if a string is a valid Ethereum address
 */
export function isValidAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input);
}

/**
 * Check if a string looks like an ENS name
 */
export function isEnsName(input: string): boolean {
  return input.endsWith(".eth") && input.length > 4 && !input.includes(" ");
}

/**
 * Format an address for display (truncated)
 *
 * @param address - Full address or ENS name
 * @param chars - Number of characters to show at start/end
 * @returns Formatted address
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return "";

  // If it's an ENS name, return as-is
  if (address.endsWith(".eth")) {
    return address;
  }

  // Truncate address
  if (address.length <= chars * 2 + 2) {
    return address;
  }

  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get ENS name for an address (reverse resolution)
 *
 * @param address - Ethereum address
 * @returns ENS name or null
 */
export async function getEnsName(address: string): Promise<string | null> {
  try {
    if (!isValidAddress(address)) return null;

    const name = await ensClient.getEnsName({
      address: address as `0x${string}`,
    });

    return name;
  } catch {
    return null;
  }
}

/**
 * Get ENS avatar for an address
 *
 * @param ensNameOrAddress - ENS name or address
 * @returns Avatar URL or null
 */
export async function getEnsAvatar(
  ensNameOrAddress: string
): Promise<string | null> {
  try {
    let name = ensNameOrAddress;

    // If it's an address, get the ENS name first
    if (isValidAddress(ensNameOrAddress)) {
      const resolvedName = await getEnsName(ensNameOrAddress);
      if (!resolvedName) return null;
      name = resolvedName;
    }

    const avatar = await ensClient.getEnsAvatar({ name: normalize(name) });
    return avatar;
  } catch {
    return null;
  }
}

/**
 * Batch resolve multiple inputs
 *
 * @param inputs - Array of addresses or ENS names
 * @returns Map of input → resolved address
 */
export async function batchResolve(
  inputs: string[]
): Promise<Map<string, ResolutionResult>> {
  const results = new Map<string, ResolutionResult>();

  // Process in parallel for speed
  const promises = inputs.map(async (input) => {
    const result = await resolveToAddress(input);
    results.set(input, result);
  });

  await Promise.all(promises);
  return results;
}
