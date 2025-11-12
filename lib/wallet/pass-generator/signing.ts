/**
 * Pass Signing & Certificate Management
 */

import fs from "fs";
import path from "path";
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

  // PRODUCTION MODE: Check for base64-encoded env variables first
  const wwdrBase64 = process.env.APPLE_WALLET_WWDR_BASE64;
  const certBase64 = process.env.APPLE_WALLET_CERT_BASE64;

  if (wwdrBase64 && certBase64) {
    // Decode from base64
    const wwdr = Buffer.from(wwdrBase64, "base64");
    const signerCert = Buffer.from(certBase64, "base64");
    const signerKey = signerCert; // P12 contains both cert and key

    return {
      wwdr,
      signerCert,
      signerKey,
      signerKeyPassphrase: certPassword,
    };
  }

  // DEVELOPMENT MODE: Fall back to file paths
  const certPath = WALLET_CONFIG.certificates.signerCert;
  const wwdrPath = WALLET_CONFIG.certificates.wwdr;

  // Read WWDR certificate
  const wwdr = fs.readFileSync(wwdrPath);

  // Check for separate PEM files or P12
  const certDir = path.dirname(certPath);
  const certPemPath = path.join(certDir, "cert.pem");
  const keyPemPath = path.join(certDir, "key.pem");

  let signerCert: Buffer;
  let signerKey: Buffer;

  if (fs.existsSync(certPemPath) && fs.existsSync(keyPemPath)) {
    // Use separate PEM files (more secure)
    signerCert = fs.readFileSync(certPemPath);
    signerKey = fs.readFileSync(keyPemPath);
  } else {
    // Use P12 file (cert and key combined)
    signerCert = fs.readFileSync(certPath);
    signerKey = signerCert;
  }

  return {
    wwdr,
    signerCert,
    signerKey,
    signerKeyPassphrase: certPassword,
  };
}
