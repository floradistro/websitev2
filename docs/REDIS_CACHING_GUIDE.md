# Redis Caching Implementation Guide

This guide explains how to use the Redis caching layer to improve performance across the application.

## Overview

The caching layer provides:

- ✅ Type-safe caching functions
- ✅ Automatic invalidation patterns
- ✅ Graceful degradation (cache failures don't break functionality)
- ✅ Integrated monitoring via Sentry
- ✅ Multiple TTL strategies

## Basic Usage

### 1. Simple Cache Get/Set

```typescript
import { cacheGet, cacheSet, CacheTTL, buildCacheKey, CachePrefix } from "@/lib/redis";

// Get from cache
const product = await cacheGet<Product>(buildCacheKey(CachePrefix.PRODUCT, productId));

// Set in cache
await cacheSet(buildCacheKey(CachePrefix.PRODUCT, productId), productData, CacheTTL.LONG);
```

### 2. Cache-Aside Pattern (Recommended)

```typescript
import { cacheGetOrSet, CacheTTL, buildCacheKey, CachePrefix } from "@/lib/redis";

// Automatically handles cache miss and refetch
const products = await cacheGetOrSet(
  buildCacheKey(CachePrefix.PRODUCTS_LIST, vendorId, category),
  async () => {
    // This function only runs on cache miss
    const { data } = await supabase.from("products").select("*").eq("vendor_id", vendorId);
    return data;
  },
  CacheTTL.MEDIUM, // 5 minutes
);
```

## TTL Strategy

Choose the appropriate TTL based on data volatility:

```typescript
CacheTTL.SHORT; // 1 minute  - Real-time data (inventory counts)
CacheTTL.MEDIUM; // 5 minutes - Frequently accessed (product lists)
CacheTTL.LONG; // 15 minutes - Stable data (product details)
CacheTTL.HOUR; // 1 hour - Rarely changing (categories, vendors)
CacheTTL.DAY; // 24 hours - Static data (analytics aggregates)
```

## API Route Examples

### Example 1: Products List Endpoint

**Before (No Caching):**

```typescript
// app/api/vendor/products/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendor_id");

  const { data, error } = await supabase.from("products").select("*").eq("vendor_id", vendorId);

  return NextResponse.json({ products: data });
}
```

**After (With Caching):**

```typescript
// app/api/vendor/products/route.ts
import { cacheGetOrSet, CacheTTL, buildCacheKey, CachePrefix } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendor_id");

  // Cache key includes vendor_id to scope cache
  const cacheKey = buildCacheKey(CachePrefix.PRODUCTS_LIST, vendorId);

  const products = await cacheGetOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase.from("products").select("*").eq("vendor_id", vendorId);

      if (error) throw error;
      return data;
    },
    CacheTTL.MEDIUM, // 5 minutes
  );

  return NextResponse.json({ products });
}
```

### Example 2: Single Product Detail

```typescript
// app/api/product/[id]/route.ts
import { cacheGetOrSet, CacheTTL, buildCacheKey, CachePrefix } from "@/lib/redis";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const cacheKey = buildCacheKey(CachePrefix.PRODUCT, params.id);

  const product = await cacheGetOrSet(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, vendor:vendors(*), category:categories(*)")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      return data;
    },
    CacheTTL.LONG, // 15 minutes - product details change less frequently
  );

  return NextResponse.json({ product });
}
```

### Example 3: Analytics Dashboard

```typescript
// app/api/vendor/analytics/route.ts
import { cacheGetOrSet, CacheTTL, buildCacheKey, CachePrefix } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const vendorId = await getVendorId(request);
  const cacheKey = buildCacheKey(CachePrefix.ANALYTICS, vendorId, "overview");

  const stats = await cacheGetOrSet(
    cacheKey,
    async () => {
      // Expensive aggregation queries
      const [revenue, orders, topProducts] = await Promise.all([
        calculateRevenue(vendorId),
        countOrders(vendorId),
        getTopProducts(vendorId),
      ]);

      return { revenue, orders, topProducts };
    },
    CacheTTL.HOUR, // Analytics can be cached for 1 hour
  );

  return NextResponse.json(stats);
}
```

## Cache Invalidation

Always invalidate cache when data changes!

### Example 4: Product Update with Cache Invalidation

```typescript
// app/api/vendor/products/[id]/route.ts
import { CacheInvalidation } from "@/lib/redis";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  // Update in database
  const { data, error } = await supabase
    .from("products")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) throw error;

  // Invalidate caches
  await CacheInvalidation.product(params.id);
  await CacheInvalidation.products(data.vendor_id);

  return NextResponse.json({ product: data });
}
```

### Example 5: Bulk Operations

```typescript
// app/api/vendor/products/bulk/route.ts
export async function POST(request: NextRequest) {
  const { products } = await request.json();
  const vendorId = await getVendorId(request);

  // Bulk insert
  const { data, error } = await supabase.from("products").insert(products).select();

  if (error) throw error;

  // Invalidate all product caches for this vendor
  await CacheInvalidation.products(vendorId);

  return NextResponse.json({ products: data });
}
```

## Cache Key Patterns

Use consistent patterns for easy invalidation:

```typescript
// Good - Hierarchical keys
product: abc123;
products: list: vendor: xyz: category: flower;
analytics: vendor: xyz: overview;

// Bad - Flat keys (hard to invalidate)
abc123;
products_xyz;
vendor_analytics_xyz;
```

## High-Priority Endpoints to Cache

Based on traffic analysis, prioritize these endpoints:

### Tier 1: Highest Traffic (Cache immediately)

1. `/api/vendor/products/route.ts` - Product listings
2. `/api/product/[id]/route.ts` - Product details
3. `/api/vendors/route.ts` - Vendor directory
4. `/api/categories/route.ts` - Category tree

### Tier 2: Expensive Operations

1. `/api/vendor/analytics/*` - All analytics endpoints
2. `/api/vendor/dashboard/route.ts` - Dashboard stats
3. `/api/admin/dashboard-stats/route.ts` - Admin dashboard
4. `/api/tv-display/products/route.ts` - TV display (high read)

### Tier 3: Medium Priority

1. `/api/vendor/inventory/route.ts` - Inventory (use SHORT TTL)
2. `/api/supabase/inventory/route.ts` - Public inventory
3. `/api/vendor/orders/route.ts` - Order lists

## Testing Cache

### Test Endpoint

Create a test endpoint to verify caching:

```typescript
// app/api/test-cache/route.ts
import { cacheGetOrSet, CacheTTL, redisHealthCheck } from "@/lib/redis";

export async function GET() {
  const healthy = await redisHealthCheck();

  const testData = await cacheGetOrSet(
    "test:cache:demo",
    async () => {
      return {
        message: "This data was fetched fresh",
        timestamp: new Date().toISOString(),
      };
    },
    60, // 1 minute TTL
  );

  return NextResponse.json({
    redisHealthy: healthy,
    data: testData,
    note: "Refresh within 60s - you should see the same timestamp",
  });
}
```

### Monitor Cache Performance

Check Sentry for cache metrics:

- Cache hit/miss ratio
- Redis connection errors
- Cache invalidation frequency

## Best Practices

### ✅ DO:

- Use `cacheGetOrSet()` for most use cases
- Always invalidate cache on mutations
- Use appropriate TTL for data volatility
- Use hierarchical cache keys
- Log cache operations in development

### ❌ DON'T:

- Cache user-specific data without user ID in key
- Use very long TTLs for frequently changing data
- Throw errors on cache failures (graceful degradation)
- Cache sensitive PII without encryption
- Forget to invalidate related caches

## Performance Impact

Expected improvements after caching implementation:

| Endpoint            | Before | After | Improvement    |
| ------------------- | ------ | ----- | -------------- |
| Product List        | ~200ms | ~20ms | **10x faster** |
| Product Detail      | ~150ms | ~15ms | **10x faster** |
| Analytics Dashboard | ~800ms | ~50ms | **16x faster** |
| Vendor Directory    | ~300ms | ~25ms | **12x faster** |

## Migration Checklist

- [ ] Install `@upstash/redis` ✅ (Already installed)
- [ ] Create `lib/redis.ts` ✅
- [ ] Add Redis health check to `/api/health` endpoint
- [ ] Implement caching in Tier 1 endpoints
- [ ] Implement caching in Tier 2 endpoints
- [ ] Add cache invalidation to mutation endpoints
- [ ] Test cache hit/miss rates
- [ ] Monitor Redis performance in Sentry
- [ ] Document cache keys in API docs
- [ ] Train team on caching patterns

## Next Steps

1. Start with `/api/vendor/products/route.ts` (highest traffic)
2. Add monitoring to track cache effectiveness
3. Gradually roll out to other endpoints
4. Monitor memory usage in Upstash dashboard
5. Adjust TTLs based on real-world usage patterns
