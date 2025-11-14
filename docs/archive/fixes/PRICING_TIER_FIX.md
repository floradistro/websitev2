# Pricing Tier Data Quality Fix

## Issue Summary
The menu editor was showing mixed pricing tiers for categories - specifically, the "Flower" category displayed both gram-based tiers (1 gram, 3.5g, etc.) AND cart-based tiers (1 cart, 2 carts, 3 carts) which belong to Vape products.

## Root Cause
A Flower product named **"White Truffle"** was incorrectly configured with cart-based pricing tiers in its `meta_data.pricing_tiers` field. Since the `/api/vendor/category-pricing-tiers` endpoint aggregates ALL pricing tiers from ALL products in a category, this single misconfigured product polluted the entire Flower category's available pricing tiers.

## Investigation Process

### 1. Database Analysis
Queried the tv_menus table and found Menu 3 (Flower) had mixed pricing tiers:
```json
{
  "Flower": {
    "available": [
      "1 cart",        // ← Vape tier (incorrect)
      "1 gram",        // ← Flower tier (correct)
      "14g (Half Oz)", // ← Flower tier (correct)
      "2 carts",       // ← Vape tier (incorrect)
      "28g (Ounce)",   // ← Flower tier (correct)
      "3 carts",       // ← Vape tier (incorrect)
      "3.5g (Eighth)", // ← Flower tier (correct)
      "7g (Quarter)"   // ← Flower tier (correct)
    ]
  }
}
```

### 2. Product Data Analysis
Found the culprit product:
- **Product**: White Truffle
- **Category**: Flower (correct)
- **Pricing**: Cart-based (incorrect - should be gram-based)
- **Description**: "Bulk imported product: White Truffle"

White Truffle is a legitimate cannabis flower strain but had vape-style pricing tiers.

### 3. Data Quality Audit
Ran comprehensive audit across all products:
```sql
-- Before fix:
Flower category:
- 37 products with gram-based pricing (correct)
- 41 products with empty pricing (will use blueprints)
- 1 product with cart-based pricing (WHITE TRUFFLE - incorrect)

-- After fix:
Flower category:
- 37 products with gram-based pricing (correct)
- 42 products with empty pricing (will use blueprints)
- 0 products with cart-based pricing ✓
```

## Fixes Applied

### Fix 1: Cleared Incorrect Product Pricing
```sql
UPDATE products
SET meta_data = jsonb_set(
  COALESCE(meta_data, '{}'::jsonb),
  '{pricing_tiers}',
  '[]'::jsonb
)
WHERE name = 'White Truffle'
AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
```
**Result**: White Truffle will now use the category's default pricing blueprint.

### Fix 2: Updated Menu Configuration
```sql
UPDATE tv_menus
SET config_data = jsonb_set(
  config_data,
  '{categoryPricingConfig,Flower,available}',
  '["1 gram", "3.5g (Eighth)", "7g (Quarter)", "14g (Half Oz)", "28g (Ounce)"]'::jsonb
)
WHERE name = '3'
AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
```
**Result**: Menu 3 now shows only proper Flower pricing tiers.

## Verification

### Final Pricing Tiers by Category
✅ **Flower**: 1 gram, 3.5g (Eighth), 7g (Quarter), 14g (Half Oz), 28g (Ounce)
✅ **Vape**: 1 cart, 2 carts, 3 carts
✅ **Concentrates**: gram-based (1g, 2g, 3g, 3.5g, 7g)
✅ **Edibles**: unit-based (1 unit, 2 units, 3 units)

## Prevention Recommendations

### 1. Add Data Validation
Consider adding validation when pricing tiers are assigned to products:
- Flower/Concentrates should use gram-based pricing
- Vape should use cart-based pricing
- Edibles should use unit-based pricing
- Beverages should use unit-based pricing

### 2. Bulk Import Safeguards
The "Bulk imported product" note suggests this data came from a bulk import operation. Add validation during import to ensure:
- Pricing tiers match the target category
- Alert user if pricing pattern doesn't match category type

### 3. API Enhancement (Optional)
Consider adding a filter in the category-pricing-tiers API to exclude obviously mismatched pricing tiers based on category type. However, the current approach (fixing the source data) is cleaner.

## Related Files
- `/app/api/vendor/category-pricing-tiers/route.ts` - Aggregates pricing tiers by category
- `/components/tv-menus/MenuEditorModal.tsx` - Displays pricing tier selection
- `/app/tv-display/page.tsx` - Renders products with selected pricing
- `/components/tv-display/SubcategoryGroup.tsx` - Displays pricing headers

## Date
2025-01-12

## Status
✅ **FIXED** - All Flower products now have correct pricing tiers
