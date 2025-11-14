# Design System Quick Reference
## WhaleTools Unified Design Standards

---

## 1. TYPOGRAPHY RULES

### Font Weights (Tailwind ONLY - NO inline styles)
- **Page Titles**: `text-2xl md:text-3xl font-semibold` (not light, not black)
- **Section Headers**: `text-lg font-semibold` 
- **Card Titles**: `text-sm font-semibold`
- **Labels (CAPS)**: `text-[10px] uppercase tracking-[0.15em] font-medium` (NOT black)
- **Body Text**: `text-sm text-white/80`
- **Small Text**: `text-xs text-white/60`

### What NOT to do:
```
❌ font-black (too heavy for most uses)
❌ font-light (too light for headers)
❌ style={{ fontWeight: 900 }} (use Tailwind instead)
✓ font-semibold (600 weight - perfect for headers)
✓ font-medium (500 weight - perfect for labels)
```

---

## 2. COLORS & OPACITY

### Backgrounds
```
bg-black              // Primary background
bg-white/5            // Secondary background (subtle)
bg-white/10           // Tertiary background (more visible)
bg-white/15           // Hover state on primary
bg-white/20           // Hover state on secondary
```

### Text Colors
```
text-white            // Primary text (headlines)
text-white/80         // Body text
text-white/60         // Secondary text
text-white/40         // Tertiary text / disabled
text-white/20         // Very disabled
```

### Borders
```
border border-white/10     // Default border (single pixel)
border border-white/20     // Hover state
border border-white/30     // Active state (rare)
border-b border-white/5    // Divider lines
```

### What NOT to do:
```
❌ bg-[#0a0a0a] (hardcoded hex)
❌ bg-zinc-900/50 (named colors)
❌ border-white/[0.06] (array notation)
❌ white/[0.05], white/[0.12] (array opacity)
✓ bg-black, bg-white/5, white/10 (shorthand only)
```

---

## 3. SPACING SYSTEM

### Padding Scale (consistent use)
```
p-2   // Extra small (rarely used)
p-3   // Small (default for buttons)
p-4   // Medium (default for cards/sections)
p-6   // Large (major sections)
p-8   // Extra large (reserved for full-page)
```

### Gaps (for flex/grid)
```
gap-2   // Extra small
gap-3   // Small  
gap-4   // Medium (default)
gap-6   // Large
```

### Pattern for directional padding:
```
✓ py-4 px-6 (vertical then horizontal)
✓ px-4 py-3 (consistent order)
❌ px-3 py-2.5 (decimals)
❌ p-2 p-4 p-6 (random values)
```

---

## 4. BORDERS & RADIUS

### Border Width
```
✓ border       // Always single pixel (no border-2)
❌ border-2    // NEVER use thick borders
```

### Border Radius
```
rounded-xl     // Buttons & inputs (12px)
rounded-2xl    // Cards & sections (16px)
rounded-3xl    // Large containers (rare, 24px)
```

### Combinations
```
✓ border border-white/10 rounded-xl
✓ border border-white/20 rounded-2xl
❌ border-2 border-white/10 rounded-xl (thick border)
```

---

## 5. BUTTON STYLES (4 TYPES ONLY)

### PRIMARY (white background - use MAX 1 per page)
```tsx
className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all"
```

### SECONDARY (default for most buttons)
```tsx
className="bg-white/10 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl hover:bg-white/15 hover:border-white/30 transition-all"
```

### TERTIARY (minimal style)
```tsx
className="text-white/60 border border-white/10 font-medium px-6 py-3 rounded-xl hover:bg-white/5 hover:text-white/80 transition-all"
```

### DANGER (for destructive actions)
```tsx
className="bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-6 py-3 rounded-xl hover:bg-red-500/30 hover:border-red-500/40 transition-all"
```

---

## 6. CARD STYLES

### Standard Interactive Card
```tsx
className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"
```

### Card with Header
```tsx
<div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
  <div className="bg-white/5 border-b border-white/10 p-4">Header</div>
  <div className="p-4">Content</div>
</div>
```

---

## 7. MODAL STYLES

### Overlay
```tsx
className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
```

### Modal Container
```tsx
className="bg-black border border-white/20 rounded-2xl p-8 max-w-md w-full"
```

### Rules
```
✓ Use backdrop-blur-sm (subtle blur on overlay)
✓ bg-black with border-white/20
❌ NO backdrop-blur-xl (too strong)
❌ NO bg-white/10 (wrong contrast)
```

---

## 8. INPUT FIELDS

### Standard Input
```tsx
className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-all"
```

