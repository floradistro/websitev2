# 📊 Simplified Pricing System

## Philosophy: Keep It Simple

The pricing system has been simplified to eliminate confusion. **No pre-filled prices, no complex templates, no placeholders.**

---

## 🎯 Three Simple Templates

### 1. **Retail Flower** (Default)
**Structure:** 1g, 3.5g, 7g, 14g, 28g

Perfect for retail flower products sold by the gram.

```
1 gram (1g)
3.5g (Eighth)
7g (Quarter)
14g (Half Oz)
28g (Ounce)
```

Vendors set their own price for each tier.

---

### 2. **Wholesale Cost Plus**
**Structure:** Simple flat rate per pound

For wholesalers who want ONE flat markup on top of cost.

Example:
- Cost: $1000/lb
- Markup: $100/lb
- Selling Price: $1100/lb

No tiers, no complexity. Just set your per-pound rate.

---

### 3. **Wholesale Tiered**
**Structure:** Customizable volume tiers

For wholesalers who want volume discounts.

Default tiers:
- Tier 1: 1-9 lbs
- Tier 2: 10+ lbs

Vendors can customize the breaks and pricing.

---

## 🛠️ How It Works

### For Admins (Platform)
1. Go to `/admin/pricing-tiers`
2. Use **Quick Start Templates** to create blueprints
3. Blueprints are just structure templates (empty)
4. All vendors see these blueprint options

### For Vendors
1. Go to `/vendor/pricing`
2. Select which blueprint(s) to use
3. Set YOUR OWN prices for each tier
4. Assign blueprints to products

---

## 💡 Examples

### Retail Vendor Example:
**Uses:** Retail Flower blueprint

Sets prices:
- 1g: $15
- 3.5g: $45
- 7g: $80
- 14g: $140
- 28g: $250

### Wholesale Vendor Example (Flat Rate):
**Uses:** Wholesale Cost Plus blueprint

Cost: $1200/lb
Markup: $150/lb
Selling: $1350/lb

### Wholesale Vendor Example (Tiered):
**Uses:** Wholesale Tiered blueprint

- 1-9 lbs: $1400/lb
- 10+ lbs: $1250/lb

---

## ✅ What Changed

### Before (Confusing):
- Multiple complex templates
- Pre-filled "suggested" prices
- Discount percentages
- Medical/Staff templates
- Concentrate templates

### After (Simple):
- 3 clean templates
- NO pre-filled prices
- NO suggestions or placeholders
- Clear structure only

---

## 🗄️ Database Migration

Run `SIMPLIFIED_PRICING_SETUP.sql` in your Supabase SQL Editor to:
1. Remove old confusing blueprints
2. Create the 3 simple templates
3. Clean up the database

---

## 📱 Vendor Experience

When vendors create pricing:
1. They see ONLY the structure (1g, 3.5g, etc.)
2. ALL price fields are **empty**
3. They fill in their own pricing
4. No confusion, no suggestions, no placeholders

---

## 🎨 UI Improvements

**Admin UI:**
- Quick Start Templates for one-click blueprint creation
- Clear descriptions
- No confusing options

**Vendor UI:**
- Shows assigned pricing tiers in inventory
- Edit cost price
- Edit selling prices per tier
- Shows retail vs wholesale context

---

That's it! Simple, clean, no confusion. 🎉

