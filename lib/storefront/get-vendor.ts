/**
 * Vendor Storefront Types
 * Type definitions for storefront templates
 */

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
