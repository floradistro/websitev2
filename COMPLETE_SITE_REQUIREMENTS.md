# 🎯 Complete Cannabis Storefront Requirements

## Current Status Analysis (Flora Distro)

### ✅ What's Working
- Header with navigation (Shop, About, Contact)
- Footer with all links (Company, Shop categories, Support, Legal)
- All 13 pages exist with components
- Pure black/white monochrome design
- Consistent spacing and typography
- Products loading on homepage (saw 12 products in console)

### ❌ What's Missing/Broken

## 1. SHOP PAGE - Products Not Showing
**Problem:** Shop page only shows "SHOP" + "Premium cannabis products" text, no product grid
**Expected:** Grid of all products (71 products for Flora Distro)
**Fix Needed:** smart_product_grid on shop page not rendering properly

## 2. HOMEPAGE - Products Not Visible
**Problem:** "FEATURED PRODUCTS" section exists but no grid showing
**Expected:** 8-12 featured products in grid
**Console shows:** Products ARE loading (Private Reserve, Pop Candy, etc images)
**Issue:** Likely rendering but invisible (CSS/layout issue)

## 3. PRODUCT LIMITS - Only 12 Products
**Problem:** Only showing 12 products when Flora has 71
**Prop Issue:** `limit: 12` on homepage, `limit: 50` on shop
**Should Be:** Unlimited on shop page, or pagination

## 4. MISSING: Category Filters
**What Pros Have:** Horizontal category nav (Flower, Edibles, Concentrates, Vapes)
**Current:** Footer has links but no prominent category navigation
**Needed:** smart_category_nav component in header or shop page

## 5. MISSING: Product Search/Filter
**What Pros Have:** Search bar, sort by (price, popularity, strain type)
**Current:** Search button exists but no functionality visible
**Needed:** Filters, sorting, search actually work

## 6. MISSING: Location Information
**Flora Has:** 0 locations (not applicable)
**For Others:** Need smart_location_map rendering when vendor has locations
**Fix:** Template should conditionally add locations section

## 7. MISSING: Social Proof Elements
**What Pros Have:** Star ratings, review count, "Trusted by X customers"
**Current:** Footer disclaimer only
**Needed:** Trust badges with real data, review stars on products

## 8. PRODUCT CARDS - Missing Elements
**Current:** Image, name, price, quick add button
**Should Have:**
- THC/CBD percentages
- Strain type badge (Indica/Sativa/Hybrid)
- Lab tested badge
- In stock/out of stock indicator
- Star rating
- Sale badge (if on sale)

## 9. MISSING: Age Verification
**Required for Cannabis:** 21+ age gate on first visit
**Current:** Disclaimer in footer only
**Needed:** Modal popup, cookie to remember

## 10. MISSING: Cart Integration
**Current:** Cart button exists but no count badge
**Needed:** Item count badge, cart drawer with items

---

## 📋 Components That Need Upgrading

### **1. SmartProductGrid** (High Priority)
**Current Issues:**
- Only shows 12 products (hardcoded limit)
- No pagination
- No "Load More" button
- Not rendering on shop page

**Needs:**
```typescript
Props to add:
- showPagination: boolean
- showLoadMore: boolean  
- showFilters: boolean (price range, strain type)
- showSort: boolean (price, popularity, name)
- showCategoryTabs: boolean
- emptyStateMessage: string
```

### **2. SmartCategoryNav** (Medium Priority)
**Current:** Doesn't exist in template
**Needed:** Horizontal category pills on shop page

**Add to template:**
```typescript
{
  section_key: 'shop_categories',
  section_order: 0.5, // Between hero and grid
  page_type: 'shop',
  components: [
    {
      component_key: 'smart_category_nav',
      props: {
        layout: 'horizontal',
        show_count: true,
        show_icons: false
      }
    }
  ]
}
```

### **3. Enhanced Product Cards** (High Priority)
**Current:** Basic (image, name, price)
**Needs:**
- THC % badge
- Strain type badge
- Lab tested icon
- Stock indicator
- Star rating
- Hover effects

**Solution:** Upgrade ProductCard component or create new `EnhancedProductCard`

### **4. Trust Badges with Real Data** (Medium)
**Current:** Static text ("LAB TESTED", "FAST DELIVERY")
**Needs:** Real stats
- "500+ products sold"
- "4.8★ average rating"
- "Same-day delivery"
- "100% lab tested"

**Use:** smart_stats_counter component

### **5. Location Map** (Low - Flora has 0)
**For vendors with locations:**
- Add smart_location_map to template
- Show hours, address, directions
- Google Maps integration

---

## 🎨 Design Improvements Needed

