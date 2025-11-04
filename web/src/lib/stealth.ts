/**
 * ERC-5564 Stealth Address Generation
 * Wave 2 implementation with mode switching
 *
 * This module conditionally exports either spec-compliant (ERC-5564) or demo mode
 * stealth address generation based on VITE_STEALTH_MODE environment variable.
 */

import { isSpecMode } from "./contracts";
import * as stealthDemo from "./stealthDemo";
import * as stealthSpec from "./stealthSpec";

// Re-export types
export type MetaAddress = {
  spendPubKey: `0x${string}`;
  viewPubKey: `0x${string}`;
};
export type SpecMetaAddress = {
  spendPriv: `0x${string}`;
  viewPriv: `0x${string}`;
};
export type StealthResult = {
  stealthAddress: `0x${string}`;
  ephemeralPubKey: `0x${string}`;
  metadata: `0x${string}`;
  viewTag?: `0x${string}`;
};

/**
 * Generate stealth address for an invoice
 * Automatically selects spec or demo mode based on environment
 */
export function genInvoiceStealth(
  meta: MetaAddress | SpecMetaAddress
): StealthResult {
  if (isSpecMode()) {
    // Spec mode: requires spendPriv and viewPriv
    return stealthSpec.genInvoiceStealth(meta as SpecMetaAddress);
  } else {
    // Demo mode: uses spendPubKey and viewPubKey
    return stealthDemo.genStealth(meta as MetaAddress);
  }
}

/**
 * Derive stealth keys (spec mode only)
 * Throws error if called in demo mode
 */
export function deriveStealthKeys(
  meta: SpecMetaAddress,
  ephPub: `0x${string}`
): { stealthPriv: `0x${string}`; stealthAddress: `0x${string}` } {
  if (!isSpecMode()) {
    throw new Error("deriveStealthKeys is only available in spec mode");
  }
  return stealthSpec.deriveStealthKeys(meta, ephPub);
}
