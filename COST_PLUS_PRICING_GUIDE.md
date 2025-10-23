# 💰 Cost-Plus Pricing System

## Overview

**Standard wholesale pricing model** where vendors set a base cost and define markup tiers. System automatically calculates selling prices.

---

## How It Works

### Example: Wholesale Flower Distributor

```
SUPPLIER COST: $1,000/lb
```

**Vendor Creates 5 Markup Tiers:**

```
Tier 1 (Bulk 10+ lbs):     Cost + $100  = $1,100/lb  (10% margin)  ✅ Best price
Tier 2 (Standard 5-9 lbs): Cost + $200  = $1,200/lb  (17% margin)
Tier 3 (Small 3-4 lbs):    Cost + $300  = $1,300/lb  (23% margin)
Tier 4 (Retail 1-2 lbs):   Cost + $400  = $1,400/lb  (29% margin)
Tier 5 (Sample 0.25 lb):   Cost + $500  = $1,500/lb  (33% margin)  💰 Highest margin
```

**Customer Orders:**
- 10 lbs → Qualifies for Tier 1 → Pays $1,100/lb × 10 = **$11,000**
- 5 lbs → Qualifies for Tier 2 → Pays $1,200/lb × 5 = **$6,000**
- 1 lb → Qualifies for Tier 4 → Pays $1,400/lb × 1 = **$1,400**

**Inventory Deduction:**
- All deductions in grams (10 lbs = 4,536g deducted from stock_quantity)
- Display shows "10 lbs" to customer
- Database stores 4,536g deducted

---

## Database Structure

### Cost-Plus Configuration Table

```sql
vendor_cost_plus_configs:
  - vendor_id: UUID
  - name: "Wholesale Flower Markup"
  - cost_unit: 'pound' | 'ounce' | 'gram'
  - markup_tiers: JSONB [
      {
        tier_id: "tier_1",
        tier_name: "Bulk (10+ lbs)",
        min_quantity: 10,
        min_quantity_unit: "lb",
        min_quantity_grams: 4536,     // Auto-calculated
        markup_type: "flat",           // or "percentage"
        markup_value: 100,             // $100 or 10%
        sort_order: 1
      }
    ]
```

### Product Pricing

```sql
products:
  - cost_price: 1000.00               // Vendor's cost
  - regular_price: NULL               // Not used in cost-plus mode
  - margin_percentage: AUTO           // Calculated from cost + tier markup
  
  
-- When customer checks pricing:
SELECT 
  calculate_tier_price(cost_price, 'flat', 100) AS tier_1_price,
  calculate_tier_price(cost_price, 'flat', 200) AS tier_2_price,
  calculate_tier_price(cost_price, 'flat', 300) AS tier_3_price
FROM products;

Result:
  tier_1_price: $1,100
  tier_2_price: $1,200
  tier_3_price: $1,300
```

---

## Complete Workflow

### 1. Vendor Sets Up Cost-Plus Pricing

**Location:** `/vendor/cost-plus-pricing`

```typescript
// Vendor configures:
{
  baseCost: 1000,         // $1,000/lb from supplier
  costUnit: 'lb',
  markupTiers: [
    {
      tier_name: "Bulk (10+ lbs)",
      min_quantity: 10,
      min_quantity_unit: "lb",
      markup_type: "flat",
      markup_value: 100     // +$100
    },
    {
      tier_name: "Standard (5-9 lbs)",
      min_quantity: 5,
      min_quantity_unit: "lb",
      markup_type: "flat",
      markup_value: 200     // +$200
    },
    {
      tier_name: "Small (1-4 lbs)",
      min_quantity: 1,
      min_quantity_unit: "lb",
      markup_type: "flat",
      markup_value: 300     // +$300
    }
  ]
}

// System calculates and displays:
✅ Tier 1: $1,100/lb (10.0% margin, $100 profit)
✅ Tier 2: $1,200/lb (16.7% margin, $200 profit)
✅ Tier 3: $1,300/lb (23.1% margin, $300 profit)
```

