import { unstable_cache } from 'next/cache';
import * as wordpress from './wordpress';

// Cache durations (in seconds)
const CACHE_TIMES = {
  PRODUCTS: 900, // 15 minutes - balanced between freshness and performance
  PRODUCT: 900, // 15 minutes
  LOCATIONS: 1800, // 30 minutes - locations don't change often
  INVENTORY: 600, // 10 minutes - inventory needs more frequent updates
  PRICING: 1800, // 30 minutes - pricing is relatively stable
  BULK: 900, // 15 minutes - for bulk endpoints
};

// Cached product fetching
export const getCachedProducts = unstable_cache(
  async (params?: any) => {
    return wordpress.getProducts(params);
  },
  ['products'],
  { revalidate: CACHE_TIMES.PRODUCTS }
);

export const getCachedAllProducts = unstable_cache(
  async () => {
    return wordpress.getAllProducts();
  },
  ['all-products'],
  { revalidate: CACHE_TIMES.PRODUCTS }
);

export const getCachedProduct = unstable_cache(
  async (id: string | number) => {
    return wordpress.getProduct(id);
  },
  ['product'],
  { revalidate: CACHE_TIMES.PRODUCT }
);

export const getCachedLocations = unstable_cache(
  async () => {
    return wordpress.getLocations();
  },
  ['locations'],
  { revalidate: CACHE_TIMES.LOCATIONS }
);

export const getCachedAllInventory = unstable_cache(
  async () => {
    return wordpress.getAllInventory();
  },
  ['all-inventory'],
  { revalidate: CACHE_TIMES.INVENTORY }
);

export const getCachedProductInventory = unstable_cache(
  async (productId: string | number) => {
    return wordpress.getProductInventory(productId);
  },
  ['product-inventory'],
  { revalidate: CACHE_TIMES.INVENTORY }
);

// V3 Native Fields - no more global pricing rules
// Pricing is now stored per-product in _product_price_tiers meta

export const getCachedProductFields = unstable_cache(
  async (productId: string | number) => {
    return wordpress.getProductFieldsV3(productId);
  },
  ['product-fields'],
  { revalidate: CACHE_TIMES.PRODUCT }
);

export const getCachedProductReviews = unstable_cache(
  async (productId: string | number) => {
    return wordpress.getProductReviews(productId);
  },
  ['product-reviews'],
  { revalidate: CACHE_TIMES.PRODUCT }
);

// OPTIMIZED: Use bulk endpoint - returns product with inventory and fields in ONE call
export const getCachedBulkProduct = unstable_cache(
  async (productId: string | number) => {
    return wordpress.getBulkProduct(productId);
  },
  ['bulk-product'],
  { revalidate: CACHE_TIMES.BULK }
);

// OPTIMIZED: Use bulk products endpoint - returns all products with inventory and fields
export const getCachedBulkProducts = unstable_cache(
  async (params?: any) => {
    return wordpress.getBulkProducts(params);
  },
  ['bulk-products'],
  { revalidate: CACHE_TIMES.BULK }
);

// OPTIMIZED: Hybrid approach - use regular endpoints with caching for single products
export async function getBulkProductData(productId: string | number) {
  // Fetch all data in parallel using cached functions
  const [product, locations, inventory, productFields, reviews] = await Promise.all([
    getCachedProduct(productId),
    getCachedLocations(),
    getCachedProductInventory(productId),
    getCachedProductFields(productId),
    getCachedProductReviews(productId),
  ]);

  return {
    product,
    locations,
    inventory,
    productFields,
    reviews,
  };
}

// Client-side cache helper for prefetching
export function prefetchProductData(productId: string | number) {
  // This will be called on hover to prefetch data
  return getBulkProductData(productId);
}

