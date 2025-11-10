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
 */
export function loadCertificates(): PassCertificates {
  const certPath = WALLET_CONFIG.certificates.signerCert;
  const wwdrPath = WALLET_CONFIG.certificates.wwdr;
  const certPassword = WALLET_CONFIG.certificates.signerKeyPassphrase;

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