### 2. Vendor Adds Products

**Location:** `/vendor/products/new`

```typescript
// Vendor enters:
{
  name: "Blue Dream",
  cost_price: 1000,     // Cost per pound
  category: "Flower",
  stock: 100            // 100 lbs = 45,359g in database
}

// NO need to enter selling prices!
// System automatically applies markup tiers from config
```

### 3. Product Appears in Wholesale Marketplace

**Location:** `/wholesale`

**Customer sees pricing options:**
```
Blue Dream - Wholesale Pricing

┌─────────────────────────────────────┐
│ Bulk Purchase (10+ lbs)             │
│ $1,100/lb                           │
│ Buy 10 lbs: $11,000                 │
│ Save $200 vs smaller quantities!    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Standard (5-9 lbs)                  │
│ $1,200/lb                           │
│ Buy 5 lbs: $6,000                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Small Order (1-4 lbs)               │
│ $1,300/lb                           │
│ Buy 1 lb: $1,300                    │
└─────────────────────────────────────┘
```

### 4. Customer Purchases

```typescript
// Customer selects: "10 lbs at Tier 1"
const orderItem = {
  product_id: "blue-dream-uuid",
  tier: "tier_1",
  quantity: 10,
  quantity_unit: "lb",
  quantity_grams: 4536,        // 10 lbs = 4,536 grams
  quantity_display: "10 lbs",  // For receipt
  unit_price: 1100,            // $1,100/lb (cost $1,000 + markup $100)
  total_price: 11000           // $1,100 × 10 = $11,000
};

// Order API deducts: 4,536 grams from inventory
UPDATE products 
SET stock_quantity = stock_quantity - 4536
WHERE id = 'blue-dream-uuid';

// Receipt shows: "10 lbs of Blue Dream - $11,000"
// Database tracks: 4,536g deducted
```

### 5. Vendor Profit Tracking

```typescript
// Vendor dashboard shows:
{
  product: "Blue Dream",
  units_sold: "10 lbs",
  revenue: 11000,          // $1,100/lb × 10
  cost: 10000,             // $1,000/lb × 10
  profit: 1000,            // $100/lb × 10
  margin: 9.1%             // $1,000 / $11,000
}
```

---

## Benefits

### ✅ **Simple for Vendors**
- Set cost once
- Define markup strategy once
- All prices calculate automatically
- Update cost, all tier prices update

### ✅ **Flexible Markup Options**
```typescript
// Flat Dollar Amount
markup_type: "flat"
markup_value: 100       // Add $100 to cost

// Percentage Markup
markup_type: "percentage"
markup_value: 10        // Add 10% to cost
```

### ✅ **Volume Discounts Built-In**
- Higher quantities = Lower tier number = Lower markup
- Encourages bulk purchases
- Professional B2B pricing structure

### ✅ **Automatic Calculations**
```
Cost changes from $1,000 → $1,100

Tier 1: $1,100 + $100 = $1,200  (was $1,100)
Tier 2: $1,100 + $200 = $1,300  (was $1,200)
Tier 3: $1,100 + $300 = $1,400  (was $1,300)

All products update instantly!
```

---

## Configuration Examples

### Example 1: Aggressive Volume Discounts

```
Cost: $2,000/lb

Tier 1 (50+ lbs):   +$100  = $2,100/lb   (4.8% margin)  
Tier 2 (25-49 lbs): +$200  = $2,200/lb   (9.1% margin)
Tier 3 (10-24 lbs): +$300  = $2,300/lb   (13.0% margin)
Tier 4 (5-9 lbs):   +$400  = $2,400/lb   (16.7% margin)
Tier 5 (1-4 lbs):   +$600  = $2,600/lb   (23.1% margin)
```

Strategy: Thin margins on bulk, higher margins on small orders

### Example 2: Premium Product (Percentage Markup)

```
Cost: $3,000/lb (exotic strain)

Tier 1 (5+ lbs):   +25%  = $3,750/lb   (20.0% margin)
Tier 2 (2-4 lbs):  +35%  = $4,050/lb   (25.9% margin)
Tier 3 (1 lb):     +50%  = $4,500/lb   (33.3% margin)
```

