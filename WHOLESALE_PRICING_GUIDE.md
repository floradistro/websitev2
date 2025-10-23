# 💰 Wholesale Pricing System - Complete Guide

## Overview

Your wholesale system supports **sophisticated multi-tier pricing** with volume discounts, minimum order quantities, and dual-market pricing (retail vs wholesale).

---

## 🎯 Pricing Levels

### 1. **Retail Price** (Base Price)
- For individual consumers
- Displayed on main marketplace
- Set in `products.regular_price`

### 2. **Base Wholesale Price**
- Entry-level wholesale price
- For minimum quantity orders
- Set in `products.wholesale_price`

### 3. **Tier Pricing** (Volume Discounts)
- Additional discounts for larger orders
- Multiple tiers: Bronze, Silver, Gold, Platinum
- Stored in `wholesale_pricing` table

---

## 📊 Pricing Structure Example

### Product: "Premium Extract 1oz"

```
Retail Price:      $150.00  (1 unit)

Wholesale Pricing:
  Base (10+ units):   $100.00/ea  (33% off)
  Bronze (25+ units): $90.00/ea   (40% off)
  Silver (50+ units): $80.00/ea   (47% off)
  Gold (100+ units):  $70.00/ea   (53% off)
```

**Order of 60 units:**
- Qualifies for Silver tier: $80/ea
- Total: $4,800
- Retail would be: $9,000
- **Savings: $4,200 (47% off)**

---

## 🛠️ Setting Up Pricing

### Method 1: Admin UI (Recommended)

**Individual Product:**
1. Go to `/admin/products`
2. Click on product
3. Click "Wholesale Pricing"
4. Configure:
   - Enable wholesale
   - Set base wholesale price
   - Set minimum quantity
   - Add pricing tiers
5. Save

**Bulk Management:**
1. Go to `/admin/wholesale-pricing`
2. View all products with pricing status
3. Quick access to edit any product
4. Search and filter capabilities

### Method 2: SQL

```sql
-- Set base wholesale pricing
UPDATE products
SET
  is_wholesale = true,
  wholesale_only = false,  -- or true to hide from retail
  wholesale_price = 100.00,
  minimum_wholesale_quantity = 10
WHERE id = 'product-id';

-- Add tier pricing
INSERT INTO wholesale_pricing (
  product_id,
  vendor_id,
  tier_name,
  minimum_quantity,
  unit_price,
  discount_percentage,
  is_active
) VALUES
  ('product-id', 'vendor-id', 'Bronze', 25, 90.00, 40, true),
  ('product-id', 'vendor-id', 'Silver', 50, 80.00, 47, true),
  ('product-id', 'vendor-id', 'Gold', 100, 70.00, 53, true);
```

---

## 💡 Pricing Strategies

### Strategy 1: Volume Incentive

**Goal:** Encourage larger orders

```
Retail:     $150/ea
Base (10+): $110/ea  (27% off)
Tier 1 (50+): $100/ea  (33% off)
Tier 2 (100+): $90/ea  (40% off)
Tier 3 (250+): $80/ea  (47% off)
```

**Psychology:** Each tier offers meaningful savings that justify ordering more.

### Strategy 2: Aggressive Wholesale

**Goal:** High volume, low margin

```
Retail:     $200/ea
Base (5+):  $120/ea  (40% off)
Tier 1 (20+): $100/ea  (50% off)
Tier 2 (50+): $80/ea   (60% off)
```

**Psychology:** Deep discounts attract bulk buyers, compensated by volume.

### Strategy 3: Premium Positioning

**Goal:** Maintain brand value

```
Retail:     $300/ea
Base (10+): $250/ea  (17% off)
Tier 1 (25+): $225/ea  (25% off)
Tier 2 (50+): $200/ea  (33% off)
```

**Psychology:** Modest discounts preserve premium positioning while offering wholesale opportunity.

---

## 🎨 Pricing Rules & Best Practices

### ✅ DO:

1. **Progressive Discounts**
   - Each tier should offer better pricing
   - Meaningful jumps between tiers (5-10% minimum)

2. **Clear Minimums**
   - Set realistic minimum quantities
   - Consider your inventory and margins

3. **Competitive Analysis**
   - Research competitor wholesale pricing
   - Offer compelling value

4. **Profitability Check**
   ```
   Wholesale Price > (Cost + Shipping + Overhead)
   ```

5. **Tier Spacing**
   - Don't create too many tiers (3-5 is optimal)
   - Space quantity requirements reasonably

### ❌ DON'T:

1. **Wholesale > Retail**
   - Never price wholesale higher than retail
   - Defeats the purpose

2. **Tiny Discounts**
   - Less than 15% off isn't attractive
   - Wholesale buyers expect real savings

3. **Impossible Minimums**
   - Don't set minimums you can't fulfill
   - Consider storage and cash flow

4. **Overlapping Tiers**
   - Each tier should have clear boundaries
   - No gaps or overlaps

---

## 📐 Pricing Calculator

### Calculate Your Wholesale Price

**Formula:**
```
Wholesale Price = Cost × (1 + Desired Margin) × (1 - Wholesale Discount %)
```

**Example:**
```
Cost per unit: $50
Retail margin: 200% → Retail price: $150
Wholesale discount: 33%

Base Wholesale = $50 × 2.0 × 0.67 = $67
Round up for clean pricing = $70

Profit margin on wholesale = $20/unit (40%)
```

### Tier Pricing Calculator

**Target: Encourage 50+ unit orders**

```
Base (10 units):  $100/ea  → Profit: $50/unit → $500 total
Tier 1 (50 units): $90/ea  → Profit: $40/unit → $2,000 total
Tier 2 (100 units): $80/ea → Profit: $30/unit → $3,000 total
```

