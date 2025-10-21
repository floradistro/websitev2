/**
 * Request Deduplication
 * Prevents duplicate API calls within a short time window
 */

interface CacheEntry {
  promise: Promise<any>;
  timestamp: number;
}

const requestCache = new Map<string, CacheEntry>();
const DEDUP_WINDOW = 2000; // 2 seconds

/**
 * Deduplicate requests by key
 * If same request is made within window, return cached promise
 */
export function dedupRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = requestCache.get(key);
  
  // Return cached promise if within dedup window
  if (cached && now - cached.timestamp < DEDUP_WINDOW) {
    return cached.promise;
  }
  
  // Create new request
  const promise = fetcher();
  requestCache.set(key, { promise, timestamp: now });
  
  // Clean up after promise resolves
  promise.finally(() => {
    setTimeout(() => {
      const entry = requestCache.get(key);
      if (entry && entry.timestamp === now) {
        requestCache.delete(key);
      }
    }, DEDUP_WINDOW);
  });
  
  return promise;
}

/**
 * Clear all cached requests
 */
export function clearRequestCache() {
  requestCache.clear();
}

/**
 * Clear specific request from cache
 */
export function clearRequest(key: string) {
  requestCache.delete(key);
}

