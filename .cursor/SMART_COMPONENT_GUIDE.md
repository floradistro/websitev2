# 🚀 Smart Component System - Quick Reference

**This file persists across Cursor sessions for AI agents**

---

## 📍 Current Status

✅ Smart Component System is fully operational
✅ Generator script ready: `scripts/smart-component-generator.ts`
✅ Base utilities available: `lib/smart-component-base.tsx`
✅ All smart components use WhaleTools luxury theme
✅ Animation system integrated (Framer Motion, GSAP, React Spring)

---

## 🎯 Quick Commands

```bash
# Generate new smart component (auto-scaffolds everything)
npm run generate:smart-component

# Register component in database
npm run db:register ComponentName
```

---

## 🏗️ Architecture Overview

### Component Registry System:
1. **Components** → `/components/component-registry/smart/`
2. **Base Utilities** → `/lib/smart-component-base.tsx`
3. **Registry Map** → `/lib/component-registry/renderer.tsx`
4. **Database** → Supabase `vendor_component_instances`

### Flow:
```
Page Request 
  → ComponentBasedPageRenderer 
  → Fetches sections & instances from DB
  → Renders via COMPONENT_MAP
  → Smart components get vendorId, vendorSlug, vendorName, vendorLogo
```

---

## 🎨 WhaleTools Luxury Design System

**ALWAYS use these standards:**

### Colors:
- Background: `bg-black` or `bg-[#0a0a0a]`
- Borders: `border-white/5` hover:`border-white/10`
- Text Headings: `text-white`
- Text Body: `text-white/60`
- Text Labels: `text-white/40`

### Typography:
- Headings: `font-black uppercase tracking-tight` (weight: 900)
- Body: `text-white/60 leading-relaxed`
- Labels: `uppercase tracking-[0.15em]`

### Spacing & Shapes:
- Rounded: `rounded-2xl` (iOS 26 style)
- Section Padding: `py-16 sm:py-20 px-4 sm:px-6`
- Card Padding: `p-6 sm:p-8`

### Animations:
- Easing: `ease: [0.22, 1, 0.36, 1]`
- Duration: `0.6s` for most transitions
- Scroll-triggered with `react-intersection-observer`

---

## 📝 Creating New Smart Components

### Minimal Template:

```tsx
"use client";

import React from 'react';
import { 
  SmartComponentWrapper, 
  SmartComponentBaseProps,
  SmartTypography,
  SmartContainers
} from '@/lib/smart-component-base';

export interface SmartYourComponentProps extends SmartComponentBaseProps {
  headline?: string;
  // Add your props here
}

export function SmartYourComponent({
  vendorId,
  headline = "DEFAULT HEADLINE",
  animate = true,
  className = ''
}: SmartYourComponentProps) {
  return (
    <SmartComponentWrapper 
      animate={animate}
      componentName="Your Component"
      className={className}
    >
      <SmartContainers.Section>
        <SmartContainers.MaxWidth>
          <SmartTypography.Headline>
            {headline}
          </SmartTypography.Headline>
          
          {/* Your UI here */}
          
        </SmartContainers.MaxWidth>
      </SmartContainers.Section>
    </SmartComponentWrapper>
  );
}
```

### Required Steps:
1. Create component in `/components/component-registry/smart/SmartYourComponent.tsx`
2. Export in `/components/component-registry/smart/index.ts`
3. Add to COMPONENT_MAP in `/lib/component-registry/renderer.tsx`
4. Register in database (see SQL template below)

---

## 🗄️ Database Registration

### SQL Template:

```sql
-- Register in component_templates
INSERT INTO component_templates (
  component_key,
  name,
  category,
  description,
  props_schema,
  fetches_real_data
)
VALUES (
  'smart_your_component',
  'Smart Your Component',
  'smart',
  'Description here',
  '{"headline": {"type": "string", "default": "DEFAULT"}}'::jsonb,
  false
)
ON CONFLICT (component_key) DO UPDATE SET
  name = EXCLUDED.name,
  props_schema = EXCLUDED.props_schema;

-- Add to vendor page
INSERT INTO vendor_component_instances (
  vendor_id,
  section_id,
  component_key,
  props,
  position_order,
  is_enabled,
  is_visible
)
VALUES (
  'cd2e1122-d511-4edb-be5d-98ef274b4baf', -- Flora Distro ID
  'YOUR_SECTION_ID',
  'smart_your_component',
  '{"headline": "CUSTOM HEADLINE"}'::jsonb,
  0,
  true,
  true
);
```

**Database Credentials:**
- Host: `db.uaednwpxursknmwdeejn.supabase.co`
- Port: `5432`
- User: `postgres`
- Password: `SelahEsco123!!`
- Database: `postgres`

**Connection String:**
```
postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres
```

**Helper command:**
```bash
psql "postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres" -c "YOUR_SQL_HERE"
```

---

## 🔧 Base Utilities Reference

