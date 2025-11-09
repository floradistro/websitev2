# Component Architecture - Quick Reference Guide

## Key Statistics
- **Total Components**: 201 files
- **Client Components**: 51 (25%) with 'use client'
- **Server Components**: 150 (75%)
- **Interfaces Defined**: 200+ (100% coverage for props)
- **useState Calls**: 497 (dominant state pattern)
- **useEffect Calls**: 186 (lifecycle management)
- **useCallback/useMemo**: 35 (conservative memoization)
- **Context Files**: 6 (strategic usage)

## Directory Organization

| Directory | Files | Purpose | Reusability |
|-----------|-------|---------|-------------|
| `ui/` | 28 | Base UI components | EXCELLENT |
| `ds/` | 6 | Design system abstractions | EXCELLENT |
| `vendor/` | 37 | Vendor-specific features | GOOD |
| `component-registry/` | 23 | Smart/Atomic/Composite | GOOD |
| `dashboard/` | 8 | Analytics & KPI | MEDIUM |
| `Root level` | 46 | Feature-level components | MIXED |
| `tv-display/` | 8 | Display specific | MEDIUM |
| `animations/` | 5 | Animation utilities | GOOD |
| `admin/` | 8 | Admin interfaces | GOOD |
| Other | 32 | Specialized features | MIXED |

## Design System

**Location**: `/lib/design-system.ts`

**Core Tokens**:
- Typography: sizes, weights, tracking, transform, leading
- Colors: text opacity levels, status colors, icon colors
- Spacing: gap, padding, margin
- Effects: radius, shadows, transitions
- Interactive: hover, focus, active states

**Usage Pattern**:
```typescript
import { ds, cn } from '@/lib/design-system';
const classes = cn(
  ds.typography.size.xs,
  ds.colors.text.tertiary,
  ds.effects.radius.md
);
```

## Component Patterns by Type

### Form Components
- **FormField** (ui/): Comprehensive form control with validation
- **Input/Textarea/Select** (ds/): Minimal, forwardRef-enabled
- **CustomFieldModal**: Example of complex form with validation
- **Pattern**: Controlled components with onChange callbacks

### State Management
- **Local State**: 497 useState calls (primary pattern)
- **Context**: Only for critical global state (Auth, Cart, Filters)
- **Philosophy**: Lift state only when necessary
- **No Redux**: Deliberate choice to keep simple

### Props Patterns
- **Extension Pattern**: `extends InputHTMLAttributes<HTMLInputElement>`
- **Discriminated Union**: `type FormFieldProps = TextInput | Textarea | Select`
- **Callbacks**: `on{EventName}` naming convention
- **Booleans**: `is{State}`, `show{Feature}`, `has{Trait}`

### Client/Server Split
- **Server (75%)**: Static content, data fetching, layouts
- **Client (25%)**: Interactive features, hooks, modals

## TypeScript Standards

### Required Practices
- Interface for every component with props
- forwardRef for form inputs
- Proper typing in callbacks
- Union types for variants

### Example Interface
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
}
```

## State Management Approaches

### When to Use Context
✓ Authentication state
✓ Cart/Wishlist data
✓ Product filters
✓ Vendor/Admin mode

### When to Use Local State
✓ Form input values
✓ UI visibility (modal open/closed)
✓ Temporary selections
✓ Component-level animations

### When to Use Props
✓ Child component configuration
✓ Event callbacks
✓ Data display

## Common Anti-Patterns (To Avoid)

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Excessive `any` types | Loss of type safety | Define proper types |
| 5+ setState calls | Hard to track state | Use useReducer |
| Inline styles `{{ fontWeight: 900 }}` | Bypass design system | Use `ds.typography.weight` |
| Inline callbacks | Performance cost | Use useCallback |
| Hardcoded data | Not scalable | Fetch from API/props |

## Best Practices Observed

### Excellent
✓ Unified design system approach
✓ 100% TypeScript interfaces coverage
✓ Error boundary specialization
✓ forwardRef for form inputs
✓ Discriminated union action types
✓ Strategic context usage

### Good
✓ Consistent naming conventions
✓ Clear directory organization
✓ Component composition patterns
✓ Accessibility awareness

### Could Improve
⚠ Some 'any' types in complex forms
⚠ Multiple setState without useReducer
⚠ Some inline DOM manipulation
⚠ Limited test coverage

## File Navigation

**Base Components** → `components/ui/` (Button, Card, FormField, Badge)
**Design Tokens** → `lib/design-system.ts`
**Authentication** → `context/AuthContext.tsx`
**Shopping Cart** → `context/CartContext.tsx`
**Point of Sale** → `components/component-registry/pos/`
**Vendor Features** → `components/vendor/`
**Admin Features** → `components/admin/`

## Common Tasks

### Add New Component
1. Create file in appropriate directory
2. Define `interface {ComponentName}Props`
3. Use `ds` tokens for styling
4. Export with proper TypeScript types

### Add Form Field
1. Use `FormField` from ui/ (recommended)
2. Or extend from `ds/Input` with forwardRef
3. Include error prop and validation

### Add Modal
1. Use `Modal` from ds/
2. Wrap in error boundary if needed
3. Handle isOpen/onClose props
4. Size options: sm, md, lg, xl, full

### Add State
1. Use useState for local UI state
2. Use context only for global state
3. Use useCallback for event handlers
4. Include proper cleanup in useEffect

## Performance Guidelines

### Memoization
- Only use if component re-renders frequently
- 35 instances across 201 components (conservative)
- Measure before optimizing

### Server Components
- Default to server components (no 'use client')
- Only use 'use client' when needed (hooks, interactivity)
- Current: 75% server, 25% client

### Bundle Size
- No component duplication
- Design system centralized
- Proper imports enable tree-shaking

## Accessibility Notes

### Implemented
✓ Dialog focus management
✓ ARIA labels
✓ Keyboard navigation support
✓ Error boundary recovery UI

### Could Improve
⚠ More comprehensive keyboard navigation
⚠ Screen reader testing
⚠ Color contrast audit

---

**Last Updated**: Analysis based on 201 component files across the codebase
