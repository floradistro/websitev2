/**
 * Product Type Definitions
 * Comprehensive type safety for product-related data structures
 */

export type ProductStatus = 'published' | 'pending' | 'rejected' | 'draft';
export type ProductType = 'simple' | 'variable';
export type ProductVisibility = 'internal' | 'public';
export type PricingMode = 'single' | 'tiered';

export interface PricingTier {
  weight: string;
  qty: number;
  price: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface CustomFields {
  strain_type?: string;
  lineage?: string;
  nose?: string;
  effects?: string;
  terpene_profile?: string;
  description?: string;
  [key: string]: any; // Allow additional custom fields
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  slug: string;
  description?: string;

  // Pricing
  regular_price?: number;
  price?: number;
  cost_price?: number;
  pricing_mode?: PricingMode;
  pricing_tiers?: PricingTier[];

  // Category & Classification
  primary_category_id?: string;
  category?: string;
  categories?: string[];

  // Product Details
  product_type: ProductType;
  product_visibility: ProductVisibility;
  status: ProductStatus;

  // Images
  image_urls?: string[];
  images?: ProductImage[];
  featured_image?: string;

  // Inventory
  total_stock?: number;
  stock_quantity?: number;
  initial_quantity?: number;
  manage_stock?: boolean;

  // Custom Fields
  custom_fields?: CustomFields;

  // Meta
  vendor_id: string;
  created_at?: string;
  updated_at?: string;

  // Additional metadata
  meta_data?: Record<string, any>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  vendor_id?: string;
  parent_id?: string;
  field_visibility?: Record<string, FieldVisibilityConfig>;
  created_at?: string;
  updated_at?: string;
}

export interface FieldVisibilityConfig {
  shop?: boolean;
  product_page?: boolean;
  pos?: boolean;
  tv_menu?: boolean;
}

export interface DynamicField {
  id: string;
  fieldId: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'url' | 'email';
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  categoryId?: string;
  sortOrder?: number;
  inherited?: boolean;
  source?: 'category' | 'parent' | 'global';
}

export interface BulkProduct {
  name: string;
  price: string;
  cost_price?: string;
  pricing_mode: PricingMode;
  pricing_tiers?: PricingTier[];
  pricing_template_id?: string;
  description?: string;
  category_id?: string;
  custom_fields?: CustomFields;
}

export interface BulkImage {
  productName: string;
  file: File;
  preview: string;
}

export interface ProductsListResponse {
  success: boolean;
  products: Product[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface ProductFilters {
  search: string;
  status: 'all' | ProductStatus;
  category: 'all' | string;
  page: number;
  itemsPerPage: number;
}

export interface ProductStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface PricingTemplate {
  id: string;
  vendor_id: string | null;
  name: string;
  slug: string;
  description?: string;
  tier_type: 'weight' | 'quantity' | 'percentage' | 'flat' | 'custom';
  quality_tier?: 'exotic' | 'top-shelf' | 'mid-shelf' | 'value';
  price_breaks: Array<{
    break_id: string;
    label: string;
    qty: number;
    unit: string;
    price?: number;
    sort_order: number;
  }>;
  applicable_to_categories?: string[];
  context?: 'retail' | 'wholesale' | 'distributor' | 'delivery';
  is_active?: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Legacy type alias for backwards compatibility
export type PricingBlueprint = PricingTemplate;

export interface FieldGroup {
  id: string;
  vendor_id: string | null;
  name: string;
  slug: string;
  description?: string;
  fields: DynamicField[];
  is_active: boolean;
  category_id?: string;
}

// API Response Types
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface APIErrorResponse {
  error?: string;
  details?: ValidationErrorDetail[];
}

export interface EnrichedProductData {
  strain_type?: string;
  lineage?: string;
  nose?: string[];
  effects?: string[];
  terpene_profile?: string[];
  description?: string;
}

export interface BulkAIResult {
  product_name: string;
  strain_type?: string;
  lineage?: string;
  nose?: string[];
  effects?: string[];
  terpene_profile?: string[];
  description?: string;
}

// Form Data Types
export interface ProductFormData {
  name: string;
  description: string;
  category_id: string;
  price: string;
  cost_price: string;
  initial_quantity: string;
}

export interface ProductSubmissionData {
  name: string;
  description?: string;
  category_id: string;
  product_type?: ProductType;
  product_visibility?: ProductVisibility;
  pricing_mode: PricingMode;
  price?: number;
  cost_price?: number;
  pricing_tiers?: PricingTier[];
  pricing_template_id?: string;
  image_urls?: string[];
  custom_fields?: CustomFields;
  initial_quantity?: number;
}
