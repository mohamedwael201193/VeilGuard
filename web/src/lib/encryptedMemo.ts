/**
 * Encrypted Memos (ECIES) for VeilGuard Wave 3
 *
 * Privacy-enhanced memo encryption using ECDH shared secret + AES-GCM
 * Only the merchant with the viewing key can decrypt memos
 *
 * Flow:
 * 1. Payer encrypts memo with ECDH(ephemeralPriv, viewPubKey)
 * 2. Merchant decrypts with ECDH(viewPriv, ephemeralPubKey)
 * 3. Same shared secret enables symmetric decryption
 */

import * as secp from "@noble/secp256k1";
import { bytesToHex, hexToBytes } from "viem";

// AES-GCM constants
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // 128 bits authentication tag

/**
 * Derive AES key from ECDH shared secret using HKDF
 */
async function deriveAesKey(sharedSecret: Uint8Array): Promise<CryptoKey> {
  // Import shared secret as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    sharedSecret.slice(1), // Skip first byte (04 prefix for uncompressed)
    "HKDF",
    false,
    ["deriveKey"]
  );

  // Derive AES-GCM key using HKDF
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("VeilGuard-Memo-v1"),
      info: new TextEncoder().encode("encrypted-memo"),
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generate random IV for AES-GCM
 */
function generateIv(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Encrypt a memo using the ephemeral private key and merchant's view public key
 * Called by payer when creating payment
 *
 * @param memo - Plaintext memo to encrypt
 * @param ephemeralPriv - Ephemeral private key (from stealth generation)
 * @param viewPubKey - Merchant's viewing public key
 * @returns Encrypted memo as hex string (iv || ciphertext || tag)
 */
export async function encryptMemo(
  memo: string,
  ephemeralPriv: `0x${string}`,
  viewPubKey: `0x${string}`
): Promise<`0x${string}`> {
  if (!memo || memo.trim() === "") {
    return "0x" as `0x${string}`;
  }

  // Parse keys
  const ephPrivHex = ephemeralPriv.startsWith("0x")
    ? ephemeralPriv.slice(2)
    : ephemeralPriv;
  const ephPrivBytes = hexToBytes(`0x${ephPrivHex.padStart(64, "0")}`);

  const viewPubHex = viewPubKey.startsWith("0x")
    ? viewPubKey.slice(2)
    : viewPubKey;
  const viewPubBytes = hexToBytes(`0x${viewPubHex.padStart(130, "0")}`);

  // Compute ECDH shared secret: ephPriv * viewPub
  const sharedSecret = secp.getSharedSecret(ephPrivBytes, viewPubBytes, false);

  // Derive AES key from shared secret
  const aesKey = await deriveAesKey(sharedSecret);

  // Generate random IV
  const iv = generateIv();

  // Encrypt memo
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(memo);

  // Cast IV to satisfy TypeScript's strict BufferSource requirement
  const ivBuffer = new ArrayBuffer(iv.byteLength);
  new Uint8Array(ivBuffer).set(iv);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: ivBuffer, tagLength: TAG_LENGTH },
    aesKey,
    plaintext
  );

  // Combine: iv (12 bytes) || ciphertext+tag
  const result = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), IV_LENGTH);

  return `0x${bytesToHex(result)}` as `0x${string}`;
}

/**
 * Decrypt a memo using the merchant's view private key and ephemeral public key
 * Called by merchant when viewing payment in Inbox
 *
 * @param encryptedMemo - Encrypted memo as hex string
 * @param viewPriv - Merchant's viewing private key
 * @param ephemeralPubKey - Ephemeral public key (from announcement)
 * @returns Decrypted plaintext memo
 */
export async function decryptMemo(
  encryptedMemo: `0x${string}`,
  viewPriv: `0x${string}`,
  ephemeralPubKey: `0x${string}`
): Promise<string> {
  // Handle empty memo
  if (!encryptedMemo || encryptedMemo === "0x" || encryptedMemo.length < 30) {
    return "";
  }

  try {
    // Parse view private key
    const viewPrivHex = viewPriv.startsWith("0x")
      ? viewPriv.slice(2)
      : viewPriv;
    const viewPrivBytes = hexToBytes(`0x${viewPrivHex.padStart(64, "0")}`);

    // Parse ephemeral public key
    const ephPubHex = ephemeralPubKey.startsWith("0x")
      ? ephemeralPubKey.slice(2)
      : ephemeralPubKey;
    const ephPubBytes = hexToBytes(`0x${ephPubHex.padStart(130, "0")}`);

    // Compute ECDH shared secret: viewPriv * ephPub (same as ephPriv * viewPub)
    const sharedSecret = secp.getSharedSecret(
      viewPrivBytes,
      ephPubBytes,
      false
    );

    // Derive AES key from shared secret
    const aesKey = await deriveAesKey(sharedSecret);

    // Parse encrypted data
    const encryptedHex = encryptedMemo.startsWith("0x")
      ? encryptedMemo.slice(2)
      : encryptedMemo;
    const encryptedBytes = hexToBytes(`0x${encryptedHex}`);

    // Extract IV and ciphertext
    const iv = encryptedBytes.slice(0, IV_LENGTH);
    const ciphertext = encryptedBytes.slice(IV_LENGTH);

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
      aesKey,
      ciphertext
    );

    // Decode UTF-8
    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  } catch (error) {
    console.error("Failed to decrypt memo:", error);
    return "[encrypted]";
  }
}

/**
 * Check if a memo is encrypted
 */
export function isEncryptedMemo(memo: string): boolean {
  // Encrypted memos start with 0x and have at least IV + some ciphertext
  return (
    memo.startsWith("0x") &&
    memo.length > 30 && // IV (24 hex) + at least 3 bytes ciphertext
    /^0x[0-9a-fA-F]+$/.test(memo)
  );
}

/**
 * Derive viewing public key from viewing private key
 * Used when merchant needs to share their meta-address
 */
export function getViewingPubKey(viewPriv: `0x${string}`): `0x${string}` {
  const viewPrivHex = viewPriv.startsWith("0x") ? viewPriv.slice(2) : viewPriv;
  const viewPrivBytes = hexToBytes(`0x${viewPrivHex.padStart(64, "0")}`);

  const viewPubBytes = secp.getPublicKey(viewPrivBytes, false); // uncompressed
  return `0x${bytesToHex(viewPubBytes)}` as `0x${string}`;
}

/**
 * Generate a complete meta-address (spending + viewing public keys)
 * from private keys for sharing with payers
 */
export function generateMetaAddress(
  spendPriv: `0x${string}`,
  viewPriv: `0x${string}`
): { spendPubKey: `0x${string}`; viewPubKey: `0x${string}` } {
  const spendPrivHex = spendPriv.startsWith("0x")
    ? spendPriv.slice(2)
    : spendPriv;
  const spendPrivBytes = hexToBytes(`0x${spendPrivHex.padStart(64, "0")}`);

  const viewPrivHex = viewPriv.startsWith("0x") ? viewPriv.slice(2) : viewPriv;
  const viewPrivBytes = hexToBytes(`0x${viewPrivHex.padStart(64, "0")}`);

  const spendPubBytes = secp.getPublicKey(spendPrivBytes, false);
  const viewPubBytes = secp.getPublicKey(viewPrivBytes, false);

  return {
    spendPubKey: `0x${bytesToHex(spendPubBytes)}` as `0x${string}`,
    viewPubKey: `0x${bytesToHex(viewPubBytes)}` as `0x${string}`,
  };
}
