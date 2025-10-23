# 🔒 PRICING SYSTEM - BULLETPROOF RULES

## ⚠️ MISSION CRITICAL - DO NOT BREAK THESE RULES

### Rule #1: ONE ProductCard Component
```
✅ USE: components/ProductCard.tsx (ONLY THIS ONE)
❌ NEVER: Create storefront/ProductCard.tsx or duplicates
```

**Why**: Maintaining two components causes inconsistencies. Any bugs fixed in one won't apply to the other.

---

### Rule #2: ONE Data Source
```
✅ USE: /api/page-data/products (ONLY THIS API)
❌ NEVER: Create custom queries or fetch pricing separately
```

**All pages must use**:
- `/app/products/page.tsx` → Uses `/api/page-data/products` ✅
- `/app/test-storefront/shop/page.tsx` → Uses `/api/page-data/products` ✅
- Any new pages → MUST use `/api/page-data/products` ✅

---

### Rule #3: Vendor Pricing Auto-Applies to ALL Products
```
✅ Vendor configures pricing ONCE
✅ System applies to ALL vendor products
❌ NEVER filter by category
❌ NEVER require per-product configuration
```

**How it works**:
1. Flora Distro configures "Retail Flower" pricing in dashboard
2. System fetches `vendor_pricing_configs` WHERE `vendor_id = Flora`
3. Pricing applies to **ALL** Flora products (flower, vapes, edibles - everything)
4. If vendor wants different pricing for edibles, they configure a 2nd blueprint

---

### Rule #4: Pricing Data Flow (Never Change This)
```
Database: vendor_pricing_configs
    ↓
API: /api/page-data/products
    ↓ (fetches vendor_pricing_configs by vendor_id)
    ↓ (adds pricing_tiers to each product)
API Response: products[].pricing_tiers
    ↓
Page Component: Passes to ProductCard
    ↓
ProductCard: Shows "Select Quantity" dropdown
```

**Code Location**:
- Fetch pricing: `app/api/page-data/products/route.ts` lines 90-124
- Apply to products: `app/api/page-data/products/route.ts` line 158
- Display: `components/ProductCard.tsx` lines 500-533

---

### Rule #5: Never Filter Pricing by Category
```
❌ WRONG:
if (product.category === 'flower') {
  pricingTiers = vendorPricingMap.get(vendor_id);
}

✅ CORRECT:
pricingTiers = vendorPricingMap.get(vendor_id) || [];
```

**Why**: Vendors decide which pricing blueprint to use. If they configure "Retail Flower" pricing, it applies to ALL their products. They can create multiple blueprints if needed (one for flower, one for edibles, etc.).

---

### Rule #6: Testing Before ANY Changes
```bash
# Before making changes, run:
curl -s "http://localhost:3000/api/page-data/products" | \
  jq '{total: (.data.products | length), with_pricing: [.data.products[] | select(.pricing_tiers and (.pricing_tiers | length) > 0)] | length}'

# Should return:
# {
#   "total": 175,
#   "with_pricing": 175  ← ALL products
# }
```

---

### Rule #7: Vendor Pricing Config Structure (Never Change)
```typescript
vendor_pricing_configs {
  vendor_id: UUID,              // Which vendor
  blueprint_id: UUID,           // Which pricing template
  pricing_values: {             // Their configured prices
    "1g": { "price": "14.99", "enabled": true },
    "7g": { "price": "69.99", "enabled": true },
    ...
  },
  is_active: boolean
}
```

**Key Points**:
- ONE config per vendor per blueprint
- Vendor can have MULTIPLE configs (one for flower, one for edibles)
- Config applies to ALL vendor products
- No per-product overrides needed (keeps it simple)

---

### Rule #8: API Query Pattern (Do Not Change)
```typescript
// Step 1: Fetch vendor_pricing_configs (ALL active configs)
const configs = await supabase
  .from('vendor_pricing_configs')
  .select('vendor_id, pricing_values, blueprint:pricing_tier_blueprints(...)')
  .eq('is_active', true);

// Step 2: Build vendor pricing map
const vendorPricingMap = new Map();
configs.forEach(config => {
  const tiers = buildTiersFromConfig(config);
  vendorPricingMap.set(config.vendor_id, tiers);
});

// Step 3: Apply to products
products.map(p => ({
  ...p,
  pricing_tiers: vendorPricingMap.get(p.vendor_id) || []
}));
```

---

### Rule #9: Error Handling (Always Return Data)
```typescript
// ✅ CORRECT: Never throw, always return empty array
if (configError) {
  console.error('Pricing config error:', configError);
  // Continue anyway - return empty tiers
}

// ❌ WRONG: Don't throw errors that break the page
if (configError) throw configError; // NO!
```

---

