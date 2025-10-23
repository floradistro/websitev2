# 🏪 Hybrid Vendor Guide: Retail + Wholesale

## Overview

Your wholesale system supports **hybrid vendors** who operate as BOTH retailers and distributors. This allows a single vendor to:
- ✅ Sell to consumers (retail)
- ✅ Sell to businesses (wholesale)
- ✅ Use different pricing for each market
- ✅ Maintain separate product catalogs

---

## 🎯 Three Vendor Types

### 1. **Standard (Retail Only)**
- Sells directly to consumers
- Products visible on main marketplace
- No wholesale capabilities
- Default for new vendors

### 2. **Distributor (Wholesale Only)**
- Sells only to vendors and approved businesses
- Products hidden from consumers
- Only visible in `/wholesale` marketplace
- Requires wholesale approval to view

### 3. **Both (Hybrid) ⭐ RECOMMENDED**
- Operates in BOTH markets
- Can have retail products AND wholesale products
- Dual pricing structures
- Maximum flexibility

---

## 🔧 Setting Up a Hybrid Vendor

### Method 1: Admin UI (Easy)

1. Go to `/admin/vendors`
2. Click on a vendor
3. Click "Wholesale Settings"
4. Select **"Both (Retail + Wholesale)"**
5. Configure:
   - Enable wholesale operations
   - Set minimum order amount (e.g., $500)
   - Add distributor terms
   - Optional: Add license info
6. Click "Save"

### Method 2: SQL (Direct)

```sql
UPDATE vendors 
SET 
  vendor_type = 'both',
  wholesale_enabled = true,
  minimum_order_amount = 500.00,
  distributor_terms = 'Retail and wholesale available. Volume discounts for wholesale orders over $500.'
WHERE id = 'YOUR_VENDOR_ID';
```

---

## 📦 Product Configuration

For hybrid vendors, you can configure products individually:

### Retail-Only Product
```sql
UPDATE products
SET
  is_wholesale = false,
  wholesale_only = false
WHERE id = 'product-id';
```
**Result:** Visible only on main marketplace to consumers

### Wholesale-Only Product
```sql
UPDATE products
SET
  is_wholesale = true,
  wholesale_only = true,
  minimum_wholesale_quantity = 10,
  wholesale_price = 99.99
WHERE id = 'product-id';
```
**Result:** Visible only in `/wholesale` to approved buyers

### Available to Both Markets
```sql
UPDATE products
SET
  is_wholesale = true,
  wholesale_only = false,
  regular_price = 149.99,
  wholesale_price = 99.99,
  minimum_wholesale_quantity = 10
WHERE id = 'product-id';
```
**Result:** 
- Consumers see it for $149.99 (retail price)
- Wholesale buyers see it for $99.99 with 10+ unit minimum

---

## 💰 Dual Pricing Example

### Product: "Premium Widget"

**Retail Customers:**
- Price: $149.99
- Quantity: 1 minimum
- Available: Main marketplace

**Wholesale Customers:**
- Price: $99.99 (33% discount)
- Quantity: 10 minimum
- Available: Wholesale marketplace
- Tier pricing:
  - 10-49 units: $99.99/ea
  - 50-99 units: $89.99/ea
  - 100+ units: $79.99/ea

---

## 🎨 User Experience

### For Consumers
1. Visit main marketplace
2. See retail products at retail prices
3. Cannot see wholesale-only products
4. Normal checkout process

### For Wholesale Buyers
1. Login (must be vendor or approved customer)
2. Click "Wholesale" button in header
3. Access `/wholesale` marketplace
4. See wholesale products with bulk pricing
5. View products from hybrid vendors
6. Get wholesale discounts

### For Hybrid Vendors
1. Manage one store
2. Upload products once
3. Set retail vs wholesale flags
4. Different pricing per market
5. Track all sales in one dashboard

---

## 📊 Business Models

### Example 1: Cannabis Retailer → Distributor

**Before (Standard):**
- Retail dispensary
- Walk-in customers only
- Limited revenue

**After (Both):**
- Still serves retail customers
- Also supplies other dispensaries
- Wholesale revenue stream
- 2x total revenue

### Example 2: Manufacturer with Storefront

**Configuration:**
- Vendor type: `both`
- Retail products: Packaged goods for consumers
- Wholesale products: Bulk inventory for resellers
- Different SKUs for each market

### Example 3: Multi-Brand Operator

**Setup:**
- Consumer brand: Premium packaging, higher prices
- B2B brand: Bulk quantities, wholesale pricing
- Same inventory, different positioning

---

## 🔐 Access Control

### Who Sees What?

| Product Type | Consumers | Wholesale Customers | Vendors |
|-------------|-----------|-------------------|---------|
| Retail only | ✅ | ❌ | ❌ |
| Wholesale only | ❌ | ✅ | ✅ |
| Both markets | ✅ (retail price) | ✅ (wholesale price) | ✅ (wholesale price) |

---

## 🚀 Getting Started

### Step 1: Configure Vendor
```
Visit: /admin/vendors/[vendor-id]/wholesale-settings
Select: "Both (Retail + Wholesale)"
Enable: Wholesale operations
Set: Minimum order amount
```

