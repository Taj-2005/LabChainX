/**
 * Cryptographic utilities for data integrity and verification
 * Uses ECDSA (Elliptic Curve Digital Signature Algorithm) for signing
 */

import crypto from "crypto";

const ALGORITHM = "sha256";
const CURVE = "secp256k1"; // Bitcoin's curve, widely supported

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

/**
 * Generate a new ECDSA key pair
 */
export function generateKeyPair(): KeyPair {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: CURVE,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return {
    privateKey,
    publicKey,
  };
}

/**
 * Sign data with a private key
 */
export function signData(data: string, privateKey: string): string {
  try {
    const sign = crypto.createSign(ALGORITHM);
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, "base64");
  } catch (error) {
    throw new Error(`Failed to sign data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Verify a signature with a public key
 */
export function verifySignature(
  data: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const verify = crypto.createVerify(ALGORITHM);
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, "base64");
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}

/**
 * Create a hash of data (for integrity checking)
 */
export function hashData(data: string): string {
  return crypto.createHash(ALGORITHM).update(data).digest("hex");
}

/**
 * Sign replication results
 */
export function signReplication(data: {
  protocolId: string;
  replicatorId: string;
  results: Record<string, unknown>;
  timestamp: string;
}): { signature: string; hash: string } {
  const dataString = JSON.stringify(data);
  const hash = hashData(dataString);
  
  // In a real implementation, you'd get the private key from the user's stored keys
  // For now, we'll use a placeholder that shows the structure
  const signature = hash; // Simplified for now - in production, use actual ECDSA signing
  
  return {
    signature,
    hash,
  };
}

/**
 * Verify replication signature
 */
export function verifyReplicationSignature(
  data: {
    protocolId: string;
    replicatorId: string;
    results: Record<string, unknown>;
    timestamp: string;
  },
  signature: string
): boolean {
  const dataString = JSON.stringify(data);
  const hash = hashData(dataString);
  
  // Simplified verification - in production, verify ECDSA signature
  return hash === signature;
}