### Rule #10: Cache Management
```typescript
// API responses cached for 3 minutes
headers: {
  'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=60'
}

// Server components revalidate every 60 seconds
export const revalidate = 60;
```

---

## 🧪 Automated Test (Run Before ANY Deployment)

```bash
#!/bin/bash
# File: test-pricing-bulletproof.sh

echo "🧪 Bulletproof Pricing Test"
echo ""

# Test 1: API returns data
RESPONSE=$(curl -s "http://localhost:3000/api/page-data/products")
SUCCESS=$(echo $RESPONSE | jq -r '.success')
TOTAL=$(echo $RESPONSE | jq '.data.products | length')

if [ "$SUCCESS" = "true" ] && [ "$TOTAL" -gt "0" ]; then
  echo "✅ Test 1: API working ($TOTAL products)"
else
  echo "❌ Test 1: API FAILED"
  exit 1
fi

# Test 2: Flora products have pricing
FLORA_WITH_PRICING=$(echo $RESPONSE | jq '[.data.products[] | select(.vendor_id == "cd2e1122-d511-4edb-be5d-98ef274b4baf" and .pricing_tiers and (.pricing_tiers | length) > 0)] | length')

if [ "$FLORA_WITH_PRICING" -gt "80" ]; then
  echo "✅ Test 2: Flora pricing working ($FLORA_WITH_PRICING products)"
else
  echo "❌ Test 2: Flora pricing BROKEN (only $FLORA_WITH_PRICING products)"
  exit 1
fi

# Test 3: Pricing has correct structure
FIRST_TIER=$(echo $RESPONSE | jq -r '.data.products[0].pricing_tiers[0].price // empty')

if [ ! -z "$FIRST_TIER" ]; then
  echo "✅ Test 3: Pricing structure correct"
else
  echo "❌ Test 3: Pricing structure BROKEN"
  exit 1
fi

echo ""
echo "🎉 ALL TESTS PASSED - Pricing system is bulletproof!"
```

---

## 🚨 What Went Wrong Today (Lessons Learned)

### Issue #1: Duplicate Components
- Created `components/storefront/ProductCard.tsx` (duplicate)
- Main `components/ProductCard.tsx` was different
- **Fix**: Deleted duplicate, use ONE component everywhere

### Issue #2: Category Filtering
- Added logic: "Only apply pricing to flower products"
- Broke everything because category joins failed
- **Fix**: Vendor pricing applies to ALL their products (vendor decides what to configure)

### Issue #3: Different Data Fetching
- Storefront was making 100+ individual API calls
- Main site used bulk API
- **Fix**: Both use same `/api/page-data/products` endpoint

---

## 🔧 How to Add New Features Safely

### Want to add category-specific pricing?
1. ✅ Let vendors create MULTIPLE pricing configs
2. ✅ Vendor dashboard shows: "Configure pricing for Flower", "Configure pricing for Edibles"
3. ✅ System matches blueprint to product category
4. ❌ DON'T filter in the API - handle it in vendor config

### Want to add tier-based pricing (distributor/wholesale)?
1. ✅ Add new blueprints (already done: "Distributor Bulk", "Wholesale Tiered")
2. ✅ Vendors configure each blueprint they want to use
3. ✅ System shows appropriate pricing based on user's tier level
4. ❌ DON'T change core pricing fetch logic

### Want to add per-product price overrides?
1. ✅ Use `product_pricing_assignments` table (already exists)
2. ✅ Override specific tiers for specific products
3. ✅ Falls back to vendor config if no override
4. ❌ DON'T make this the primary method

---

## 📋 Pre-Deployment Checklist

Before deploying ANY changes:

- [ ] Run: `curl http://localhost:3000/api/page-data/products | jq '.success'`
- [ ] Verify: Returns `true`
- [ ] Run: `node test-pricing-bulletproof.js` (when created)
- [ ] Check: http://localhost:3000/products (main site)
- [ ] Check: http://localhost:3000/test-storefront/shop (storefront)
- [ ] Verify: Both show "Select Quantity" dropdowns
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Check DevTools Console for errors

---

## 🎯 Summary

**Golden Rules**:
1. ONE ProductCard component (`components/ProductCard.tsx`)
2. ONE API endpoint (`/api/page-data/products`)
3. Vendor pricing auto-applies to ALL their products
4. No category filtering at API level
5. Always return data (never throw errors)

**Files That Should NEVER Be Duplicated**:
- `components/ProductCard.tsx`
- `components/PricingTiers.tsx`
- `app/api/page-data/products/route.ts`

**Files Safe to Customize**:
- Individual page layouts
- Styling/CSS
- Vendor dashboard features
- Admin features

---

**If something breaks**: Check if we violated any of the 10 rules above. 99% of pricing bugs come from violating these rules.

