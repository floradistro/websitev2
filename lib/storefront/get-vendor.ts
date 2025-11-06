/**
 * Vendor Storefront Types
 * Minimal type definitions for storefront templates
 */

export interface VendorStorefront {
  id: string;
  slug: string;
  store_name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_domain?: string;
}
