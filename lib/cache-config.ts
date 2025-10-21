/**
 * Centralized caching configuration for SWR
 * Prevents unnecessary refetches and memory leaks
 */

export const swrConfig = {
  // Revalidation settings
  revalidateOnFocus: false, // Don't refetch when window regains focus (prevents crashes on tab switch)
  revalidateOnReconnect: true, // Refetch when reconnecting
  revalidateIfStale: true,
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  
  // Cache settings
  focusThrottleInterval: 60000, // Throttle focus revalidation to 1 minute
  errorRetryInterval: 5000,
  errorRetryCount: 3,
  
  // Performance settings
  shouldRetryOnError: true,
  suspense: false,
  
  // Keep data fresh but don't overload
  refreshInterval: 0, // Disable automatic polling (prevents memory leaks)
  refreshWhenHidden: false, // Don't refresh when tab is hidden
  refreshWhenOffline: false, // Don't try to refresh when offline
  
  // Cache timeout
  loadingTimeout: 3000,
  
  // Provider value for global state
  provider: () => new Map(),
  
  // Keep previous data while revalidating
  keepPreviousData: true,
  
  onError: (error: Error) => {
    console.error('SWR Error:', error);
    // Don't crash the app on fetch errors
  },
  
  onErrorRetry: (error: Error, key: string, config: any, revalidate: any, { retryCount }: any) => {
    // Never retry on 404
    if (error.message.includes('404')) return;
    
    // Only retry up to 3 times
    if (retryCount >= 3) return;
    
    // Retry after 5 seconds
    setTimeout(() => revalidate({ retryCount }), 5000);
  }
};

// Cache keys for consistent invalidation
export const cacheKeys = {
  products: (params?: any) => ['products', params],
  product: (id: string) => ['product', id],
  categories: () => ['categories'],
  vendors: () => ['vendors'],
  vendor: (slug: string) => ['vendor', slug],
  vendorProducts: (slug: string) => ['vendor-products', slug],
  inventory: (productId: number) => ['inventory', productId],
  locations: () => ['locations'],
  orders: (customerId?: string) => ['orders', customerId],
  order: (id: string) => ['order', id],
  reviews: (productId: string) => ['reviews', productId],
  customer: (id: string) => ['customer', id],
};

