/**
 * x402 Agent Payment Protocol - Wave 4
 *
 * Enable AI agents and automated systems to pay invoices
 * using the x402 protocol standard. Aligned with BrianSeong's
 * vision for internet-native payments and agent-to-agent trades.
 *
 * Features:
 * - Agent authentication and authorization
 * - Pay-per-use invoice model
 * - Machine-to-machine payments
 * - Automated payment scheduling
 * - Rate limiting and budgets
 */

import type { Address } from "viem";

// x402 Protocol Constants
export const X402_VERSION = "1.0.0";
export const X402_SCHEME = "x402";

export interface AgentCredentials {
  agentId: string;
  publicKey: string;
  permissions: AgentPermission[];
  budget: AgentBudget;
  createdAt: number;
  expiresAt?: number;
}

export interface AgentPermission {
  action: "PAY" | "CREATE" | "VIEW" | "SWEEP";
  maxAmount?: string;
  allowedTokens?: string[];
  rateLimit?: RateLimit;
}

export interface AgentBudget {
  dailyLimit: string;
  weeklyLimit: string;
  monthlyLimit: string;
  spent: {
    daily: string;
    weekly: string;
    monthly: string;
  };
  lastReset: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface RateLimit {
  maxRequests: number;
  windowMs: number;
  currentCount: number;
  windowStart: number;
}

export interface X402PaymentRequest {
  version: string;
  invoiceId: string;
  amount: string;
  token: string;
  recipient: Address;
  memo?: string;
  agentId: string;
  timestamp: number;
  signature: string;
  metadata?: Record<string, unknown>;
}

export interface X402PaymentResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
  timestamp: number;
}

export interface RecurringPayment {
  id: string;
  agentId: string;
  merchantAddress: Address;
  amount: string;
  token: string;
  frequency: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
  nextPayment: number;
  lastPayment?: number;
  totalPaid: string;
  paymentCount: number;
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "EXPIRED";
  maxPayments?: number;
  endDate?: number;
}

export interface PaymentSchedule {
  payments: ScheduledPayment[];
  totalAmount: string;
  estimatedGas: string;
}

export interface ScheduledPayment {
  invoiceId: string;
  scheduledTime: number;
  amount: string;
  token: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  retryCount: number;
}

// Storage keys for agent data
const AGENT_STORAGE_KEY = "veilguard_x402_agents";
const RECURRING_STORAGE_KEY = "veilguard_x402_recurring";
const SCHEDULE_STORAGE_KEY = "veilguard_x402_schedule";

/**
 * Register a new AI agent for automated payments
 *
 * @param agentId - Unique identifier for the agent
 * @param publicKey - Agent's public key for verification
 * @param permissions - List of allowed actions
 * @param budgetLimits - Daily/weekly/monthly spending limits
 * @returns Registered agent credentials
 */
export function registerAgent(
  agentId: string,
  publicKey: string,
  permissions: AgentPermission[],
  budgetLimits: { daily: string; weekly: string; monthly: string }
): AgentCredentials {
  const agent: AgentCredentials = {
    agentId,
    publicKey,
    permissions,
    budget: {
      dailyLimit: budgetLimits.daily,
      weeklyLimit: budgetLimits.weekly,
      monthlyLimit: budgetLimits.monthly,
      spent: { daily: "0", weekly: "0", monthly: "0" },
      lastReset: {
        daily: Date.now(),
        weekly: Date.now(),
        monthly: Date.now(),
      },
    },
    createdAt: Date.now(),
  };

  // Store agent
  const agents = getStoredAgents();
  agents[agentId] = agent;
  localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(agents));

  return agent;
}

/**
 * Verify agent has permission for an action
 *
 * @param agentId - Agent to verify
 * @param action - Action being attempted
 * @param amount - Amount involved (for PAY action)
 * @param token - Token being used
 * @returns Whether agent is authorized
 */
