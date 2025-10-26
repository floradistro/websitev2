# Smart Component System

## Overview

The Smart Component System is a powerful architecture for building reusable, data-driven UI components that are easy to create, maintain, and customize per vendor.

---

## 🏗️ Architecture

### 3-Layer System:

1. **Component Layer** - React components (`/components/component-registry/smart/`)
2. **Registry Layer** - Component mapping (`/lib/component-registry/renderer.tsx`)
3. **Data Layer** - Database configuration (Supabase `vendor_component_instances`)

---

## ✨ What Makes a Component "Smart"?

Smart components:
- ✅ Fetch their own data (optional)
- ✅ Receive vendor context automatically (`vendorId`, `vendorSlug`, `vendorName`, `vendorLogo`)
- ✅ Accept props from the database (JSON-configured)
- ✅ Work across all vendor storefronts
- ✅ Include built-in animations and luxury styling

---

## 🚀 Quick Start: Creating a New Smart Component

### Option 1: Use the Generator (Recommended)

```bash
npm run generate:smart-component
```

The generator will:
- Create the component file with TypeScript
- Generate props interface
- Add to index.ts and renderer.tsx
- Create database registration SQL
- Scaffold with animations and styling

### Option 2: Manual Creation

1. **Create the component file:**

```tsx
// components/component-registry/smart/SmartYourComponent.tsx
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
  items?: string[];
}

export function SmartYourComponent({
  vendorId,
  headline = 'DEFAULT HEADLINE',
  items = [],
  className = '',
  animate = true
}: SmartYourComponentProps) {
  return (
    <SmartComponentWrapper 
      className={className}
      animate={animate}
      componentName="Your Component"
    >
      <SmartContainers.Section>
        <SmartContainers.MaxWidth>
          <SmartTypography.Headline>
            {headline}
          </SmartTypography.Headline>
          
          {/* Your component UI here */}
        </SmartContainers.MaxWidth>
      </SmartContainers.Section>
    </SmartComponentWrapper>
  );
}
```

2. **Export from index:**

```ts
// components/component-registry/smart/index.ts
export { SmartYourComponent } from './SmartYourComponent';
```

3. **Register in renderer:**

```ts
// lib/component-registry/renderer.tsx
const COMPONENT_MAP = {
  // ...
  'smart_your_component': Smart.SmartYourComponent,
};
```

4. **Register in database:**

```sql
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
  'Description of what this does',
  '{"headline": {"type": "string", "default": "DEFAULT HEADLINE"}}'::jsonb,
  false
);
```

5. **Add to a page:**

```sql
INSERT INTO vendor_component_instances (
  vendor_id,
  section_id,
  component_key,
  props,
  position_order
)
VALUES (
  'YOUR_VENDOR_ID',
  'YOUR_SECTION_ID',
  'smart_your_component',
  '{"headline": "CUSTOM HEADLINE"}'::jsonb,
  0
);
```

---

## 🎨 Styling System

### Use the Built-in Helpers:

```tsx
import { 
  SmartTypography,
  SmartContainers,
  SmartButton
} from '@/lib/smart-component-base';

// Typography
<SmartTypography.Headline>BIG BOLD HEADLINE</SmartTypography.Headline>
<SmartTypography.Subheadline>Subtext here</SmartTypography.Subheadline>
<SmartTypography.Body>Regular paragraph</SmartTypography.Body>
<SmartTypography.Label>LABEL TEXT</SmartTypography.Label>

// Containers
<SmartContainers.Section>         // py-16 sm:py-20 px-4 sm:px-6
<SmartContainers.MaxWidth>        // max-w-7xl mx-auto
<SmartContainers.Card hover>      // Luxury rounded-2xl card
<SmartContainers.Grid cols={3}>   // Responsive grid

// Buttons
<SmartButton variant="primary">PRIMARY</SmartButton>
<SmartButton variant="secondary">SECONDARY</SmartButton>
<SmartButton variant="ghost">GHOST</SmartButton>
```

### Design System:

- **Backgrounds:** Pure black (`bg-black`) or dark cards (`bg-[#0a0a0a]`)
- **Borders:** Subtle white (`border-white/5`, `hover:border-white/10`)
- **Rounded:** iOS 26 style (`rounded-2xl`)
- **Typography:** Font-black (900 weight), uppercase, tight tracking
- **Text Colors:** 
  - Headings: `text-white`
  - Body: `text-white/60`
  - Labels: `text-white/40`
