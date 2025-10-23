# 💰 Cost Tracking & Dual Unit System Guide

## Overview

This system provides:
1. **Cost Tracking** - Vendors can track product costs and see profit margins
2. **Dual Unit System** - Display grams for retail, pounds for wholesale
3. **Automatic Calculations** - Profit margins calculated automatically
4. **Privacy** - Cost data only visible to vendor and admins

---

## 1. Cost Tracking

### Database Fields

```sql
products:
  - cost_price: DECIMAL(10,2)          -- Your cost per unit
  - margin_percentage: DECIMAL(5,2)    -- Auto-calculated: (price - cost) / price * 100
  
Example:
  cost_price: $10.00
  regular_price: $15.00
  margin_percentage: 33.33%            -- Automatically calculated
  profit_per_unit: $5.00
```

### How It Works

```
Vendor adds product:
├─ Name: "Blue Dream"
├─ Cost: $8.00/gram (what you pay supplier)
├─ Retail Price: $12.00/gram (what customer pays)
└─ System calculates:
   ├─ Margin: 33.33%
   ├─ Profit: $4.00/gram
   └─ Inventory Value: $8 × stock_quantity
```

### Privacy & Security

✅ **Cost is PRIVATE:**
- Only visible to the vendor who owns the product
- Only visible to platform admins
- **NEVER visible to customers**
- **NEVER visible to other vendors**

✅ **Audit Trail:**
- All cost changes are logged
- History tracked in `product_cost_history` table
- For accounting and analytics

### Profit Analysis View

```sql
-- Vendors can query their margins
SELECT * FROM vendor_profit_margins
WHERE vendor_id = 'your-vendor-id'
ORDER BY margin_percentage DESC;

Shows:
- Product name
- Cost price
- Selling price
- Margin %
- Profit per unit
- Total inventory value
- Potential profit
```

---

## 2. Dual Unit System (Grams vs Pounds)

### Problem

Cannabis industry has unique needs:
- **Retail customers** think in grams (1g, 3.5g, 7g, 14g, 28g)
- **Wholesale customers** think in pounds (¼ lb, ½ lb, 1 lb, 5 lb, 10 lb)
- Need to display the same product differently based on context

### Solution

**Store everything in GRAMS (base unit) in database**
**Display in appropriate units based on context**

```
Database (always grams):
├─ qty: 453.6 grams
│
Display to Retail:
├─ "28g (1 oz)" ← gram-focused
│
Display to Wholesale:
└─ "1 lb (454g)" ← pound-focused
```

### Pricing Blueprints

#### Retail Blueprint (Gram-based)
```json
{
  "name": "Retail Cannabis Flower (Grams)",
  "display_unit": "gram",
  "context": "retail",
  "price_breaks": [
    {"qty": 1,    "display": "1g"},
    {"qty": 3.5,  "display": "3.5g (⅛ oz)"},
    {"qty": 7,    "display": "7g (¼ oz)"},
    {"qty": 14,   "display": "14g (½ oz)"},
    {"qty": 28,   "display": "28g (1 oz)"}
  ]
}
```

#### Wholesale Blueprint (Pound-based)
```json
{
  "name": "Wholesale Cannabis Flower (Pounds)",
  "display_unit": "pound",
  "context": "wholesale",
  "price_breaks": [
    {"qty": 113.4,  "display": "¼ lb (113g)",  "display_qty": 0.25},
    {"qty": 226.8,  "display": "½ lb (227g)",  "display_qty": 0.5},
    {"qty": 453.6,  "display": "1 lb (454g)",  "display_qty": 1},
    {"qty": 2268,   "display": "5 lbs",        "display_qty": 5},
    {"qty": 4536,   "display": "10 lbs",       "display_qty": 10}
  ]
}
```

### Conversion Formula

```sql
-- Function to convert stored grams to display unit
convert_weight_to_display(quantity_grams, display_unit)

Examples:
- convert_weight_to_display(453.6, 'pound')  → 1.0 lb
- convert_weight_to_display(453.6, 'gram')   → 453.6 g
- convert_weight_to_display(453.6, 'ounce')  → 16.0 oz
```

### Vendor Settings

