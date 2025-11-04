import * as secp from "@noble/secp256k1";
import { encodePacked, getAddress, hexToBytes, keccak256, toHex } from "viem";

type MetaAddress = { spendPubKey: `0x${string}`; viewPubKey: `0x${string}` };

export function genStealth(meta: MetaAddress) {
  const ephemeralPriv = crypto.getRandomValues(new Uint8Array(32));
  // Generate uncompressed public key (65 bytes) instead of compressed (33 bytes)
  const ephPub = secp.getPublicKey(ephemeralPriv, false);

  // Get shared secret (returns Uint8Array)
  const sharedSecret = secp.getSharedSecret(
    ephemeralPriv,
    hexToBytes(meta.viewPubKey)
  );

  // Convert to hex for hashing
  const sharedHex = toHex(sharedSecret);

  // View tag: first byte of keccak256(shared secret)
  const tagByte = Number("0x" + keccak256(sharedHex).slice(2, 4));

  // Generate stealth seed
  const stealthSeed = keccak256(
    encodePacked(["bytes", "bytes"], [sharedHex, meta.spendPubKey])
  );

  // Derive stealth address from seed (last 20 bytes)
  const stealthAddress = getAddress(
    ("0x" + stealthSeed.slice(26)) as `0x${string}`
  );

  const metadata = toHex(new Uint8Array([tagByte]));

  return {
    stealthAddress,
    ephemeralPrivKey: toHex(ephemeralPriv),
    ephemeralPubKey: toHex(ephPub),
    viewTag: metadata,
    metadata,
  };
}
