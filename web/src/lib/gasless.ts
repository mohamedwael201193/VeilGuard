/**
 * Gasless Transaction Support - Wave 4
 *
 * Account Abstraction and meta-transactions for gasless UX.
 * "Grandma UX" - ChillerWhale's vision for mass adoption.
 *
 * Features:
 * - ERC-4337 Account Abstraction
 * - Paymaster integration for sponsored transactions
 * - Session keys for delegated signing
 * - Gas estimation and optimization
 */

import type { Address } from "viem";

// Paymaster configurations
export const PAYMASTERS = {
  POLYGON: {
    biconomy: "0x00000f79B7FaF42EEBAdbA19aCc07cD08Af44789",
    pimlico: "0x0000000000000039cd5e8ae05257ce51c473ddd1",
    stackup: "0x474Ea64BEdDE53aaD1084210BD60eeB99E4a56d6",
  },
} as const;

// Entry point contract (ERC-4337)
export const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

export interface GaslessConfig {
  enabled: boolean;
  paymaster: "biconomy" | "pimlico" | "stackup" | "custom";
  sponsorshipPolicy: SponsorshipPolicy;
  sessionKeyEnabled: boolean;
  maxGasPerTx: string;
}

export interface SponsorshipPolicy {
  type: "FULL" | "PARTIAL" | "CONDITIONAL";
  maxSponsoredPerDay: string;
  allowedOperations: ("CREATE_INVOICE" | "PAY_INVOICE" | "SWEEP" | "RECEIPT")[];
  conditions?: SponsorshipCondition[];
}

export interface SponsorshipCondition {
  type: "MIN_AMOUNT" | "TOKEN_TYPE" | "USER_TYPE" | "TIME_WINDOW";
  value: string | number | boolean;
}

export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: `0x${string}`;
  signature: `0x${string}`;
}

export interface GasEstimate {
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  totalGasEstimate: string;
  sponsoredAmount: string;
  userPays: string;
}