- **Animations:** Framer Motion with `ease: [0.22, 1, 0.36, 1]`

---

## 🎭 Animation System

### Use Built-in Hooks:

```tsx
import { useScrollAnimation } from '@/lib/smart-component-base';

const { ref, inView } = useScrollAnimation();

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 20 }}
  animate={inView ? { opacity: 1, y: 0 } : {}}
>
  Content here
</motion.div>
```

### Pre-built Animations:

```tsx
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/animations';

<motion.div variants={fadeInUp}>Fades in from below</motion.div>
<motion.div variants={scaleIn}>Scales in</motion.div>
```

---

## 📊 Data Fetching

### Use the Built-in Hook:

```tsx
import { useVendorData } from '@/lib/smart-component-base';

export function SmartProducts({ vendorId }: SmartComponentBaseProps) {
  const { data, loading, error } = useVendorData<Product[]>(
    `/api/vendors/${vendorId}/products`,
    vendorId
  );
  
  return (
    <SmartComponentWrapper 
      loading={loading}
      error={error}
      componentName="Products"
    >
      {/* Render data here */}
    </SmartComponentWrapper>
  );
}
```

The wrapper automatically handles:
- ✅ Loading skeleton
- ✅ Error display
- ✅ Animation states

---

## 🗂️ Component Organization

```
components/component-registry/
├── atomic/          # Basic UI elements (Text, Button, Image)
├── composite/       # Multi-part components (ProductCard, Grid)
└── smart/          # Data-aware components (SmartFAQ, SmartFeatures)
    ├── SmartHeader.tsx
    ├── SmartFooter.tsx
    ├── SmartFAQ.tsx
    ├── SmartFeatures.tsx
    └── index.ts     # Exports all smart components
```

---

## 🔧 Maintenance

### Editing Content:

**Option 1: Database** (Per-vendor customization)
```sql
UPDATE vendor_component_instances 
SET props = jsonb_set(
  props, 
  '{headline}', 
  '"NEW HEADLINE"'
)
WHERE component_key = 'smart_faq'
AND vendor_id = 'your-vendor-id';
```

**Option 2: Component File** (Global defaults)
```tsx
// SmartFAQ.tsx
headline = "FREQUENTLY ASKED QUESTIONS"  // Change default here
```

### When to Edit What:

- **Database props** → Vendor-specific content/styling
- **Component file** → Global behavior, UI structure, animations
- **Base utilities** → Shared styling system

---

## 🎯 Best Practices

### DO:
✅ Use `SmartComponentWrapper` for consistent structure
✅ Extend `SmartComponentBaseProps` for type safety
✅ Use built-in typography and container helpers
✅ Add TypeScript interfaces for all props
✅ Include sensible defaults
✅ Make components responsive
✅ Add loading and error states

### DON'T:
❌ Hardcode vendor-specific data in components
❌ Use inline styles (use Tailwind classes)
❌ Skip animations (users expect them)
❌ Forget mobile optimization
❌ Use font weights other than 900 for headings

---

## 📦 Current Smart Components

| Component | Purpose | Fetches Data |
|-----------|---------|--------------|
| `SmartHeader` | Navigation header | Yes (categories) |
| `SmartFooter` | Site footer | No |
| `SmartProductGrid` | Product listing | Yes (products) |
| `SmartFAQ` | FAQ accordion | No |
| `SmartFeatures` | Feature cards | No |
| `SmartTestimonials` | Customer reviews | Yes (reviews) |
| `SmartLocationMap` | Store locations | Yes (locations) |
| `SmartStatsCounter` | Animated statistics | No |

---

## 🚀 Future Improvements

- [ ] Visual prop editor in vendor dashboard
- [ ] Component preview in admin
- [ ] A/B testing support
- [ ] Real-time prop updates
- [ ] Component marketplace
- [ ] Auto-generated documentation
- [ ] TypeScript → JSON schema conversion
- [ ] Component versioning

---

## 📞 Quick Reference

```tsx
// Minimal Smart Component Template
"use client";

import React from 'react';
import { SmartComponentWrapper, SmartComponentBaseProps } from '@/lib/smart-component-base';

export interface SmartMyComponentProps extends SmartComponentBaseProps {
  // Your props here
}

export function SmartMyComponent({ vendorId, ...props }: SmartMyComponentProps) {
  return (
    <SmartComponentWrapper componentName="My Component">
      {/* Your UI here */}
    </SmartComponentWrapper>
  );
}
```

**That's it!** 🎉

