/**
 * Apple Wallet Pass Generator
 * Clean, modern, beautiful pass generation
 */

import { createClient } from "@supabase/supabase-js";
import { getVendorWalletBranding } from "../config";
import type { Customer, Vendor, WalletPass } from "./types";
import { createBeautifulPass } from "./templates";
import { loadCertificates } from "./signing";
import { logger } from "@/lib/logger";
import { getVendorWalletSettings, downloadImage, logPassEvent } from "./utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export class WalletPassGenerator {
  /**
   * Generate a beautiful Apple Wallet pass for a customer
   */
  async generatePass(customer: Customer, vendor: Vendor, passRecord: WalletPass): Promise<Buffer> {
    try {
      // Load certificates
      const certificates = loadCertificates();

      // Get vendor settings and branding
      const vendorSettings = await getVendorWalletSettings(vendor.id);
      const branding = getVendorWalletBranding(vendor);

      // Download and prepare images
      const logoBuffer = await downloadImage(vendor.logo_url);
      const iconBuffer = logoBuffer; // In production, resize for icon

      // Create beautiful pass
      const pass = await createBeautifulPass(
        {
          customer,
          vendor,
          passRecord,
          vendorSettings,
          branding,
          logoBuffer,
          iconBuffer,
        },
        certificates,
      );

      // Generate .pkpass file
      const buffer = pass.getAsBuffer();

      // Log success
      await logPassEvent(passRecord.id, customer.id, "generated");

      return buffer;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Failed to generate wallet pass:", error);
      }
      throw new Error(`Pass generation failed: ${error}`);
    }
  }

  /**
   * Update existing pass with latest customer data
   */
  async updatePass(passId: string): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
    try {
      // Get pass record with relations
      const { data: passRecord, error: passError } = await supabase
        .from("wallet_passes")
        .select("*, customers(*), vendors(*)")
        .eq("id", passId)
        .single();

      if (passError || !passRecord) {
        return { success: false, error: "Pass not found" };
      }

      // Get latest customer data
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", passRecord.customer_id)
        .single();

      if (!customer) {
        return { success: false, error: "Customer not found" };
      }

      // Update pass data with latest info
      const updatedPassData = {
        points: customer.loyalty_points,
        tier: customer.loyalty_tier,
        member_name: `${customer.first_name} ${customer.last_name}`,
        member_since: customer.created_at,
        barcode_message: `CUSTOMER-${customer.id.substring(0, 8).toUpperCase()}`,
      };

      // Update database
      await supabase
        .from("wallet_passes")
        .update({
          pass_data: updatedPassData,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", passId);

      // Generate new pass with updated data
      const buffer = await this.generatePass(customer, passRecord.vendors, {
        ...passRecord,
        pass_data: updatedPassData,
      });

      // Log update
      await logPassEvent(passId, customer.id, "updated");

      return { success: true, buffer };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Failed to update pass:", error);
      }
      return { success: false, error: String(error) };
    }
  }
}

// Export singleton instance
export const walletPassGenerator = new WalletPassGenerator();