### **Typography Issues:**
1. Some text too small (need better hierarchy)
2. Uppercase everywhere (too aggressive - mix with sentence case)
3. Letter spacing too wide on some elements

### **Layout Issues:**
1. Product grid layout not visible (CSS issue?)
2. Sections stacking but no products showing
3. Need better section dividers

### **Missing Visual Elements:**
1. No hero image/background
2. No section backgrounds (all pure black)
3. No gradient accents (pure monochrome is TOO plain)
4. Product images not displaying?

---

## 🔧 Fixes Required (Priority Order)

### **CRITICAL (Do First):**
1. ✅ Fix product grid rendering on homepage (vendorId passed - DONE)
2. ❌ Fix product grid rendering on shop page (still broken)
3. ❌ Change shop limit to 100 or unlimited
4. ❌ Add category navigation to shop page

### **HIGH (Do Next):**
5. ❌ Upgrade product cards (THC%, strain type, ratings)
6. ❌ Add search/filter/sort to shop page
7. ❌ Add pagination or "Load More" to shop
8. ❌ Fix product image display issues

### **MEDIUM:**
9. ❌ Add age verification modal (21+ gate)
10. ❌ Add real stats to trust badges
11. ❌ Add cart item count badge
12. ❌ Add reviews/ratings to products

### **LOW:**
13. ❌ Add location map (when vendor has locations)
14. ❌ Add newsletter signup
15. ❌ Add social media links
16. ❌ Add breadcrumbs

---

## 🏗️ Template Enhancements Needed

### **Shop Page Template (Upgrade):**
```typescript
{
  section_key: 'shop_hero',
  components: [
    { text: 'SHOP' }, 
    { smart_category_nav } // ADD THIS
  ]
},
{
  section_key: 'shop_filters', // NEW SECTION
  components: [
    { text: 'Filter by:' },
    // Filter chips: Price, THC%, Strain Type, In Stock
  ]
},
{
  section_key: 'shop_grid',
  components: [
    { 
      smart_product_grid,
      props: {
        limit: 100, // INCREASE
        showPagination: true, // ADD
        showFilters: true, // ADD
        showSort: true // ADD
      }
    }
  ]
}
```

### **Product Card Enhancement:**
Add these to every product card:
- THC/CBD percentage badges
- Strain type (Indica/Sativa/Hybrid)
- Stock status (In Stock / Low Stock / Out of Stock)
- Star rating (if has reviews)
- Lab tested badge
- Sale badge (if on sale)

### **Homepage Enhancement:**
```typescript
// After hero, add stats section:
{
  section_key: 'stats',
  components: [
    {
      component_key: 'smart_stats_counter',
      props: {
        stats: [
          { label: 'Products', value: 71, suffix: '+' },
          { label: 'Happy Customers', value: 500, suffix: '+' },
          { label: 'Same-Day Delivery', value: '2', suffix: ' PM' }
        ]
      }
    }
  ]
}
```

---

## 🎯 Action Plan

### **Phase 1: Fix Product Display (Today)**
1. Debug why shop page product grid doesn't show
2. Increase limit to 100 on shop page
3. Verify products render on both home and shop
4. Fix any CSS hiding products

### **Phase 2: Add Category Navigation (Today)**
1. Add smart_category_nav to shop template
2. Wire up category filtering
3. Make categories clickable in header dropdown

### **Phase 3: Enhance Product Cards (Tomorrow)**
1. Add THC% badge
2. Add strain type badge
3. Add stock indicator
4. Add star rating
5. Add lab tested icon

### **Phase 4: Polish (Tomorrow)**
1. Add age verification modal
2. Add real stats to trust section
3. Add pagination to shop
4. Add sort/filter controls
5. Test all pages thoroughly

---

## 🔍 Debug Steps (No Psql!)

### Check Product Grid API:
```bash
curl "http://localhost:3000/api/products?vendor_id=cd2e1122-d511-4edb-be5d-98ef274b4baf&limit=50" | head -100
```

### Check Component Registry:
```bash
grep -r "smart_product_grid" components/component-registry/
```

### Check Shop Page Sections:
Look at browser network tab for:
- `/api/vendor/content/sections?page_type=shop`
- `/api/vendor/content/components?page_type=shop`

---

## 💡 Quick Wins (Can Do in 1 Hour)

1. **Increase shop page limit:** Change template `limit: 50` → `limit: 100`
2. **Add category nav:** Insert smart_category_nav in shop template
3. **Fix homepage product visibility:** Check CSS, add console logs
4. **Add product count:** Show "71 Products" on shop page

After these 4 fixes, the site will be 80% complete!

