# Wilson's Storefront Homepage Architecture

## CRITICAL: Never Confuse This Again

### How Homepage Rendering Works

**URL:** `localhost:3000/storefront?vendor=flora-distro`

**Page File:** `app/(storefront)/storefront/page.tsx`

**Renderer Used:** `ComponentBasedPageRenderer` ✅

### What Gets Rendered

The homepage uses the **Component Registry System**, NOT content sections.

```
ComponentBasedPageRenderer
  ↓
  Reads from database tables:
  - vendor_storefront_sections (sections like 'hero', 'process', etc.)
  - vendor_component_instances (atomic components: text, image, button, icon)
  ↓
  Renders using atomic components from:
  - components/component-registry/atomic/
    - Text.tsx
    - Image.tsx
    - Button.tsx
    - Icon.tsx
    - Badge.tsx
    - Spacer.tsx
    - Divider.tsx
```

### Files to Modify for Homepage Styling

1. **Section Container Styles**
   - File: `components/storefront/ComponentBasedPageRenderer.tsx`
   - Controls: Section padding, backgrounds, layout

2. **Text Styling (Headlines, Paragraphs, Labels)**
   - File: `components/component-registry/atomic/Text.tsx`
   - Controls: Font size, weight, color, uppercase, tracking

3. **Button Styling (CTAs)**
   - File: `components/component-registry/atomic/Button.tsx`
   - Controls: Rounded corners, colors, hover states

4. **Image Styling (Logos)**
   - File: `components/component-registry/atomic/Image.tsx`
   - Controls: Size, animations, effects

5. **Icon Styling (Emojis/SVGs)**
   - File: `components/component-registry/atomic/Icon.tsx`
   - Controls: Size, color

---

## What NOT to Modify (These Are NOT Used on Homepage)

❌ **Content Sections** - NOT used by ComponentBasedPageRenderer:
  - `components/storefront/content-sections/HeroSection.tsx`
  - `components/storefront/content-sections/ProcessSection.tsx`
  - `components/storefront/content-sections/DifferentiatorsSection.tsx`

These are ONLY used for:
- Legacy pages
- Fallback rendering
- Non-component-registry storefronts

---

## Luxury Product Card Aesthetic Applied

### Typography
- **ALL text is font-black (900 weight)**
- **Headlines:** UPPERCASE, tracking-tight, text-5xl → text-9xl
- **Subheadlines:** UPPERCASE, tracking-wide, text-xl → text-2xl
- **Labels:** UPPERCASE, tracking-[0.15em], text-xs

### Colors
- Pure black background: `bg-black`
- White text: `text-white`
- Dimmed text: `text-white/60` or `text-white/40`
- Borders: `border-white/5` or `border-white/10`

### Buttons
- Rounded: `rounded-2xl` (iOS 26 style)
- Primary: White bg, black text
- Secondary: Transparent with white border
- All: `font-black uppercase tracking-[0.08em]`

### Cards
- Background: `bg-[#0a0a0a]`
- Border: `border border-white/5`
- Hover: `hover:border-white/10 hover:bg-[#141414]`
- Rounded: `rounded-2xl`

---

## Memory Created

A permanent memory has been saved to prevent confusion:
- Storefront homepage uses ComponentBasedPageRenderer
- Modify atomic components in component-registry/
- Content sections are NOT used

---

## Current Status

✅ Text.tsx - Font-black, uppercase, large sizes
✅ Button.tsx - Already rounded-2xl, font-black
✅ ComponentBasedPageRenderer - Pure black backgrounds
✅ Image.tsx - Logo animations
✅ Memory created to prevent future confusion

