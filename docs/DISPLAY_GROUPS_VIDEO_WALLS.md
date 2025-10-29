# Display Groups & Video Walls

**Status**: Architecture Complete
**Created**: 2025-10-29

## 🎯 Problem Statement

When you have **multiple TVs mounted next to each other** (like a video wall), they need to look **visually unified** even though they're showing different product categories.

### ❌ **Bad**: Mismatched Displays
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   TV 1      │ │   TV 2      │ │   TV 3      │
│   Flower    │ │   Edibles   │ │   Drinks    │
│             │ │             │ │             │
│ Dark theme  │ │ Bright theme│ │ Ocean theme │
│ 4×3 grid    │ │ 3×2 grid    │ │ Carousel    │
│ 24px fonts  │ │ 18px fonts  │ │ 32px fonts  │
└─────────────┘ └─────────────┘ └─────────────┘
      ↑               ↑               ↑
  Looks like 3 random screens - unprofessional!
```

### ✅ **Good**: Unified Display Group
```
┌─────────────┬─────────────┬─────────────┐
│   TV 1      │   TV 2      │   TV 3      │
│   Flower    │   Edibles   │   Drinks    │
│             │             │             │
│ Same theme  │ Same theme  │ Same theme  │
│ 4×3 grid    │ 4×3 grid    │ 4×3 grid    │
│ Same fonts  │ Same fonts  │ Same fonts  │
└─────────────┴─────────────┴─────────────┘
      ↑               ↑               ↑
  Looks like ONE cohesive installation!
```

---

## 🏗️ Architecture

### **Core Concept: Display Groups**

A **Display Group** is a collection of displays that:
1. Share the **same theme**
2. Use the **same grid layout**
3. Have **identical typography**
4. Use **same spacing**
5. But show **different categories**

### **Database Schema**

```sql
tv_display_groups:
  - name: "Main Wall Video Grid"
  - shared_theme: "midnight-elegance"
  - shared_display_mode: "dense"
  - shared_grid_columns: 4
  - shared_grid_rows: 3
  - shared_typography: { productNameSize: 22, priceSize: 36 }

tv_display_group_members:
  - group_id: xxx
  - device_id: TV1
  - position_in_group: 1 (leftmost)
  - assigned_categories: ["Flower", "Pre-Rolls"]

  - group_id: xxx
  - device_id: TV2
  - position_in_group: 2 (middle)
  - assigned_categories: ["Edibles", "Beverages"]

  - group_id: xxx
  - device_id: TV3
  - position_in_group: 3 (rightmost)
  - assigned_categories: ["Concentrates"]
```

---

## 🎨 How It Works

### **Step 1: Create Display Group**

```
Vendor goes to: TV Menus → "Create Display Group"

┌────────────────────────────────────────┐
│  Create Display Group                  │
├────────────────────────────────────────┤
│  Name: [Main Wall - Premium Showcase] │
│                                        │
│  Select Displays:                      │
│  ☑ TV 1 (Entrance)                     │
│  ☑ TV 2 (Main Wall Left)               │
│  ☑ TV 3 (Main Wall Right)              │
│                                        │
│  [Next: Configure Layout]              │
└────────────────────────────────────────┘
```

### **Step 2: AI Analyzes the Group**

AI considers:
- **All 3 displays together** (not individually)
- Common viewing distance
- Shared location characteristics
- Combined product count

AI Output:
```
🤖 Analyzing 3-display group...

Recommended Unified Layout:
  • Theme: Midnight Elegance (dark, premium)
  • Grid: 4×3 (48 products per page across 3 displays)
  • Display Mode: Dense
  • Font Size: 22px product names, 36px prices
  • Spacing: 16px gaps

Confidence: 92%
```

### **Step 3: Assign Categories Per Display**

```
┌────────────────────────────────────────┐
│  Configure Categories                  │
├────────────────────────────────────────┤
│                                        │
│  [TV 1 - Leftmost]                     │
│  Categories: Flower, Pre-Rolls         │
│                                        │
│  [TV 2 - Middle]                       │
│  Categories: Edibles, Beverages        │
│                                        │
│  [TV 3 - Rightmost]                    │
│  Categories: Concentrates, Accessories │
│                                        │
│  💡 AI Suggestion: This distribution   │
│     balances product counts and        │
│     creates logical flow               │
│                                        │
│  [Apply to Group]                      │
└────────────────────────────────────────┘
```

### **Step 4: Visual Result**

```
┌─────────────┬─────────────┬─────────────┐
│   FLOWER    │   EDIBLES   │CONCENTRATES │
│             │             │             │
│ ┌─┬─┬─┬─┐   │ ┌─┬─┬─┬─┐   │ ┌─┬─┬─┬─┐   │
│ ├─┼─┼─┼─┤   │ ├─┼─┼─┼─┤   │ ├─┼─┼─┼─┤   │
│ └─┴─┴─┴─┘   │ └─┴─┴─┴─┘   │ └─┴─┴─┴─┘   │
│             │             │             │
│ Same theme, │ Same layout,│ Same style, │
│ Same grid   │ Same fonts  │ Different   │
│ 16 products │ 16 products │ categories  │
└─────────────┴─────────────┴─────────────┘
```

---

## 🚀 Advanced Features

### **1. Multi-Zone Groups**

Create different groups for different areas:

```
Store Setup:
┌─────────────────────────────────────────┐
│  GROUP 1: "Main Wall" (3 displays)     │
│    Theme: Dark, 4×3 grid                │
│    TV1: Flower | TV2: Edibles | TV3: Concentrates
│                                         │
│  GROUP 2: "Checkout" (2 displays)      │
│    Theme: Bright, 3×2 grid              │
│    TV4: Impulse | TV5: Accessories      │
│                                         │
│  GROUP 3: "Entrance" (1 display)       │
│    Theme: Premium, carousel             │
│    TV6: Featured Products               │
└─────────────────────────────────────────┘
```

### **2. Synchronized Carousels**

All displays in a group rotate in sync:

```
Time 0:00 - All show Page 1
Time 0:20 - All transition to Page 2 (synchronized!)
Time 0:40 - All transition to Page 3
```

### **3. AI Category Distribution**

AI suggests optimal category distribution:

```javascript
AI Analysis:
  Total Products: 120
  Displays: 3
  Target: ~40 products per display