### With Icon (add padding)
```tsx
className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-all"
```

---

## 9. NAVIGATION PATTERNS

### Vendor Sidebar (keep as-is)
- 60px fixed icon bar on left
- 200px expandable panel on click
- NO backdrop-blur-xl (flat design)

### POS Breadcrumbs (match vendor)
- Use Home + ChevronRight icons
- Match spacing with vendor nav
- No custom colors

### TV Menus
- Integrate with vendor nav (don't exclude)
- Use same header pattern as other vendor pages
- Remove custom backdrop-blur-xl

---

## 10. GLASSMORPHISM RULES

### Where to USE
```
✓ Modal overlays (backdrop-blur-sm only)
✓ Floating action buttons (rare)
```

### Where NOT to use
```
❌ Navigation bars/headers (keep flat)
❌ Main content areas
❌ backdrop-blur-xl (use blur-sm instead)
```

---

## 11. COMMON FIXES

### Fix 1: Font Weights
```tsx
// BEFORE
className="text-3xl font-black uppercase"

// AFTER
className="text-3xl font-semibold uppercase"
```

### Fix 2: Hardcoded Colors
```tsx
// BEFORE
className="bg-[#0a0a0a] border border-white/[0.06]"

// AFTER
className="bg-black border border-white/10"
```

### Fix 3: Thick Borders
```tsx
// BEFORE
className="border-2 border-white/10 rounded-2xl"

// AFTER
className="border border-white/10 rounded-2xl"
```

### Fix 4: Inline Styles
```tsx
// BEFORE
className="..." style={{ fontWeight: 900 }}

// AFTER
className="... font-semibold"
// Just use Tailwind
```

### Fix 5: Array Notation
```tsx
// BEFORE
className="border-white/[0.06] bg-white/[0.05]"

// AFTER
className="border-white/10 bg-white/5"
// Use shorthand only
```

---

## 12. FILES TO PRIORITIZE

### Critical (Fix First)
1. `/app/pos/register/page.tsx` - Font weights, borders
2. `/components/component-registry/pos/POSProductGrid.tsx` - Colors, buttons
3. `/app/vendor/tv-menus/page.tsx` - Navigation integration, backdrop-blur removal
4. `/app/pos/receiving/page.tsx` - Color inconsistencies

### High Priority (Fix Second)
5. `/app/vendor/layout.tsx` - TV Menus integration
6. All POS selector components - Standardize styling
7. Modal components - Unify styling

### Medium Priority (Fix Third)
8. All vendor pages - Update opacity notation
9. Media library - Verify consistency
10. Form components - Input field standardization

---

## 13. TESTING CHECKLIST

After making changes, verify:

- [ ] No hardcoded colors (only white opacity or bg-black)
- [ ] No border-2 or thick borders (only single border)
- [ ] No font-black except for rare emphasis
- [ ] No inline style={{ fontWeight }} attributes
- [ ] No backdrop-blur-xl (only blur-sm for modals)
- [ ] All buttons use 4 standard patterns
- [ ] All cards use unified bg-white/5 style
- [ ] All padding follows p-2 through p-8 scale
- [ ] All borders use border-white/10 or border-white/20
- [ ] Navigation consistent across apps

---

## 14. COLOR PALETTE SUMMARY

```
PRIMARY:     bg-black, text-white
SECONDARY:   bg-white/5, text-white/80
TERTIARY:    bg-white/10, text-white/60
HOVER:       bg-white/15, text-white/70
ACTIVE:      bg-white/20, text-white
DISABLED:    bg-white/5, text-white/40
DANGER:      bg-red-500/20, text-red-400
SUCCESS:     bg-green-500/20, text-green-400 (if needed)
```

---

## Quick Copy-Paste Templates

### Button Component
```tsx
<button className="bg-white/10 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl hover:bg-white/15 hover:border-white/30 transition-all">
  Click me
</button>
```

### Card Component
```tsx
<div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all">
  Card content
</div>
```

### Modal Component
```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-black border border-white/20 rounded-2xl p-8 max-w-md w-full">
    Modal content
  </div>
</div>
```

### Input Component
```tsx
<input
  type="text"
  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-all"
  placeholder="Type here..."
/>
```

---

## Summary

**The Golden Rules:**
1. Font-semibold for headers, font-medium for labels
2. White opacity shorthand ONLY (white/5, white/10, etc.)
3. Single border width, never border-2
4. 4 button types, 1 card style, 1 modal pattern
5. No hardcoded colors, no array notation, no inline styles
6. Flat design for navigation, blur-sm only for modals

