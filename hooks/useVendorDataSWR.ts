/**
 * SWR-based Vendor Data Hooks
 * Replaces direct API calls with cached, deduplicated requests
 * Prevents the duplicate API call issue seen in logs
 */

import useSWR from 'swr';
import { vendorFetcher, defaultSWRConfig, realtimeConfig } from '@/lib/swr-config';

/**
 * Fetch vendor dashboard data
 * Deduplicates the multiple dashboard API calls
 */
export function useVendorDashboardSWR() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/page-data/vendor-dashboard',
    vendorFetcher,
    {
      ...defaultSWRConfig,
      dedupingInterval: 10000, // Dashboard refreshes every 10s max
    }
  );

  return {
    data: data || null,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Fetch vendor products (full data)
 * Prevents the 6+ duplicate calls seen in logs
 */
export function useVendorProductsSWR() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/vendor/products/full',
    vendorFetcher,
    {
      ...defaultSWRConfig,
      dedupingInterval: 15000, // Products change less frequently
    }
  );

  return {
    products: data?.products || [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Fetch vendor profit stats
 * Deduplicates the 3+ calls seen in logs
 */
export function useVendorProfitStatsSWR() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/vendor/profit-stats',
    vendorFetcher,
    defaultSWRConfig
  );

  return {
    stats: data?.stats || null,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Fetch vendor inventory (real-time)
 * Uses shorter cache for live stock updates
 */
export function useVendorInventorySWR() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/vendor/inventory',
    vendorFetcher,
    realtimeConfig // ✅ Auto-refresh every 10s for inventory
  );

  return {
    inventory: data?.inventory || [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Fetch vendor analytics
 */
export function useVendorAnalyticsSWR(timeRange: string = '30d') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/vendor/analytics/overview?range=${timeRange}`,
    vendorFetcher,
    defaultSWRConfig
  );

  return {
    data: data || null,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Fetch single product details
 */
export function useVendorProductSWR(productId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/api/vendor/products/${productId}` : null,
    vendorFetcher,
    defaultSWRConfig
  );

  return {
    product: data?.product || null,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Fetch vendor locations
 */
export function useVendorLocationsSWR() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/vendor/locations',
    vendorFetcher,
    defaultSWRConfig
  );

  return {
    locations: data?.locations || [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Preload data for faster navigation
 */
export function prefetchVendorDataSWR(endpoint: string) {
  // SWR automatically caches, so just trigger a fetch
  fetch(endpoint, {
    headers: {
      'x-vendor-id': localStorage.getItem('vendor_id') || '',
    },
  }).catch(() => {
    // Silent fail for prefetch
  });
}

