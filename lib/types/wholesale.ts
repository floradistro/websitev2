// Wholesale/Distributor Types

export type VendorType = "standard" | "distributor" | "both";

export type WholesaleApplicationStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

export interface WholesaleCustomer {
  id: string;
  is_wholesale_approved: boolean;
  wholesale_approved_at?: string;
  wholesale_approved_by?: string;
  wholesale_business_name?: string;
  wholesale_license_number?: string;
  wholesale_license_expiry?: string;
  wholesale_tax_id?: string;
  wholesale_application_status: WholesaleApplicationStatus;
}

export interface WholesaleVendor {
  id: string;
  vendor_type: VendorType;
  wholesale_enabled: boolean;
  distributor_terms?: string;
  minimum_order_amount: number;
  distributor_license_number?: string;
  distributor_license_expiry?: string;
}

export interface WholesaleProduct {
  id: string;
  is_wholesale: boolean;
  wholesale_only: boolean;
  minimum_wholesale_quantity: number;
  wholesale_price?: number;
}

export interface WholesalePricing {
  id: string;
  product_id: string;
  vendor_id: string;
  tier_name: string;
  minimum_quantity: number;
  unit_price: number;
  discount_percentage?: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
  description?: string;
  terms?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WholesaleApplication {
  id: string;
  customer_id: string;
  business_name: string;
  business_type?: string;
  business_address: {
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  license_number: string;
  license_expiry: string;
  license_document_url?: string;
  tax_id: string;
  resale_certificate_url?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  rejection_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Extended types with wholesale fields
export interface VendorWithWholesale extends WholesaleVendor {
  email: string;
  store_name: string;
  slug: string;
  status: "active" | "suspended" | "pending";
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductWithWholesale extends WholesaleProduct {
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  regular_price: number;
  sale_price?: number;
  price: number;
  on_sale: boolean;
  featured_image?: string;
  vendor_id?: string;
  stock_status: "instock" | "outofstock" | "onbackorder";
  status: "draft" | "pending" | "published" | "archived";
}
