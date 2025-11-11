# Query Optimization Guide

## Overview

This guide documents query optimization strategies and recommended database indexes for WhaleTools.

**Current Status:**
- ✅ Parallel query execution implemented
- ✅ LRU caching in place
- ✅ Smart query patterns
- ⚠️ Database indexes need verification

---

## Recommended Database Indexes

### Critical Indexes (High Impact)

These indexes should be created in Supabase for optimal performance:

```sql
-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON products(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_vendor_created ON products(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_primary_category ON products(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Inventory table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_id ON inventory(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_product ON inventory(vendor_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(vendor_id)
  WHERE CAST(quantity AS NUMERIC) <= CAST(low_stock_threshold AS NUMERIC);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_created ON order_items(vendor_id, created_at DESC);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Media table indexes
CREATE INDEX IF NOT EXISTS idx_media_vendor_id ON media(vendor_id);
CREATE INDEX IF NOT EXISTS idx_media_product_id ON media(product_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Locations table indexes
CREATE INDEX IF NOT EXISTS idx_locations_vendor_id ON locations(vendor_id);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON users(vendor_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

### Performance Impact

| Index | Expected Improvement | Use Case |
|-------|---------------------|----------|
| `idx_products_vendor_status` | 70-90% faster | Dashboard queries, product listings |
| `idx_order_items_vendor_created` | 60-80% faster | Sales analytics, recent orders |
| `idx_inventory_low_stock` | 80-95% faster | Low stock alerts (partial index) |
| `idx_products_name_trgm` | 90%+ faster | Product search (trigram index) |
| `idx_products_vendor_created` | 70-85% faster | Recent products, dashboard |

---

## Query Optimization Patterns

### 1. Use Parallel Queries

**Bad:**
```typescript
const products = await supabase.from('products').select('*');
const inventory = await supabase.from('inventory').select('*');
const orders = await supabase.from('orders').select('*');
// Total time: ~900ms (300ms each)
```

**Good:**
```typescript
const [products, inventory, orders] = await Promise.all([
  supabase.from('products').select('*'),
  supabase.from('inventory').select('*'),
  supabase.from('orders').select('*'),
]);
// Total time: ~300ms (parallel execution)
```

### 2. Select Only Required Fields

**Bad:**
```typescript
const products = await supabase
  .from('products')
  .select('*')  // Fetches ALL columns
  .eq('vendor_id', vendorId);
```

**Good:**
```typescript
const products = await supabase
  .from('products')
  .select('id, name, price, status')  // Only what you need
  .eq('vendor_id', vendorId);
```

### 3. Use Joins Instead of Multiple Queries

**Bad (N+1 Query):**
```typescript
const products = await supabase.from('products').select('*');
for (const product of products) {
  const category = await supabase
    .from('categories')
    .select('*')
    .eq('id', product.category_id)
    .single();
}
// Makes N+1 database calls
```

**Good (Single Query with Join):**
```typescript
const products = await supabase
  .from('products')
  .select(`
    *,
    category:categories(id, name, slug)
  `)
  .eq('vendor_id', vendorId);
// Single database call
```

### 4. Use Caching for Repeated Queries

**Implementation:**
```typescript
import { vendorCache, generateCacheKey } from '@/lib/cache-manager';

const cacheKey = generateCacheKey('vendor-products', { vendorId });
const cached = vendorCache.get(cacheKey);
if (cached) {
  return cached;
}

const data = await fetchFromDatabase();
vendorCache.set(cacheKey, data);
return data;
```

### 5. Limit Result Sets

**Bad:**
```typescript
const products = await supabase
  .from('products')
  .select('*')
  .eq('vendor_id', vendorId);
// Could return 10,000+ products
```

**Good:**
```typescript
const products = await supabase
  .from('products')
  .select('*')
  .eq('vendor_id', vendorId)
  .limit(50)
  .order('created_at', { ascending: false });
// Returns only 50 most recent
```

### 6. Use Partial Indexes for Common Filters

**Example:**
```sql
-- Index only for active products
CREATE INDEX idx_products_active ON products(vendor_id, status)
  WHERE status = 'published';

-- Index only for low stock items
CREATE INDEX idx_inventory_low_stock ON inventory(vendor_id)
  WHERE CAST(quantity AS NUMERIC) <= CAST(low_stock_threshold AS NUMERIC);