**Logic:** Lower per-unit margin, higher total profit.

---

## 🔄 Dynamic Pricing Examples

### Example 1: Seasonal Adjustment

**Summer (High Demand):**
```sql
UPDATE wholesale_pricing
SET unit_price = unit_price * 1.10  -- 10% increase
WHERE starts_at >= '2025-06-01' 
  AND ends_at <= '2025-08-31';
```

### Example 2: Clearance Pricing

**End of Season:**
```sql
UPDATE products
SET wholesale_price = wholesale_price * 0.80  -- 20% clearance
WHERE category_id = 'seasonal-category'
  AND season = 'winter';
```

### Example 3: VIP Customer Pricing

```sql
-- Create special tier for VIP customers
INSERT INTO wholesale_pricing (
  product_id, vendor_id,
  tier_name, minimum_quantity, unit_price
)
SELECT 
  id, vendor_id,
  'VIP', 1, wholesale_price * 0.90  -- Extra 10% off
FROM products
WHERE is_wholesale = true;
```

---

## 📊 Pricing Analytics

### Track Performance

```sql
-- Average discount per tier
SELECT 
  tier_name,
  AVG(discount_percentage) as avg_discount,
  COUNT(*) as product_count
FROM wholesale_pricing
WHERE is_active = true
GROUP BY tier_name;

-- Most profitable wholesale products
SELECT 
  p.name,
  p.wholesale_price - p.cost as margin,
  COUNT(oi.id) as total_orders
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE p.is_wholesale = true
GROUP BY p.id
ORDER BY margin DESC
LIMIT 10;
```

---

## 🎯 Pricing by Market

### Retail Customers
- See: `regular_price`
- Minimum: 1 unit
- No tier pricing

### Wholesale Customers  
- See: `wholesale_price` or tier price
- Minimum: `minimum_wholesale_quantity`
- Eligible for all tiers

### Hybrid Products
```sql
-- Product available in both markets
UPDATE products
SET
  regular_price = 150.00,      -- Retail: $150
  wholesale_price = 100.00,    -- Wholesale: $100
  is_wholesale = true,
  wholesale_only = false,      -- Available to both
  minimum_wholesale_quantity = 10
WHERE id = 'product-id';
```

---

## 🔐 Pricing Visibility

| User Type | Sees Retail Price | Sees Wholesale Price | Sees Tier Pricing |
|-----------|------------------|---------------------|------------------|
| Public | ✅ | ❌ | ❌ |
| Customer | ✅ | ❌ | ❌ |
| Wholesale Customer | ✅ | ✅ | ✅ |
| Vendor | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ |

---

## 🛠️ Admin Tools

### Bulk Pricing Manager
**URL:** `/admin/wholesale-pricing`

**Features:**
- View all products and their pricing
- See wholesale vs retail comparison
- Quick edit access
- Filter by pricing status
- Search products

### Individual Product Pricing
**URL:** `/admin/products/[id]/wholesale-pricing`

**Features:**
- Set wholesale price
- Configure minimum quantity
- Add/edit/remove pricing tiers
- Pricing calculator
- Discount preview
- Visual tier structure

---

## 📱 Frontend Display

### On Product Page (Wholesale Marketplace)

```jsx
// Base pricing
<div>
  <p>Wholesale Price: $100/ea</p>
  <p>Minimum Order: 10 units</p>
</div>

// Tier pricing
<div>
  <h4>Volume Discounts:</h4>
  <ul>
    <li>25+ units: $90/ea (Save 10%)</li>
    <li>50+ units: $80/ea (Save 20%)</li>
    <li>100+ units: $70/ea (Save 30%)</li>
  </ul>
</div>

// Calculator
<div>
  <input type="number" value={quantity} />
  <p>Your price: ${calculatePrice(quantity)}/ea</p>
  <p>Total: ${calculatePrice(quantity) * quantity}</p>
  <p>Save ${savings} vs retail</p>
</div>
```

---

## 🚀 Quick Reference

### Enable Wholesale
```sql
UPDATE products SET is_wholesale = true WHERE id = ?;
```

### Set Base Price
```sql
UPDATE products SET wholesale_price = 99.99 WHERE id = ?;
```

### Add Tier
```sql
INSERT INTO wholesale_pricing (product_id, tier_name, minimum_quantity, unit_price)
VALUES ('product-id', 'Gold', 50, 79.99);
```

### Hide from Retail
```sql
UPDATE products SET wholesale_only = true WHERE id = ?;
```

---

## 📞 Support

**Admin Interfaces:**
- `/admin/wholesale-pricing` - Bulk management
- `/admin/products/[id]/wholesale-pricing` - Individual product

**Documentation:**
- `HYBRID_VENDOR_GUIDE.md` - Vendor configuration
- `WHOLESALE_SETUP_COMPLETE.md` - Full setup guide

---

## ✅ Pricing Checklist

Before launching wholesale pricing:

- [ ] Set retail price (baseline)
- [ ] Calculate wholesale base price
- [ ] Determine minimum order quantity
- [ ] Create 2-4 pricing tiers
- [ ] Test pricing calculator
- [ ] Verify profit margins
- [ ] Review competitor pricing
- [ ] Test checkout with various quantities
- [ ] Confirm tier thresholds work
- [ ] Document pricing policy

---

## 🎉 Summary

**Your pricing system includes:**
- ✅ Dual pricing (retail + wholesale)
- ✅ Tier-based volume discounts
- ✅ Minimum order quantities
- ✅ Admin management interfaces
- ✅ Automatic discount calculation
- ✅ Pricing calculator
- ✅ Bulk pricing tools
- ✅ Market segmentation

**Access pricing tools:**
- Individual: `/admin/products/[id]/wholesale-pricing`
- Bulk: `/admin/wholesale-pricing`