### SmartTypography:
```tsx
<SmartTypography.Headline>MAIN HEADING</SmartTypography.Headline>
<SmartTypography.Subheadline>Secondary text</SmartTypography.Subheadline>
<SmartTypography.Body>Paragraph text</SmartTypography.Body>
<SmartTypography.Label>LABEL TEXT</SmartTypography.Label>
```

### SmartContainers:
```tsx
<SmartContainers.Section>         // Section wrapper with padding
<SmartContainers.MaxWidth>        // 7xl max-width container
<SmartContainers.Card hover>      // Luxury card with optional hover
<SmartContainers.Grid cols={3}>   // Responsive grid (1/2/3 cols)
```

### SmartButton:
```tsx
<SmartButton variant="primary">PRIMARY</SmartButton>
<SmartButton variant="secondary">SECONDARY</SmartButton>
<SmartButton variant="ghost">GHOST</SmartButton>
```

### Hooks:
```tsx
// Scroll animation
const { ref, inView } = useScrollAnimation();

// Data fetching with auto-loading/error
const { data, loading, error } = useVendorData<Type>(
  `/api/endpoint`,
  vendorId
);

// Use with wrapper
<SmartComponentWrapper 
  loading={loading}
  error={error}
  animate
  componentName="Name"
>
  {/* Auto-handles loading skeleton & errors */}
</SmartComponentWrapper>
```

---

## 📦 Existing Smart Components

Located in: `/components/component-registry/smart/`

| Component | Key | Purpose | Fetches Data |
|-----------|-----|---------|--------------|
| `SmartHeader` | `smart_header` | Navigation header | Yes (categories) |
| `SmartFooter` | `smart_footer` | Site footer | No |
| `SmartProductGrid` | `smart_product_grid` | Product listing | Yes (products) |
| `SmartFAQ` | `smart_faq` | FAQ accordion | No |
| `SmartFeatures` | `smart_features` | Feature cards | No |
| `SmartTestimonials` | `smart_testimonials` | Reviews | Yes (reviews) |
| `SmartLocationMap` | `smart_location_map` | Store locations | Yes (locations) |
| `SmartStatsCounter` | `smart_stats_counter` | Animated stats | No |
| `SmartShopControls` | `smart_shop_controls` | Shop filters | No |

---

## 🎯 Flora Distro (Wilson's Template)

**Vendor ID:** `cd2e1122-d511-4edb-be5d-98ef274b4baf`
**Template:** Wilson's (luxury cannabis retail)
**Theme:** Pure black, font-black typography, rounded-2xl, uppercase

### Homepage Sections:
- Header (`smart_header`)
- Hero (atomic components)
- Features (`smart_features`)
- Product Grid (`smart_product_grid`)
- FAQ (`smart_faq`)
- Footer (`smart_footer`)

### Current Pages:
- Home: `/storefront?vendor=flora-distro`
- Shop: `/storefront/shop?vendor=flora-distro`
- About: `/storefront/about?vendor=flora-distro`
- Contact: `/storefront/contact?vendor=flora-distro`
- FAQ: `/storefront/faq?vendor=flora-distro`

---

## ⚠️ Important Rules

### DO:
✅ Always extend `SmartComponentBaseProps`
✅ Use base utilities (`SmartContainers`, `SmartTypography`)
✅ Include TypeScript interfaces
✅ Make components responsive (mobile-first)
✅ Use `font-black` (900) for all headings
✅ Use `rounded-2xl` for all cards/buttons
✅ Include animation with `SmartComponentWrapper`
✅ Add loading and error states
✅ Use uppercase for headings and labels

### DON'T:
❌ Hardcode vendor data
❌ Use inline styles (use Tailwind)
❌ Skip TypeScript types
❌ Use font weights other than 900 for headings
❌ Create components without database registration
❌ Forget mobile optimization
❌ Use colors outside the design system

---

## 🔄 Editing Content

### Per-Vendor (Database):
```sql
UPDATE vendor_component_instances 
SET props = jsonb_set(props, '{headline}', '"NEW TEXT"')
WHERE component_key = 'smart_faq'
AND vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
```

### Global Default (Component File):
```tsx
// SmartFAQ.tsx
headline = "NEW DEFAULT"  // Changes for all vendors
```

---

## 📚 Full Documentation

- **System Overview:** `/SMART_COMPONENT_SYSTEM.md`
- **Animation Library:** `/lib/animations.ts`
- **Animation Docs:** `/ANIMATION_SYSTEM.md`
- **Base Utilities:** `/lib/smart-component-base.tsx`
- **Component Registry:** `/lib/component-registry/renderer.tsx`

---

## 🤖 For AI Agents

When the user asks to create a new smart component:
1. Use the minimal template above
2. Follow WhaleTools design system
3. Always register in database
4. Add to index.ts and renderer.tsx
5. Use base utilities for consistency
6. Include animations and responsive design

**This system is production-ready and fully operational.** 🚀

