# 🎯 Complete Tier Management Guide

## ✅ You Can Now:

### 1. **Add Custom Tiers**
Click **"+ Add Tier"** to create your own tier structures

### 2. **Remove Tiers**
Click the trash icon 🗑️ to delete a tier you don't need

### 3. **Enable/Disable Tiers**
Checkbox for each tier - uncheck to temporarily disable without deleting

### 4. **Customize Everything**
- Edit tier names
- Set min/max quantity ranges
- Configure prices per tier

### 5. **Disable Entire Pricing Structure**
Click **"Disable"** button in header to deactivate all pricing

---

## 📋 Complete UI Features

### Per-Tier Controls:
```
[✓] Active | Tier Name | Min Qty | Max Qty | Unit | Price | [🗑️]
```

- **Checkbox** - Enable/disable this tier
- **Tier Name** - Rename it (e.g., "Bulk Discount", "Premium Tier")
- **Min Qty** - Minimum quantity for this tier
- **Max Qty** - Maximum quantity (or ∞ for unlimited)
- **Unit** - Shows lb/g/oz
- **Price** - Your price for this tier
- **Trash Icon** - Permanently delete this tier

### Wholesale Tiered Example:

```
┌────────────────────────────────────────────────────┐
│ ✅ Wholesale Tiered                    [Disable]   │
├────────────────────────────────────────────────────┤
│ 3 of 4 tiers active                  [+ Add Tier]  │
├────────────────────────────────────────────────────┤
│ [✓] Small Orders     | 1-9 lbs   | $1400/lb  [🗑️] │
│ [✓] Medium Orders    | 10-19 lbs | $1200/lb  [🗑️] │
│ [✓] Bulk Orders      | 20-49 lbs | $1000/lb  [🗑️] │
│ [ ] Super Bulk       | 50+ lbs   | $800/lb   [🗑️] │  ← Disabled
│                                                     │
│                           [Save Configuration]     │
└────────────────────────────────────────────────────┘
```

---

## 💡 Use Cases

### Use Case 1: Flat Rate (Simple)
**Wholesale Cost Plus:**
```
[✓] Per Pound | 1 lb | $1100/lb
```
One tier, one price. Done.

### Use Case 2: Volume Discounts (Your 1-10, 10-20 Example)
**Wholesale Tiered:**
```
[✓] Tier 1 | 1-10 lbs   | $1400/lb
[✓] Tier 2 | 10-20 lbs  | $1200/lb
[✓] Tier 3 | 20+ lbs    | $1000/lb
```

Click "+ Add Tier" to add more ranges!

### Use Case 3: Seasonal Pricing
**Disable tiers temporarily:**
```
[✓] Summer Tier  | 1-10 lbs | $1200/lb  ← Active
[ ] Winter Tier  | 1-10 lbs | $1400/lb  ← Disabled (off-season)
```

Just uncheck the box - don't delete it. Re-enable when needed!

### Use Case 4: Hybrid Vendor
**Both Retail + Wholesale:**

**Retail Flower:**
```
[✓] 1g    | $15
[✓] 3.5g  | $45
[✓] 7g    | $80
[✓] 14g   | $140
[✓] 28g   | $250
```

**Wholesale Cost Plus:**
```
[✓] Per Pound | $1100/lb
```

Both active, both apply to all products automatically!

---

## 🎮 Controls Summary

| Action | How |
|--------|-----|
| **Add Tier** | Click "+ Add Tier" button |
| **Remove Tier** | Click trash icon 🗑️ |
| **Enable Tier** | Check the checkbox ✓ |
| **Disable Tier** | Uncheck the checkbox |
| **Edit Tier** | Type directly in input fields |
| **Disable All Pricing** | Click "Disable" in header |
| **Save Changes** | Click "Save Configuration" |

---

## 🎨 Visual States

### Active Tier:
- ✅ Checkbox checked
- Full opacity
- All fields editable
- Shown to customers

### Disabled Tier:
- ⬜ Checkbox unchecked
- 40% opacity (grayed out)
- Fields locked
- Hidden from customers
- Red text: "Disabled - Not shown to customers"

### Entire Config Disabled:
- Removed from products
- Can re-enable from "Add Pricing Structure" section

---

## ⚡ Smart Features

### 1. **Auto-Counter**
Shows: "3 of 4 tiers active" - quick visual check

### 2. **Validation**
Can't save without at least one enabled tier with a price

### 3. **Contextual Help**
Shows examples for wholesale tiered pricing

### 4. **Non-Destructive**
Disable = temporary, Remove = permanent

---

## 🚀 Workflow

1. **Enable a pricing structure** (Retail or Wholesale)
2. **Configure your tiers:**
   - Add more if needed
   - Set quantity ranges
   - Set prices
   - Enable/disable as needed
3. **Save**
4. ✅ **Auto-applies to ALL products**

No manual assignment, no confusion, just works! 🎉

---

## 📱 Mobile-Friendly

- Stacks vertically on mobile
- Touch-friendly toggles
- Easy to add/remove tiers
- Clear visual feedback

---

That's it! Complete control, super simple. 💪

