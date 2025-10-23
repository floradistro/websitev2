# 🔄 Unit Synchronization System

## The Core Concept

**Everything is stored in ONE base unit in the database, but displayed in ANY unit to users.**

This means:
- ✅ 453.592 grams = 1 pound = 16 ounces (SAME STOCK, different views)
- ✅ 1000 milliliters = 1 liter (SAME STOCK, different views)
- ✅ All conversions happen automatically
- ✅ No duplication, no confusion

---

## 🎯 How It Works

### Database Storage (Base Units):
```
┌─────────────────┬──────────────┬────────────┐
│ Product Type    │ Stored As    │ Base Unit  │
├─────────────────┼──────────────┼────────────┤
│ Flower          │ GRAMS        │ gram       │
│ Concentrates    │ GRAMS        │ gram       │
│ Edibles (solid) │ GRAMS        │ gram       │
│ Tinctures       │ MILLILITERS  │ milliliter │
│ Oils/Liquids    │ MILLILITERS  │ milliliter │
│ Accessories     │ UNITS        │ unit       │
│ Pre-rolls       │ UNITS        │ unit       │
└─────────────────┴──────────────┴────────────┘
```

### User Display (Converted):
```
┌─────────────────────────────────────────────────────┐
│ Stock Level: 453.592 grams (in database)           │
├─────────────────────────────────────────────────────┤
│ Retail Vendor sees:     "453g in stock"            │
│ Wholesale Vendor sees:  "1 lb in stock"            │
│ Customer sees:          "16 oz available"          │
│                                                     │
│ ALL SHOWING THE SAME STOCK! ✅                      │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Weight Conversions (Base: Gram)

```
1 milligram (mg)   = 0.001 grams
1 gram (g)         = 1 gram          ← BASE UNIT
1 ounce (oz)       = 28.3495 grams
1 pound (lb)       = 453.592 grams
1 kilogram (kg)    = 1000 grams
```

### Example Synchronized Views:

**Database:** `453.592 grams`

**Views:**
- Retail: "453g"
- Wholesale: "1 lb"  
- Metric: "0.45 kg"
- Imperial: "16 oz"

**All showing THE SAME inventory!** 🎯

---

## 💧 Volume Conversions (Base: Milliliter)

```
1 milliliter (ml)  = 1 milliliter    ← BASE UNIT
1 liter (L)        = 1000 milliliters
1 fluid ounce      = 29.5735 milliliters
1 gallon           = 3785.41 milliliters
```

### Example Synchronized Views:

**Database:** `1000 milliliters`

**Views:**
- Retail: "1000ml"
- Metric: "1 L"
- Imperial: "33.8 fl oz"
- Wholesale: "0.26 gal"

**All showing THE SAME inventory!** 🎯

---

## 🛒 Real-World Example

### Scenario: Wholesale Flower Vendor

**Vendor adds stock:**
```
Add 5 pounds to inventory
```

**System converts:**
```
5 lbs × 453.592 = 2267.96 grams (stored in DB)
```

**Different users see different views:**

| User Type | Preferred Unit | What They See |
|-----------|----------------|---------------|
| Retail Customer | Grams | "2268g in stock" |
| Wholesale Customer | Pounds | "5 lbs in stock" |
| Vendor (metric) | Kilograms | "2.27 kg in stock" |
| Vendor (imperial) | Ounces | "80 oz in stock" |

**But it's ALL the same stock!** Everyone is looking at the same 2267.96 grams, just in different units.

---

## 🎨 Vendor Experience

### Setting Up Product Units:

1. **Create/Edit Product**
2. **Select Measurement Type:**
   - 🏋️ Weight (flower, concentrates, most products)
   - 💧 Volume (tinctures, oils, liquids)
   - 📦 Count (edibles, accessories, pre-rolls)

3. **Choose Display Preference:**
   - Retail vendor → grams
   - Wholesale vendor → pounds
   - International → kilograms

4. **System handles all conversions automatically!**

---

## 💡 Use Cases

### Use Case 1: Retail Flower
```
Product: Blue Dream Flower
Measurement Type: Weight
Base Unit: gram
Display Preference: gram

