/**
 * Type definitions for inventory-related data structures
 */

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductCategoryRelation {
  category: ProductCategory;
}

export interface CustomField {
  field_name: string;
  field_value: string | number | boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: string | number;
  cost_price: string | number | null;
  stock_quantity: number;
  featured_image_storage: string | null;
  description: string | null;
  custom_fields: CustomField[] | null;
  product_categories?: ProductCategoryRelation[];
  primary_category?: ProductCategory | null;
}

export interface Location {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

export interface InventoryRecord {
  id: string;
  product_id: string;
  quantity: number;
  stock_status: string;
  location_id: string;
  location?: Location;
}

export interface InventoryLocationDetail {
  location_id: string;
  location_name: string;
  quantity: number;
  stock_status: string;
}

export interface InventoryItem {
  id: string;
  inventory_id: string | null;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  category_name: string;
  image: string | null;
  price: number;
  cost_price?: number;
  description: string | null;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  stock_status_label: string;
  location_name: string;
  location_id: string | null;
  locations_with_stock: number;
  inventory_locations: InventoryLocationDetail[];
  flora_fields: Record<string, any>;
}

export interface InventoryApiResponse {
  success: true;
  data: {
    products: Product[];
    inventory: InventoryItem[];
    locations: Location[];
  };
  meta: {
    responseTime: string;
    vendorId: string;
    productCount: number;
    inventoryCount: number;
    locationCount: number;
  };
}
