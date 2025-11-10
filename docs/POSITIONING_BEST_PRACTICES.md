# CSS Positioning Best Practices

## The "Flash Then Disappear" Bug

This document describes a persistent bug that has affected multiple parts of the application (gallery view, order expand view) and how to prevent it.

### Root Causes

The bug occurs when ALL of these conditions are met:

1. **Component uses `fixed` or `absolute` positioning**
2. **Component is wrapped in a parent with `overflow-hidden` and/or `h-full`**
3. **(Optional) Tailwind `animate-in` classes are used, which hide elements after animation**

### Why It Happens

```tsx
// ❌ BAD - Will cause disappearing bug
<div className="overflow-hidden h-full">  {/* Parent clips child */}
  <div className="fixed inset-0">          {/* Child tries to escape parent */}
    <YourContent />
  </div>
</div>
```

**What happens:**
- The `fixed`/`absolute` element tries to position itself relative to the viewport/parent
- The parent's `overflow-hidden` clips anything outside its bounds
- If the parent doesn't have proper height context, the child gets clipped to 0px
- Result: Content renders briefly, then disappears

### The Solution

#### For Full-Screen Overlays (Modals)

Use `fixed inset-0` **WITHOUT** any wrapper div:

```tsx
// ✅ GOOD - Modal overlay
{showModal && (
  <FullScreenContainer mode="overlay" onBackdropClick={onClose}>
    <YourModalContent />
  </FullScreenContainer>
)}
```

#### For In-Place Replacements (Galleries)

Use `absolute inset-0` with a `relative` parent:

```tsx
// ✅ GOOD - In-place replacement
<div className="relative flex-1">  {/* Parent provides positioning context */}
  {showGallery ? (
    <FullScreenContainer mode="replace">
      <YourGalleryContent />
    </FullScreenContainer>
  ) : (
    <YourGridContent />
  )}
</div>
```

## Standardized Component

**Always use `<FullScreenContainer>`** instead of creating custom positioning:

```tsx
import { FullScreenContainer } from "@/components/ui/FullScreenContainer";

// Mode options:
// - "overlay": Fixed positioning for modals/popups
// - "replace": Absolute positioning to replace content in parent

<FullScreenContainer
  mode="overlay"  // or "replace"
  background="linear-gradient(135deg, #000000 0%, #1a1a1a 100%)"
  zIndex={9999}   // overlay mode only
  onBackdropClick={onClose}  // overlay mode only
>
  <YourContent />
</FullScreenContainer>
```

## Rules to Follow

### ✅ DO

1. Use `<FullScreenContainer>` for all full-screen UI
2. Ensure parent has `position: relative` when using mode="replace"
3. Use standard CSS `transition` for animations
4. Keep positioning logic simple and explicit

### ❌ DON'T

1. **NEVER** wrap fixed/absolute elements in divs with `overflow-hidden`
2. **NEVER** use Tailwind `animate-in` classes (they hide after animation)
3. **NEVER** nest multiple layers of positioning wrappers
4. **NEVER** use `h-full` on wrappers around fixed/absolute elements

## Debugging Checklist

If content is disappearing:

1. Check for parent divs with `overflow-hidden` or `h-full`
2. Remove Tailwind `animate-in` classes
3. Verify positioning: `fixed` for overlays, `absolute` for replacements
4. Ensure parent has `position: relative` if using `absolute`
5. Check browser devtools to see if element has 0px height

## Examples from Codebase

### ✅ FIXED: ProductGallery (Media Library)

**Before (broken):**
```tsx
<div className="relative h-full w-full">  {/* h-full causes clipping */}
  <div className="absolute inset-0 animate-in fade-in">  {/* animate-in hides after */}
    <ProductGallery />
  </div>
</div>
```

**After (working):**
```tsx
<div className="relative flex-1">  {/* flex-1 for natural sizing */}
  <FullScreenContainer mode="replace">
    <ProductGallery />
  </FullScreenContainer>
</div>
```

### ✅ CORRECT: POSQuickView Modal

This modal is implemented correctly:

```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
  <div className="bg-[#0a0a0a] rounded-2xl max-w-6xl max-h-[90vh] overflow-hidden">
    <ModalContent />
  </div>
</div>
```

**Why it works:**
- `fixed inset-0` is NOT wrapped in overflow-hidden
- Only the content div has overflow-hidden (which is fine)
- No animate-in classes

## Historical Context

This bug affected:
- **ProductGallery** (vendor/media-library): Fixed by removing wrapper divs with overflow-hidden and h-full
- **Order expand view**: Verified correct implementation

Total debugging time: ~4 hours (January 2025)

## Additional Resources

- [MDN: CSS Position](https://developer.mozilla.org/en-US/docs/Web/CSS/position)
- [MDN: Overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow)
- Tailwind Docs: [animate-in is experimental and buggy](https://tailwindcss.com/docs/animation)