```sql
vendors:
  - retail_display_unit: 'gram'      -- Default for retail customers
  - wholesale_display_unit: 'pound'  -- Default for wholesale
  - track_cost_of_goods: true        -- Enable cost tracking
```

---

## 3. Complete Workflow Example

### Scenario: Distributor with Dual Pricing

```
Product: "Gelato #33"
Cost: $2,000/lb ($4.41/gram)

1️⃣ Create Retail Blueprint:
   - 1g: $15
   - 3.5g: $50 ($14.29/g) ← 5% discount
   - 7g: $90 ($12.86/g) ← 14% discount
   - 14g: $160 ($11.43/g) ← 24% discount
   - 28g: $280 ($10/g) ← 33% discount

2️⃣ Create Wholesale Blueprint:
   - ¼ lb (113g): $900 ($7.96/g) ← wholesale price
   - ½ lb (227g): $1,700 ($7.49/g) ← better rate
   - 1 lb (454g): $3,200 ($7.05/g) ← best rate
   - 5 lb: $15,000 ($6.61/g)
   - 10 lb: $28,000 ($6.17/g)

3️⃣ System Calculates Margins:
   Retail:
   - 1g: Cost $4.41 → Sell $15 → Margin 70.6% 💰
   - 28g: Cost $123 → Sell $280 → Margin 56.1% 💰
   
   Wholesale:
   - 1 lb: Cost $2,000 → Sell $3,200 → Margin 37.5% 💰
   - 10 lb: Cost $20,000 → Sell $28,000 → Margin 28.6% 💰

4️⃣ Display to Customers:
   Retail Customer sees:
   ├─ 1g for $15
   ├─ 3.5g for $50
   └─ "Save 33% when you buy an ounce!"
   
   Wholesale Customer sees:
   ├─ ¼ lb for $900
   ├─ 1 lb for $3,200
   └─ "Volume discounts available!"
```

---

## 4. Implementation in Vendor Portal

### Product Form Updates Needed

```tsx
// app/vendor/products/new/page.tsx
// Add cost tracking field

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* COST PRICE (Private) */}
  <div>
    <label className="block text-white/80 text-sm mb-2">
      Cost Price (Your Cost) 
      <span className="text-white/40 text-xs ml-2">🔒 Private</span>
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
      <input
        type="number"
        step="0.01"
        value={formData.cost_price}
        onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
        placeholder="10.00"
        className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-8 pr-4 py-3 rounded"
      />
    </div>
    <p className="text-white/40 text-xs mt-1">
      Your cost per unit (not visible to customers)
    </p>
  </div>

  {/* RETAIL PRICE */}
  <div>
    <label className="block text-white/80 text-sm mb-2">
      Retail Price <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
      <input
        type="number"
        step="0.01"
        required
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: e.target.value})}
        placeholder="15.00"
        className="w-full bg-white/5 border border-white/10 text-white pl-8 pr-4 py-3 rounded"
      />
    </div>
    
    {/* Auto-calculated margin */}
    {formData.cost_price && formData.price && (
      <div className="mt-2 text-xs">
        <span className="text-green-400">
          Margin: {calculateMargin(formData.cost_price, formData.price)}%
        </span>
        <span className="text-white/40 ml-2">
          Profit: ${(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)}/unit
        </span>
      </div>
    )}
  </div>
</div>

{/* PRICING CONTEXT SELECTOR */}
<div className="mb-6">
  <label className="block text-white/80 text-sm mb-2">
    Pricing Context
  </label>
  <div className="flex gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="pricing_context"
        value="retail"
        checked={pricingContext === 'retail'}
        onChange={(e) => setPricingContext(e.target.value)}
      />
      <span className="text-white">Retail (Display in grams)</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="pricing_context"
        value="wholesale"
        checked={pricingContext === 'wholesale'}
        onChange={(e) => setPricingContext(e.target.value)}
      />
      <span className="text-white">Wholesale (Display in pounds)</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="pricing_context"
        value="both"
        checked={pricingContext === 'both'}
        onChange={(e) => setPricingContext(e.target.value)}
      />
      <span className="text-white">Both</span>
    </label>
  </div>
</div>
```

