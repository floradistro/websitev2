/**
 * Apple Wallet Pass Type Definitions
 */

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  loyalty_points: number;
  loyalty_tier: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  logo_url?: string;
  brand_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

export interface VendorWalletSettings {
  pass_type_identifier: string;
  team_identifier: string;
  organization_name: string;
  logo_text?: string;
  description?: string;
  foreground_color?: string;
  background_color?: string;
  label_color?: string;
  fields_config?: any;
}

export interface WalletPass {
  id: string;
  serial_number: string;
  authentication_token: string;
  customer_id: string;
  vendor_id: string;
  pass_data: {
    points: number;
    tier: string;
    member_name: string;
    member_since: string;
    barcode_message: string;
  };
}

export interface PassGenerationParams {
  customer: Customer;
  vendor: Vendor;
  passRecord: WalletPass;
  vendorSettings: VendorWalletSettings | null;
  branding: any;
  logoBuffer: Buffer | null;
  iconBuffer: Buffer | null;
}
