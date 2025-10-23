# 🧪 STOREFRONT PRICING - MANUAL TEST

## Open This in Your Browser:

http://localhost:3000/test-storefront/shop

## Steps to Verify:

### 1. Hard Refresh
Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+F5** (Windows) to clear cache

### 2. What You Should See:

**Products with pricing tiers will show:**
```
┌─────────────────────────────┐
│ [Product Image]             │
│                             │
│ PRODUCT NAME                │
│ $15 - $200                 │
│ • In Stock                  │
│                             │
│ [Select Quantity ▼]        │  ← THIS DROPDOWN
│  1 gram - $14.99           │
│  7g (Quarter) - $69.99     │
│  14g (Half Oz) - $109.99   │
│  28g (Ounce) - $199.99     │
│                             │
│ [Add to Cart]              │
└─────────────────────────────┘
```

### 3. Expected Results:
- **83 products** should have "Select Quantity" dropdowns
- **92 products** will show "$35" or "Contact for Pricing" (no tiers configured yet)

### 4. If You DON'T See Dropdowns:

#### Check Console:
1. Press **F12** (DevTools)
2. Go to **Console** tab
3. Look for errors (red text)
4. Look for these logs:
   - "Shop Client - Products with pricing tiers: 83"
   - "Product XXX has 4 pricing tiers"

#### Clear All Caches:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

#### Try Incognito:
1. Open incognito/private window
2. Go to http://localhost:3000/test-storefront/shop
3. Check if pricing shows there

---

## Current Status (Verified via API):

```json
{
  "total_flora_products": 175,
  "products_with_pricing": 175,
  "sample": "Tiger Runtz has 4 tiers"
}
```

All 175 Flora products have pricing data in the API ✅

---

## If Still Not Showing:

Take a screenshot and share what you see, or tell me:
1. Do you see product cards?
2. Do you see "Select Quantity" text anywhere?
3. What does the price show? ($15-$200 or Contact for Pricing?)
4. Any errors in browser console?

