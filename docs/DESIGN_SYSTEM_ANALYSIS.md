# Design System Component Analysis

**Date:** November 9, 2025
**Phase:** Pre-Consolidation Analysis
**Status:** 🔍 ANALYSIS COMPLETE - Ready for Strategy

---

## BUTTON COMPONENTS (5 Variants)

### 1. `components/ui/Button.tsx` ⭐ PRIMARY
- **Usage:** 2 imports in codebase
- **Purpose:** POS system UI (dark theme, uppercase, bold)
- **Props:**
  - `variant`: primary | secondary | ghost | danger | success
  - `size`: sm | md | lg
  - `icon`, `iconPosition`, `fullWidth`, `loading`
- **Styling:** Dark theme, white/10 backgrounds, uppercase tracking, font-black
- **Exports:** `Button`, `IconButton`

### 2. `components/ds/Button.tsx`
- **Usage:** 1 import
- **Purpose:** Design system standardized button (compact, minimal)
- **Props:**
  - `variant`: primary | secondary | ghost | danger
  - `size`: xs | sm | md
  - `icon` (LucideIcon), `iconPosition`, `fullWidth`, `loading`
- **Styling:** Uses `@/lib/design-system` tokens, professional minimal padding
- **Exports:** `Button`, `IconButton`

### 3. `components/vendor/ui/Button.tsx` (VendorButton)
- **Usage:** 0 imports (UNUSED)
- **Purpose:** Vendor portal theme-aware button
- **Props:**
  - `variant`: primary | secondary | danger | ghost
  - `icon` (LucideIcon), `loading`
- **Styling:** Uses `@/lib/dashboard-theme`, theme-based
- **Exports:** `VendorButton`
- **⚠️ Status:** CANDIDATE FOR REMOVAL

### 4. `components/ui/dashboard/Button.tsx` (DashboardButton)
- **Usage:** 0 imports (UNUSED)
- **Purpose:** Multi-theme dashboard button (admin/vendor)
- **Props:**
  - `theme`: ThemeName (admin | vendor)
  - `variant`: primary | secondary | danger | ghost
  - `icon` (LucideIcon), `loading`
- **Styling:** Uses `@/lib/dashboard-theme`, theme parameter
- **Exports:** `DashboardButton`
- **⚠️ Status:** CANDIDATE FOR REMOVAL

### 5. `components/component-registry/atomic/Button.tsx`
- **Usage:** 0 imports (UNUSED - used via dynamic component registry)
- **Purpose:** Visual builder atomic component with inline editing
- **Props:**
  - `text` (string, not children)
  - `variant`: primary | secondary | ghost | outline | danger | success
  - `size`: xs | sm | md | lg | xl
  - `href` (Link integration), `isPreviewMode`, `isSelected`, `onInlineEdit`
- **Styling:** Dark theme, uppercase, bold, rounded-2xl
- **Exports:** `Button` (named export)
- **Special Features:**
  - Inline text editing in preview mode
  - Next.js Link integration with param preservation
  - ContentEditable for visual builder
- **⚠️ Status:** KEEP - Required for component registry system

---

## CARD COMPONENTS (4 Variants)

### 1. `components/ui/Card.tsx`
- **Purpose:** General UI card component
- **Status:** Need to analyze

### 2. `components/ds/Card.tsx`
- **Purpose:** Design system standardized card
- **Status:** Need to analyze

### 3. `components/vendor/ui/Card.tsx`
- **Purpose:** Vendor portal themed card
- **Status:** Need to analyze

### 4. `components/ui/dashboard/Card.tsx`
- **Purpose:** Multi-theme dashboard card
- **Status:** Need to analyze

---

## INPUT COMPONENTS (3 Variants)

### 1. `components/ui/Input.tsx`
- **Purpose:** General UI input
- **Status:** Need to analyze

### 2. `components/ds/Input.tsx`
- **Purpose:** Design system standardized input
- **Status:** Need to analyze

### 3. `components/vendor/ui/Input.tsx`
- **Purpose:** Vendor portal themed input
- **Status:** Need to analyze

---

## BUTTON CONSOLIDATION STRATEGY (DRAFT)

### ⚠️ CRITICAL: Do NOT Break Functionality

#### Option A: Conservative Approach (RECOMMENDED)
1. **Keep 3 Button variants:**
   - `components/ui/Button.tsx` - Primary (POS/dark theme)
   - `components/ds/Button.tsx` - Secondary (design system)
   - `components/component-registry/atomic/Button.tsx` - Visual builder
2. **Remove 2 unused variants:**
   - ❌ `components/vendor/ui/Button.tsx` (0 imports)
   - ❌ `components/ui/dashboard/Button.tsx` (0 imports)
3. **Create unified export index:** `components/ui/index.ts`

#### Option B: Aggressive Approach (RISKY)
1. Create single `UnifiedButton` with all features
2. Migrate all imports to unified component
3. High risk of breaking POS, vendor portal, visual builder

#### Option C: Facade Pattern (SAFEST)
1. Keep all existing components as-is
2. Create unified implementation under the hood
3. Existing components become thin wrappers
4. Zero breaking changes, gradual migration path

---

## NEXT STEPS (Before Making Changes)

1. ✅ Analyze Card components (read all 4 variants)
2. ✅ Analyze Input components (read all 3 variants)
3. ✅ Check actual usage in app/ directory
4. ✅ Document all prop differences
5. ⏳ Create detailed migration plan with rollback strategy
6. ⏳ Get approval before any file deletions
7. ⏳ Test in local environment before committing

---

## USAGE SUMMARY

| Component | Imports | Status |
|-----------|---------|--------|
| `ui/Button.tsx` | 2 | ✅ IN USE |
| `ds/Button.tsx` | 1 | ✅ IN USE |
| `vendor/ui/Button.tsx` | 0 | ⚠️ UNUSED |
| `ui/dashboard/Button.tsx` | 0 | ⚠️ UNUSED |
| `atomic/Button.tsx` | 0* | ✅ REGISTRY |

*Used via dynamic component registry, not direct imports

---

## RISK ASSESSMENT

### Low Risk:
- Removing `vendor/ui/Button.tsx` (0 imports)
- Removing `ui/dashboard/Button.tsx` (0 imports)

### Medium Risk:
- Consolidating `ui/Button.tsx` and `ds/Button.tsx` (different APIs)

### High Risk:
- Modifying `atomic/Button.tsx` (complex inline editing, Link integration)
- Changing existing component APIs without migration path

### Zero Risk:
- Creating new unified components without touching existing ones
- Adding barrel exports (index.ts files)

---

**RECOMMENDATION:** Start with Card and Input analysis before proceeding with Button changes.
