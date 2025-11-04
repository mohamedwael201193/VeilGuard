import * as secp from "@noble/secp256k1";
import { bytesToHex, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Secp256k1 curve order
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/**
 * Modular arithmetic helper for secp256k1 curve order
 */
function mod(n: bigint): bigint {
  return ((n % N) + N) % N;
}

/**
 * Convert hex string to bigint
 */
function hexToBig(x: `0x${string}`): bigint {
  return BigInt(x);
}

/**
 * Derive stealth keys from merchant meta keys and ephemeral public key
 * Following ERC-5564 spec: k_stealth = (H(ECDH(viewPriv, ephPub)) + spendPriv) mod n
 *
 * @param meta - Merchant meta keys (spendPriv and viewPriv)
 * @param ephPub - Ephemeral public key (uncompressed, 65 bytes)
 * @returns Stealth private key and address
 */
export function deriveStealthKeys(
  meta: { spendPriv: `0x${string}`; viewPriv: `0x${string}` },
  ephPub: `0x${string}`
) {
  console.log("deriveStealthKeys called with:");
  console.log("  spendPriv:", meta.spendPriv);
  console.log("  viewPriv:", meta.viewPriv);
  console.log("  ephPub:", ephPub);

  // Ensure private keys are properly formatted (remove 0x and pad to 64 hex chars)
  const viewPrivHex = meta.viewPriv.startsWith("0x")
    ? meta.viewPriv.slice(2)
    : meta.viewPriv;
  const viewPrivPadded = viewPrivHex.padStart(64, "0");

  // Convert hex to bytes - must be exactly 64 hex chars (32 bytes)
  if (viewPrivPadded.length !== 64) {
    throw new Error(`Invalid viewPriv length: ${viewPrivPadded.length}`);
  }
  const viewPrivBytes = new Uint8Array(
    viewPrivPadded.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const ephPubHex = ephPub.startsWith("0x") ? ephPub.slice(2) : ephPub;
  const ephPubPadded = ephPubHex.padStart(130, "0"); // 65 bytes = 130 hex chars

  // Convert hex to bytes - must be exactly 130 hex chars (65 bytes)
  if (ephPubPadded.length !== 130) {
    throw new Error(`Invalid ephPub length: ${ephPubPadded.length}`);
  }
  const ephPubBytes = new Uint8Array(
    ephPubPadded.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  // Perform ECDH: shared = viewPriv * ephPub
  const shared = secp.getSharedSecret(viewPrivBytes, ephPubBytes, false); // 65 bytes uncompressed

  console.log("  shared secret:", bytesToHex(shared));

  // Hash the shared secret
  const h = BigInt(keccak256(`0x${bytesToHex(shared)}`));

  console.log("  hash(shared):", `0x${h.toString(16)}`);

  // Derive stealth private key: k_stealth = (h + spendPriv) mod n
  const k = mod(h + hexToBig(meta.spendPriv));

  console.log("  stealth priv:", `0x${k.toString(16).padStart(64, "0")}`);

  // Derive stealth public key from stealth private key
  const stealthPrivHex = `0x${k
    .toString(16)
    .padStart(64, "0")}` as `0x${string}`;

  // Use viem's privateKeyToAccount to ensure address compatibility
  const account = privateKeyToAccount(stealthPrivHex);
  const addr = account.address;

  console.log("  derived address:", addr);

  return {
    stealthPriv: stealthPrivHex,
    stealthAddress: addr,
  };
}

/**
 * Generate a new stealth address for an invoice (spec-compliant ERC-5564)
 * Generate a new stealth address for an invoice (spec-compliant ERC-5564)
 *
 * @param meta - Merchant meta keys (spendPriv and viewPriv)
 * @returns Stealth address, ephemeral public key, and metadata (view tag)
 */
export function genInvoiceStealth(meta: {
  spendPriv: `0x${string}`;
  viewPriv: `0x${string}`;
}) {
  // Generate random ephemeral private key
  const ephPriv = secp.utils.randomSecretKey();
  const ephPub = secp.getPublicKey(ephPriv, false); // uncompressed 65 bytes

  // Ensure viewPriv is properly formatted (remove 0x and pad to 64 hex chars)
  const viewPrivHex = meta.viewPriv.startsWith("0x")
    ? meta.viewPriv.slice(2)
    : meta.viewPriv;
  const viewPrivPadded = viewPrivHex.padStart(64, "0");

  // Convert hex to bytes - must be exactly 64 hex chars (32 bytes)
  if (viewPrivPadded.length !== 64) {
    throw new Error(
      `Invalid private key length: ${viewPrivPadded.length}, expected 64 hex chars`
    );
  }
  const viewPrivBytes = new Uint8Array(
    viewPrivPadded.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  // Compute shared secret for view tag: ECDH(viewPriv, ephPub)
  const shared = secp.getSharedSecret(viewPrivBytes, ephPub, false);

  // View tag: first byte of keccak256(shared secret)
  const viewTag = keccak256(`0x${bytesToHex(shared)}`).slice(
    0,
    4
  ) as `0x${string}`; // 0xXX

  // Convert ephPub to hex string (without 0x prefix for length check)
  const ephPubHexStr = bytesToHex(ephPub);
  const ephPubWith0x = ephPubHexStr.startsWith("0x")
    ? ephPubHexStr
    : (`0x${ephPubHexStr}` as `0x${string}`);

  // Derive stealth address using the spec-compliant method
  const { stealthAddress } = deriveStealthKeys(meta, ephPubWith0x);

  return {
    stealthAddress,
    ephemeralPubKey: ephPubWith0x,
    metadata: `0x${viewTag.slice(2, 4)}` as `0x${string}`, // single byte view tag
  };
}
