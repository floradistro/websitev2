/**
 * Wallet Pass Utilities
 */

import { createClient } from "@supabase/supabase-js";
import type { VendorWalletSettings } from "./types";

import { logger } from "@/lib/logger";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Get vendor wallet settings from database
 */
export async function getVendorWalletSettings(
  vendorId: string,
): Promise<VendorWalletSettings | null> {
  try {
    const { data, error } = await supabase
      .from("vendor_wallet_settings")
      .select("*")
      .eq("vendor_id", vendorId)
      .single();

    if (error) {
      return null;
    }

    return data as VendorWalletSettings;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching vendor wallet settings:", error);
    }
    return null;
  }
}

/**
 * Download image from URL and return as buffer
 */
export async function downloadImage(url?: string): Promise<Buffer | null> {
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Failed to download image:", error);
    }
    return null;
  }
}

/**
 * Log wallet pass event to database
 */
export async function logPassEvent(passId: string, customerId: string, eventType: string) {
  try {
    await supabase.from("wallet_pass_events").insert({
      pass_id: passId,
      customer_id: customerId,
      event_type: eventType,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Failed to log pass event:", error);
    }
  }
}
