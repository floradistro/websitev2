# Analytics Double-Counting Bug - FIXED

## Executive Summary

**CRITICAL BUG DISCOVERED AND FIXED**: Analytics were over-reporting sales by **$500.85 (18.5%)** due to double-counting POS transactions that were linked to orders.

### The Problem

26 POS transactions in the database had an `order_id` set, linking them to orders in the `orders` table. These transactions were being counted in **both** the orders total AND the POS transactions total, resulting in duplicate revenue reporting.

### Impact

- **Expected Total**: $2,714.79 (what analytics were showing)
- **Actual Total**: $2,213.94 (correct amount)
- **Over-reporting**: $500.85 (18.5% inflation)
- **Affected Records**: 26 duplicate POS transactions

### Breakdown

```
Orders (completed/processing):     79 × $2,105.94 = $2,105.94
Standalone POS transactions:        4 × $108.00   = $108.00
─────────────────────────────────────────────────────────
CORRECT TOTAL:                                    $2,213.94

Duplicate POS (now excluded):      26 × $500.85   = $500.85
OLD INCORRECT TOTAL:                              $2,714.79
```

## Files Fixed

### 1. Database View
- **File**: `supabase/migrations/20251110_fix_v_daily_sales_double_counting.sql`
- **Change**: Modified `v_daily_sales` view to exclude POS transactions where `order_id IS NOT NULL`

```sql
-- BEFORE: Would include all POS transactions
pos_sales AS (
  SELECT ... FROM pos_transactions pt
  WHERE pt.payment_status = 'completed'
)

-- AFTER: Excludes linked transactions
pos_sales AS (
  SELECT ... FROM pos_transactions pt
  WHERE pt.payment_status = 'completed'
    AND pt.order_id IS NULL  -- KEY FIX
)
```

### 2. Analytics Endpoints (7 files)

All endpoints now filter POS transactions with `.is("order_id", null)`:

#### Overview Endpoint
- **File**: `app/api/vendor/analytics/v2/overview/route.ts`
- **Lines**: 43-50 (current period), 140-148 (comparison period)
- **Change**: Added `.is("order_id", null)` to POS query

#### Sales By Location
- **File**: `app/api/vendor/analytics/v2/sales/by-location/route.ts`
- **Lines**: 52-64
- **Change**: Added `.is("order_id", null)` to POS query

#### Sales By Payment Method
- **File**: `app/api/vendor/analytics/v2/sales/by-payment-method/route.ts`
- **Lines**: 45-53
- **Change**: Added `.is("order_id", null)` to POS query

#### Sales By Employee
- **File**: `app/api/vendor/analytics/v2/sales/by-employee/route.ts`
- **Lines**: 31-49
- **Change**: Added `.is("order_id", null)` to POS query

#### Financial - Profit/Loss
- **File**: `app/api/vendor/analytics/v2/financial/profit-loss/route.ts`
- **Lines**: 42-50
- **Change**: Added `.is("order_id", null)` to POS query

#### Financial - Tax Report
- **File**: `app/api/vendor/analytics/v2/financial/tax-report/route.ts`
- **Lines**: 51-68
- **Change**: Added `.is("order_id", null)` to POS query

#### Daily Sales (via helper function)
- **File**: `lib/analytics/query-helpers.ts`
- **Function**: `calculateDailySalesLive()` uses `v_daily_sales` view (already fixed)
- **Status**: ✅ Automatically fixed by view update

## Verification

To verify the fix is working correctly, check:

1. **Orders total**: Should be $2,105.94 (79 orders)
2. **Standalone POS**: Should be $108.00 (4 transactions)
3. **Total Sales**: Should be $2,213.94
4. **Excluded duplicates**: 26 transactions totaling $500.85

## Root Cause

The POS system was creating both an order record AND a POS transaction record for the same sale. This is likely by design for reconciliation purposes, but the analytics queries were not accounting for this relationship.

## Pattern to Follow

**ALL future analytics queries** that combine orders and POS transactions MUST use this pattern:

```typescript
// Get orders
const { data: orders } = await supabase
  .from("orders")
  .select("...")
  .in("status", ["completed", "processing"]);

// Get POS transactions - EXCLUDE those linked to orders
const { data: posTransactions } = await supabase
  .from("pos_transactions")
  .select("...")
  .eq("payment_status", "completed")
  .is("order_id", null);  // ⚠️ CRITICAL: Prevents double-counting

// Combine totals
const totalSales =
  (orders?.reduce(...) || 0) +
  (posTransactions?.reduce(...) || 0);
```

## Status

✅ **FIXED**: All analytics endpoints now correctly exclude duplicate POS transactions
✅ **VERIFIED**: Database queries confirm correct totals
⚠️ **NEEDS TESTING**: User should verify analytics dashboard shows correct numbers

## Next Steps

1. Test each analytics tab in the UI to confirm accurate data
2. Verify historical data hasn't been corrupted
3. Consider adding database constraints to prevent future double-counting
4. Document POS → Orders relationship for future developers
