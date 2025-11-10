import { logger } from "@/lib/logger";

/**
 * Supabase API Client
 * SECURITY: All fetch calls include credentials to send HTTP-only cookies
 */

// Determine base URL for API calls
function getBaseUrl() {
  // Browser
  if (typeof window !== "undefined") return "";

  // Vercel production
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // Vercel preview
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;

  // Local development
  return "http://localhost:3000";
}

const BASE_URL = getBaseUrl();

/**
 * Wrapper for fetch that includes credentials (HTTP-only cookies)
 * SECURITY FIX: All API calls now include credentials to send auth cookies
 */
async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include", // Include HTTP-only cookies
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

// ============================================================================
// PRODUCTS
// ============================================================================

export async function getProducts(params?: {
  page?: number;
  per_page?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  on_sale?: boolean;
  min_price?: number;
  max_price?: number;
  orderby?: string;
  order?: string;
}) {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const response = await apiFetch(`${BASE_URL}/api/supabase/products?${queryParams}`);
  return response.json();
}

export async function getProduct(id: string) {
  try {
    const response = await apiFetch(`${BASE_URL}/api/page-data/product/${id}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (process.env.NODE_ENV === "development") {
        logger.error(`Product API returned ${response.status} for ${id}`);
      }
      return { success: false, product: null };
    }

    const data = await response.json();
    return data.success ? data.data : { success: false, product: null };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error(`Error fetching product ${id}:`, error);
    }
    return { success: false, product: null };
  }
}

export async function getCategories() {
  const response = await apiFetch(`${BASE_URL}/api/supabase/categories`);
  const data = await response.json();
  return data.categories || [];
}

// ============================================================================
// CUSTOMERS
// ============================================================================

export async function getCustomer(id: string) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/customers/${id}`);
  return response.json();
}

export async function updateCustomer(id: string, data: any) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

// ============================================================================
// ORDERS
// ============================================================================

export async function getCustomerOrders(customerId: string) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/orders?customer_id=${customerId}`);
  const data = await response.json();
  return data.orders || [];
}

export async function getOrder(id: string) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/orders/${id}`);
  return response.json();
}

export async function createOrder(orderData: any) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  return response.json();
}

// ============================================================================
// INVENTORY
// ============================================================================

export async function getProductInventory(productId: number) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/inventory?product_id=${productId}`);
  const data = await response.json();
  return data.inventory || [];
}

export async function getLocations() {
  const response = await apiFetch(`${BASE_URL}/api/supabase/locations`);
  const data = await response.json();
  return data.locations || [];
}

// ============================================================================
// REVIEWS
// ============================================================================

export async function getProductReviews(productId: string) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/reviews?product_id=${productId}`);
  const data = await response.json();
  return data.reviews || [];
}

export async function createReview(reviewData: any) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewData),
  });
  return response.json();
}

// ============================================================================
// COUPONS
// ============================================================================

export async function validateCoupon(code: string, cartTotal: number, customerId?: string) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/coupons/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      cart_total: cartTotal,
      customer_id: customerId,
    }),
  });
  return response.json();
}

// ============================================================================
// VENDORS
// ============================================================================

export async function getVendors() {
  const response = await apiFetch(`${BASE_URL}/api/admin/vendors`);
  const data = await response.json();
  return data.vendors || [];
}

export async function getVendorBySlug(slug: string) {
  const response = await apiFetch(`${BASE_URL}/api/admin/vendors`);
  const data = await response.json();
  const vendors = data.vendors || [];
  return vendors.find((v: any) => v.slug === slug);
}

export async function getVendorProducts(vendorSlug: string) {
  // Get vendor first
  const vendor = await getVendorBySlug(vendorSlug);
  if (!vendor) return [];

  // Get vendor's products
  const response = await apiFetch(`${BASE_URL}/api/supabase/products?vendor_id=${vendor.id}`);
  const data = await response.json();
  return data.products || [];
}

// ============================================================================
// VENDOR OPERATIONS
// ============================================================================

export async function getVendorPayouts(vendorId?: string) {
  const headers: any = {};
  if (vendorId) {
    headers["x-vendor-id"] = vendorId;
  }

  const response = await apiFetch(`${BASE_URL}/api/supabase/vendor/payouts`, {
    headers,
  });
  const data = await response.json();
  return data.payouts || [];
}

export async function getVendorAnalytics(vendorId: string, days: number = 30) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/vendor/analytics?days=${days}`, {
    headers: { "x-vendor-id": vendorId },
  });
  return response.json();
}

export async function getVendorBranding(vendorId: string) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/vendor/branding`, {
    headers: { "x-vendor-id": vendorId },
  });
  return response.json();
}

export async function updateVendorBranding(vendorId: string, brandingData: any) {
  const response = await apiFetch(`${BASE_URL}/api/supabase/vendor/branding`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-vendor-id": vendorId,
    },
    body: JSON.stringify(brandingData),
  });
  return response.json();
}