Recommended Distribution:
  TV1: Flower (45 products) ✓ Balanced
  TV2: Edibles (38 products) ✓ Balanced
  TV3: Concentrates (37 products) ✓ Balanced

Alternative:
  TV1: High-Margin Products (30)
  TV2: Best Sellers (50)
  TV3: New Arrivals (40)
```

### **4. Quick Templates**

Pre-built group configurations:

```
Templates:
  • "3-Display Wall" → Flower | Edibles | Concentrates
  • "Checkout Duo" → Impulse Items | Add-Ons
  • "Premium Showcase" → High-End Only
  • "Daily Specials" → Promotions across all
```

---

## 📐 Layout Consistency Rules

### **What's Shared (Locked Across Group)**
✅ Theme
✅ Grid dimensions (columns × rows)
✅ Typography (font sizes)
✅ Spacing (gaps, padding, margins)
✅ Display mode (dense/carousel)
✅ Transition timing (for carousels)

### **What's Individual (Per Display)**
✅ Categories shown
✅ Actual products displayed
✅ Content (based on category filter)

---

## 🎯 Use Cases

### **Use Case 1: Dispensary Main Wall**
```
3 TVs side-by-side, 55" each

GROUP: "Main Product Wall"
  Theme: Midnight Elegance
  Grid: 4×3 (12 products per screen)

  TV1 (Left): Flower varieties
  TV2 (Center): Edibles & Beverages
  TV3 (Right): Concentrates & Vapes

Result: Customers see 36 products at once,
        organized by type, visually cohesive
```

### **Use Case 2: Checkout Impulse**
```
2 TVs at checkout counter, 43" each

GROUP: "Checkout Add-Ons"
  Theme: Fresh Market (bright)
  Grid: 3×2 (6 products per screen)

  TV1: Edibles (chocolates, gummies)
  TV2: Accessories (papers, lighters)

Result: Quick-scan, impulse buy items
        Large cards, easy to read
```

### **Use Case 3: Premium Lounge**
```
5 TVs in lounge area, 65" each

GROUP: "Premium Experience"
  Theme: Bold Vibrant
  Mode: Carousel (slow transitions)

  TV1: Top Shelf Flower
  TV2: Exotic Strains
  TV3: Premium Concentrates
  TV4: Craft Edibles
  TV5: Limited Edition

Result: Immersive, high-end showcase
        Synchronized rotations
        Educational content
```

---

## 🔧 Implementation Status

### ✅ **Already Built**
- Category filtering per menu
- AI layout optimization
- Multiple menu management
- Theme system
- Grid configurability

### 📝 **Need to Build**
- [ ] Display Groups UI
- [ ] Group configuration wizard
- [ ] AI group analyzer (optimize all displays together)
- [ ] Category distribution AI
- [ ] Synchronized carousel system
- [ ] Group preview (see all displays together)

---

## 🎨 UI Mockup

### **Display Groups Dashboard**

```
┌────────────────────────────────────────────┐
│  Display Groups                            │
├────────────────────────────────────────────┤
│                                            │
│  GROUP: "Main Wall"  [Edit] [Delete]      │
│  ┌────┬────┬────┐                          │
│  │ TV1│ TV2│ TV3│  3 displays • Midnight   │
│  │ Flr│Edbl│Conc│  Elegance • 4×3 grid    │
│  └────┴────┴────┘                          │
│                                            │
│  GROUP: "Checkout"  [Edit] [Delete]       │
│  ┌────┬────┐                               │
│  │ TV4│ TV5│      2 displays • Fresh       │
│  │Impl│Accs│      Market • 3×2 grid       │
│  └────┴────┘                               │
│                                            │
│  [+ Create Display Group]                  │
└────────────────────────────────────────────┘
```

---

## 💡 Key Benefits

1. **Professional Appearance**: Looks like Apple Store
2. **Easy Management**: Configure once, applies to all
3. **Flexible Content**: Different categories, same style
4. **AI Optimized**: System ensures perfect visual harmony
5. **Scalable**: Works for 2 displays or 20

---

## 🚀 Next Steps

1. Apply migration: `20251029_display_groups.sql`
2. Build Display Groups UI
3. Enhance AI to analyze groups (not just individual displays)
4. Add group templates
5. Implement synchronized carousels

---

**This turns your digital signage from individual screens into a professional, cohesive visual system.** 🎨✨