export interface SessionKey {
  publicKey: Address;
  permissions: SessionPermission[];
  validAfter: number;
  validUntil: number;
  nonce: number;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface SessionPermission {
  target: Address;
  selector: `0x${string}`;
  maxValue: string;
  maxCalls: number;
  callsUsed: number;
}

// Storage keys
const GASLESS_CONFIG_KEY = "veilguard_gasless_config";
const SESSION_KEYS_KEY = "veilguard_session_keys";
const SPONSORED_TXS_KEY = "veilguard_sponsored_txs";

/**
 * Initialize gasless configuration for user
 *
 * @param paymaster - Paymaster to use
 * @param policy - Sponsorship policy
 * @returns Gasless configuration
 */
export function initializeGasless(
  paymaster: GaslessConfig["paymaster"] = "biconomy",
  policy?: Partial<SponsorshipPolicy>
): GaslessConfig {
  const config: GaslessConfig = {
    enabled: true,
    paymaster,
    sponsorshipPolicy: {
      type: policy?.type || "FULL",
      maxSponsoredPerDay: policy?.maxSponsoredPerDay || "10",
      allowedOperations: policy?.allowedOperations || [
        "CREATE_INVOICE",
        "PAY_INVOICE",
        "SWEEP",
        "RECEIPT",
      ],
      conditions: policy?.conditions,
    },
    sessionKeyEnabled: false,
    maxGasPerTx: "500000",
  };

  localStorage.setItem(GASLESS_CONFIG_KEY, JSON.stringify(config));
  return config;
}

/**
 * Get current gasless configuration
 *
 * @returns Current config or null if not initialized
 */
export function getGaslessConfig(): GaslessConfig | null {
  try {
    const stored = localStorage.getItem(GASLESS_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Check if operation qualifies for gas sponsorship
 *
 * @param operation - Type of operation
 * @param amount - Transaction amount
 * @param token - Token being used
 * @returns Whether operation is sponsored and reason
 */
export function checkSponsorshipEligibility(
  operation: SponsorshipPolicy["allowedOperations"][number],
  amount?: string,
  token?: string
): { eligible: boolean; reason: string; sponsoredPercent: number } {
  const config = getGaslessConfig();

  if (!config || !config.enabled) {
    return {
      eligible: false,
      reason: "Gasless transactions not enabled",
      sponsoredPercent: 0,
    };
  }

  // Check if operation is allowed
  if (!config.sponsorshipPolicy.allowedOperations.includes(operation)) {
    return {
      eligible: false,
      reason: `Operation ${operation} not eligible for sponsorship`,
      sponsoredPercent: 0,
    };
  }

  // Check daily limit
  const todaySponsored = getTodaySponsoredCount();
  const maxDaily = parseInt(config.sponsorshipPolicy.maxSponsoredPerDay);

  if (todaySponsored >= maxDaily) {
    return {
      eligible: false,
      reason: `Daily sponsorship limit reached (${maxDaily}/day)`,
      sponsoredPercent: 0,
    };
  }

  // Check conditions
  if (config.sponsorshipPolicy.conditions) {
    for (const condition of config.sponsorshipPolicy.conditions) {
      const conditionMet = evaluateCondition(condition, amount, token);
      if (!conditionMet.met) {
        return {
          eligible: false,
          reason: conditionMet.reason,
          sponsoredPercent: 0,
        };
      }
    }
  }

  // Determine sponsorship percentage based on policy type
  let sponsoredPercent: number;
  switch (config.sponsorshipPolicy.type) {
    case "FULL":
      sponsoredPercent = 100;
      break;
    case "PARTIAL":
      sponsoredPercent = 50;
      break;
    case "CONDITIONAL":
      sponsoredPercent = amount && parseFloat(amount) > 100 ? 100 : 50;
      break;
    default:
      sponsoredPercent = 0;
  }

  return {
    eligible: true,
    reason: `${sponsoredPercent}% gas sponsored`,
    sponsoredPercent,
  };
}

/**
 * Estimate gas for gasless transaction
 *
 * @param target - Contract to call
 * @param callData - Encoded function call
 * @param value - ETH value to send
 * @returns Gas estimate with sponsorship breakdown
 */
export async function estimateGaslessTransaction(
  target: Address,
  callData: `0x${string}`,
  value: string = "0"
): Promise<GasEstimate> {
  const config = getGaslessConfig();

  // Base gas estimates (would be calculated from bundler in production)
  const baseEstimates = {
    callGasLimit: "100000",
    verificationGasLimit: "100000",
    preVerificationGas: "50000",
    maxFeePerGas: "50000000000", // 50 gwei
    maxPriorityFeePerGas: "2000000000", // 2 gwei
  };

  const totalGas =
    BigInt(baseEstimates.callGasLimit) +
    BigInt(baseEstimates.verificationGasLimit) +
    BigInt(baseEstimates.preVerificationGas);

  const totalCost = totalGas * BigInt(baseEstimates.maxFeePerGas);

  // Calculate sponsorship
  let sponsoredAmount = 0n;
  let userPays = totalCost;

  if (config?.enabled) {
    const eligibility = checkSponsorshipEligibility("PAY_INVOICE");
    if (eligibility.eligible) {
      sponsoredAmount =
        (totalCost * BigInt(eligibility.sponsoredPercent)) / 100n;
      userPays = totalCost - sponsoredAmount;
    }
  }

  return {
    ...baseEstimates,
    totalGasEstimate: totalGas.toString(),
    sponsoredAmount: sponsoredAmount.toString(),
    userPays: userPays.toString(),
  };
}

/**
 * Build UserOperation for gasless transaction
 *
 * @param sender - Smart account address
 * @param target - Target contract
 * @param callData - Encoded call data
 * @param nonce - Account nonce
 * @returns Unsigned UserOperation
 */
export async function buildUserOperation(
  sender: Address,
  target: Address,
  callData: `0x${string}`,
  nonce: bigint
): Promise<Partial<UserOperation>> {
  const gasEstimate = await estimateGaslessTransaction(target, callData);
  const config = getGaslessConfig();

  // Get paymaster data
  const paymasterAndData = await getPaymasterData(
    config?.paymaster || "biconomy"
  );

  return {
    sender,
    nonce,
    initCode: "0x",
    callData,
    callGasLimit: BigInt(gasEstimate.callGasLimit),
    verificationGasLimit: BigInt(gasEstimate.verificationGasLimit),
    preVerificationGas: BigInt(gasEstimate.preVerificationGas),
    maxFeePerGas: BigInt(gasEstimate.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(gasEstimate.maxPriorityFeePerGas),
    paymasterAndData,
  };
}

/**
 * Create session key for delegated signing
 *
 * @param permissions - What the session key can do
 * @param validityHours - How long the key is valid
 * @returns Created session key
 */
export function createSessionKey(
  permissions: SessionPermission[],
  validityHours: number = 24
): SessionKey {
  // Generate a deterministic "public key" for demo
  const publicKey = `0x${Math.random()
    .toString(16)
    .slice(2)
    .padStart(40, "0")}` as Address;

  const now = Math.floor(Date.now() / 1000);

  const sessionKey: SessionKey = {
    publicKey,
    permissions,
    validAfter: now,
    validUntil: now + validityHours * 3600,
    nonce: 0,
    status: "ACTIVE",
  };

  // Store session key
  const keys = getStoredSessionKeys();
  keys[publicKey] = sessionKey;
  localStorage.setItem(SESSION_KEYS_KEY, JSON.stringify(keys));

  // Enable session keys in config
  const config = getGaslessConfig();
  if (config) {
    config.sessionKeyEnabled = true;
    localStorage.setItem(GASLESS_CONFIG_KEY, JSON.stringify(config));
  }

  return sessionKey;
}

/**
 * Get all active session keys
 *
 * @returns List of active session keys
 */
export function getActiveSessionKeys(): SessionKey[] {
  const keys = getStoredSessionKeys();
  const now = Math.floor(Date.now() / 1000);

  return Object.values(keys).filter(
    (key) => key.status === "ACTIVE" && key.validUntil > now
  );
}

/**
 * Revoke a session key
 *
 * @param publicKey - Key to revoke
 * @returns Whether revocation was successful
 */
export function revokeSessionKey(publicKey: Address): boolean {
  const keys = getStoredSessionKeys();

  if (!keys[publicKey]) {
    return false;
  }

  keys[publicKey].status = "REVOKED";
  localStorage.setItem(SESSION_KEYS_KEY, JSON.stringify(keys));

  return true;
}

/**
 * Check if session key can perform operation
 *
 * @param publicKey - Session key to check
 * @param target - Target contract
 * @param selector - Function selector
 * @param value - Transaction value
 * @returns Whether operation is allowed
 */
export function canSessionKeyPerform(
  publicKey: Address,
  target: Address,
  selector: `0x${string}`,
  value: string
): { allowed: boolean; reason?: string } {
  const keys = getStoredSessionKeys();
  const key = keys[publicKey];

  if (!key) {
    return { allowed: false, reason: "Session key not found" };
  }

  if (key.status !== "ACTIVE") {
    return { allowed: false, reason: "Session key is not active" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now < key.validAfter) {
    return { allowed: false, reason: "Session key not yet valid" };
  }

  if (now > key.validUntil) {
    key.status = "EXPIRED";
    localStorage.setItem(SESSION_KEYS_KEY, JSON.stringify(keys));
    return { allowed: false, reason: "Session key expired" };
  }

  // Find matching permission
  const permission = key.permissions.find(
    (p) =>
      p.target.toLowerCase() === target.toLowerCase() && p.selector === selector
  );

  if (!permission) {
    return { allowed: false, reason: "Operation not permitted for this key" };
  }

  if (BigInt(value) > BigInt(permission.maxValue)) {
    return { allowed: false, reason: "Value exceeds session key limit" };
  }

  if (permission.callsUsed >= permission.maxCalls) {
    return { allowed: false, reason: "Session key call limit reached" };
  }

  return { allowed: true };
}

/**
 * Record a sponsored transaction
 *
 * @param txHash - Transaction hash
 * @param gasSponsored - Amount of gas sponsored
 */
export function recordSponsoredTx(txHash: string, gasSponsored: string): void {
  const today = new Date().toISOString().split("T")[0];
  const txs = JSON.parse(localStorage.getItem(SPONSORED_TXS_KEY) || "{}");

  if (!txs[today]) {
    txs[today] = [];
  }

  txs[today].push({
    txHash,
    gasSponsored,
    timestamp: Date.now(),
  });

  localStorage.setItem(SPONSORED_TXS_KEY, JSON.stringify(txs));
}

/**
 * Get gasless transaction statistics
 *
 * @returns Usage statistics
 */
export function getGaslessStats(): {
  totalSponsored: number;
  totalGasSaved: string;
  todayCount: number;
  todayRemaining: number;
} {
  const txs = JSON.parse(localStorage.getItem(SPONSORED_TXS_KEY) || "{}");
  const config = getGaslessConfig();
  const today = new Date().toISOString().split("T")[0];

  let totalSponsored = 0;
  let totalGasSaved = 0n;

  for (const dayTxs of Object.values(txs) as Array<
    Array<{ gasSponsored: string }>
  >) {
    totalSponsored += dayTxs.length;
    for (const tx of dayTxs) {
      totalGasSaved += BigInt(tx.gasSponsored);
    }
  }

  const todayTxs = txs[today] || [];
  const maxDaily = config
    ? parseInt(config.sponsorshipPolicy.maxSponsoredPerDay)
    : 10;

  return {
    totalSponsored,
    totalGasSaved: totalGasSaved.toString(),
    todayCount: todayTxs.length,
    todayRemaining: Math.max(0, maxDaily - todayTxs.length),
  };
}

// Helper functions

function getStoredSessionKeys(): Record<Address, SessionKey> {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEYS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getTodaySponsoredCount(): number {
  const today = new Date().toISOString().split("T")[0];
  const txs = JSON.parse(localStorage.getItem(SPONSORED_TXS_KEY) || "{}");
  return (txs[today] || []).length;
}

function evaluateCondition(
  condition: SponsorshipCondition,
  amount?: string,
  token?: string
): { met: boolean; reason: string } {
  switch (condition.type) {
    case "MIN_AMOUNT":
      if (!amount || parseFloat(amount) < (condition.value as number)) {
        return {
          met: false,
          reason: `Amount below minimum ${condition.value} for sponsorship`,
        };
      }
      break;

    case "TOKEN_TYPE":
      if (token !== condition.value) {
        return {
          met: false,
          reason: `Token ${token} not eligible, requires ${condition.value}`,
        };
      }
      break;

    case "TIME_WINDOW":
      const hour = new Date().getHours();
      const [start, end] = (condition.value as string).split("-").map(Number);
      if (hour < start || hour > end) {
        return {
          met: false,
          reason: `Sponsorship only available ${start}:00-${end}:00`,
        };
      }
      break;
  }

  return { met: true, reason: "Condition met" };
}

async function getPaymasterData(
  paymaster: GaslessConfig["paymaster"]
): Promise<`0x${string}`> {
  // In production, would call paymaster API for signed data
  // Return mock paymaster data
  const paymasterAddress =
    PAYMASTERS.POLYGON[paymaster as keyof typeof PAYMASTERS.POLYGON] ||
    PAYMASTERS.POLYGON.biconomy;

  // Simplified paymaster data format
  return `${paymasterAddress}${"00".repeat(32)}` as `0x${string}`;
}
