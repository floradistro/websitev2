# 🎨 Unified Design System - "SF Family" for Vendor Platform

**Apple-level consistency across the entire ecosystem**

## 📦 What We've Created

### Core Files
1. **`/lib/design-system.ts`** - Design tokens (colors, typography, spacing, effects)
2. **`/components/ds/`** - Standardized components

### Components Created
- ✅ **Button** - Compact buttons with variants (primary, secondary, ghost, danger)
- ✅ **IconButton** - Icon-only buttons
- ✅ **Dropdown** - Auto-positioning dropdowns that don't overflow
- ✅ **Modal** - Compact modals with proper backdrop
- ✅ **Input** - Text inputs with icons and labels
- ✅ **Textarea** - Multi-line text inputs
- ✅ **Select** - Dropdown selects
- ✅ **Tabs** - Professional tab navigation
- ✅ **Card** - Container cards with optional headers
- ✅ **Container** - Simple container without header

---

## 🎯 Design Principles

1. **Compact** - Minimal padding, save space
2. **Professional** - Refined typography, subtle colors
3. **Consistent** - Same fonts, sizes, colors everywhere
4. **Accessible** - Proper focus states, good contrast

### Typography System
```typescript
// Sizes (all in text-[Xpx] for precision)
micro: 9px    // Tiny labels, badges
xs: 10px      // Standard labels, buttons, nav ⭐ PRIMARY
sm: 11px      // Subtitles, descriptions
base: 14px    // Body text
md: 16px      // Emphasized text
lg: 18px      // Section headers
xl: 20px      // Page headers
2xl: 24px     // Hero text

// Weight
light: 300    // ⭐ PRIMARY - most text
normal: 400   // Body text
medium: 500   // Emphasis
semibold: 600 // Numbers, CTAs
bold: 700     // Rare, only for impact

// Letter spacing (tracking)
wide: 0.15em  // ⭐ PRIMARY for labels
wider: 0.2em  // Extra refined
```

### Color System
```typescript
// Text (white with opacity)
text-white/90  // Primary text
text-white/70  // Secondary text ⭐ COMMON
text-white/60  // Tertiary text ⭐ COMMON
text-white/40  // Quaternary (placeholders)
text-white/30  // Ghost text
text-white/25  // Whisper text
text-white/20  // Almost invisible

// Backgrounds
bg-[#0a0a0a]      // ⭐ PRIMARY dark
bg-black          // Pure black
bg-white/[0.04]   // Subtle lift
bg-white/[0.06]   // Hover state
bg-white/[0.08]   // Active/selected

// Borders
border-white/[0.04]  // Barely visible
border-white/[0.06]  // ⭐ STANDARD
border-white/[0.08]  // Hover
border-white/[0.12]  // Active/focus
```

---

## 📝 Usage Examples

### Buttons
```tsx
import { Button, IconButton } from '@/components/ds';
import { Plus, Trash } from 'lucide-react';

// Primary button
<Button onClick={handleClick}>
  Save Product
</Button>

// With icon
<Button icon={Plus} iconPosition="left">
  Add Product
</Button>

// Danger variant
<Button variant="danger" icon={Trash}>
  Delete
</Button>

// Icon only
<IconButton icon={Plus} onClick={handleAdd} />
```

### Dropdowns
```tsx
import { Dropdown, DropdownTrigger } from '@/components/ds';
import { MoreVertical, Edit, Trash } from 'lucide-react';

<Dropdown
  trigger={
    <DropdownTrigger>
      <MoreVertical size={14} />
    </DropdownTrigger>
  }
  items={[
    { label: 'Edit', icon: <Edit size={14} />, onClick: handleEdit },
    { label: 'Delete', icon: <Trash size={14} />, onClick: handleDelete, variant: 'danger' },
  ]}
  align="right"
/>
```

### Modals
```tsx
import { Modal, Button } from '@/components/ds';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Product"
  size="lg"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </>
  }
>
  {/* Modal content */}
</Modal>
```

### Forms
```tsx
import { Input, Textarea, Select } from '@/components/ds';
import { Search } from 'lucide-react';

// Input with icon
<Input
  label="Product Name"
  placeholder="Enter name..."
  icon={Search}
  iconPosition="left"
/>

// Textarea
<Textarea
  label="Description"
  placeholder="Enter description..."
  rows={4}
/>

// Select
<Select
  label="Category"
  options={[
    { value: '1', label: 'Flowers' },
    { value: '2', label: 'Edibles' },
  ]}
/>
```

