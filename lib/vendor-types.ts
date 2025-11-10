/**
 * Shared TypeScript types for vendor dashboard
 * Import once, use everywhere
 */

export interface VendorUser {
  id: string;
  store_name: string;
  slug: string;
  email: string;
  store_tagline?: string;
  logo_url?: string;
  vendor_type?: "standard" | "distributor" | "both";
  wholesale_enabled?: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost_price?: number;
  description?: string;
  status: "approved" | "pending" | "rejected" | "draft" | "published";
  total_stock: number;
  custom_fields?: any[];
  pricing_tiers?: any[];
  images?: string[];
  featured_image_storage?: string;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  location_id: string;
  location_name: string;
  quantity: number;
  low_stock_threshold?: number;
}

export interface Location {
  id: string;
  name: string;
  is_primary: boolean;
  is_active?: boolean;
}

export interface DashboardStats {
  totalProducts: number;
  approved: number;
  pending: number;
  rejected: number;
  totalSales30d: number;
  lowStock: number;
  sales_30_days?: number;
  pending_review?: number;
  low_stock_items?: number;
}

export interface RecentProduct {
  id: string | number;
  name: string;
  image: string;
  status: "approved" | "pending" | "rejected";
  submittedDate: string;
}

export interface LowStockItem {
  id: string | number;
  name: string;
  currentStock: number;
  threshold: number;
}

export type ProductStatus = "approved" | "pending" | "rejected" | "draft" | "published";
export type StatusVariant = "approved" | "pending" | "rejected" | "draft";
