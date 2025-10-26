/**
 * SWR Configuration
 * Prevents duplicate API calls and provides automatic caching
 */

import useSWR, { SWRConfiguration } from 'swr';

// Default fetcher for all SWR hooks
export const fetcher = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  
  if (!res.ok) {
    const error = new Error('API request failed');
    (error as any).status = res.status;
    (error as any).info = await res.json();
    throw error;
  }
  
  return res.json();
};

// Vendor-specific fetcher (adds vendor ID header)
export const vendorFetcher = async (url: string) => {
  const vendorId = typeof window !== 'undefined' ? localStorage.getItem('vendor_id') : null;
  
  const res = await fetch(url, {
    headers: vendorId ? { 'x-vendor-id': vendorId } : {},
  });
  
  if (!res.ok) {
    const error = new Error('API request failed');
    (error as any).status = res.status;
    (error as any).info = await res.json();
    throw error;
  }
  
  return res.json();
};

// Default SWR config for all hooks
export const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,         // Don't refetch on window focus
  revalidateOnReconnect: false,     // Don't refetch on reconnect
  dedupingInterval: 5000,           // Dedupe requests within 5 seconds
  errorRetryCount: 3,               // Retry failed requests 3 times
  errorRetryInterval: 1000,         // Wait 1s between retries
  shouldRetryOnError: true,
  loadingTimeout: 3000,
  focusThrottleInterval: 5000,
};

// Aggressive caching for static data (vendor info, categories)
export const staticDataConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  revalidateOnMount: false,         // Don't refetch on mount if cached
  dedupingInterval: 60000,          // Dedupe for 60 seconds
  revalidateIfStale: false,         // Don't revalidate stale data automatically
};

// Real-time data config (inventory, orders)
export const realtimeConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  refreshInterval: 10000,           // Refresh every 10 seconds
  dedupingInterval: 2000,           // Shorter deduping for real-time
};

