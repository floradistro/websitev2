# Cursor-Based Pagination Migration Guide

**Status**: Ready for Implementation
**Priority**: Medium
**Impact**: Performance improvement for large datasets

---

## Why Cursor-Based Pagination?

### Problems with Offset-Based Pagination

```typescript
// ❌ Offset-based (current)
.range(offset, offset + limit - 1)
```

**Issues:**

1. **Performance degradation** - Slow on large offsets (page 1000+)
2. **Inconsistent results** - If items are added/deleted, users see duplicates or miss items
3. **Database overhead** - Must scan and skip all previous rows

### Benefits of Cursor-Based Pagination

```typescript
// ✅ Cursor-based (new)
.gt('created_at', cursor).limit(20)
```

**Benefits:**

1. **Consistent performance** - Same speed regardless of page depth
2. **Stable results** - No duplicates or missing items
3. **Database efficient** - Uses indexes, no row skipping

---

## Implementation

### 1. Import the Utility

```typescript
import {
  paginateQuery,
  getPaginationParams,
  formatPaginationResponse,
} from "@/lib/cursor-pagination";
```

### 2. Update Endpoint

**Before (Offset-based):**

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const { data, count } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("vendor_id", vendorId)
    .range(offset, offset + limit - 1);

  return NextResponse.json({
    products: data,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}
```

**After (Cursor-based):**

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paginationParams = getPaginationParams(searchParams);

  const result = await paginateQuery(
    supabase.from("products").select("*").eq("vendor_id", vendorId),
    paginationParams,
  );

  return NextResponse.json({
    products: result.data,
    pagination: result.pagination,
  });
}
```

### 3. Update Frontend

**Before:**

```typescript
const response = await fetch(`/api/products?page=2&limit=20`);
```

**After:**

```typescript
const response = await fetch(`/api/products?cursor=${nextCursor}&limit=20`);
```

---

## Endpoints to Migrate

### High Priority (Public-facing, high traffic)

| Endpoint                    | Current Method | Est. Impact |
| --------------------------- | -------------- | ----------- |
| `/api/supabase/products`    | `.range()`     | HIGH        |
| `/api/wholesale/products`   | `.range()`     | MEDIUM      |
| `/api/vendor/products/full` | `.range()`     | HIGH        |

### Medium Priority

| Endpoint                  | Current Method | Est. Impact |
| ------------------------- | -------------- | ----------- |
| `/api/supabase/customers` | `.range()`     | MEDIUM      |
| `/api/supabase/orders`    | `.range()`     | MEDIUM      |
| `/api/vendor/customers`   | `.range()`     | MEDIUM      |
| `/api/vendor/orders`      | `.range()`     | MEDIUM      |

### Low Priority

| Endpoint                      | Current Method | Est. Impact |
| ----------------------------- | -------------- | ----------- |
| `/api/admin/products`         | `.range()`     | LOW         |
| `/api/bulk/products`          | `.range()`     | LOW         |
| `/api/supabase/reviews`       | `.range()`     | LOW         |
| `/api/wholesale/distributors` | `.range()`     | LOW         |

---

## Advanced Usage

### Custom Cursor Field

```typescript
// Use product ID instead of created_at
const result = await paginateQuery(supabase.from("products").select("*"), {
  cursor: nextCursor,
  cursorField: "id",
  limit: 50,
});
```

### Bi-directional Pagination

```typescript
// Next page
const next = await paginateQuery(query, {
  cursor: nextCursor,
  direction: "desc",
});

// Previous page
const prev = await paginateQuery(query, {
  cursor: prevCursor,
  direction: "asc",
});
```

### With Filtering

```typescript
const result = await paginateQuery(
  supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("status", "active")
    .ilike("name", `%${search}%`),
  { cursor, limit: 20 },
);
```

---

## Migration Checklist

For each endpoint:

- [ ] Update endpoint to use `paginateQuery()`
- [ ] Remove `page`, `offset`, `totalPages` logic
- [ ] Return `pagination` object with cursors
- [ ] Update frontend to use `cursor` instead of `page`
- [ ] Test with filters and search
- [ ] Test pagination consistency (add/delete items during pagination)
- [ ] Update API documentation

---

## Testing

### Test Pagination Consistency

```bash
# 1. Fetch page 1
curl '/api/products?limit=10'

# 2. Add new product (would disrupt offset pagination)
curl -X POST '/api/products' -d '{"name":"New Product"}'

# 3. Fetch page 2 with cursor (should work correctly)
curl '/api/products?cursor=xyz&limit=10'

# Result: No duplicates or missing items ✅
```

### Performance Test

```sql
-- Offset pagination (slow on large offsets)
EXPLAIN ANALYZE
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 10000;

-- Cursor pagination (fast regardless of depth)
EXPLAIN ANALYZE
SELECT * FROM products
WHERE created_at < '2024-01-01'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Backward Compatibility

To support both methods during migration:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Support both cursor and page parameters
  if (searchParams.has("cursor")) {
    // New cursor-based pagination
    const result = await paginateQuery(query, getPaginationParams(searchParams));
    return NextResponse.json(formatPaginationResponse(result));
  } else {
    // Legacy offset-based pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    // ... existing offset logic
  }
}
```

---

## Notes

- **Cursor field must be indexed** for performance
- **Cursor field must be unique and sequential** (created_at, id, etc.)
- **No total count** - Cursor pagination doesn't support accurate total counts (by design)
- **Use offset for small datasets** - For < 1000 items, offset is fine and simpler

---

**Next Steps:**

1. Start with `/api/vendor/products/full` (highest impact)
2. Monitor performance improvements
3. Migrate remaining endpoints gradually
4. Update frontend components to use cursors