### Tabs
```tsx
import { Tabs } from '@/components/ds';

<Tabs
  tabs={[
    { label: 'Active', content: <ProductList />, count: 42 },
    { label: 'Archived', content: <ArchivedList />, count: 8 },
  ]}
/>
```

### Cards
```tsx
import { Card, Container, Button } from '@/components/ds';
import { Plus } from 'lucide-react';

// Card with header
<Card
  title="Products"
  subtitle="Manage your inventory"
  headerActions={
    <Button icon={Plus} size="xs">Add</Button>
  }
  padding="compact"
>
  {/* Content */}
</Card>

// Simple container
<Container padding="compact">
  {/* Content */}
</Container>
```

---

## 🔄 Migration Guide

### Before (Inconsistent)
```tsx
// ❌ Old way - inconsistent
<button className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">
  Save
</button>

<div className="bg-gray-800 p-6 rounded-lg shadow-xl">
  <h2 className="text-2xl font-bold mb-4">Products</h2>
  {/* content */}
</div>
```

### After (Design System)
```tsx
// ✅ New way - consistent
import { Button, Card } from '@/components/ds';

<Button>Save</Button>

<Card title="Products" padding="compact">
  {/* content */}
</Card>
```

---

## 🎯 Next Steps

### Phase 1: Replace Common Components (Immediate)
1. Find all custom buttons → Replace with `<Button />`
2. Find all custom modals → Replace with `<Modal />`
3. Find all custom dropdowns → Replace with `<Dropdown />`

### Phase 2: Apply to Critical Pages
1. **Products page** - Most used
2. **Customers page** - High traffic
3. **Inventory page** - Daily use
4. **Orders page** - Real-time operations

### Phase 3: System-wide Rollout
Apply to remaining 26 vendor pages

---

## 🚀 Quick Start

```tsx
// Import what you need
import { Button, Input, Card, Modal, Dropdown, Tabs } from '@/components/ds';
import { ds } from '@/components/ds'; // Design tokens

// Use design tokens for custom styling
<div className={`${ds.colors.text.secondary} ${ds.typography.size.xs}`}>
  Custom text with design system
</div>
```

---

## 📏 Spacing Guidelines

**Compact is key!**

- Buttons: `px-2.5 py-1.5` (10px/6px)
- Inputs: `px-2.5 py-1.5` (10px/6px)
- Cards: `p-3` (12px) - compact mode
- Modals: `p-4` (16px) headers/footers, `p-4` content
- Gaps: `gap-2` (8px) to `gap-3` (12px) most common

---

## 🎨 Before & After

### Dropdown Menus
**Before:**
- ❌ Overflow off-screen
- ❌ Inconsistent fonts (14px, 16px, bold, medium)
- ❌ Too much padding (px-6 py-4)

**After:**
- ✅ Auto-positioning with `max-h-[70vh]` scroll
- ✅ Consistent: `text-[10px] font-light`
- ✅ Compact: `px-3 py-1.5`

### Buttons
**Before:**
- ❌ Mix of sizes, colors, fonts
- ❌ Some rounded-md, some rounded-lg
- ❌ Inconsistent hover states

**After:**
- ✅ Standardized sizes (xs, sm, md)
- ✅ Consistent `rounded-md`
- ✅ Unified hover: `hover:bg-white/[0.08]`

---

## 🛠️ Advanced Usage

### Using Design Tokens Directly
```tsx
import { ds, cn } from '@/components/ds';

// Combine multiple tokens
const myClass = cn(
  ds.colors.bg.primary,
  ds.colors.text.secondary,
  ds.typography.size.xs,
  ds.effects.radius.lg,
  'custom-class'
);
```

### Creating Custom Variants
```tsx
// Use the ds tokens to create consistent custom components
const MyCustomComponent = () => (
  <div className={cn(
    ds.components.container,  // Pre-made combination
    'my-custom-additions'
  )}>
    {/* content */}
  </div>
);
```

---

**Design System Version:** 1.0.0
**Last Updated:** 2025-11-01
**Status:** ✅ Core components complete, ready for rollout
