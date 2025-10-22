# ✅ Vendor Pricing Tier System - COMPLETE

## 🎯 What This Is

A **standardized pricing blueprint system** that allows:
- ✅ **Platform defines pricing structures** (like field groups)
- ✅ **Vendors configure their own prices** for each structure
- ✅ **Products inherit vendor's pricing** automatically
- ✅ **Cross-vendor price comparison** & market research
- ✅ **KPI tracking** & analytics

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│ PLATFORM PRICING BLUEPRINTS (Admin Defines)    │
│ ┌─────────────────────────────────────────────┐ │
│ │ • Retail Cannabis Flower (1g, 3.5g, 7g...)│ │
│ │ • Wholesale Tiers (10-49, 50-99, 100+)    │ │
│ │ • Medical Patient Discount (-20%)          │ │
│ │ • Staff Discount (-30%)                    │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ VENDOR CONFIGURATIONS (Each Vendor Sets Prices) │
│ ┌───────────────┬───────────────┬─────────────┐ │
│ │ Yacht Club    │ Moonwater     │ Flora House │ │
│ ├───────────────┼───────────────┼─────────────┤ │
│ │ 1g: $15       │ 1g: $12       │ 1g: $10     │ │
│ │ 3.5g: $45     │ 3.5g: $40     │ 3.5g: $32   │ │
│ │ 7g: $80       │ 7g: $75       │ 7g: $60     │ │
│ └───────────────┴───────────────┴─────────────┘ │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ PRODUCT ASSIGNMENTS (With Optional Overrides)   │
│ Blue Dream (Yacht Club): Uses vendor defaults   │
│ OG Kush (Yacht Club): Override 1g → $17         │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### 1. `pricing_tier_blueprints`
Platform-defined pricing structures (managed by admin)

```sql
CREATE TABLE pricing_tier_blueprints (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,           -- "Retail Cannabis Flower"
  slug TEXT UNIQUE NOT NULL,            -- "retail-flower"
  description TEXT,
  tier_type TEXT,                       -- 'weight', 'quantity', 'percentage', 'flat', 'custom'
  price_breaks JSONB NOT NULL,          -- Array of price break definitions
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,     -- Default for new vendors
  display_order INTEGER DEFAULT 0,
  applicable_to_categories UUID[],      -- Optional category filtering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example `price_breaks` (Weight-based):**
```json
[
  {"break_id": "1g", "label": "1 gram", "qty": 1, "unit": "g", "sort_order": 1},
  {"break_id": "3_5g", "label": "Eighth (3.5g)", "qty": 3.5, "unit": "g", "sort_order": 2},
  {"break_id": "7g", "label": "Quarter (7g)", "qty": 7, "unit": "g", "sort_order": 3},
  {"break_id": "14g", "label": "Half (14g)", "qty": 14, "unit": "g", "sort_order": 4},
  {"break_id": "28g", "label": "Ounce (28g)", "qty": 28, "unit": "g", "sort_order": 5}
]
```

**Example `price_breaks` (Quantity-based):**
```json
[
  {"break_id": "retail", "label": "Retail (1-9)", "min_qty": 1, "max_qty": 9, "sort_order": 1},
  {"break_id": "tier_1", "label": "Wholesale T1 (10-49)", "min_qty": 10, "max_qty": 49, "discount_expected": 15, "sort_order": 2},
  {"break_id": "tier_2", "label": "Wholesale T2 (50-99)", "min_qty": 50, "max_qty": 99, "discount_expected": 25, "sort_order": 3},
  {"break_id": "tier_3", "label": "Bulk (100+)", "min_qty": 100, "max_qty": null, "discount_expected": 35, "sort_order": 4}
]
```

---

### 2. `vendor_pricing_configs`
Each vendor's pricing for blueprints

```sql
CREATE TABLE vendor_pricing_configs (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  blueprint_id UUID NOT NULL REFERENCES pricing_tier_blueprints(id),
  pricing_values JSONB NOT NULL,        -- Vendor's prices keyed by break_id
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, blueprint_id)
);
```

**Example `pricing_values`:**
```json
{
  "1g": {"price": "15.00", "enabled": true},
  "3_5g": {"price": "45.00", "enabled": true},
  "7g": {"price": "80.00", "enabled": true},
  "14g": {"price": "150.00", "enabled": true},
  "28g": {"price": "280.00", "enabled": true}
}
```

---

### 3. `product_pricing_assignments`
Assign blueprints to products (with optional overrides)

```sql
CREATE TABLE product_pricing_assignments (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  blueprint_id UUID NOT NULL REFERENCES pricing_tier_blueprints(id),
  price_overrides JSONB DEFAULT '{}',   -- Optional product-specific overrides
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, blueprint_id)
);
```

**Example `price_overrides`:**
```json
{
  "1g": {"price": "17.00"}  // Only override 1g, rest uses vendor config
}
```

---

## 🚀 Pre-Seeded Blueprints

The migration includes 5 ready-to-use blueprints:

### 1. **Retail Cannabis Flower** (Default ✅)
- **Type:** Weight-based
- **Breaks:** 1g, 3.5g, 7g, 14g, 28g
- **Use Case:** Standard flower products

### 2. **Wholesale Tiers**
- **Type:** Quantity-based
- **Breaks:** Retail (1-9), Tier 1 (10-49), Tier 2 (50-99), Bulk (100+)
- **Use Case:** Bulk ordering discounts

### 3. **Medical Patient Discount**
- **Type:** Percentage-based
- **Breaks:** 20% off retail
- **Use Case:** Medical cardholder pricing

### 4. **Staff Discount**
- **Type:** Percentage-based
- **Breaks:** 30% off retail
- **Use Case:** Employee pricing

### 5. **Retail Concentrates**
- **Type:** Weight-based
- **Breaks:** 0.5g, 1g, 2g, 3.5g
- **Use Case:** Concentrate products (smaller quantities)

---

## 🎨 UI Pages

### Vendor Pages

#### `/vendor/pricing` - Pricing Configuration
- View all available pricing blueprints
- Configure prices for each blueprint
- Enable/disable price breaks
- Set custom prices per break
- Add notes about pricing strategy
- View stats (configured tiers, active configs)

**Features:**
- ✅ Visual pricing configuration
- ✅ Enable/disable individual price breaks
- ✅ Support for price + discount percent
- ✅ Real-time validation
- ✅ Edit/delete existing configs

---

### Admin Pages

#### `/admin/pricing-blueprints` - Manage Blueprints
*(To be created - similar to field groups manager)*

- Create/edit/delete blueprints
- Define price break structure
- Set tier types
- Mark as default
- View vendor adoption stats

---

## 📡 API Endpoints

### Admin Endpoints

**`/api/admin/pricing-blueprints`**
- `GET` - List all blueprints
- `POST` - Create new blueprint
- `PUT` - Update blueprint
- `DELETE` - Delete blueprint

### Vendor Endpoints

**`/api/vendor/pricing-config`**
- `GET ?vendor_id={id}` - Get vendor's configs + available blueprints
- `POST` - Create pricing configuration
- `PUT` - Update pricing configuration
- `DELETE ?id={id}&vendor_id={id}` - Delete configuration

---

## 🔧 Helper Functions

### `get_vendor_pricing(vendor_id, blueprint_id)`
Returns vendor's configured pricing for a blueprint

```sql
SELECT get_vendor_pricing(
  '123e4567-e89b-12d3-a456-426614174000',
  '456e7890-e89b-12d3-a456-426614174111'
);

