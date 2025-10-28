# Unified Design System - Singularity

**Beautiful · Simple · Clean**

## Overview

Our unified design system creates a cohesive, professional aesthetic across all dashboards and components. Inspired by the point-of-sale system's clean design, this system emphasizes simplicity, optimal space usage, and visual consistency.

## Design Principles

### 1. **Singularity**
Everything feels like one cohesive system. No visual inconsistencies, no jarring transitions.

### 2. **Minimalism**
Clean lines, subtle borders, optimal whitespace. Remove everything unnecessary.

### 3. **Consistency**
Reuse components, patterns, and spacing throughout the entire application.

### 4. **Performance**
Animations are smooth, transitions are purposeful, and the interface feels responsive.

## Color Palette

### Background Colors
- **Pure Black**: `#000000` - Main background
- **Dark Gray**: `#0a0a0a` - Secondary background
- **Darker Gray**: `#141414` - Card backgrounds

### Opacity Scale (White)
- `white/5` (5%) - Subtle borders and dividers
- `white/10` (10%) - Interactive borders
- `white/20` (20%) - Emphasized borders
- `white/30` (30%) - Tertiary text
- `white/40` (40%) - Secondary text
- `white/60` (60%) - Primary secondary text
- `white/90` (90%) - Primary text

### Accent Colors
- **Success**: `rgb(34, 197, 94)` - Green for success states
- **Warning**: `rgb(234, 179, 8)` - Yellow for warnings
- **Error**: `rgb(239, 68, 68)` - Red for errors
- **Info**: `rgb(59, 130, 246)` - Blue for informational

## Typography

### Font Weights
- **100 (Thin)**: Large display numbers, hero text
- **300 (Light)**: Body text, labels
- **500 (Medium)**: Emphasized text
- **900 (Black)**: Buttons, important UI elements

### Text Styles

#### Labels
```css
.text-label
- color: rgba(255, 255, 255, 0.4)
- font-size: 11px
- font-weight: 300
- text-transform: uppercase
- letter-spacing: 0.2em
```

#### Sublabels
```css
.text-sublabel
- color: rgba(255, 255, 255, 0.3)
- font-size: 10px
- font-weight: 300
- text-transform: uppercase
- letter-spacing: 0.15em
```

#### Values
```css
.text-value
- color: rgba(255, 255, 255, 0.9)
- font-size: 30px
- font-weight: 100
```

#### Headings
```css
.text-heading
- color: rgba(255, 255, 255, 0.9)
- font-size: 30px
- font-weight: 100
- letter-spacing: -0.02em
```

## Spacing System

### Grid Gaps
- `spacing-grid`: 0.75rem (12px) - Standard grid gap
- `spacing-grid-lg`: 1rem (16px) - Large grid gap

### Section Spacing
- `spacing-section`: 2rem (32px) - Standard section margin
- `spacing-section-lg`: 3rem (48px) - Large section margin

### Component Padding
- `p-4`: 1rem (16px) - Small padding
- `p-6`: 1.5rem (24px) - Standard padding
- `p-8`: 2rem (32px) - Large padding

## Components

### StatCard

Display key metrics with icon, value, and trend.

```tsx
import { StatCard } from '@/components/ui/StatCard';
import { DollarSign } from 'lucide-react';

<StatCard
  label="Revenue"
  value="$12,345.67"
  sublabel="This Month"
  icon={DollarSign}
  loading={false}
  delay="0s"
  trend={{ value: '+12%', direction: 'up' }}
/>
```

**Props:**
- `label`: string - Upper label text
- `value`: string | number - Main display value
- `sublabel`: string - Lower label text
- `icon`: LucideIcon - Icon component
- `loading?`: boolean - Show skeleton loader
- `delay?`: string - Animation delay (e.g., "0.1s")
- `trend?`: { value: string, direction: 'up' | 'down' } - Optional trend indicator

### Card

Versatile container component with multiple variants.

```tsx
import { Card, CardHeader, CardSection } from '@/components/ui/Card';

<Card variant="glass" padding="md" hover={true}>
  <CardHeader
    title="Card Title"
    subtitle="Optional subtitle"
    action={<button>Action</button>}
    noPadding={false}
  />
  <CardSection border={false}>
    Content here
  </CardSection>
</Card>
```

**Card Props:**
- `children`: ReactNode
- `variant?`: 'glass' | 'base' | 'dark' | 'interactive' (default: 'glass')
- `className?`: string
- `padding?`: 'sm' | 'md' | 'lg' | 'none' (default: 'md')
- `hover?`: boolean (default: true)

**CardHeader Props:**
- `title`: string
- `subtitle?`: string
- `action?`: ReactNode
- `noPadding?`: boolean - If true, no padding/border (use with Card padding="md")

**CardSection Props:**
- `children`: ReactNode
- `border?`: boolean - Add top border
- `className?`: string

### Button

Unified button component with consistent styling.

```tsx
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

<Button
  variant="primary"
  size="md"
  icon={Plus}
  iconPosition="left"
  fullWidth={false}
  loading={false}
  onClick={handleClick}
>
  Add Item
</Button>
```

**Props:**
- `children`: ReactNode - Button text
- `variant?`: 'primary' | 'secondary' | 'ghost' (default: 'secondary')
- `size?`: 'sm' | 'md' | 'lg' (default: 'md')
- `icon?`: LucideIcon - Optional icon
- `iconPosition?`: 'left' | 'right' (default: 'left')
- `fullWidth?`: boolean (default: false)
- `loading?`: boolean (default: false)
- All standard button HTML attributes

