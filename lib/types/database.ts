/**
 * Database Types
 * Comprehensive type definitions for all database entities
 *
 * Generated from Supabase schema
 * Last updated: January 10, 2025
 */

// =============================================================================
// VENDORS
// =============================================================================

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  settings?: VendorSettings;
  meta_data?: Record<string, unknown>;
}

export interface VendorSettings {
  theme?: string;
  currency?: string;
  timezone?: string;
  tax_rate?: number;
  [key: string]: unknown;
}

// =============================================================================
// USERS
// =============================================================================

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  vendor_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string;
  meta_data?: Record<string, unknown>;
}

export type UserRole = "admin" | "vendor" | "employee" | "customer";

// =============================================================================
// PRODUCTS
// =============================================================================

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  regular_price?: number;
  cost_price?: number;
  featured_image?: string;
  featured_image_storage?: string;
  gallery_images?: string[];
  primary_category_id?: string;
  tags?: string[];
  custom_fields?: CustomField[];
  meta_data?: ProductMetaData;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_featured?: boolean;
  stock_status?: StockStatus;
}

export interface CustomField {
  field_name: string;
  field_value: string | number | boolean;
  field_type?: "text" | "number" | "boolean" | "select";
}

export interface ProductMetaData {
  pricing_mode?: "simple" | "tiered";
  pricing_tiers?: PricingTier[];
  pricing_blueprint_id?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  [key: string]: unknown;
}

export interface PricingTier {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

// =============================================================================
// CATEGORIES
// =============================================================================

export interface Category {
  id: string;
  vendor_id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  display_order?: number;
  is_active: boolean;
  field_visibility?: FieldVisibility;
  created_at: string;
  updated_at: string;
}

export interface FieldVisibility {
  [fieldName: string]: {
    visible: boolean;
    required?: boolean;
    label?: string;
  };
}

// =============================================================================
// INVENTORY
// =============================================================================

export interface Inventory {
  id: string;
  vendor_id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  reserved_quantity?: number;
  available_quantity?: number;
  stock_status: StockStatus;
  reorder_point?: number;
  reorder_quantity?: number;
  last_counted?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  vendor_id: string;
  product_id: string;
  location_id: string;
  transaction_type: InventoryTransactionType;
  quantity: number;
  reason?: string;
  reference_id?: string;
  user_id?: string;
  created_at: string;
}

export type InventoryTransactionType =
  | "adjustment"
  | "sale"
  | "return"
  | "transfer"
  | "restock"
  | "damage"
  | "theft";

// =============================================================================
// LOCATIONS
// =============================================================================

export interface Location {
  id: string;
  vendor_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ORDERS
// =============================================================================

export interface Order {
  id: string;
  vendor_id: string;
  customer_id?: string;
  order_number: string;
  order_date: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  cost_of_goods?: number;
  payment_method?: string;
  payment_status?: PaymentStatus;
  pickup_location_id?: string;
  notes?: string;
  meta_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded"
  | "on-hold";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially-refunded";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  tax_amount: number;
  discount_amount?: number;
  meta_data?: Record<string, unknown>;
  created_at: string;
}

// =============================================================================
// POS TRANSACTIONS
// =============================================================================

export interface POSTransaction {
  id: string;
  vendor_id: string;
  location_id?: string;
  user_id?: string;
  order_id?: string;
  transaction_date: string;
  transaction_type: "sale" | "refund" | "void";
  payment_method: string;
  payment_status: PaymentStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  tip_amount?: number;
  total_amount: number;
  cost_of_goods?: number;
  items?: POSTransactionItem[];
  meta_data?: Record<string, unknown>;
  created_at: string;
}

export interface POSTransactionItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  tax_amount: number;
}

// =============================================================================
// PRICING TIER BLUEPRINTS
// =============================================================================

export interface PricingTierBlueprint {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  quality_tier?: string;
  applicable_to_categories: string[];
  tiers: PricingTier[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// CUSTOMERS
// =============================================================================

export interface Customer {
  id: string;
  vendor_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  birthday?: string;
  total_spent?: number;
  order_count?: number;
  loyalty_points?: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface DateRangeParams {
  start_date: string;
  end_date: string;
}

export interface FilterParams {
  category_ids?: string[];
  location_ids?: string[];
  employee_ids?: string[];
  payment_methods?: string[];
  include_refunds?: boolean;
  include_discounts?: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: ResponseMetadata;
}

export interface ResponseMetadata {
  total_records?: number;
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  metadata: ResponseMetadata & {
    total_records: number;
    page: number;
    limit: number;
    total_pages: number;
    has_more: boolean;
  };
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}