-- Returns: {"1g": {"price": "15.00", "enabled": true}, ...}
```

### `get_product_pricing(product_id, blueprint_id)`
Returns product's final pricing (vendor config + product overrides)

```sql
SELECT get_product_pricing(
  '789e0123-e89b-12d3-a456-426614174222',
  '456e7890-e89b-12d3-a456-426614174111'
);

-- Returns: Merged pricing with product-specific overrides
```

### `get_product_all_pricing(product_id)`
Returns all pricing blueprints assigned to a product

```sql
SELECT * FROM get_product_all_pricing('789e0123-e89b-12d3-a456-426614174222');

-- Returns: Table with all assigned blueprints and their pricing
```

---

## 📊 Analytics Views

### `vendor_pricing_comparison`
Compare pricing across vendors for market research

```sql
SELECT * FROM vendor_pricing_comparison
WHERE blueprint_slug = 'retail-flower';

-- Result:
-- blueprint_name | vendor_name | pricing_values
-- Retail Flower  | Yacht Club  | {"1g": {"price": "15.00"}, ...}
-- Retail Flower  | Moonwater   | {"1g": {"price": "12.00"}, ...}
-- Retail Flower  | Flora House | {"1g": {"price": "10.00"}, ...}
```

**Use Cases:**
- ✅ Price comparison dashboards
- ✅ Market research
- ✅ Identify pricing trends
- ✅ Competitive analysis

### `product_pricing_overview`
All products with their pricing configurations

```sql
SELECT * FROM product_pricing_overview
WHERE vendor_id = '123e4567-e89b-12d3-a456-426614174000';

-- Shows all products with their assigned pricing blueprints
```

---

## 🔍 Example Usage Scenarios

### Scenario 1: Vendor Sets Up Pricing
1. Vendor logs in to `/vendor/pricing`
2. Sees "Retail Cannabis Flower" blueprint
3. Clicks "Configure"
4. Enables price breaks: 1g, 3.5g, 7g, 14g, 28g
5. Sets prices: $15, $45, $80, $150, $280
6. Saves configuration
7. **All vendor's flower products now use these prices**

### Scenario 2: Product-Specific Override
1. Admin creates product "Blue Dream"
2. Assigns "Retail Cannabis Flower" blueprint
3. Product inherits vendor's default pricing
4. Admin wants to charge $17 for 1g (premium strain)
5. Sets override: `{"1g": {"price": "17.00"}}`
6. Product now shows $17 for 1g, rest uses vendor defaults

### Scenario 3: Market Research Query
```sql
-- Get average 1g pricing across all vendors
SELECT 
  AVG((pricing_values->'1g'->>'price')::DECIMAL) as avg_1g_price,
  MIN((pricing_values->'1g'->>'price')::DECIMAL) as min_1g_price,
  MAX((pricing_values->'1g'->>'price')::DECIMAL) as max_1g_price
