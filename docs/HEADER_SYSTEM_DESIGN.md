# Page Header System Design
## Apple-Quality Consistency for WhaleTools PWA

### Problem Statement
Current headers across the app are inconsistent:
- **Products**: Minimal count-only header
- **Locations**: Title + subtitle pattern
- **Orders/Analytics**: No dedicated header (jumps to stats)
- **POS**: Loading states only
- **Settings**: Mixed patterns

This creates a disjointed, non-native experience that doesn't meet Apple's Human Interface Guidelines standards.

---

## Design Principles (Steve Jobs Standard)

### 1. **Ruthless Consistency**
Every page follows the EXACT same pattern. No exceptions.

### 2. **Information Hierarchy**
```
Level 1: Page Title (what am I looking at?)
Level 2: Context/Count (how much/what state?)
Level 3: Primary Action (what can I do?)
```

### 3. **Minimal, Never Empty**
- Headers are present on ALL pages (except full-screen modes like TV Display)
- They provide context without noise
- Typography creates visual rhythm

### 4. **Safe Area Aware**
- Headers must respect iOS safe areas
- Account for notch/Dynamic Island
- No content behind status bar

### 5. **Gesture-Friendly**
- Headers provide scroll context
- Sticky behavior on mobile
- Touch targets minimum 44px

---

## The Unified Header Component

### Visual Design
```
┌──────────────────────────────────────────────────────────┐
│  [Back Icon]                                   [Action]  │  ← Safe Area Top Padding
│                                                           │
│  Page Title                                               │  ← 28px, -2% tracking, 400 weight
│  CONTEXT · 42 ITEMS                                       │  ← 10px, uppercase, 60% opacity
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Typography Scale
```css
/* Page Title */
font-size: 28px;
font-weight: 400; /* Light */
letter-spacing: -0.02em; /* Tight tracking */
color: rgba(255, 255, 255, 0.90); /* 90% white */
line-height: 1.2;

/* Context Label */
font-size: 10px;
font-weight: 400;
letter-spacing: 0.15em; /* Wide tracking */
text-transform: uppercase;
color: rgba(255, 255, 255, 0.40); /* 40% white */
line-height: 1.4;
```

### Spacing
```css
/* Container */
padding-top: max(env(safe-area-inset-top), 16px);
padding-bottom: 24px;
padding-left: 16px; /* Matches iOS standard margins */
padding-right: 16px;

/* Title to Context */
margin-top: 4px; /* Tight coupling */
```

---

## Header Variants

### Variant A: Standard (Most Pages)
**Use for**: Products, Orders, Analytics, Locations, Customers, etc.

```tsx
<PageHeader
  title="Products"
  context="42 ITEMS · 3 LOW STOCK"
  action={
    <Button href="/vendor/products/new">
      <Plus /> Add Product
    </Button>
  }
/>
```

### Variant B: With Back Button (Detail Pages)
**Use for**: Product Edit, Order Detail, Campaign Detail

```tsx
<PageHeader
  back="/vendor/products"
  title="Edit Product"
  context="GMO · FLOWER"
/>
```

### Variant C: With Tabs (Multi-Section Pages)
**Use for**: Products (Products/Categories/Inventory), Settings

```tsx
<PageHeader
  title="Products"
  context="INVENTORY MANAGEMENT"
  tabs={[
    { label: "Products", value: "products", count: 42 },
    { label: "Categories", value: "categories", count: 12 },
    { label: "Inventory", value: "inventory" }
  ]}
  activeTab="products"
  onTabChange={setTab}
/>
```

### Variant D: Minimal (Auth Pages, Errors)
**Use for**: Login, 404, Loading screens

```tsx
<PageHeader
  title="Sign In"
  minimal
/>
```

### Variant E: Hidden (Full-Screen Modes)
**Use for**: TV Display, POS Register, Kiosk Mode

No header rendered - content takes full viewport.

---

## Component API

```tsx
interface PageHeaderProps {
  // Content
  title: string;
  context?: string;

  // Navigation
  back?: string | (() => void);

  // Actions
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;

  // Tabs (optional)
  tabs?: Array<{
    label: string;
    value: string;
    count?: number;
    icon?: LucideIcon;
  }>;
  activeTab?: string;
  onTabChange?: (tab: string) => void;

  // Variants
  minimal?: boolean;
  sticky?: boolean;

