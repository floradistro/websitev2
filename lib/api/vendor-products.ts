/**
 * Typed API Client for Vendor Products
 * Provides type-safe methods for interacting with the product API
 */

import {
  CreateProductRequest,
  UpdateProductRequest,
  BulkProduct,
  AIAutofillRequest,
  BulkAIAutofillRequest,
  ProductStatus,
  ProductType,
} from '@/lib/validations/product';

// API Response types
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  cost_price: number | null;
  regular_price: number;
  status: ProductStatus;
  type: ProductType;
  product_visibility: 'internal' | 'marketplace';
  vendor_id: string;
  primary_category_id: string;
  category?: string;
  total_stock: number;
  stock_quantity: number;
  manage_stock: boolean;
  stock_status: string;
  custom_fields: Record<string, any>;
  featured_image_storage: string | null;
  image_gallery_storage: string[];
  images: string[];
  pricing_tiers?: PricingTier[];
  coas?: COA[];
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  label: string;
  quantity: number;
  unit: string;
  price: number;
  min_quantity: number;
  max_quantity: number | null;
}

export interface COA {
  id: string;
  file_name: string;
  file_url: string;
  lab_name: string | null;
  test_date: string | null;
  batch_number: string | null;
  test_results: any;
  is_verified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  vendor_id?: string;
  field_visibility?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any[];
}

export interface ListProductsResponse extends ApiResponse<Product[]> {
  products: Product[];
  total?: number;
  elapsed_ms?: number;
}

export interface CreateProductResponse extends ApiResponse<Product> {
  product: Product;
  message?: string;
}

export interface UpdateProductResponse extends ApiResponse<Product> {
  product: Product;
}

export interface DeleteProductResponse extends ApiResponse<void> {
  message: string;
}

/**
 * VendorProductsAPI - Type-safe API client for product operations
 */
export class VendorProductsAPI {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(authToken?: string) {
    this.baseUrl = '/api/vendor/products';
    this.headers = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      this.headers['Authorization'] = `Bearer ${authToken}`;
    }
  }

  /**
   * Helper method to handle fetch responses
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  /**
   * List all products for the authenticated vendor
   */
  async listProducts(): Promise<ListProductsResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: this.headers,
      credentials: 'include', // Include HTTP-only cookies
    });

    return this.handleResponse<ListProductsResponse>(response);
  }

  /**
   * List products with full details (optimized endpoint)
   */
  async listProductsFull(): Promise<ListProductsResponse> {
    const response = await fetch(`${this.baseUrl}/full`, {
      method: 'GET',
      headers: this.headers,
      credentials: 'include',
    });

    return this.handleResponse<ListProductsResponse>(response);
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<CreateProductResponse> {
    const response = await fetch(`${this.baseUrl}/${productId}`, {
      method: 'GET',
      headers: this.headers,
      credentials: 'include',
    });

    return this.handleResponse<CreateProductResponse>(response);
  }

  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductRequest): Promise<CreateProductResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      credentials: 'include',
      body: JSON.stringify(productData),
    });

    return this.handleResponse<CreateProductResponse>(response);
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: string,
    productData: UpdateProductRequest
  ): Promise<UpdateProductResponse> {
    const response = await fetch(`${this.baseUrl}/${productId}`, {
      method: 'PUT',
      headers: this.headers,
      credentials: 'include',
      body: JSON.stringify(productData),
    });

    return this.handleResponse<UpdateProductResponse>(response);
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<DeleteProductResponse> {
    const response = await fetch(`${this.baseUrl}/${productId}`, {
      method: 'DELETE',
      headers: this.headers,
      credentials: 'include',
    });

    return this.handleResponse<DeleteProductResponse>(response);
  }

  /**
   * Get all unique custom field names from vendor's products
   */
  async getCustomFields(): Promise<{ success: boolean; customFields: string[] }> {
    const response = await fetch(`${this.baseUrl}/custom-fields`, {
      method: 'GET',
      headers: this.headers,
      credentials: 'include',
    });

    return this.handleResponse<{ success: boolean; customFields: string[] }>(response);
  }

  /**
   * Get categories for vendor
   */
  async getCategories(): Promise<{ success: boolean; categories: string[] }> {
    const response = await fetch(`${this.baseUrl}/categories`, {
      method: 'GET',
      headers: this.headers,
      credentials: 'include',
    });

    return this.handleResponse<{ success: boolean; categories: string[] }>(response);
  }

  /**
   * Bulk create products
   */
  async bulkCreateProducts(products: BulkProduct[]): Promise<{
    success: boolean;
    results: Array<{ success: boolean; product?: Product; error?: string }>;
  }> {
    const results = await Promise.allSettled(
      products.map(product =>
        this.createProduct(product as CreateProductRequest)
      )
    );

    return {
      success: results.every(r => r.status === 'fulfilled'),
      results: results.map(r => {
        if (r.status === 'fulfilled') {
          return { success: true, product: r.value.product };
        }
        return { success: false, error: r.reason.message };
      }),
    };
  }
}

/**
 * Create a singleton instance of the API client
 */
let apiClient: VendorProductsAPI | null = null;

export function getVendorProductsAPI(authToken?: string): VendorProductsAPI {
  if (!apiClient) {
    apiClient = new VendorProductsAPI(authToken);
  }
  return apiClient;
}

/**
 * React hook-friendly API functions
 */
export const vendorProductsAPI = {
  listProducts: () => new VendorProductsAPI().listProducts(),
  listProductsFull: () => new VendorProductsAPI().listProductsFull(),
  getProduct: (id: string) => new VendorProductsAPI().getProduct(id),
  createProduct: (data: CreateProductRequest) => new VendorProductsAPI().createProduct(data),
  updateProduct: (id: string, data: UpdateProductRequest) =>
    new VendorProductsAPI().updateProduct(id, data),
  deleteProduct: (id: string) => new VendorProductsAPI().deleteProduct(id),
  getCustomFields: () => new VendorProductsAPI().getCustomFields(),
  getCategories: () => new VendorProductsAPI().getCategories(),
};