Pricing Tiers:
  1g = $15
  3.5g = $45
  7g = $80
  28g = $250
  
Stock: 1000g
Customer sees: "1kg in stock" or "35.27 oz" or "2.2 lbs"
```

### Use Case 2: Wholesale Flower
```
Product: Bulk Blue Dream
Measurement Type: Weight
Base Unit: gram (stored)
Display Preference: pound (show)

Pricing Tiers:
  1 lb = $1200
  5 lbs = $5500
  10 lbs = $10000

Stock: 4535.92g (stored)
Vendor sees: "10 lbs in stock"
Customer sees: "10 lbs available"
```

### Use Case 3: CBD Tincture
```
Product: CBD Oil 1000mg
Measurement Type: Volume
Base Unit: milliliter
Display Preference: milliliter

Pricing:
  30ml = $40
  60ml = $70
  
Stock: 500ml
Customer sees: "500ml" or "16.9 fl oz"
```

### Use Case 4: Edibles
```
Product: Gummies
Measurement Type: Count
Base Unit: unit
Display Preference: piece

Pricing:
  10 pieces = $25
  20 pieces = $45
  
Stock: 500 units
Customer sees: "500 available"
```

---

## 🔧 Technical Implementation

### Frontend (lib/unit-conversion.ts):
```typescript
// Convert TO base unit (for storage)
toGrams(1, 'pound')          → 453.592 grams
toMilliliters(1, 'liter')    → 1000 milliliters

// Convert FROM base unit (for display)
fromGrams(453.592, 'pound')  → 1 pound
fromMilliliters(1000, 'liter') → 1 liter

// Universal converter (auto-detects type)
convertToBaseUnit(1, 'pound')      → 453.592
convertFromBaseUnit(453.592, 'pound') → 1

// Smart formatting
formatWeight(453.592, 'pound')     → "1.0 lb"
formatVolume(1000, 'liter')        → "1.0 L"
formatQuantity(453.592, 'pound')   → "1.0 lb" (auto-detects)
```

### Database:
```sql
-- Everything stored in base units
products.stock_quantity: 453.592  (grams)
products.base_unit: 'gram'
products.preferred_display_unit: 'pound'

-- User sees: "1 lb"
-- Database has: 453.592 grams
-- Perfect synchronization ✅
```

---

## 📱 User Interface

### Inventory Page Example:

```
┌─────────────────────────────────────────────┐
│ Blue Dream Flower                           │
│ Stock: 1 lb (453g)    ← Shows both units!  │
│                                             │
│ Display Preference: [Pounds ▼]             │
│   • Grams                                   │
│   • Ounces                                  │
│   • Pounds      ✓                          │
│   • Kilograms                               │
└─────────────────────────────────────────────┘
```

User changes to "Grams" → instantly shows "453g"
Stock level unchanged, just the display!

---

## ✅ Benefits

### For Vendors:
- 🎯 Choose their preferred unit
- 📊 See stock in familiar terms
- 🔄 Switch views anytime
- ✅ No manual conversion needed

### For Customers:
- 🌍 See units they understand
- 📱 Consistent across platform
- ✅ Accurate stock levels

### For Platform:
- 💾 Single source of truth
- 🔒 No inventory drift
- 🚀 Scalable worldwide
- ✅ Multi-market ready

---

## 🚀 Setup Steps

1. **Run SQL:** Execute `SETUP_UNIT_SYSTEM.sql` in Supabase
2. **Refresh app:** Unit system is now active
3. **Configure products:** Set measurement type and preferred units
4. **Done!** Everything synchronized automatically

---

## 🎓 Quick Reference

| Conversion | Formula |
|------------|---------|
| **Pounds to Grams** | multiply by 453.592 |
| **Grams to Pounds** | divide by 453.592 |
| **Ounces to Grams** | multiply by 28.3495 |
| **Liters to ML** | multiply by 1000 |
| **ML to Liters** | divide by 1000 |

**Remember:** Database always stores in BASE unit (grams/milliliters/units), display converts automatically! 🎉

---

That's it! One stock level, infinite views, perfect synchronization. 💪