export function verifyAgentPermission(
  agentId: string,
  action: AgentPermission["action"],
  amount?: string,
  token?: string
): { authorized: boolean; reason?: string } {
  const agents = getStoredAgents();
  const agent = agents[agentId];

  if (!agent) {
    return { authorized: false, reason: "Agent not registered" };
  }

  // Check expiry
  if (agent.expiresAt && agent.expiresAt < Date.now()) {
    return { authorized: false, reason: "Agent credentials expired" };
  }

  // Find matching permission
  const permission = agent.permissions.find((p) => p.action === action);
  if (!permission) {
    return { authorized: false, reason: `No permission for action: ${action}` };
  }

  // Check token allowlist
  if (
    token &&
    permission.allowedTokens &&
    !permission.allowedTokens.includes(token)
  ) {
    return { authorized: false, reason: `Token not allowed: ${token}` };
  }

  // Check amount limit
  if (amount && permission.maxAmount) {
    if (BigInt(amount) > BigInt(permission.maxAmount)) {
      return { authorized: false, reason: "Amount exceeds permission limit" };
    }
  }

  // Check rate limit
  if (permission.rateLimit) {
    const now = Date.now();
    const windowExpired =
      now - permission.rateLimit.windowStart > permission.rateLimit.windowMs;

    if (windowExpired) {
      permission.rateLimit.currentCount = 0;
      permission.rateLimit.windowStart = now;
    }

    if (permission.rateLimit.currentCount >= permission.rateLimit.maxRequests) {
      return { authorized: false, reason: "Rate limit exceeded" };
    }

    permission.rateLimit.currentCount++;
  }

  // Check budget
  if (amount && action === "PAY") {
    const budgetCheck = checkBudget(agent, amount);
    if (!budgetCheck.withinBudget) {
      return { authorized: false, reason: budgetCheck.reason };
    }
  }

  // Save updated agent state
  agents[agentId] = agent;
  localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(agents));

  return { authorized: true };
}

/**
 * Create x402 payment request for agent
 *
 * @param agentId - Agent making the payment
 * @param invoiceId - Invoice to pay
 * @param amount - Payment amount
 * @param token - Payment token
 * @param recipient - Payment recipient address
 * @returns Payment request object
 */
export function createPaymentRequest(
  agentId: string,
  invoiceId: string,
  amount: string,
  token: string,
  recipient: Address,
  memo?: string
): X402PaymentRequest {
  const timestamp = Date.now();

  // Create signature payload
  const payload = `${X402_VERSION}:${invoiceId}:${amount}:${token}:${recipient}:${timestamp}`;

  // In production, would use agent's private key to sign
  // For now, use deterministic hash
  const signature = simpleHash(payload);

  return {
    version: X402_VERSION,
    invoiceId,
    amount,
    token,
    recipient,
    memo,
    agentId,
    timestamp,
    signature,
  };
}

/**
 * Process x402 payment request
 *
 * @param request - Payment request from agent
 * @returns Payment response
 */
export async function processPaymentRequest(
  request: X402PaymentRequest
): Promise<X402PaymentResponse> {
  // Verify agent permission
  const authCheck = verifyAgentPermission(
    request.agentId,
    "PAY",
    request.amount,
    request.token
  );

  if (!authCheck.authorized) {
    return {
      success: false,
      error: authCheck.reason,
      timestamp: Date.now(),
    };
  }

  // Verify signature
  const payload = `${request.version}:${request.invoiceId}:${request.amount}:${request.token}:${request.recipient}:${request.timestamp}`;
  const expectedSig = simpleHash(payload);

  if (request.signature !== expectedSig) {
    return {
      success: false,
      error: "Invalid signature",
      timestamp: Date.now(),
    };
  }

  // Check timestamp freshness (5 minute window)
  if (Date.now() - request.timestamp > 5 * 60 * 1000) {
    return {
      success: false,
      error: "Request expired",
      timestamp: Date.now(),
    };
  }

  // Record spending
  recordAgentSpending(request.agentId, request.amount);

  // In production, would execute actual blockchain transaction
  // Return mock success for now
  return {
    success: true,
    transactionHash: `0x${simpleHash(JSON.stringify(request))}`,
    gasUsed: "65000",
    timestamp: Date.now(),
  };
}

/**
 * Create recurring payment subscription
 *
 * @param agentId - Agent managing the subscription
 * @param merchantAddress - Merchant to pay
 * @param amount - Payment amount per cycle
 * @param token - Payment token
 * @param frequency - Payment frequency
 * @param options - Additional options
 * @returns Recurring payment subscription
 */
