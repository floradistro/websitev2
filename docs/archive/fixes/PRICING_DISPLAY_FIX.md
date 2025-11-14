# Pricing Display Fix - ID vs Label Mismatch

## Issue Summary
Flower and Edibles products weren't showing ANY prices on the TV display menus, even though the products had valid pricing data.

## Root Cause
There was a **mismatch between tier IDs and tier labels** in the pricing filtering logic:

### In the Database (Menu Config):
```json
{
  "categoryPricingConfig": {
    "Flower": {
      "selected": ["3.5g (Eighth)", "28g (Ounce)"]  // ← LABELS
    },
    "Edibles": {
      "selected": ["1 unit", "2 units"]  // ← LABELS
    }
  }
}
```

### In Products (Pricing Data):
```json
{
  "pricing_data": {
    "tiers": [
      {
        "id": "3_5g",  // ← TIER ID
        "label": "3.5g (Eighth)",  // ← TIER LABEL
        "price": 34.99
      }
    ]
  }
}
```

### The Problem:
All display components were filtering like this:
```typescript
// ❌ WRONG - Checking tier ID against labels
.filter((tierId) => visiblePriceBreaks.includes(tierId))
//  "3_5g" is never in ["3.5g (Eighth)", "28g (Ounce)"]
//  Result: ALL prices filtered out → NO PRICES SHOWN
```

## How Prices Were Supposed to Work

1. **Menu Configuration**: Admin selects which price tiers to show in menu editor
   - Menu editor displays friendly labels: "3.5g (Eighth)", "1 unit", etc.
   - These labels are stored in `config_data.categoryPricingConfig[category].selected`

2. **TV Display Fetches Products**: API transforms `pricing_data` into `pricing_tiers`
   - Keys are tier IDs: `"3_5g"`, `"1"`, `"2"`, etc.
   - Values contain labels, prices, quantities

3. **Display Components Filter Tiers**: Should show only selected tiers
   - Gets `visiblePriceBreaks` array from menu config (contains labels)
   - Iterates through `pricing_tiers` (keys are IDs)
   - **MISMATCH**: Comparing IDs to labels → Nothing matches → No prices!

## Files Fixed

### 1. `/components/tv-display/SubcategoryGroup.tsx`
**Lines 70-97**: Changed pricing tier filtering logic
- **Before**: Only checked if tier ID was in `visiblePriceBreaks`
- **After**: Checks if EITHER tier ID OR tier label is in `visiblePriceBreaks`

```typescript
// OLD
.filter(([breakId, breakData]) => {
  return visiblePriceBreaks.includes(breakId);  // ❌ Only IDs
})

// NEW
.filter((priceInfo) => {
  return (
    visiblePriceBreaks.includes(priceInfo.breakId) ||  // ✅ IDs
    visiblePriceBreaks.includes(priceInfo.label)       // ✅ Labels
  );
})
```

### 2. `/components/tv-display/MinimalProductCard.tsx`
**Lines 68-120**: Same fix for grid view cards
- Also updated sorting logic to check both ID and label indices

### 3. `/components/tv-display/ListProductCard.tsx`
**Lines 32-80**: Same fix for list view cards
- Maintains consistent pricing display across all layout modes

### 4. `/components/tv-display/CompactListProductCard.tsx`
**Lines 32-80**: Same fix for compact list cards
- Ensures compact mode shows prices too

## Changes Summary

All four components now:
1. **Map first** to calculate tier labels
2. **Filter** by checking BOTH tier ID and tier label
3. **Sort** by checking BOTH tier ID and tier label indices

This makes the filtering **backwards compatible**:
- ✅ Works with old configs using tier IDs
- ✅ Works with new configs using tier labels
- ✅ Handles mixed scenarios gracefully

## Testing Recommendations

### Test Menu Configurations:

1. **Menu with labels** (current configs):
   ```json
   "selected": ["3.5g (Eighth)", "28g (Ounce)"]
   ```
   - Should show prices ✅

2. **Menu with IDs** (legacy):
   ```json
   "selected": ["3_5g", "28g"]
   ```
   - Should show prices ✅

3. **Menu with mixed** (edge case):
   ```json
   "selected": ["3_5g", "28g (Ounce)"]
   ```
   - Should show both prices ✅

4. **Empty array** (show all):
   ```json
   "selected": []
   ```
   - Should show all enabled tiers ✅

### Categories to Test:
- ✅ Flower: Check gram-based pricing (1 gram, 3.5g, 7g, 14g, 28g)
- ✅ Edibles: Check unit-based pricing (1 unit, 2 units, 3 units)
- ✅ Vape: Check cart-based pricing (1 cart, 2 carts, 3 carts)
- ✅ Beverages: Check unit-based pricing for subcategories
- ✅ Concentrates: Check gram-based pricing

## Related Issues Fixed
- **Mixed pricing tiers**: Fixed in PRICING_TIER_FIX.md
- **Duplicate categories**: Fixed duplicate "Vape/vape" entries
- **White Truffle data error**: Removed cart pricing from Flower product

## Date
2025-01-12

## Status
✅ **FIXED** - All pricing display components now check both IDs and labels
