/**
 * Centralized vendor data fetching with caching
 * Eliminates duplicate API calls across pages
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAppAuth } from '@/context/AppAuthContext';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache with size limit
const MAX_CACHE_SIZE = 50; // Limit cache to 50 entries
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Ongoing requests to prevent duplicate fetches
const pendingRequests = new Map<string, Promise<any>>();

// Cache cleanup - evict oldest entries when cache is full
function evictOldestCacheEntries() {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Sort by timestamp and remove oldest 25%
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = Math.floor(MAX_CACHE_SIZE * 0.25);

    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

// Periodic cache cleanup - remove expired entries
let cleanupInterval: NodeJS.Timeout | null = null;

function startCacheCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }
  }, 60 * 1000); // Run every minute
}

function stopCacheCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Start cleanup when module loads
if (typeof window !== 'undefined') {
  startCacheCleanup();

  // Cleanup on unmount (page unload)
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      stopCacheCleanup();
      cache.clear();
      pendingRequests.clear();
    });
  }
}

export function useVendorData<T>(
  endpoint: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    cacheTime?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  } = {}
) {
  const {
    enabled = true,
    refetchInterval,
    cacheTime = CACHE_TTL,
    onSuccess,
    onError,
  } = options;

  const { vendor, isAuthenticated } = useAppAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const vendorId = vendor?.id;

    if (!vendorId || !isAuthenticated) {
      // Normal during initial load - skip silently
      setLoading(false);
      return;
    }
    
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cacheKey = `${endpoint}:${vendorId}`;

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data);
        setLoading(false);
        onSuccess?.(cached.data);
        return cached.data;
      }
    }

    // Check if request is already in flight
    if (pendingRequests.has(cacheKey)) {
      try {
        const result = await pendingRequests.get(cacheKey);
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        setError(err as Error);
        setLoading(false);
        onError?.(err);
        return;
      }
    }

    // Make new request
    setLoading(true);
    setError(null);

    const requestPromise = axios.get(endpoint, {
      headers: { 'x-vendor-id': vendorId }
    }).then(response => {
      // Handle different response structures
      let result;
      if (response.data.success !== false) {
        // Check if data is nested under data property
        if (response.data.data !== undefined) {
          result = response.data.data;
        } else if (response.data.success === true && response.data.data) {
          result = response.data.data;
        } else {
          result = response.data;
        }
        
        // Evict old entries before adding new one
        evictOldestCacheEntries();

        // Cache the result
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        setData(result);
        onSuccess?.(result);
        return result;
      } else {
        throw new Error(response.data.error || 'Failed to fetch data');
      }
    }).catch(err => {
      console.error(`API Error fetching ${endpoint}:`, err);
      setError(err);
      onError?.(err);
      throw err;
    }).finally(() => {
      setLoading(false);
      pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, requestPromise);
    
    try {
      return await requestPromise;
    } catch (err) {
      // Error already handled above
    }
  }, [endpoint, enabled, cacheTime, onSuccess, onError, vendor, isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const mutate = useCallback((updater: (prev: T | null) => T | null) => {
    setData(prev => {
      const updated = updater(prev);
      
      // Update cache
      if (updated) {
        const vendorId = localStorage.getItem('vendor_id');
        if (vendorId) {
          const cacheKey = `${endpoint}:${vendorId}`;
          cache.set(cacheKey, {
            data: updated,
            timestamp: Date.now()
          });
        }
      }
      
      return updated;
    });
  }, [endpoint]);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
  };
}

// Specific hooks for common vendor data
export function useVendorDashboard() {
  return useVendorData<any>('/api/page-data/vendor-dashboard', {
    cacheTime: 30 * 1000, // 30 seconds - matches server cache
  });
}

export function useVendorProducts() {
  return useVendorData('/api/page-data/vendor-products', {
    cacheTime: 60 * 1000, // 60 seconds - matches server cache
  });
}

export function useVendorInventory() {
  return useVendorData('/api/page-data/vendor-inventory', {
    cacheTime: 30 * 1000, // 30 seconds - matches server cache
  });
}

export function useVendorAnalytics(range: string = '30d') {
  return useVendorData(`/api/vendor/analytics?range=${range}`, {
    cacheTime: 2 * 60 * 1000, // 2 minutes for analytics
  });
}

// Utility to clear cache
export function clearVendorCache(endpoint?: string) {
  if (endpoint) {
    const vendorId = localStorage.getItem('vendor_id');
    if (vendorId) {
      cache.delete(`${endpoint}:${vendorId}`);
    }
  } else {
    cache.clear();
  }
}

// Utility to prefetch data
export async function prefetchVendorData(endpoint: string) {
  const vendorId = localStorage.getItem('vendor_id');
  if (!vendorId) return;

  const cacheKey = `${endpoint}:${vendorId}`;
  
  // Don't prefetch if already cached
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return;
  }

  try {
    const response = await axios.get(endpoint, {
      headers: { 'x-vendor-id': vendorId }
    });
    
    if (response.data.success !== false) {
      const result = response.data.data || response.data;
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
  } catch (err) {
    console.error('Prefetch error:', err);
  }
}

