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

  // ALWAYS use file paths for now (BASE64 versions are corrupted)
  // TODO: Fix BASE64 encoded certificates for production deployment
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
