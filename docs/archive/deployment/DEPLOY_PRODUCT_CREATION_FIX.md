# 🔧 Deploy Atomic Product Creation Fix

## Issue

Product creation has multiple atomicity issues that can leave the database in an inconsistent state:

1. **Product created, inventory not created** (HIGH SEVERITY)
   - If primary location missing, product exists but has no inventory
   - Silent warning only, creation continues
   - Result: Products with stock_quantity but no fulfillable inventory

2. **Inventory created, stock_movement not created** (HIGH SEVERITY)
   - Audit trail incomplete
   - No error handling if stock_movements insert fails

3. **Variable product created without variants** (MEDIUM SEVERITY)
   - Product type = "variable" but no variants exist
   - Product unfulfillable

## Fix

Migration file: `supabase/migrations/20251114000002_atomic_product_creation.sql`

**Creates:** `atomic_create_product(vendor_id, product_data, initial_stock, variants)` RPC function

**What it does:**
1. ✅ Validates primary location exists BEFORE creating product
2. ✅ Validates variants exist for variable products
3. ✅ Creates product record
4. ✅ Creates inventory record at primary location (if stock > 0)
5. ✅ Creates stock movement audit trail
6. ✅ Creates all variants (for variable products)
7. ✅ **ALL in a single transaction** - automatic rollback if ANY step fails

## Deployment Steps

### Option 1: Using Web Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new

2. Copy the ENTIRE contents of:
   ```
   supabase/migrations/20251114000002_atomic_product_creation.sql
   ```

3. Paste into SQL Editor

4. Click "Run"

5. Verify success: Should see "Success. No rows returned"

### Option 2: Using Custom CLI

```bash
npm run db:migrate 20251114000002_atomic_product_creation.sql
```

## Verification

After deployment, run this query to verify:

```sql
SELECT proname, pg_get_function_identity_arguments(oid) as signature
FROM pg_proc
WHERE proname = 'atomic_create_product';
```

Should return:
```
proname                 | signature
-----------------------|----------------------------------------------------------
atomic_create_product  | p_vendor_id uuid, p_product_data jsonb, p_initial_stock numeric, p_variants jsonb
```

## Usage Example

```typescript
// Create a simple product with inventory
const { data, error } = await supabase.rpc('atomic_create_product', {
  p_vendor_id: vendorId,
  p_product_data: {
    name: 'Blue Dream',
    slug: 'blue-dream',
    description: 'Premium sativa-dominant hybrid',
    sku: 'BD-001',
    regular_price: 45.00,
    product_type: 'simple',
    primary_category_id: categoryId,
    status: 'published',
    custom_fields: {
      strain_type: 'sativa-dominant',
      thc_content: '22%'
    }
  },
  p_initial_stock: 100, // grams
  p_variants: null // simple product
});

// Result:
// {
//   success: true,
//   product_id: '...',
//   product_name: 'Blue Dream',
//   product_type: 'simple',
//   initial_stock: 100,
//   inventory_created: true,
//   inventory_id: '...',
//   location_id: '...',
//   location_name: 'Charlotte Central',
//   variants_created: 0
// }
```

```typescript
// Create a variable product with variants
const { data, error } = await supabase.rpc('atomic_create_product', {
  p_vendor_id: vendorId,
  p_product_data: {
    name: 'Pre-Roll Pack',
    slug: 'pre-roll-pack',
    sku: 'PR-PACK',
    product_type: 'variable',
    primary_category_id: categoryId,
    status: 'published'
  },
  p_initial_stock: 0, // Variable products use variant stock
  p_variants: [
    {
      name: '3-Pack',
      sku: 'PR-PACK-3',
      regular_price: 25.00,
      stock_quantity: 50,
      attributes: { count: 3 }
    },
    {
      name: '6-Pack',
      sku: 'PR-PACK-6',
      regular_price: 45.00,
      stock_quantity: 30,
      attributes: { count: 6 }
    }
  ]
});

// Result:
// {
//   success: true,
//   product_id: '...',
//   product_type: 'variable',
//   variants_created: 2,
//   variant_ids: ['...', '...']
// }
```

## What This Fixes

**Before:**
- ❌ Product created without inventory (silent failure)
- ❌ Inventory created without audit trail
- ❌ Variable products created without variants
- ❌ Partial failures leave database inconsistent

**After:**
- ✅ BLOCKS creation if no primary location exists
- ✅ BLOCKS variable product without variants
- ✅ ALL records created in single transaction
- ✅ Automatic rollback on ANY failure
- ✅ Complete audit trail for compliance
- ✅ Detailed success result with all IDs

## Error Handling

The function will raise exceptions (and rollback) if:

1. **No primary location:** `"No primary location found for vendor"`
2. **Variable product without variants:** `"Variable products require at least one variant"`
3. **Any database constraint violation:** Automatic rollback
4. **Any other error:** `"Product creation failed: <error message>"`

## Impact

This is a **P1 bug fix** because:
- Affects new product creation (frequent operation)
- Can leave orphaned products (data inconsistency)
- Inventory discrepancies cause fulfillment issues
- Missing audit trails violate compliance requirements

## Next Steps After Deployment

1. **Update product creation API** (`app/api/vendor/products/route.ts`)
   - Replace current multi-step creation with atomic RPC call
   - Add error handling for the new exception types

2. **Test with real scenarios:**
   - Simple product with stock
   - Simple product without stock
   - Variable product with variants
   - Edge case: vendor with no primary location

3. **Monitor logs** for any issues after deployment

---

**Status:** Ready to deploy
**Risk:** Low - New function, doesn't change existing behavior until API is updated
**Time:** ~2 minutes
**Breaking Changes:** None (new function, backward compatible)
