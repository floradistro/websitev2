# Design System Consolidation Plan

**Date:** 2025-11-09
**Status:** 🚧 In Progress
**Goal:** Consolidate 3 design systems into 1 canonical system

---

## Current State Analysis

### Button Components (6 found)

| File                                              | Lines | Status      | Notes                                   |
| ------------------------------------------------- | ----- | ----------- | --------------------------------------- |
| `components/component-registry/atomic/Button.tsx` | 258   | ✅ **KEEP** | Most comprehensive, full variant system |
| `components/ui/Button.tsx`                        | 140   | 🔄 Migrate  | Good but less complete                  |
| `components/ds/Button.tsx`                        | 134   | 🔄 Migrate  | Similar to ui/Button                    |
| `components/vendor/ui/Button.tsx`                 | 48    | 🔄 Migrate  | Minimal implementation                  |
| `components/ui/dashboard/Button.tsx`              | ?     | 🔍 Audit    | Dashboard-specific                      |
| `components/customer/AddToWalletButton.tsx`       | ?     | ✅ KEEP     | Specialized component (OK)              |

**Decision:** Use `component-registry/atomic/Button.tsx` as canonical

---

### Card Components (13 found)

**Base Cards (duplicates):**

- `components/ui/Card.tsx`
- `components/ds/Card.tsx`
- `components/vendor/ui/Card.tsx`
- `components/ui/dashboard/Card.tsx`

**Specialized Cards (keep):**

- `components/ui/StatCard.tsx` - Stats display
- `components/ui/ChartCard.tsx` - Charts
- `components/component-registry/composite/ProductCard.tsx` - Products
- `components/tv-display/*ProductCard.tsx` - TV display variants
- `components/ProductCardSkeleton.tsx` - Loading state
- `components/vendor/VendorCard.tsx` - Vendor-specific

**Decision:** Consolidate base Cards, keep specialized ones

---

### Input Components (4 found)

| File                             | Lines | Status   | Notes               |
| -------------------------------- | ----- | -------- | ------------------- |
| `components/ui/Input.tsx`        | ?     | 🔍 Audit |                     |
| `components/ds/Input.tsx`        | ?     | 🔍 Audit |                     |
| `components/vendor/ui/Input.tsx` | ?     | 🔍 Audit |                     |
| `components/ui/POSInput.tsx`     | ?     | ✅ KEEP  | Specialized for POS |

---

## Consolidation Strategy

### Phase 1: Establish Canonical Location

**Decision:** Use `components/ui/` as the canonical design system location

**Rationale:**

- Already imported most frequently
- Clear, simple path (`@/components/ui/Button`)
- Established convention in codebase

### Phase 2: Migration Plan

#### Step 1: Audit & Enhance Canonical Components

1. Review `component-registry/atomic/Button.tsx` for all variants
2. Move to `components/ui/Button.tsx` (replace existing)
3. Ensure all props/variants are supported
4. Add JSDoc documentation

#### Step 2: Create Automated Migration Script

```typescript
// scripts/migrate-design-system.ts
// - Find all imports from old locations
// - Rewrite to new canonical location
// - Remove old component files
```

#### Step 3: Update Components

1. Run migration script
2. Test all affected pages
3. Remove duplicate files

#### Step 4: Document Design System

Create `components/ui/README.md` with:

- Component API documentation
- Usage examples
- Variant catalog
- Migration guide

---

## Implementation Tasks

- [ ] Audit all Button, Card, Input component features
- [ ] Choose best implementation for each
- [ ] Create migration script
- [ ] Run migration (automated)
- [ ] Manual testing of affected pages
- [ ] Delete redundant files
- [ ] Update imports
- [ ] Document design system
- [ ] Create Storybook/component showcase (optional)

---

## Estimated Impact

**Files to migrate:** ~150-200 imports
**Lines to remove:** ~1,200 duplicate lines
**Maintenance reduction:** 75% (maintain 1 system instead of 4)
**Time to complete:** 2-3 hours

---

## Rollback Plan

1. Git commit before migration
2. Keep old files until all tests pass
3. Gradual rollout (test one page at a time)
4. Can revert with `git reset --hard` if issues

---

## Next Steps

1. ✅ Complete this audit
2. ⏳ Read canonical Button component
3. ⏳ Create migration script
4. ⏳ Execute migration
5. ⏳ Delete old files
6. ⏳ Document new system
