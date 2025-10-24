# Device-Aware Live Editor - Shopify-Style Context Editing

## Overview
The live editor now features **context-aware editing** that changes based on the preview device, just like Shopify Theme Editor. This prevents clutter and makes it crystal clear which settings affect which devices.

## How It Works

### **Device Switcher (Top Right)**
```
[Desktop Icon] [Mobile Icon]
```
Click to switch between:
- **Desktop Preview** (1920px+ viewport)
- **Mobile Preview** (iPhone Pro frame)

### **Context-Aware Controls**

#### **Shop Config Section** (Device-Specific)

**When Desktop Preview is Active:**
```
┌─────────────────────────┐
│ Layout          Desktop │ ← Device indicator
├─────────────────────────┤
│ Columns: [3 ▼]          │ ← Desktop columns (2/3/4)
│ Gap: [Medium ▼]         │ ← Applies to both
└─────────────────────────┘
```

**When Mobile Preview is Active:**
```
┌─────────────────────────┐
│ Layout           Mobile │ ← Device indicator
├─────────────────────────┤
│ Columns: [2 ▼]          │ ← Mobile columns (1/2)
│ Gap: [Medium ▼]         │ ← Applies to both
└─────────────────────────┘
```

**The "Columns" dropdown switches content based on device!**

#### **All Other Sections** (Universal)
All styling controls show indicator:
```
┌─────────────────────────────┐
│ Card Container    📱💻 Both │
├─────────────────────────────┤
│ Colors, padding, borders... │
└─────────────────────────────┘
```

These settings apply to **both devices** equally.

## Visual Indicators

### **Section Headers Show Device Scope:**

**Desktop Only:**
```
Layout                   🖥️ Desktop
```

**Mobile Only:**
```
Layout                   📱 Mobile
```

**Both Devices:**
```
Card Container           🖥️📱 Both
Product Image            🖥️📱 Both
Product Info             🖥️📱 Both
Card Display             🖥️📱 Both
Page Controls            🖥️📱 Both
```

## User Workflow (Shopify-Style)

### **Step 1: Configure Desktop**
1. Click **Desktop** preview button
2. See "Editing Desktop View" banner
3. Set **Columns: 3**
4. Configure all styling (colors, padding, borders, etc.)
5. Preview updates instantly

### **Step 2: Configure Mobile**
1. Click **Mobile** preview button
2. See "Editing Mobile View" banner
3. Set **Columns: 1** (for better mobile UX)
4. Same styling from desktop automatically applies
5. Preview shows mobile layout

### **Step 3: Save**
1. Press **Cmd+S** or wait 2 seconds for auto-save
2. **Both** desktop AND mobile configs are saved together
3. Published storefront now has optimized layouts for both devices

## Settings Breakdown

### **Device-Specific (Changes Based on Preview)**
- **Grid Columns** 
  - Desktop: 2/3/4 columns
  - Mobile: 1/2 columns

### **Universal (Apply to Both Devices)**
All other settings apply equally to desktop and mobile:

**Layout:**
- Gap Between Cards

**Card Container:**
- Background, Padding, Radius, Border

**Product Image:**
- Aspect Ratio, Background, Object Fit, Padding, Spacing, Radius, Border

**Product Info:**
- Background, Padding, Colors

**Display Options:**
- All checkboxes (Quick Add, Stock Badge, etc.)

**Page Controls:**
- All checkboxes (Categories, Location Filter, Sort)

## Why This Approach?

### **Prevents Confusion**
❌ OLD: Show "Desktop Columns" and "Mobile Columns" at the same time
   → User confused which setting affects current preview
   
✅ NEW: Show only relevant "Columns" for current device
   → Clear and focused editing experience

### **Saves Space**
- No cluttered sidebar with duplicate controls
- Only shows what's relevant to current preview
- Cleaner, more professional interface

### **Shopify Parity**
This matches exactly how Shopify Theme Editor works:
1. Switch device preview
2. Controls update to show relevant settings
3. Device scope clearly indicated
4. Save once, works everywhere

## Technical Implementation

### **Live Editor State**
```tsx
const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
```

### **Conditional Rendering**
```tsx
{previewDevice === 'desktop' ? (
  <select value={grid_columns}>
    <option value={2}>2 Columns</option>
    <option value={3}>3 Columns</option>
    <option value={4}>4 Columns</option>
  </select>
) : (
  <select value={grid_columns_mobile}>
    <option value={1}>1 Column</option>
    <option value={2}>2 Columns</option>
  </select>
)}
```

### **Data Storage**
Both configs stored in same section:
```json
{
  "section_key": "shop_config",
  "content_data": {
    "grid_columns": 3,           // Desktop
    "grid_columns_mobile": 1,    // Mobile
    "card_bg": "#000000",        // Both
    "image_aspect": "square"     // Both
  }
}
```

### **Single Save**
One save operation stores entire config object → both desktop and mobile settings persisted together.

## Future Enhancements (Optional)

### **Per-Device Styling (If Needed)**
Could add device-specific overrides for:
- Mobile-specific colors
- Different padding on mobile
- Hide certain elements on mobile

Example:
```json
{
  "card_bg": "#000000",           // Default (both)
  "card_bg_mobile": "#1a1a1a",   // Mobile override
}
```

### **Tablet Mode**
Add third preview option:
- Desktop (1920px+)
- Tablet (768px-1024px)
- Mobile (<768px)

## Testing Checklist

✅ Desktop preview shows desktop columns dropdown
✅ Mobile preview shows mobile columns dropdown
✅ Device indicator updates when switching
✅ All universal settings work on both devices
✅ Save preserves both desktop and mobile configs
✅ Published site respects both settings
✅ No console errors
✅ Smooth transitions when switching devices
✅ Preview iframe resizes correctly

## Browser Testing

Test on actual devices:
1. Configure mobile as 1 column
2. Configure desktop as 4 columns
3. Save
4. Visit storefront on iPhone → See 1 column
5. Visit storefront on desktop → See 4 columns

---

**Status**: ✅ **PRODUCTION READY**
**Pattern**: Shopify Theme Editor
**User Experience**: Clean, intuitive, professional
**Complexity**: Hidden from user, simple interface