### Helper Function
```typescript
// Calculate margin percentage
function calculateMargin(cost: string, price: string): string {
  const c = parseFloat(cost);
  const p = parseFloat(price);
  if (c > 0 && p > 0) {
    return ((p - c) / p * 100).toFixed(1);
  }
  return '0';
}

// Convert grams to display unit
function convertToDisplayUnit(grams: number, unit: 'gram' | 'ounce' | 'pound'): string {
  switch(unit) {
    case 'ounce': return (grams / 28.3495).toFixed(2) + ' oz';
    case 'pound': return (grams / 453.592).toFixed(2) + ' lb';
    default: return grams.toFixed(1) + ' g';
  }
}
```

---

## 5. Admin Controls

### Create Preset Blueprints

```typescript
// Admin can create pricing templates
const retailBlueprint = {
  name: "Retail Cannabis Flower (Grams)",
  display_unit: "gram",
  context: "retail",
  price_breaks: [
    {qty: 1, label: "1 gram"},
    {qty: 3.5, label: "Eighth (3.5g)"},
    {qty: 7, label: "Quarter (7g)"},
    {qty: 14, label: "Half (14g)"},
    {qty: 28, label: "Ounce (28g)"}
  ]
};

const wholesaleBlueprint = {
  name: "Wholesale Cannabis Flower (Pounds)",
  display_unit: "pound",
  context: "wholesale",
  price_breaks: [
    {qty: 113.4, label: "¼ lb", display_qty: 0.25, display_unit: "lb"},
    {qty: 226.8, label: "½ lb", display_qty: 0.5, display_unit: "lb"},
    {qty: 453.6, label: "1 lb", display_qty: 1, display_unit: "lb"},
    {qty: 2268, label: "5 lbs", display_qty: 5, display_unit: "lb"},
    {qty: 4536, label: "10 lbs", display_qty: 10, display_unit: "lb"}
  ]
};
```

---

## 6. Benefits

### For Vendors
✅ Track real profit margins  
✅ Know inventory value  
✅ Make informed pricing decisions  
✅ Separate retail vs wholesale pricing  
✅ Automatic unit conversion  
✅ Professional presentation  

### For Platform
✅ Enterprise-grade cost tracking  
✅ Flexible unit system  
✅ Dual marketplace (retail + wholesale)  
✅ Vendor profitability insights  
✅ Data-driven recommendations  

### For Customers
✅ Appropriate units for their context  
✅ Clear pricing (grams for small, pounds for bulk)  
✅ Volume discount visibility  
✅ Professional presentation  

---

## 7. Reporting & Analytics

### Vendor Dashboard Widgets

```typescript
// Profit Margin Summary
{
  "total_products": 150,
  "avg_margin": 42.5,
  "inventory_cost_value": 125000,
  "potential_profit": 75000,
  "top_margin_products": [...]
}

// Low Margin Alert
{
  "products_below_threshold": [
    {
      "name": "Product X",
      "margin": 12.5,
      "cost": 10,
      "price": 11.43,
      "recommendation": "Consider price increase"
    }
  ]
}
```

---

## 8. Migration Steps

```bash
# 1. Run the migration
psql -h your-db.supabase.co -U postgres -d postgres -f supabase/migrations/20251024_cost_tracking_and_dual_units.sql

# 2. Update vendor product forms to include cost_price field

# 3. Create preset blueprints via admin panel

# 4. Notify vendors of new cost tracking feature

# 5. Train vendors on dual unit system
```

---

## 9. Future Enhancements

- [ ] Bulk cost import via CSV
- [ ] Cost trend analysis over time
- [ ] Automated repricing suggestions
- [ ] Competitor price comparison
- [ ] Multi-currency support
- [ ] Cost allocation for bundles
- [ ] Landed cost calculation (shipping, taxes, etc.)
- [ ] Inventory valuation methods (FIFO, LIFO, Average)

---

## Summary

✅ **Cost Tracking**: Vendors see their margins, customers never see costs  
✅ **Dual Units**: Grams for retail, pounds for wholesale  
✅ **Automatic Calculations**: Margins computed instantly  
✅ **Audit Trail**: All cost changes logged  
✅ **Flexible Display**: Context-aware unit presentation  
✅ **Privacy Protected**: RLS policies enforce data security  

**Next Steps:**
1. Run migration
2. Update product forms
3. Create pricing blueprints
4. Test with vendors
5. Roll out gradually