  // Accessibility
  loading?: boolean;
  ariaLabel?: string;
}
```

---

## Implementation Strategy

### Phase 1: Component Creation
1. Create `components/ui/PageHeader.tsx`
2. Build all variants with proper safe area handling
3. Add smooth animations (300ms ease-out)
4. Test on iOS/Android

### Phase 2: Systematic Rollout
Replace headers in this order (highest traffic first):

**Week 1: Core Vendor Pages**
1. ✅ `/vendor/apps` (Dashboard)
2. ✅ `/vendor/products`
3. ✅ `/vendor/orders`
4. ✅ `/vendor/analytics`

**Week 2: Management Pages**
5. ✅ `/vendor/locations`
6. ✅ `/vendor/customers`
7. ✅ `/vendor/employees`
8. ✅ `/vendor/settings`

**Week 3: Specialized Pages**
9. ✅ `/vendor/marketing/*`
10. ✅ `/vendor/labels/*`
11. ✅ `/vendor/operations`

**Week 4: POS & Polish**
12. ✅ `/pos/orders`
13. ✅ `/pos/receiving`
14. ✅ `/pos/register`
15. ✅ Polish & Bug Fixes

### Phase 3: Quality Assurance
- Test on real iOS device (iPhone with notch/Dynamic Island)
- Test on Android tablet (fullscreen PWA)
- Verify scroll behavior
- Check dark mode consistency
- Accessibility audit (VoiceOver, TalkBack)

---

## Success Metrics

### User Experience
- ✅ Headers consistent across 100% of app pages
- ✅ No content behind iOS status bar
- ✅ Smooth, native-like transitions
- ✅ Touch targets meet 44px minimum

### Performance
- ✅ No layout shift on page load
- ✅ Headers render in < 16ms (60fps)
- ✅ Smooth scroll on 60Hz and 120Hz displays

### Accessibility
- ✅ Proper heading hierarchy (h1 for titles)
- ✅ ARIA labels for actions
- ✅ Screen reader navigation works
- ✅ High contrast mode support

---

## Example Pages After Implementation

### Products Page
```
┌──────────────────────────────────────────────────────────┐
│                                              [Add Product]│
│                                                           │
│  Products                                                 │
│  42 ITEMS · 3 LOW STOCK · 12 CATEGORIES                  │
│                                                           │
│  ┌─────────┬────────────┬───────────┬──────────────┐    │
│  │Products │Categories  │Inventory  │Purchase Orders│    │
│  └─────────┴────────────┴───────────┴──────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Orders Page
```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  Orders                                                   │
│  127 ORDERS · $12,453 REVENUE · LAST 30 DAYS             │
│                                                           │
│  [Stats Cards: Total | Revenue | Commission | Net]       │
└──────────────────────────────────────────────────────────┘
```

### Settings Page
```
┌──────────────────────────────────────────────────────────┐
│  [← Back]                                       [Save]    │
│                                                           │
│  Settings                                                 │
│  STORE CONFIGURATION                                      │
│                                                           │
│  [Form Fields...]                                         │
└──────────────────────────────────────────────────────────┘
```

---

## Code Quality Standards

### TypeScript
- ✅ Strict mode enabled
- ✅ No `any` types
- ✅ Exhaustive union type checks

### Performance
- ✅ Memoized components
- ✅ No re-renders on scroll
- ✅ Lazy-loaded icons

### Accessibility
- ✅ Semantic HTML
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ ARIA attributes

### Testing
- ✅ Unit tests for all variants
- ✅ Visual regression tests
- ✅ Accessibility tests
- ✅ Performance benchmarks

---

## What Would Steve Jobs Say?

> "This is how it should have been from day one. One header. Everywhere. No compromises. No exceptions. Users should never have to think about where they are - the header tells them. It's not about features, it's about clarity."

The header is the user's north star. It must be:
- **Instantly recognizable** - Same everywhere
- **Invisible when right** - You don't notice it working
- **Delightful in detail** - Typography, spacing, timing perfect

This is not just UI. This is trust. This is craft.

---

## Next Steps

1. **Create the component** (`components/ui/PageHeader.tsx`)
2. **Test on device** (Real iPhone, real Android tablet)
3. **Roll out systematically** (One page at a time, test each)
4. **Measure success** (No regressions, improved navigation)
5. **Document usage** (Storybook, examples for team)

This is how we build software that respects users' time and intelligence.