```

### 7. Use COUNT Efficiently

**Bad:**
```typescript
const { data } = await supabase.from('products').select('*');
const count = data.length;
// Fetches all rows just to count
```

**Good:**
```typescript
const { count } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true })
  .eq('vendor_id', vendorId);
// Only counts, no data transfer
```

---

## Identifying Slow Queries

### Using Supabase Dashboard

1. Go to **Supabase Dashboard** → **Database** → **Query Performance**
2. Look for queries with:
   - High execution time (>100ms)
   - High call count
   - Sequential scans instead of index scans

### Query Performance Metrics

Monitor these in production:

```typescript
const startTime = performance.now();
const data = await query();
const duration = performance.now() - startTime;

if (duration > 100) {
  logger.warn('Slow query detected', {
    duration: `${duration.toFixed(2)}ms`,
    query: 'description',
  });
}
```

---

## Common Anti-Patterns to Avoid

### 1. ❌ Fetching All Rows Without Limit

```typescript
// BAD - No limit
const products = await supabase.from('products').select('*');

// GOOD - With limit
const products = await supabase.from('products').select('*').limit(100);
```

### 2. ❌ N+1 Query Pattern

```typescript
// BAD - Multiple queries in a loop
for (const product of products) {
  const inventory = await supabase
    .from('inventory')
    .select('*')
    .eq('product_id', product.id);
}

// GOOD - Single query with join
const products = await supabase
  .from('products')
  .select(`*, inventory(*)`);
```

### 3. ❌ Not Using Indexes

```typescript
// BAD - Full table scan
WHERE lower(email) = 'user@example.com'

// GOOD - Uses index
WHERE email = 'user@example.com'
```

### 4. ❌ SELECT * in Production

```typescript
// BAD - Fetches everything
.select('*')

// GOOD - Only what you need
.select('id, name, price, status')
```

### 5. ❌ Not Caching Repeated Queries

```typescript
// BAD - Hits database every time
const dashboard = await getDashboardData();

// GOOD - Uses cache
const cached = cache.get('dashboard');
if (cached) return cached;
const dashboard = await getDashboardData();
cache.set('dashboard', dashboard);
```

---

## Optimization Checklist

- [ ] **Indexes Created**: All critical indexes from above created in Supabase
- [ ] **Query Profiling**: Slow queries identified using Supabase dashboard
- [ ] **Parallel Execution**: All independent queries run in parallel
- [ ] **Selective Columns**: Only required columns selected
- [ ] **Result Limits**: All queries have reasonable limits
- [ ] **Caching**: Frequently-accessed data is cached
- [ ] **Join Optimization**: Related data fetched in single queries
- [ ] **Monitoring**: Query performance tracked in production

---

## Testing Query Performance

### Script to Test Query Speed

```bash
# Run the query performance test
npm run test:query-performance
```

### Expected Benchmarks

| Query Type | Before Optimization | After Optimization | Target |
|------------|--------------------|--------------------|--------|
| Dashboard load | ~800ms | ~200ms | <300ms |
| Product list | ~500ms | ~100ms | <150ms |
| Analytics query | ~1200ms | ~300ms | <400ms |
| Search query | ~600ms | ~150ms | <200ms |

---

## Monitoring in Production

### Performance Headers

All optimized queries include performance headers:

```typescript
return NextResponse.json(data, {
  headers: {
    'X-Response-Time': `${duration.toFixed(2)}ms`,
    'X-Cache-Hit': cached ? 'true' : 'false',
  },
});
```

### Logging Slow Queries

```typescript
if (duration > 100) {
  logger.warn('Slow query detected', {
    endpoint: request.url,
    duration: `${duration}ms`,
    vendorId,
  });
}
```

---

## Next Steps

1. **Create Indexes**: Run the SQL script above in Supabase SQL Editor
2. **Verify Indexes**: Check that indexes are created with `\di` in psql
3. **Profile Queries**: Use Supabase Query Performance dashboard
4. **Monitor Production**: Watch for slow query warnings in logs
5. **Iterate**: Continuously optimize based on real-world usage

---

**Last Updated:** November 10, 2025
**Phase:** 2.5.1 - Query Optimization
