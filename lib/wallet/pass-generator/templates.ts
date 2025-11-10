/**
 * Beautiful Apple Wallet Pass Templates
 * Modern, clean design with premium aesthetics
 */

import type { PassGenerationParams } from "./types";
import { PKPass } from "passkit-generator";
import fs from "fs";
import path from "path";
import { WALLET_CONFIG } from "../config";

/**
 * Create a beautiful, modern pass with premium design
 */
export async function createBeautifulPass(
  params: PassGenerationParams,
  certificates: {
    wwdr: Buffer;
    signerCert: Buffer;
    signerKey: Buffer;
    signerKeyPassphrase: string;
  },
): Promise<PKPass> {
  const { customer, vendor, passRecord, vendorSettings, branding, logoBuffer, iconBuffer } = params;

  // Template folder path
  const templatePath = path.join(process.cwd(), "lib/wallet/pass-template.pass");

  // Get premium colors with fallbacks
  const colors = getPremiumColors(vendor, vendorSettings);

  // Create pass instance with beautiful styling
  const pass = await PKPass.from(
    {
      model: templatePath,
      certificates,
    },
    {
      // Pass identification
      serialNumber: passRecord.serial_number,
      authenticationToken: passRecord.authentication_token,

      // Beautiful branding
      organizationName: vendorSettings?.organization_name || branding.organizationName,
      description: vendorSettings?.description || `${vendor.store_name} VIP Loyalty Card`,
      logoText: vendorSettings?.logo_text || vendor.store_name,

      // Premium colors - vibrant and modern
      foregroundColor: colors.foreground,
      backgroundColor: colors.background,
      labelColor: colors.label,

      // Web service for real-time updates
      webServiceURL: `${WALLET_CONFIG.webServiceURL}/api/wallet/v1`,
    },
  );

  // Set elegant QR code (compact, professional)
  pass.setBarcodes({
    message: passRecord.pass_data.barcode_message,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: passRecord.pass_data.member_name,
  });

  // PRIMARY FIELD - Huge, bold points (hero number) - NO LABEL
  pass.primaryFields.pop(); // Remove template placeholder
  pass.primaryFields.push({
    key: "points",
    // NO LABEL - just show the big number!
    value: formatPointsLuxury(passRecord.pass_data.points), // e.g. "2,392 PTS"
    changeMessage: "New Balance: %@",
    textAlignment: "PKTextAlignmentCenter",
  });

  // SECONDARY FIELDS - Boarding pass style: TIER | MEMBER | SINCE
  while (pass.secondaryFields.length > 0) {
    pass.secondaryFields.pop();
  }
  pass.secondaryFields.push(
    {
      key: "tier",
      label: "TIER",
      value:
        getTierEmoji(passRecord.pass_data.tier) + " " + passRecord.pass_data.tier.toUpperCase(),
      textAlignment: "PKTextAlignmentLeft",
    },
    {
      key: "member",
      label: "MEMBER",
      value: passRecord.pass_data.member_name,
      textAlignment: "PKTextAlignmentCenter",
    },
    {
      key: "since",
      label: "SINCE",
      value: formatMemberSince(customer.created_at),
      textAlignment: "PKTextAlignmentRight",
    },
  );

  // AUXILIARY FIELDS - Member ID below secondary fields
  while (pass.auxiliaryFields.length > 0) {
    pass.auxiliaryFields.pop();
  }
  pass.auxiliaryFields.push({
    key: "member_id",
    label: "MEMBER #",
    value: passRecord.pass_data.barcode_message,
    textAlignment: "PKTextAlignmentCenter",
  });

  // BACK FIELDS - Rich, detailed luxury information
  while (pass.backFields.length > 0) {
    pass.backFields.pop();
  }
  pass.backFields.push(
    {
      key: "welcome",
      label: "Welcome to VIP Rewards",
      value: `Thank you for being a valued member, ${passRecord.pass_data.member_name}. Your loyalty means everything to us.`,
    },
    {
      key: "points_detail",
      label: "Your Loyalty Balance",
      value: `${formatPoints(passRecord.pass_data.points)} points available to redeem for exclusive rewards, premium products, and special member-only experiences.`,
    },
    {
      key: "tier_benefits",
      label: `${getTierEmoji(passRecord.pass_data.tier)} ${passRecord.pass_data.tier.toUpperCase()} Tier Benefits`,
      value: getTierBenefits(passRecord.pass_data.tier),
    },
    {
      key: "earn_rewards",
      label: "Earning Rewards",
      value:
        "Earn 1 point for every dollar spent. Bonus points on special promotions. Points never expire as long as you remain active.",
    },
    {
      key: "contact",
      label: "Contact Information",
      value: `${vendor.store_name} | Email: ${customer.email}`,
    },
    {
      key: "terms",
      label: "Terms & Privacy",
      value: `Visit ${vendor.slug}.com/terms for complete terms and conditions. Your privacy is protected under our privacy policy.`,
    },
  );

  // Add beautiful images
  if (logoBuffer) {
    pass.addBuffer("logo.png", logoBuffer);
    pass.addBuffer("logo@2x.png", logoBuffer);
    pass.addBuffer("logo@3x.png", logoBuffer);
  }

  if (iconBuffer) {
    pass.addBuffer("icon.png", iconBuffer);
    pass.addBuffer("icon@2x.png", iconBuffer);
    pass.addBuffer("icon@3x.png", iconBuffer);
  }

  return pass;
}

