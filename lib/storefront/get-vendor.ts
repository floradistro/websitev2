/**
 * Vendor Storefront Types and Functions
 * Type definitions and helper functions for storefront templates
 */

import { headers } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/client";

export interface VendorStorefront {
  id: string;
  slug: string;
  store_name: string;
  store_tagline?: string;
  logo_url?: string;
  banner_url?: string;
  primary_color?: string;
  secondary_color?: string;
  brand_colors?: any;
  custom_domain?: string;
  custom_css?: string;
  custom_font?: string;
  template_id?: string;
  coming_soon?: boolean;
  coming_soon_message?: string;
  launch_date?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    email?: string;
  };
}

/**
 * Get vendor ID from request headers
 */
export async function getVendorFromHeaders(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get("x-vendor-id");
}

/**
 * Get vendor storefront data from database
 */
export async function getVendorStorefront(
  vendorId: string,
): Promise<VendorStorefront | null> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", vendorId)
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching vendor:", error);
    }
    return null;
  }

  return data as VendorStorefront;
}
