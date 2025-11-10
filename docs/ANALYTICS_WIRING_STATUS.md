# Analytics System - Wiring Status

## Problem Identified
The analytics endpoints were querying from **empty cache tables** (`analytics_daily_cache`, `analytics_product_cache`, `analytics_employee_cache`) instead of the actual data tables (`orders`, `pos_transactions`, `order_items`).

## Root Causes
1. **Parameter mismatch**: Frontend sending `?range=30d` but backend expecting `time_range`
   - ✅ FIXED in `lib/analytics/query-helpers.ts`

2. **Cache dependency**: Endpoints querying empty cache instead of real data
   - ✅ FIXED: `/api/vendor/analytics/v2/overview/route.ts` - now queries orders + pos_transactions directly
   - ⏳ NEEDS FIX: All other endpoints still query from cache

## What's Working Now
- ✅ Query parameter parsing (`range` parameter now works)
- ✅ Overview endpoint queries real data (orders + POS transactions)
- ✅ Date range calculations
- ✅ Period comparisons

## What Needs to Be Fixed

### Priority 1: Core Report Endpoints (User is seeing "Loading...")
These endpoints need to be updated to query from real tables:

1. **`/api/vendor/analytics/v2/sales/by-day/route.ts`**
   - Currently: Queries `analytics_daily_cache` (empty)
   - Should: Query `orders` + `pos_transactions` grouped by date

2. **`/api/vendor/analytics/v2/sales/by-employee/route.ts`**
   - Currently: Tries cache first, has fallback
   - Check: Verify fallback is working correctly

3. **`/api/vendor/analytics/v2/sales/by-location/route.ts`**
   - Currently: Queries cache
   - Should: Query orders + POS transactions grouped by location

4. **`/api/vendor/analytics/v2/products/performance/route.ts`**
   - Currently: Queries `analytics_product_cache`
   - Should: Query `order_items` grouped by product

5. **`/api/vendor/analytics/v2/sales/by-category/route.ts`**
   - Currently: Queries cache
   - Should: Query order_items joined with products/categories

6. **`/api/vendor/analytics/v2/sales/by-payment-method/route.ts`**
   - Currently: Queries cache
   - Should: Query orders + POS transactions grouped by payment_method

### Priority 2: Financial Reports

7. **`/api/vendor/analytics/v2/financial/profit-loss/route.ts`**
   - Status: Check if querying real data

8. **`/api/vendor/analytics/v2/financial/tax-report/route.ts`**
   - Status: Check if querying real data

### Priority 3: Detailed Reports

9. **`/api/vendor/analytics/v2/sales/itemized/route.ts`**
   - Should: Query orders with order_items directly

10. **`/api/vendor/analytics/v2/sessions/summary/route.ts`**
    - Should: Query pos_sessions table directly

## Quick Fix Strategy

For each endpoint, replace:
```typescript
// OLD (querying cache)
const cacheData = await getDailyCacheData(vendorId, dateRange, filters);
if (!cacheData || cacheData.length === 0) {
  return empty response
}
```

With:
```typescript
// NEW (querying real data)
let ordersQuery = supabase
  .from("orders")
  .select("*")
  .eq("vendor_id", vendorId)
  .gte("order_date", dateRange.start_date)
  .lte("order_date", dateRange.end_date)
  .in("status", ["completed", "processing"]);

// Apply filters...
// Get data...
// Aggregate/group as needed...
// Return formatted response...
```

## Data Available
- ✅ 79 orders with dates from Nov 2-3, 2025
- ✅ 30 POS transactions
- ✅ 88 order items
- ✅ All have vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'

## Next Steps
1. Fix `sales/by-day` endpoint (Priority 1 - showing in UI)
2. Fix `sales/by-employee` endpoint (Priority 1 - showing in UI)
3. Test the UI to see data loading
4. Fix remaining endpoints one by one
5. Optionally: Build cache population script for optimization later

## Cache Tables (Optional Future Enhancement)
The analytics cache tables exist for performance optimization but are NOT required for the system to work. Once all endpoints are querying real data successfully, we can optionally populate the cache via:
- Background job
- Trigger on insert/update
- Manual cache refresh API endpoint

**For now: Skip the cache, query real data directly.**