/**
 * Get luxury color scheme - rich, deep, premium
 */
function getPremiumColors(vendor: any, settings: any) {
  // Try vendor brand colors first - but make them RICH
  if (vendor.brand_colors?.primary) {
    const primary = vendor.brand_colors.primary;
    return {
      background: darkenColor(primary, 0.2), // Richer, deeper
      foreground: "#FFFFFF",
      label: "#F5F5F5", // Brighter for luxury
    };
  }

  // Try settings
  if (settings?.background_color) {
    return {
      background: darkenColor(settings.background_color, 0.15),
      foreground: settings.foreground_color || "#FFFFFF",
      label: settings.label_color || "#F5F5F5",
    };
  }

  // LUXURY default - deep emerald with gold accents
  return {
    background: "#065f46", // Deep emerald (luxury green)
    foreground: "#FFFFFF",
    label: "#fef3c7", // Soft gold labels
  };
}

/**
 * Darken a color by a percentage for luxury depth
 */
function darkenColor(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Darken
  const newR = Math.max(0, Math.floor(r * (1 - percent)));
  const newG = Math.max(0, Math.floor(g * (1 - percent)));
  const newB = Math.max(0, Math.floor(b * (1 - percent)));

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

/**
 * Format points with commas (standard)
 */
function formatPoints(points: number): string {
  return points.toLocaleString("en-US");
}

/**
 * Format points with luxury suffix (for primary field)
 */
function formatPointsLuxury(points: number): string {
  return `${points.toLocaleString("en-US")} PTS`;
}

/**
 * Get emoji for tier
 */
function getTierEmoji(tier: string): string {
  const tierLower = tier.toLowerCase();
  if (tierLower.includes("platinum") || tierLower.includes("diamond")) {
    return "💎";
  }
  if (tierLower.includes("gold")) {
    return "🏆";
  }
  if (tierLower.includes("silver")) {
    return "🥈";
  }
  if (tierLower.includes("bronze")) {
    return "🥉";
  }
  return "⭐";
}

/**
 * Format member since date
 */
function formatMemberSince(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

/**
 * Get tier-specific benefits (luxury copy)
 */
function getTierBenefits(tier: string): string {
  const tierLower = tier.toLowerCase();

  if (tierLower.includes("platinum") || tierLower.includes("diamond")) {
    return "Exclusive access to limited releases, priority customer service, 2x point earning rate, special birthday rewards, and early access to sales and events.";
  }

  if (tierLower.includes("gold")) {
    return "Priority access to new products, 1.5x point earning rate, exclusive member discounts, special birthday rewards, and invitations to member-only events.";
  }

  if (tierLower.includes("silver")) {
    return "Enhanced point earning rate, member-exclusive discounts, birthday rewards, and early notifications on sales and promotions.";
  }

  if (tierLower.includes("bronze")) {
    return "Standard point earning rate, member discounts, birthday rewards, and access to special promotions throughout the year.";
  }

  // Default member benefits
  return "Earn points on every purchase, redeem for exclusive rewards, receive special member-only offers, and enjoy birthday rewards.";
}