export function createRecurringPayment(
  agentId: string,
  merchantAddress: Address,
  amount: string,
  token: string,
  frequency: RecurringPayment["frequency"],
  options?: { maxPayments?: number; endDate?: number }
): RecurringPayment {
  const id = `recurring_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const frequencyMs: Record<RecurringPayment["frequency"], number> = {
    HOURLY: 60 * 60 * 1000,
    DAILY: 24 * 60 * 60 * 1000,
    WEEKLY: 7 * 24 * 60 * 60 * 1000,
    MONTHLY: 30 * 24 * 60 * 60 * 1000,
  };

  const recurring: RecurringPayment = {
    id,
    agentId,
    merchantAddress,
    amount,
    token,
    frequency,
    nextPayment: Date.now() + frequencyMs[frequency],
    totalPaid: "0",
    paymentCount: 0,
    status: "ACTIVE",
    maxPayments: options?.maxPayments,
    endDate: options?.endDate,
  };

  // Store recurring payment
  const subscriptions = getStoredRecurring();
  subscriptions[id] = recurring;
  localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(subscriptions));

  return recurring;
}

/**
 * Get all recurring payments for an agent
 *
 * @param agentId - Agent ID (optional, returns all if not provided)
 * @returns List of recurring payments
 */
export function getRecurringPayments(agentId?: string): RecurringPayment[] {
  const subscriptions = getStoredRecurring();
  const all = Object.values(subscriptions);

  if (agentId) {
    return all.filter((r) => r.agentId === agentId);
  }

  return all;
}

/**
 * Process due recurring payments
 *
 * @returns Results of processed payments
 */
export async function processDueRecurringPayments(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: X402PaymentResponse[];
}> {
  const subscriptions = getStoredRecurring();
  const now = Date.now();
  const results: X402PaymentResponse[] = [];
  let processed = 0;
  let successful = 0;

  for (const recurring of Object.values(subscriptions)) {
    if (recurring.status !== "ACTIVE") continue;
    if (recurring.nextPayment > now) continue;

    // Check if max payments reached
    if (
      recurring.maxPayments &&
      recurring.paymentCount >= recurring.maxPayments
    ) {
      recurring.status = "EXPIRED";
      continue;
    }

    // Check if end date passed
    if (recurring.endDate && now > recurring.endDate) {
      recurring.status = "EXPIRED";
      continue;
    }

    processed++;

    // Create and process payment request
    const request = createPaymentRequest(
      recurring.agentId,
      `recurring_${recurring.id}_${recurring.paymentCount + 1}`,
      recurring.amount,
      recurring.token,
      recurring.merchantAddress
    );

    const response = await processPaymentRequest(request);
    results.push(response);

    if (response.success) {
      successful++;
      recurring.lastPayment = now;
      recurring.paymentCount++;
      recurring.totalPaid = (
        BigInt(recurring.totalPaid) + BigInt(recurring.amount)
      ).toString();

      // Calculate next payment
      const frequencyMs: Record<RecurringPayment["frequency"], number> = {
        HOURLY: 60 * 60 * 1000,
        DAILY: 24 * 60 * 60 * 1000,
        WEEKLY: 7 * 24 * 60 * 60 * 1000,
        MONTHLY: 30 * 24 * 60 * 60 * 1000,
      };
      recurring.nextPayment = now + frequencyMs[recurring.frequency];
    }
  }

  // Save updated subscriptions
  localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(subscriptions));

  return {
    processed,
    successful,
    failed: processed - successful,
    results,
  };
}

/**
 * Cancel a recurring payment
 *
 * @param id - Recurring payment ID
 * @returns Whether cancellation was successful
 */
export function cancelRecurringPayment(id: string): boolean {
  const subscriptions = getStoredRecurring();

  if (!subscriptions[id]) {
    return false;
  }

  subscriptions[id].status = "CANCELLED";
  localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(subscriptions));

  return true;
}

/**
 * Schedule multiple payments for batch processing
 *
 * @param payments - Payments to schedule
 * @returns Payment schedule with estimates
 */
export function schedulePayments(
  payments: Array<{
    invoiceId: string;
    amount: string;
    token: string;
    delayMinutes?: number;
  }>
): PaymentSchedule {
  const now = Date.now();
  const scheduled: ScheduledPayment[] = payments.map((p, index) => ({
    invoiceId: p.invoiceId,
    scheduledTime: now + (p.delayMinutes || index * 5) * 60 * 1000,
    amount: p.amount,
    token: p.token,
    status: "PENDING",
    retryCount: 0,
  }));

  const totalAmount = payments
    .reduce((sum, p) => sum + BigInt(p.amount), 0n)
    .toString();

  // Estimate gas (65000 per payment)
  const estimatedGas = (BigInt(65000) * BigInt(payments.length)).toString();

  // Store schedule
  const schedules = JSON.parse(
    localStorage.getItem(SCHEDULE_STORAGE_KEY) || "[]"
  );
  schedules.push(...scheduled);
  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));

  return {
    payments: scheduled,
    totalAmount,
    estimatedGas,
  };
}

/**
 * Get agent statistics
 *
 * @param agentId - Agent ID
 * @returns Agent payment statistics
 */
export function getAgentStats(agentId: string): {
  totalPayments: number;
  totalAmount: string;
  successRate: number;
  averageGas: string;
  budget: AgentBudget;
} | null {
  const agents = getStoredAgents();
  const agent = agents[agentId];

  if (!agent) return null;

  // Get recurring payments for this agent
  const recurring = getRecurringPayments(agentId);
  const totalPayments = recurring.reduce((sum, r) => sum + r.paymentCount, 0);
  const totalAmount = recurring
    .reduce((sum, r) => sum + BigInt(r.totalPaid), 0n)
    .toString();

  return {
    totalPayments,
    totalAmount,
    successRate: 0.98, // Would calculate from actual payment history
    averageGas: "65000",
    budget: agent.budget,
  };
}

// Helper functions

function getStoredAgents(): Record<string, AgentCredentials> {
  try {
    return JSON.parse(localStorage.getItem(AGENT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function getStoredRecurring(): Record<string, RecurringPayment> {
  try {
    return JSON.parse(localStorage.getItem(RECURRING_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function checkBudget(
  agent: AgentCredentials,
  amount: string
): { withinBudget: boolean; reason?: string } {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const WEEK_MS = 7 * DAY_MS;
  const MONTH_MS = 30 * DAY_MS;

  // Reset budgets if needed
  if (now - agent.budget.lastReset.daily > DAY_MS) {
    agent.budget.spent.daily = "0";
    agent.budget.lastReset.daily = now;
  }
  if (now - agent.budget.lastReset.weekly > WEEK_MS) {
    agent.budget.spent.weekly = "0";
    agent.budget.lastReset.weekly = now;
  }
  if (now - agent.budget.lastReset.monthly > MONTH_MS) {
    agent.budget.spent.monthly = "0";
    agent.budget.lastReset.monthly = now;
  }

  const amountBigInt = BigInt(amount);

  // Check daily
  if (
    BigInt(agent.budget.spent.daily) + amountBigInt >
    BigInt(agent.budget.dailyLimit)
  ) {
    return { withinBudget: false, reason: "Daily budget exceeded" };
  }

  // Check weekly
  if (
    BigInt(agent.budget.spent.weekly) + amountBigInt >
    BigInt(agent.budget.weeklyLimit)
  ) {
    return { withinBudget: false, reason: "Weekly budget exceeded" };
  }

  // Check monthly
  if (
    BigInt(agent.budget.spent.monthly) + amountBigInt >
    BigInt(agent.budget.monthlyLimit)
  ) {
    return { withinBudget: false, reason: "Monthly budget exceeded" };
  }

  return { withinBudget: true };
}

function recordAgentSpending(agentId: string, amount: string): void {
  const agents = getStoredAgents();
  const agent = agents[agentId];

  if (!agent) return;

  agent.budget.spent.daily = (
    BigInt(agent.budget.spent.daily) + BigInt(amount)
  ).toString();
  agent.budget.spent.weekly = (
    BigInt(agent.budget.spent.weekly) + BigInt(amount)
  ).toString();
  agent.budget.spent.monthly = (
    BigInt(agent.budget.spent.monthly) + BigInt(amount)
  ).toString();

  agents[agentId] = agent;
  localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(agents));
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}