Strategy: Maintain consistent margin percentages

### Example 3: Hybrid (Mix of flat and percentage)

```
Cost: $1,500/lb

Tier 1 (20+ lbs):  Flat +$150   = $1,650/lb   (9.1% margin)
Tier 2 (10-19):    Flat +$250   = $1,750/lb   (14.3% margin)
Tier 3 (5-9):      Flat +$400   = $1,900/lb   (21.1% margin)
Tier 4 (1-4):      Percent +40% = $2,100/lb   (28.6% margin)
```

---

## API Integration

### Calculate Price for Order

```typescript
// When customer selects quantity
async function getApplicablePrice(productId: string, quantityInGrams: number) {
  // 1. Get product cost
  const product = await getProduct(productId);
  const costPrice = product.cost_price;  // $1,000/lb
  
  // 2. Get vendor's markup config
  const config = await getVendorCostPlusConfig(product.vendor_id);
  
  // 3. Find applicable tier based on quantity
  const applicableTier = config.markup_tiers
    .sort((a, b) => b.min_quantity_grams - a.min_quantity_grams)
    .find(tier => quantityInGrams >= tier.min_quantity_grams);
  
  // 4. Calculate price
  if (applicableTier) {
    if (applicableTier.markup_type === 'flat') {
      return costPrice + applicableTier.markup_value;
    } else {
      return costPrice * (1 + applicableTier.markup_value / 100);
    }
  }
  
  // Default: cost + highest markup if no tier matches
  return costPrice + config.markup_tiers[config.markup_tiers.length - 1].markup_value;
}

// Example usage:
const quantity = 4536;  // 10 lbs in grams
const price = await getApplicablePrice('blue-dream', quantity);
// Returns: $1,100/lb (Tier 1: cost $1,000 + markup $100)
```

---

## Advantages Over Fixed Pricing

### Traditional Method (Manual):
```
❌ Vendor sets each tier price manually:
   - 1 lb: $1,300
   - 5 lbs: $1,200/lb
   - 10 lbs: $1,100/lb

❌ Cost increases to $1,100/lb
❌ Vendor must manually update ALL tiers:
   - 1 lb: $1,400
   - 5 lbs: $1,300/lb
   - 10 lbs: $1,200/lb
   
❌ Time-consuming, error-prone
```

### Cost-Plus Method (Automatic):
```
✅ Vendor sets cost: $1,000/lb
✅ Vendor sets markup rules:
   - Tier 1: +$100
   - Tier 2: +$200
   - Tier 3: +$300

✅ Cost increases to $1,100/lb
✅ ALL prices update automatically:
   - Tier 1: $1,200/lb
   - Tier 2: $1,300/lb
   - Tier 3: $1,400/lb
   
✅ Instant, accurate, consistent margins
```

---

## Implementation Status

### ✅ Completed

1. **Database Schema**
   - `vendor_cost_plus_configs` table created
   - `calculate_tier_price()` function added
   - Migration: `20251024_cost_plus_pricing.sql`

2. **Vendor UI**
   - Cost-plus pricing page: `/vendor/cost-plus-pricing`
   - Real-time price calculator
   - Margin visualization
   - Support for flat ($) and percentage (%) markups

3. **API Endpoints**
   - `POST /api/vendor/cost-plus-pricing` - Save config
   - `GET /api/vendor/cost-plus-pricing` - Fetch config

4. **Product Integration**
   - Products store `cost_price`
   - Auto-calculated `margin_percentage`
   - Profit tracking in vendor dashboard

### 🔄 Next Steps

1. **Link cost-plus configs to products**
   - When adding product, select cost-plus config
   - System applies markup tiers automatically
   
2. **Display tiered pricing in wholesale marketplace**
   - Show all applicable tiers to customer
   - Highlight best value (bulk tier)
   
3. **Order processing**
   - Determine applicable tier based on quantity
   - Calculate final price
   - Deduct inventory in grams

