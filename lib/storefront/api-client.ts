import { logger } from "@/lib/logger";

/**
 * WhaleTools API Client for Vendor Storefronts
 *
 * This client allows vendor storefronts (deployed on their own domains)
 * to fetch their product data from the WhaleTools API.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_WHALETOOLS_API_URL || "https://whaletools.dev/api";
const VENDOR_ID = process.env.NEXT_PUBLIC_WHALETOOLS_VENDOR_ID;

if (!VENDOR_ID && typeof window !== "undefined") {
  if (process.env.NODE_ENV === "development") {
    logger.warn("⚠️  NEXT_PUBLIC_WHALETOOLS_VENDOR_ID is not set. API calls may fail.");
  }
}

/**
 * Build API URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(endpoint, API_BASE_URL);

  // Always add vendor ID if available
  if (VENDOR_ID) {
    url.searchParams.set("vendorId", VENDOR_ID);
  }

  // Add additional params
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildUrl(endpoint);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error(`Failed to fetch ${endpoint}:`, error);
    }
    throw error;
  }
}

/**
 * API Client Methods
 */
export const whaletoolsAPI = {
  /**
   * Get all products for the vendor
   */
  async getProducts() {
    return fetchAPI("/page-data/products");
  },

  /**
   * Get a single product by slug
   */
  async getProduct(slug: string) {
    return fetchAPI(`/page-data/products/${slug}`);
  },

  /**
   * Get vendor information
   */
  async getVendorInfo() {
    if (!VENDOR_ID) {
      throw new Error("Vendor ID not configured");
    }
    return fetchAPI(`/vendors/${VENDOR_ID}`);
  },

  /**
   * Search products
   */
  async searchProducts(query: string) {
    return fetchAPI("/page-data/products", {
      method: "GET",
    });
  },
};

/**
 * Helper to check if API is properly configured
 */
export function isAPIConfigured(): boolean {
  return Boolean(VENDOR_ID && API_BASE_URL);
}

/**
 * Get configuration info for debugging
 */
export function getAPIConfig() {
  return {
    apiUrl: API_BASE_URL,
    vendorId: VENDOR_ID,
    isConfigured: isAPIConfigured(),
  };
}