### Badge

Status badges with consistent styling.

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="success" size="md">
  Approved
</Badge>
```

**Props:**
- `children`: ReactNode
- `variant?`: 'success' | 'warning' | 'error' | 'neutral' (default: 'neutral')
- `size?`: 'sm' | 'md' (default: 'md')

### QuickAction

Clickable action cards for dashboard navigation.

```tsx
import { QuickAction } from '@/components/ui/QuickAction';
import { Store } from 'lucide-react';

<QuickAction
  href="/storefront"
  icon={Store}
  label="View Storefront"
  sublabel="Live Preview"
  badge={<span>New</span>}
  external={true}
  variant="highlight"
  cols={2}
/>
```

**Props:**
- `href`: string - Link destination
- `icon`: LucideIcon - Icon component
- `label`: string - Main text
- `sublabel?`: string - Secondary text
- `badge?`: ReactNode - Optional badge
- `external?`: boolean - Open in new tab
- `variant?`: 'default' | 'highlight' (default: 'default')
- `cols?`: 1 | 2 - Grid column span (default: 1)

## CSS Utility Classes

### Cards
- `.minimal-glass` - Glass morphism card
- `.subtle-glow` - Subtle shadow glow
- `.card-base` - Base card style
- `.card-dark` - Dark background card
- `.card-interactive` - Interactive card with hover

### Buttons
- `.button-primary` - Primary button style
- `.button-secondary` - Secondary button style

### Dividers
- `.divider` - Standard divider (1px, white/5)
- `.divider-strong` - Emphasized divider (1px, white/10)

### Lists
- `.list-item` - Standard list item with hover

### Inputs
- `.input-base` - Standard input style

### Badges
- `.badge-base` - Base badge style
- `.badge-success` - Success variant
- `.badge-warning` - Warning variant
- `.badge-error` - Error variant
- `.badge-neutral` - Neutral variant

### Animations
- `.fade-in` - Fade in animation
- `.skeleton` - Loading skeleton animation

### Icons
- `.icon-container` - Standard icon container (40x40, gradient bg)

## Best Practices

### 1. **Always Use Components**
Prefer reusable components over custom markup:
```tsx
// ✅ Good
<StatCard label="Orders" value={42} sublabel="Today" icon={ShoppingCart} />

// ❌ Bad
<div className="minimal-glass p-6">
  <div className="flex justify-between">
    <span className="text-white/40">Orders</span>
    <ShoppingCart />
  </div>
  <div className="text-3xl">{42}</div>
</div>
```

### 2. **Consistent Spacing**
Use the spacing utility classes:
```tsx
// ✅ Good
<div className="grid grid-cols-4 spacing-grid mb-8">

// ❌ Bad
<div className="grid grid-cols-4 gap-4 mb-6">
```

### 3. **Animation Delays**
Stagger fade-in animations for polish:
```tsx
<StatCard delay="0s" ... />
<StatCard delay="0.1s" ... />
<StatCard delay="0.2s" ... />
```

### 4. **Loading States**
Always handle loading states:
```tsx
<StatCard loading={isLoading} ... />
```

### 5. **Responsive Design**
Use Tailwind responsive prefixes:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 spacing-grid">
```

## Migration Guide

### From Old Card Style
```tsx
// Before
<div className="bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[14px] shadow-[0_0_30px_rgba(255,255,255,0.02)] p-6">
  Content
</div>

// After
<Card>
  Content
</Card>
```

### From Old Stat Card
```tsx
// Before
<div className="minimal-glass p-6">
  <div className="flex justify-between mb-4">
    <span className="text-white/40 text-[11px] uppercase">Revenue</span>
    <DollarSign size={16} />
  </div>
  <div className="text-3xl">{value}</div>
  <div className="text-white/30 text-[10px]">This Month</div>
</div>

// After
<StatCard
  label="Revenue"
  value={value}
  sublabel="This Month"
  icon={DollarSign}
/>
```

## File Structure

```
components/
└── ui/
    ├── StatCard.tsx       # Metric display cards
    ├── Card.tsx           # Container components
    ├── Button.tsx         # Button component
    ├── Badge.tsx          # Status badges
    ├── QuickAction.tsx    # Action cards
    └── index.ts           # Barrel exports

app/
├── globals.css            # Design tokens and utilities
├── vendor/
│   └── dashboard/
│       └── page.tsx       # ✅ Refactored
└── admin/
    └── dashboard/
        └── page.tsx       # ✅ Refactored
```

## Future Work

### Components to Create
- [ ] Input component with unified styling
- [ ] Select/Dropdown component
- [ ] Modal/Dialog component
- [ ] Toast/Notification component
- [ ] Table component
- [ ] Form components

### Pages to Refactor
- [ ] Vendor sub-pages (inventory, products, etc.)
- [ ] Admin sub-pages (approvals, users, etc.)
- [ ] Storefront builder
- [ ] POS pages (already follows the system)

## Questions?

The design system is defined in:
- `app/globals.css` - CSS utilities and tokens
- `components/ui/` - React components

Follow the patterns established in:
- `app/vendor/dashboard/page.tsx` - Vendor dashboard example
- `app/admin/dashboard/page.tsx` - Admin dashboard example
- `app/pos/register/page.tsx` - POS example (original inspiration)
