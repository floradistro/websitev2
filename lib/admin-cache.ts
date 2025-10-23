// Client-side caching for admin pages - instant loading
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const adminCache = {
  get(key: string) {
    const item = cache.get(key);
    if (!item) return null;
    
    const age = Date.now() - item.timestamp;
    if (age > CACHE_DURATION) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  set(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
  },
  
  clear() {
    cache.clear();
  },
  
  invalidate(pattern: string) {
    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  }
};

// Prefetch helper
export async function prefetch(url: string) {
  const cached = adminCache.get(url);
  if (cached) return cached;
  
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    adminCache.set(url, data);
    return data;
  } catch (error) {
    console.error('Prefetch error:', error);
    return null;
  }
}