### Step 2: Create Products
- Upload products as normal
- Mark wholesale products: `is_wholesale = true`
- Set wholesale pricing
- Add tier pricing (optional)

### Step 3: Test
- View retail site as consumer
- Login as vendor/wholesale customer
- Check wholesale marketplace
- Verify pricing differences

---

## 💡 Best Practices

### ✅ DO:
- Set clear minimum order amounts
- Offer volume discounts for wholesale
- Write detailed distributor terms
- Keep retail and wholesale SKUs organized
- Use tier pricing to encourage bulk orders

### ❌ DON'T:
- Make wholesale prices higher than retail
- Set minimum orders too low (defeats purpose)
- Forget to enable wholesale operations
- Mix up retail vs wholesale product flags

---

## 📈 Revenue Optimization

### Pricing Strategy
```
Retail Price: $150 (Base + margin for individual sales)
Wholesale Tiers:
  - 10-49 units: $100 (33% off - small wholesale)
  - 50-99 units: $90 (40% off - medium wholesale)  
  - 100+ units: $80 (47% off - large wholesale)
```

### Why This Works:
- Retail maintains brand value
- Wholesale volume compensates for lower margin
- Tiered pricing encourages larger orders
- Both channels remain profitable

---

## 🔍 Monitoring

### Track Performance
- Retail revenue vs wholesale revenue
- Average order value by type
- Customer acquisition by channel
- Inventory turnover rates

### Admin Dashboard Shows:
- Total products by type
- Wholesale vs retail sales
- Pending wholesale applications
- Revenue by channel

---

## 🛠️ Technical Details

### Database Schema
```sql
vendor_type ENUM('standard', 'distributor', 'both')
wholesale_enabled BOOLEAN
minimum_order_amount DECIMAL(10,2)
distributor_terms TEXT
```

### Product Schema
```sql
is_wholesale BOOLEAN         -- Sold in wholesale marketplace?
wholesale_only BOOLEAN        -- Hidden from consumers?
regular_price DECIMAL(10,2)  -- Retail price
wholesale_price DECIMAL(10,2) -- Base wholesale price
minimum_wholesale_quantity DECIMAL(10,2)
```

### Tier Pricing
```sql
CREATE TABLE wholesale_pricing (
  product_id UUID,
  vendor_id UUID,
  tier_name TEXT,
  minimum_quantity DECIMAL,
  unit_price DECIMAL,
  discount_percentage DECIMAL
)
```

---

## 🎓 Examples in Action

### Configure Hybrid Vendor (SQL)
```sql
-- Make vendor hybrid
UPDATE vendors SET 
  vendor_type = 'both',
  wholesale_enabled = true,
  minimum_order_amount = 1000,
  distributor_terms = 'Net 30 payment terms. Free shipping on orders over $2000.'
WHERE store_name = 'Acme Wholesale';
```

### Create Dual-Market Product
```sql
-- Create product available in both markets
INSERT INTO products (
  name, slug, vendor_id,
  is_wholesale, wholesale_only,
  regular_price, wholesale_price,
  minimum_wholesale_quantity
) VALUES (
  'Premium Extract 1oz',
  'premium-extract-1oz',
  'vendor-uuid',
  true,     -- Available for wholesale
  false,    -- ALSO available retail
  199.99,   -- Retail price
  149.99,   -- Wholesale base price
  5         -- Wholesale minimum: 5 units
);

-- Add tier pricing for bulk orders
INSERT INTO wholesale_pricing (product_id, vendor_id, tier_name, minimum_quantity, unit_price)
VALUES 
  ('product-uuid', 'vendor-uuid', 'Bronze', 5, 149.99),
  ('product-uuid', 'vendor-uuid', 'Silver', 25, 139.99),
  ('product-uuid', 'vendor-uuid', 'Gold', 50, 129.99);
```

---

## 📞 Support

**Admin UI:**
- `/admin/vendors/[id]/wholesale-settings` - Configure vendor
- `/admin/wholesale-applications` - Review applications

**Documentation:**
- `WHOLESALE_SETUP_COMPLETE.md` - Full setup guide
- `WHOLESALE_IMPLEMENTATION.md` - Technical details

**Test Page:**
- `http://localhost:3000/test-wholesale.html`

---

## ✅ Checklist

Before going live with a hybrid vendor:

- [ ] Set vendor type to "both"
- [ ] Enable wholesale operations
- [ ] Set minimum order amount
- [ ] Write distributor terms
- [ ] Upload products
- [ ] Mark wholesale products
- [ ] Set dual pricing
- [ ] Add tier pricing
- [ ] Test retail checkout
- [ ] Test wholesale checkout
- [ ] Verify pricing differences
- [ ] Confirm minimum quantities work

---

## 🎉 Summary

**The "both" vendor type gives you maximum flexibility:**
- One store, two revenue streams
- Serve consumers AND businesses
- Different pricing for each market
- Manage everything in one place

**This is the recommended setup for:**
- Established retailers expanding into B2B
- Manufacturers with direct-to-consumer brands
- Multi-channel operations
- Growth-focused vendors

---

**Ready to enable hybrid mode? Use the admin UI:**
`/admin/vendors/[vendor-id]/wholesale-settings`