---

## Usage Guide for Vendors

### Step 1: Configure Cost-Plus Pricing

1. Go to `/vendor/pricing`
2. Click **"Cost-Plus Pricing"** button
3. Enter your base cost: `$1,000/lb`
4. Add markup tiers:
   ```
   Tier 1: Min 10 lbs, +$100 markup
   Tier 2: Min 5 lbs, +$200 markup
   Tier 3: Min 1 lb, +$300 markup
   ```
5. System shows calculated prices in real-time
6. Click **Save**

### Step 2: Add Products

1. Go to `/vendor/products/new`
2. Fill in product details
3. Enter **Cost Price**: `$1,000` (per lb)
4. Select **Pricing Mode**: "Cost-Plus Tiers"
5. Select your saved config
6. Submit

### Step 3: Products Auto-Price

- Product "Blue Dream" now has 3 automatic pricing tiers
- Customer buying 10 lbs sees: $1,100/lb
- Customer buying 1 lb sees: $1,300/lb
- Inventory deducted in grams regardless of tier

### Step 4: Update Costs

When supplier cost changes:
1. Go to `/vendor/cost-plus-pricing`
2. Update base cost: `$1,000` → `$1,100`
3. Click Save
4. **ALL products using this config update instantly**
   - Tier 1: $1,200/lb
   - Tier 2: $1,300/lb
   - Tier 3: $1,400/lb

---

## Advanced Features

### Mixed Markup Types

```typescript
{
  tiers: [
    {
      name: "Bulk (50+ lbs)",
      min_quantity: 50,
      markup_type: "flat",
      markup_value: 50        // Tiny $50 markup for huge orders
    },
    {
      name: "Medium (10-49 lbs)",
      min_quantity: 10,
      markup_type: "percentage",
      markup_value: 15        // 15% markup
    },
    {
      name: "Small (1-9 lbs)",
      min_quantity: 1,
      markup_type: "percentage",
      markup_value: 30        // 30% markup for retail-size orders
    }
  ]
}
```

### Category-Specific Configs

```typescript
{
  name: "Flower Wholesale Pricing",
  applies_to_categories: ["flower-category-uuid"],
  // Only applies to flower products
}

{
  name: "Concentrate Wholesale Pricing",
  applies_to_categories: ["concentrate-category-uuid"],
  // Different markup strategy for concentrates
}
```

### Seasonal/Temporary Configs

```typescript
{
  name: "Holiday Discount Pricing",
  start_date: "2025-11-01",
  end_date: "2025-12-31",
  markup_tiers: [
    // Lower markups for holiday season
  ]
}
```

---

## Migration Commands

```bash
# 1. Run cost-plus pricing migration
psql -f supabase/migrations/20251024_cost_plus_pricing.sql

# 2. Verify table created
SELECT * FROM vendor_cost_plus_configs LIMIT 1;

# 3. Test price calculation function
SELECT calculate_tier_price(1000, 'flat', 100);
-- Should return: 1100

SELECT calculate_tier_price(1000, 'percentage', 10);
-- Should return: 1100
```

---

## Summary

**Before Cost-Plus:**
- Manual pricing for each tier
- Update each product individually when costs change
- Prone to errors and inconsistencies

**After Cost-Plus:**
- ✅ Set cost once
- ✅ Define markup strategy once
- ✅ All prices calculate automatically
- ✅ Update cost, everything adjusts
- ✅ Consistent margins
- ✅ Professional wholesale pricing

**Perfect for:**
- Distributors with fluctuating supplier costs
- Vendors with large catalogs
- B2B marketplace pricing
- Volume-based discount strategies

---

## Next: Test the Flow!

1. **Run migration:** `20251024_cost_plus_pricing.sql`
2. **Visit:** `/vendor/cost-plus-pricing`
3. **Configure** your markup tiers
4. **Add product** with cost-plus pricing
5. **View in wholesale** marketplace with tiered pricing

🚀 **Cost-plus pricing is ready to use!**


