// Apple Wallet Configuration
// Manages certificate paths and pass configuration

export const WALLET_CONFIG = {
  // Apple Developer Configuration
  passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || "pass.com.whaletools.wallet",
  teamIdentifier: process.env.APPLE_TEAM_ID || "Y9Q7L7SGR3",

  // Certificate Paths (relative to project root)
  certificates: {
    // Path to extracted certificate PEM file
    signerCert:
      process.env.APPLE_WALLET_CERT_PATH ||
      "/Users/whale/Desktop/APPLE WALLET SHIT/cert-final.pem",

    // Path to extracted private key PEM file
    signerKey:
      process.env.APPLE_WALLET_KEY_PATH ||
      "/Users/whale/Desktop/APPLE WALLET SHIT/key-final.pem",

    // Path to Apple WWDR certificate
    wwdr:
      process.env.APPLE_WALLET_WWDR_PATH ||
      "/Users/whale/Desktop/APPLE WALLET SHIT/AppleWWDRCAG4-correct.pem",

    // Password for the key (library requires non-empty value even for unencrypted PEM)
    signerKeyPassphrase: process.env.APPLE_WALLET_CERT_PASSWORD || "whaletools",
  },

  // Default Pass Styling
  defaultColors: {
    foregroundColor: "rgb(255,255,255)",
    backgroundColor: "rgb(0,0,0)",
    labelColor: "rgb(255,255,255)",
  },

  // Asset Paths
  assets: {
    // Default logo/icon if vendor doesn't have one
    defaultLogo: "/wallet-assets/default-logo.png",
    defaultIcon: "/wallet-assets/default-icon.png",
  },

  // API URLs
  webServiceURL: process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com",

  // Pass Update Settings
  updates: {
    enablePushNotifications: true,
    maxUpdateRetries: 3,
  },
} as const;

// Validation
export function validateWalletConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!WALLET_CONFIG.certificates.signerKeyPassphrase) {
    errors.push("Missing APPLE_WALLET_CERT_PASSWORD environment variable");
  }

  if (!WALLET_CONFIG.passTypeIdentifier) {
    errors.push("Missing APPLE_PASS_TYPE_ID environment variable");
  }

  if (!WALLET_CONFIG.teamIdentifier) {
    errors.push("Missing APPLE_TEAM_ID environment variable");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Helper to get vendor-specific branding
export function getVendorWalletBranding(vendor: {
  store_name: string;
  logo_url?: string;
  brand_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}) {
  return {
    organizationName: vendor.store_name,
    logoText: `${vendor.store_name} Rewards`,
    foregroundColor: "rgb(255,255,255)",
    backgroundColor: vendor.brand_colors?.primary
      ? rgbFromHex(vendor.brand_colors.primary)
      : WALLET_CONFIG.defaultColors.backgroundColor,
    logoUrl: vendor.logo_url || WALLET_CONFIG.assets.defaultLogo,
  };
}

// Convert hex color to rgb() format
function rgbFromHex(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgb(${r},${g},${b})`;
}

// Generate unique serial number for pass
export function generatePassSerialNumber(): string {
  return `PASS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

// Generate authentication token for pass updates
export function generateAuthToken(): string {
  return `AUTH-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`.toUpperCase();
}
