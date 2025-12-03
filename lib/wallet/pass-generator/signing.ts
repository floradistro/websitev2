/**
 * Pass Signing & Certificate Management
 */

import fs from "fs";
import { WALLET_CONFIG } from "../config";

export interface PassCertificates {
  wwdr: Buffer;
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase: string;
}

/**
 * Load signing certificates for pass generation
 * Supports both base64-encoded env variables (for production) and file paths (for development)
 */
export function loadCertificates(): PassCertificates {
  const certPassword = WALLET_CONFIG.certificates.signerKeyPassphrase;

  // Check for base64-encoded certificates in environment variables (production)
  const certBase64 = process.env.APPLE_WALLET_CERT_BASE64;
  const keyBase64 = process.env.APPLE_WALLET_KEY_BASE64;
  const wwdrBase64 = process.env.APPLE_WALLET_WWDR_BASE64;

  if (certBase64 && keyBase64 && wwdrBase64) {
    // Production: Use base64-encoded certificates from environment variables
    return {
      wwdr: Buffer.from(wwdrBase64, "base64"),
      signerCert: Buffer.from(certBase64, "base64"),
      signerKey: Buffer.from(keyBase64, "base64"),
      signerKeyPassphrase: certPassword,
    };
  }

  // Development: Fall back to file paths
  const certPath = WALLET_CONFIG.certificates.signerCert;
  const keyPath = WALLET_CONFIG.certificates.signerKey;
  const wwdrPath = WALLET_CONFIG.certificates.wwdr;

  // Read certificates as PEM files
  const wwdr = fs.readFileSync(wwdrPath);
  const signerCert = fs.readFileSync(certPath);
  const signerKey = fs.readFileSync(keyPath);

  return {
    wwdr,
    signerCert,
    signerKey,
    signerKeyPassphrase: certPassword,
  };
}
