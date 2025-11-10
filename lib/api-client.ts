/**
 * Optimized API Client with built-in caching and error handling
 * Prevents crashes and memory leaks
 */

import useSWR from "swr";
import { cacheKeys } from "./cache-config";

const BASE_URL = typeof window !== "undefined" ? "" : "http://localhost:3000";

// Optimized fetcher with timeout and error handling
async function fetcher(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: "include", // SECURITY FIX: Include HTTP-only cookies
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      throw error;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Products
export function useProducts(params?: any) {
  const queryParams = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/api/bulk/products?${queryParams}`;

  return useSWR(cacheKeys.products(params), () => fetcher(url), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    keepPreviousData: true,
  });
}

export function useProduct(id: string | null) {
  const url = id ? `${BASE_URL}/api/supabase/products/${id}` : null;

  return useSWR(id ? cacheKeys.product(id) : null, () => fetcher(url!), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}

// Categories
export function useCategories() {
  return useSWR(cacheKeys.categories(), () => fetcher(`${BASE_URL}/api/bulk/categories`), {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
    keepPreviousData: true,
  });
}

// Vendors
export function useVendors() {
  return useSWR(cacheKeys.vendors(), () => fetcher(`${BASE_URL}/api/admin/vendors`), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });
}

export function useVendor(slug: string | null) {
  return useSWR(
    slug ? cacheKeys.vendor(slug) : null,
    async () => {
      const data = await fetcher(`${BASE_URL}/api/admin/vendors`);
      return data.vendors?.find((v: any) => v.slug === slug);
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );
}

// Inventory
export function useInventory(productId: number | null) {
  return useSWR(
    productId ? cacheKeys.inventory(productId) : null,
    () => fetcher(`${BASE_URL}/api/supabase/inventory?product_id=${productId}`),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      keepPreviousData: true,
    },
  );
}

export function useBulkInventory(productIds: number[]) {
  return useSWR(
    productIds.length > 0 ? ["bulk-inventory", ...productIds] : null,
    () =>
      fetcher(`${BASE_URL}/api/bulk/inventory`, {
        method: "POST",
        body: JSON.stringify({ product_ids: productIds }),
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      keepPreviousData: true,
    },
  );
}

// Locations
export function useLocations() {
  return useSWR(cacheKeys.locations(), () => fetcher(`${BASE_URL}/api/supabase/locations`), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });
}

// Orders
export function useOrders(customerId?: string) {
  return useSWR(
    cacheKeys.orders(customerId),
    () =>
      fetcher(`${BASE_URL}/api/supabase/orders${customerId ? `?customer_id=${customerId}` : ""}`),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );
}

export function useOrder(id: string | null) {
  return useSWR(
    id ? cacheKeys.order(id) : null,
    () => fetcher(`${BASE_URL}/api/supabase/orders/${id}`),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );
}

// Reviews
export function useReviews(productId: string | null) {
  return useSWR(
    productId ? cacheKeys.reviews(productId) : null,
    () => fetcher(`${BASE_URL}/api/supabase/reviews?product_id=${productId}`),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    },
  );
}

// Customer
export function useCustomer(id: string | null) {
  return useSWR(
    id ? cacheKeys.customer(id) : null,
    () => fetcher(`${BASE_URL}/api/supabase/customers/${id}`),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );
}

// Mutation helpers
export async function createOrder(orderData: any) {
  return fetcher(`${BASE_URL}/api/supabase/orders`, {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export async function updateCustomer(id: string, data: any) {
  return fetcher(`${BASE_URL}/api/supabase/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function createReview(reviewData: any) {
  return fetcher(`${BASE_URL}/api/supabase/reviews`, {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
}

export async function validateCoupon(code: string, cartTotal: number, customerId?: string) {
  return fetcher(`${BASE_URL}/api/supabase/coupons/validate`, {
    method: "POST",
    body: JSON.stringify({
      code,
      cart_total: cartTotal,
      customer_id: customerId,
    }),
  });
}