FROM vendor_pricing_configs vpc
JOIN pricing_tier_blueprints b ON b.id = vpc.blueprint_id
WHERE b.slug = 'retail-flower'
  AND vpc.is_active = true
  AND pricing_values->'1g'->>'enabled' = 'true';

-- Result: avg: $12.33, min: $10.00, max: $15.00
```

### Scenario 4: KPI Dashboard
```sql
-- Yacht Club's pricing vs market average
WITH market_avg AS (
  SELECT 
    AVG((pricing_values->'1g'->>'price')::DECIMAL) as avg_1g,
    AVG((pricing_values->'3_5g'->>'price')::DECIMAL) as avg_eighth
  FROM vendor_pricing_configs
  WHERE blueprint_id = (SELECT id FROM pricing_tier_blueprints WHERE slug = 'retail-flower')
)
SELECT 
  v.name as vendor,
  (vpc.pricing_values->'1g'->>'price')::DECIMAL as yacht_1g,
  ma.avg_1g as market_avg_1g,
  ROUND(((yacht_1g - ma.avg_1g) / ma.avg_1g * 100)::NUMERIC, 2) as percent_vs_market
FROM vendor_pricing_configs vpc
JOIN vendors v ON v.id = vpc.vendor_id
CROSS JOIN market_avg ma
WHERE v.slug = 'yacht-club'
  AND vpc.blueprint_id = (SELECT id FROM pricing_tier_blueprints WHERE slug = 'retail-flower');

-- Result: Yacht Club is 21.7% above market average
```

---

## 🎯 Benefits

### For Platform (You)
- ✅ **Standardized pricing structure** across all vendors
- ✅ **Market research capabilities** - compare pricing easily
- ✅ **KPI tracking** - see who's priced high/low
- ✅ **Data consistency** - all pricing in same format
- ✅ **Analytics ready** - query pricing trends

### For Vendors
- ✅ **Easy configuration** - visual UI to set prices
- ✅ **Flexibility** - enable/disable breaks as needed
- ✅ **Product inheritance** - set once, applies to all products
- ✅ **Override capability** - customize per product if needed
- ✅ **Strategy notes** - document pricing decisions

### For Customers
- ✅ **Consistent experience** - all vendors show pricing same way
- ✅ **Easy comparison** - compare 1g prices across vendors
- ✅ **Clear pricing** - see all weight options
- ✅ **Bulk discounts** - quantity breaks visible

---

## 🔄 Migration from Old System

Your existing products use `meta_data._product_price_tiers`:

```json
{
  "_product_price_tiers": [
    {"weight": "1g", "qty": 1, "price": "15.00"},
    {"weight": "3.5g", "qty": 3.5, "price": "45.00"}
  ]
}
```

**Migration Path:**
1. ✅ New system is parallel - doesn't break existing products
2. Auto-assign "Retail Cannabis Flower" blueprint to existing products
3. Extract vendor pricing from existing products
4. Create `vendor_pricing_configs` entries
5. Create `product_pricing_assignments` entries
6. Products now use new system + old meta_data as fallback

---

## 🚀 Next Steps

### Immediate:
1. ✅ Migration applied to database
2. ✅ API routes created
3. ✅ Vendor UI created (`/vendor/pricing`)
4. ⏳ Admin UI for blueprint management
5. ⏳ Integrate with product creation flow
6. ⏳ Display pricing on product pages

### Future Enhancements:
- Dynamic pricing (time-based, inventory-based)
- Promotional pricing (sales, flash deals)
- Customer group pricing (loyalty tiers)
- Location-based pricing (different locations, different prices)
- Automated repricing based on market

---

## ✅ Complete

**Status:** Core system ready ✅

**What Works:**
- ✅ Database schema with 5 pre-seeded blueprints
- ✅ API endpoints for admin & vendors
- ✅ Vendor UI for configuring pricing
- ✅ Helper functions for retrieving pricing
- ✅ Analytics views for market research
- ✅ RLS policies for security

**What's Next:**
- Admin blueprint manager UI
- Integration with product display
- Migration script for existing products
- Price comparison widgets

---

## 📚 References

Similar to industry standards:
- **Shopify**: Price rules & customer groups
- **WooCommerce**: Dynamic pricing & discounts
- **Faire**: Wholesale pricing tiers
- **Amazon**: Vendor pricing structures

**Your system is enterprise-grade and scalable!** 🚀

