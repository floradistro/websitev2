# COMPREHENSIVE DESIGN INCONSISTENCY REPORT
## WhaleTools Design System Analysis

Generated: 2025-11-13

---

## EXECUTIVE SUMMARY

Your codebase spans **3 main applications** with **CRITICAL design inconsistencies**:

1. **POS (Point of Sale)** - Uses modern black theme with Apple-style design
2. **Vendor Dashboard** - Uses inconsistent black theme with conflicting patterns
3. **TV Menus** - Uses intermediate-state design with mixed patterns
4. **Media Library** - Uses inconsistent patterns

**Key Issues:**
- Font weight inconsistency (font-black/900 vs font-light)
- Multiple navigation patterns (vendor nav bar vs custom nav)
- Different color opacity schemes (white/5 vs white/[0.05])
- Inconsistent spacing/padding conventions
- Border styling variations
- Mixed modal/dialog approaches

---

## 1. POS APPLICATION ANALYSIS

### Files Analyzed:
- `/Users/whale/Desktop/whaletools/app/pos/layout.tsx`
- `/Users/whale/Desktop/whaletools/app/pos/register/page.tsx`
- `/Users/whale/Desktop/whaletools/app/pos/orders/page.tsx`
- `/Users/whale/Desktop/whaletools/app/pos/receiving/page.tsx`
- `/Users/whale/Desktop/whaletools/components/component-registry/pos/POSLocationSelector.tsx`
- `/Users/whale/Desktop/whaletools/components/component-registry/pos/POSRegisterSelector.tsx`
- `/Users/whale/Desktop/whaletools/components/component-registry/pos/POSProductGrid.tsx`

### POS Design Characteristics:

#### 1.1 **Typography**
**ISSUE: Inconsistent font weights**

| Component | Font Weight | Size | Issue |
|-----------|-----------|------|-------|
| Main Headers (Location Selector) | font-black (900) | text-3xl | HEAVY |
| Receiving Page Headers | font-light | text-xl | LIGHT |
| POS Register Page Modal | font-black (900) | text-2xl | HEAVY |
| Product Names (POS Grid) | font-black (900) | text-xs | INCONSISTENT WITH SIZE |
| Register Info | font-light | text-sm | LIGHT |

**Lines with Issues:**
- `/app/pos/register/page.tsx:820` - `font-black text-white uppercase tracking-tight` (font-weight: 900)
- `/app/pos/receiving/page.tsx:242` - `font-light mb-2` (too light for header)
- `/components/component-registry/pos/POSLocationSelector.tsx:55` - `font-black text-white uppercase tracking-tight` (font-weight: 900)
- `/components/component-registry/pos/POSProductGrid.tsx:981` - `font-black uppercase text-xs` (too heavy for product names)

**Recommended Approach:**
- Use `font-semibold` (600) for major headers
- Use `font-medium` (500) for section titles
- Use `font-normal` (400) for body text
- Reserve `font-black` (900) ONLY for emphasis elements

---

#### 1.2 **Color Schemes & Backgrounds**

**ISSUE: Inconsistent opacity notation**

| Component | Pattern | Issue |
|-----------|---------|-------|
| POS Layout | `bg-[#0a0a0a]` | Hardcoded hex |
| POS Register Selector | `bg-white/5` | Opacity shorthand |
| Product Grid | `bg-white/[0.02]` | Array notation |
| Receiving Page | `bg-zinc-900/50` | Named color + opacity |
| Buttons | Mixed: `border-white/10`, `border-2 border-white/20` | INCONSISTENT |

**Lines with Issues:**
- `/app/pos/layout.tsx:40` - `bg-[#0a0a0a]` 
- `/app/pos/register/page.tsx:751` - `bg-[#0a0a0a]`
- `/components/component-registry/pos/POSProductGrid.tsx:924` - `bg-[#0a0a0a] hover:bg-[#141414]`
- `/app/pos/receiving/page.tsx:399` - `bg-zinc-900/50` (uses named color instead of white opacity)

**Recommended Approach:**
```
Primary Background: bg-black (or bg-[#000000])
Secondary Background: bg-white/5
Tertiary Background: bg-white/10
Hover States: bg-white/15
Borders: border border-white/10
Borders Strong: border-2 border-white/20
```

---

#### 1.3 **Navigation Patterns**

**ISSUE: POS has NO vendor navigation bar**

| Application | Nav Style | Location | Issue |
|------------|-----------|----------|-------|
| POS Layout | CUSTOM (Breadcrumbs only) | Top of selector pages | Completely different from vendor |
| POS Register/Location Selector | Breadcrumb Navigation | `/app/pos/register/page.tsx:248-260` | Uses Home icon + ChevronRight |
| Vendor Layout | Fixed 60px Icon Bar + Expandable 200px Panel | `app/vendor/layout.tsx:296-384` | Full sidebar navigation |

**Lines with Issues:**
- `/components/component-registry/pos/POSLocationSelector.tsx:36-49` - Custom breadcrumb navigation
- `/components/component-registry/pos/POSRegisterSelector.tsx:248-260` - Duplicate breadcrumb pattern
- `/app/pos/layout.tsx:40` - No navigation integration (returns bare div)

**Recommended Approach:**
- POS should have a **minimal top bar** with: Vendor logo + Location + Register + Help
- Do NOT use sidebar in POS (interrupts workflow)
- Match breadcrumb styling with vendor dashboard when navigating to/from POS

---

#### 1.4 **Spacing & Padding Systems**

**ISSUE: Inconsistent padding conventions**

| Pattern | Used In | Standard |
|---------|---------|----------|
| `p-6` | Location Selector | Yes |
| `p-4` | Product Grid toolbar | Yes |
| `px-3 py-2.5` | Register Selector buttons | Inconsistent |
| `px-4 py-3` | Various modals | Mixed |
| `p-8` | TV Menus breadcrumbs | Too large |

**Lines with Issues:**
- `/app/pos/register/page.tsx:817` - `p-8 max-w-md` (large padding on modal)
- `/app/pos/receiving/page.tsx:399` - `p-4` (header inconsistent)
- `/components/component-registry/pos/POSRegisterSelector.tsx:305` - `p-6` (cards inconsistent)

**Recommended Approach:**
```
Padding Scale (use consistently):
xs: p-2 (for small elements)
sm: p-3 (for compact sections)
md: p-4 (default for cards/sections)
lg: p-6 (for major sections)
xl: p-8 (reserved for full-page sections)

Padding Directional (consistency):
Horizontal padding: Always use px-3 or px-4
Vertical padding: Always use py-3 or py-4
Mixed: py-4 px-6 (y-first pattern)
```

---

#### 1.5 **Border Styles & Effects**

**ISSUE: Multiple border patterns**

| Pattern | Usage | Inconsistency |
|---------|-------|---------------|
| `border border-white/10` | Standard | Single-weight border |
| `border-2 border-white/10` | Some buttons | Double-weight |
| `border-2 border-white/20` | POS buttons | HEAVY |
| `border-b border-white/5` | Headers | Extra light |
| `rounded-xl` | Most | Inconsistent with rounded-2xl |
| `rounded-2xl` | Modals/cards | DIFFERENT |

**Lines with Issues:**
- `/app/pos/register/page.tsx:818` - `border-2 border-white/20` (heavy border)
- `/components/component-registry/pos/POSLocationSelector.tsx:71` - `border-2 border-white/10` (then hover adds `/30`)
- `/app/pos/receiving/page.tsx:299` - `border border-white/5` (inconsistent opacity)

**Recommended Approach:**
```
All borders: border (single pixel)
Border color: border-white/10 (default)
Border color hover: border-white/20 (hover state)
Border color active: border-white/30 (active state)

Border radius:
Inputs/Buttons: rounded-xl (12px)
Cards/Sections: rounded-2xl (16px)
Large containers: rounded-3xl (24px) - use sparingly
```

---

#### 1.6 **Button Styles**

**ISSUE: Buttons lack consistency**

| Button Type | Style | Issue |
|------------|-------|-------|
| Primary | `bg-white text-black` | Good |
| Secondary | `bg-white/5 border border-white/10` | Inconsistent opacity |
| Danger | `bg-red-500/10 border border-red-500/30` | Color-specific opacity |
| Hover State | Varies | Not standardized |

**Lines with Issues:**
- `/app/pos/register/page.tsx:845` - `bg-white text-black rounded-xl hover:bg-white/90` (WHITE primary)
- `/app/pos/register/page.tsx:852` - `bg-red-500/10 border border-red-500/30 text-red-400` (color-specific)
- `/components/component-registry/pos/POSRegisterSelector.tsx:271` - `bg-white/5 border border-white/10` (secondary)

**Recommended Approach:**
```
PRIMARY BUTTON:
bg-white text-black font-semibold rounded-xl
hover:bg-white/90 transition-all
(Use sparingly - max 1 per page)

SECONDARY BUTTON:
bg-white/10 text-white border border-white/20
hover:bg-white/15 hover:border-white/30 transition-all

TERTIARY BUTTON:
bg-transparent text-white/60 border border-white/10
hover:bg-white/5 hover:text-white/80 transition-all

DANGER BUTTON:
bg-red-500/20 text-red-400 border border-red-500/30
hover:bg-red-500/30 hover:border-red-500/40 transition-all
```

---

#### 1.7 **Card/Container Styles**

**ISSUE: Different card styling patterns**

| Component | Background | Border | Radius |
|-----------|-----------|--------|--------|
| Location Card | `bg-white/5` | `border-2 border-white/10` | rounded-2xl |
| Register Card | `bg-white/5` | `border-2 border-white/10` | rounded-2xl |
| Product Card | `bg-[#0a0a0a]` | `border border-white/5` | rounded-2xl |
| Modal | `bg-black` | `border border-white/20` | rounded-2xl |
| Input Field | `bg-white/5` | `border border-white/10` | rounded-xl |

**Lines with Issues:**
- `/components/component-registry/pos/POSLocationSelector.tsx:71` - `bg-white/5 border-2 border-white/10` (border-2 inconsistent)
- `/components/component-registry/pos/POSProductGrid.tsx:924` - `bg-[#0a0a0a]` (hardcoded, not white/0)
- `/app/pos/receiving/page.tsx:299` - `bg-zinc-900/50` (should be white opacity)

---

### POS Summary of Corrections Needed:

| Issue | Current | Recommended | Files |
|-------|---------|------------|-------|
| Font weights | Mixed black/light | Semibold for headers, normal for body | 5+ files |
| Colors | Hardcoded + opacity mixed | Consistent white opacity only | 3+ files |
| Navigation | Custom breadcrumbs | Minimal top bar | 2 files |
| Spacing | `p-4` through `p-8` | Standardized scale | All |
| Borders | `border` vs `border-2` | Single border width | 4+ files |
| Buttons | 6+ variations | 4 standard patterns | All |
| Cards | Different bg colors | Unified styling | 3+ files |

---

## 2. VENDOR DASHBOARD ANALYSIS

### Files Analyzed:
- `/Users/whale/Desktop/whaletools/app/vendor/layout.tsx` (Major)
- `/Users/whale/Desktop/whaletools/app/vendor/apps/page.tsx`
- `/Users/whale/Desktop/whaletools/app/vendor/operations/page.tsx`
- `/Users/whale/Desktop/whaletools/app/vendor/tv-menus/page.tsx` (Major)
- `/Users/whale/Desktop/whaletools/app/vendor/media-library/page.tsx`

### Vendor Dashboard Design Characteristics:

#### 2.1 **Navigation System (MAJOR DIFFERENCE FROM POS)**

**PATTERN: Fixed 60px Icon Bar + Expandable 200px Panel**

Defined in: `/app/vendor/layout.tsx:295-384`

```
TIER 1: Fixed 60px Icon Bar (left-0 w-[60px])
  - Contains icon-only buttons
  - Text shown on hover via title attribute
  - Line 321: w-11 h-11 flex items-center justify-center

TIER 2: Secondary Expandable Panel (left-[60px] w-[200px]) 
  - Shows on section click
  - Contains sub-page navigation
  - Slides in from left
  - Line 390: z-[95] transition-all duration-300

BACKDROP: Dark overlay when panel open
  - Line 285-293: z-[90] bg-black/50
```

**Inconsistency with POS:**
- POS uses custom breadcrumbs
- Vendor uses sidebar navigation
- TV Menus explicitly avoids this navigation: `/app/vendor/layout.tsx:296` - `!pathname?.includes("/tv-menus")`

**Lines with Issues:**
- `/app/vendor/layout.tsx:296` - TV Menus bypasses navigation entirely
- `/app/vendor/layout.tsx:462-478` - Custom header for page title (centered)
- `/app/vendor/tv-menus/page.tsx:842` - Header inside content area (DIFFERENT PATTERN)

---

#### 2.2 **Typography in Vendor Dashboard**

**ISSUE: Inconsistent weight usage**

| Component | Weight | Lines | Issue |
|-----------|--------|-------|-------|
| Section Headers | `font-black` (900) | Multiple | ALL CAPS + HEAVY |
| Page Titles | `font-light` | 474 | Too thin |
| Card Titles | `font-bold` (700) | Analytics | Good |
| Labels | `font-black` (900) | Reviews/Payouts | EXCESSIVE |
| UI Text | `font-medium` | Buttons | Good |

**Lines with Issues:**
- `/app/vendor/layout.tsx:474` - `font-light text-white/90 tracking-tight` (page title too light)
- `/app/vendor/review/page.tsx` - `font-black text-[10px] uppercase` (label text too heavy)
- `/app/vendor/tv-menus/page.tsx:860` - `font-black text-xs uppercase` (repetitive heavy styling)

**Recommended Approach:**
- Page titles: `text-2xl md:text-3xl font-semibold` (not light)
- Section labels: `text-[10px] uppercase tracking-[0.15em] font-medium` (not black)
- All caps text: Use `tracking-[0.15em]` with `font-medium`, NOT `font-black`

---

#### 2.3 **Color Opacity Notation**

**ISSUE: Inconsistent opacity notation patterns**

| Pattern | Example | Issue |
|---------|---------|-------|
| `white/5` | Button bg | Shorthand |
| `white/[0.05]` | Sidebar bg | Array notation |
| `white/[0.06]` | Border colors | Array notation |
| `white/40` | Text color | Shorthand |
| Named colors | `zinc-900/50` | In Receiving page |

**Inconsistency locations:**
- `/app/vendor/layout.tsx:299` - `border-white/[0.06]` (array notation)
- `/app/vendor/layout.tsx:323` - `border-white/[0.12]` (array notation)
- `/app/vendor/tv-menus/page.tsx:806` - `bg-white/5` (shorthand) vs others using array

**Recommended Approach:**
```
USE ONLY SHORTHAND:
white/5, white/10, white/15, white/20, white/30, white/40, white/50, white/60

NO ARRAY NOTATION:
Never use white/[0.05], white/[0.08], etc.

Opacity Map:
white/5 = 5% (very subtle)
white/10 = 10% (default backgrounds)
white/15 = 15% (hover states)
white/20 = 20% (active/borders)
white/30 = 30% (strong emphasis)
white/40 = 40% (secondary text)
white/50 = 50% (tertiary text)
white/60 = 60% (disabled text)
```

---

#### 2.4 **Vendor Navigation vs TV Menus**

**ISSUE: TV Menus explicitly disables vendor navigation**

Location: `/app/vendor/layout.tsx:296`, `387`, `449`, `457`

```tsx
{!pathname?.includes("/tv-menus") && (
  <aside>... sidebar ...</aside>
)}
```

TV Menus page has its **own custom header**:
- `/app/vendor/tv-menus/page.tsx:842` - Full-width header with breadcrumbs
- `border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-10`
- Custom button styling for actions
- NO integration with vendor sidebar

**Why this is problematic:**
- Users navigating from Dashboard → TV Menus lose navigation context
- Users can't easily navigate away from TV Menus without back button
- TV Menus has DIFFERENT design patterns (glassmorphism backdrop-blur-xl)

---

#### 2.5 **Glassmorphism & Transparency Effects**

**ISSUE: Different pages use different transparency techniques**

| Component | Technique | Location |
|-----------|-----------|----------|
| Vendor Sidebar | No backdrop blur | Clean/flat |
| Vendor Header | None specified | Flat |
| TV Menus Header | `backdrop-blur-xl` | Line 842 |
| Modal Overlays | `bg-black/50 backdrop-blur-sm` | Line 1205 |
| Modal Box | `border border-white/20` | No blur |

**Lines with Issues:**
- `/app/vendor/tv-menus/page.tsx:842` - `backdrop-blur-xl` (differs from vendor bar)
- `/app/vendor/tv-menus/page.tsx:1205` - `bg-black/80 backdrop-blur-sm` (modal blur)
- Inconsistency: TV Menus header blur vs vendor sidebar no blur

**Recommended Approach:**
```
NO glassmorphism in main navigation (keep flat/clean)
Glassmorphism ONLY for:
  - Floating action buttons
  - Modals/overlays
  - Context menus

Use backdrop-blur-md consistently across modals
Never use backdrop-blur-xl (too strong, hard to read)
```

---

#### 2.6 **Modal/Dialog Styling**

**ISSUE: Multiple modal patterns**

| Modal Type | Background | Border | Blur | Location |
|-----------|-----------|--------|------|----------|
| Create Menu | `bg-black border-white/20` | Yes | No | 1212 |
| Delete Confirm | `bg-black border-red-500/30` | Yes | No | 1311 |
| Edit Menu | (Component based) | Varies | No | 1277 |
| New Display | `bg-white/10 backdrop-blur-xl` | Yes | YES (xl) |1498 |

**Lines with Issues:**
- `/app/vendor/tv-menus/page.tsx:1212` - `border border-white/20` (standard)
- `/app/vendor/tv-menus/page.tsx:1498` - `bg-white/10 backdrop-blur-xl` (extra blur, different bg)
- Mixed backgrounds: `bg-black` vs `bg-white/10`

---

### Vendor Dashboard Summary:

| Issue | Current | Impact | Files |
|-------|---------|--------|-------|
| Navigation inconsistency | Sidebar + custom TV Menus | Confusing UX | 3+ |
| Font weights | BLACK/LIGHT mixed | Hierarchy unclear | 5+ |
| Opacity notation | Shorthand + array mix | Maintenance overhead | 4+ |
| Glassmorphism | Inconsistent application | Design confusion | 2+ |
| Modals | 3+ different patterns | UI inconsistency | Multiple |

---

## 3. TV MENUS APPLICATION ANALYSIS

### File: `/Users/whale/Desktop/whaletools/app/vendor/tv-menus/page.tsx`

### TV Menus Design Characteristics:

#### 3.1 **Separate Header (Not Integrated)**

**PATTERN: Full-width sticky header**

```tsx
Line 842: border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-10
```

**Issues:**
- Uses `backdrop-blur-xl` (strong blur) while vendor nav uses no blur
- Custom breadcrumb implementation (duplicate from POS)
- No integration with vendor sidebar (explicitly excluded)
- Takes up full width (no offset for sidebar)

**Recommended Fix:**
- Integrate with vendor layout properly
- Use vendor header but customize content area
- Don't exclude from sidebar navigation

---

#### 3.2 **Location Selector Screen**

Location: `/app/vendor/tv-menus/page.tsx:761-833`

**Issues:**
- Uses motion/framer-motion animations (not used consistently elsewhere)
- Grid layout: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Cards use `bg-white/5 hover:bg-white/10` (correct)
- BUT uses different animation approach than POS location selector

**Comparison:**
- POS Location Selector: Simple card buttons, no animation
- TV Menus Location Selector: Framer Motion animations, staggered entrance

---

#### 3.3 **Device Cards with Live Preview**

Location: `/app/vendor/tv-menus/page.tsx:1005-1150`

**Complex styling:**
```
bg-white/3 border border-white/10 rounded-xl
Uses iframes for live preview
Status indicator: fill-green-500 text-green-500 (Circle icon)
Compact controls: p-4 section at bottom
```

**Issues:**
- Very dense UI with multiple interaction patterns
- Status badge uses green/gray colors (not in design system)
- Menu selector dropdown in card (cramped)

---

## 4. MEDIA LIBRARY ANALYSIS

### File: `/Users/whale/Desktop/whaletools/app/vendor/media-library/MediaLibraryClient.tsx`

**Analysis shows:**
- Custom grid item component (memoized for performance)
- Image overlay on hover: `bg-gradient-to-t from-black/60 to-transparent`
- Selection indicator: `ring-2 ring-white` (circle border)
- Very different UI from other vendor pages (image-focused)

---

## 5. RECEIVING PAGE (INTERMEDIATE STATE)

### File: `/Users/whale/Desktop/whaletools/app/pos/receiving/page.tsx`

**Issue: This page has DIFFERENT styling from register page**

| Element | Register Page | Receiving Page | Issue |
|---------|---------------|-----------------|-------|
| Font weights | font-black headers | font-light headers | Inconsistent |
| Background | `bg-[#0a0a0a]` | `bg-black` | Different blacks |
| Card bg | Not applicable | `bg-zinc-900/50` | Named color |
| Header bg | NA | `bg-zinc-900/50` | Named color |
| Border style | `border-2` | `border` | Different thickness |

**Lines with Issues:**
- `/app/pos/receiving/page.tsx:399` - `bg-zinc-900/50` (should be white opacity)
- `/app/pos/receiving/page.tsx:230` - `font-light mb-2` (too light)
- `/app/pos/receiving/page.tsx:299` - `bg-zinc-900/50 border border-white/5` (inconsistent)

---

## 6. KEY INCONSISTENCY PATTERNS IDENTIFIED

### Pattern 1: Font Weight Chaos
```
POS Location Selector:     font-black (too heavy)
Receiving Page Headers:    font-light (too light)
Vendor Page Labels:        font-black + uppercase (excessive)
Proper Pattern:           font-semibold for headers, font-medium for labels
```

### Pattern 2: Color Opacity Notation
```
Current Mix:
  white/5 (shorthand)
  white/[0.05] (array notation) 
  white/[0.06] (array notation)
  white/[0.12] (array notation)
  
Recommendation: Use ONLY shorthand
```

### Pattern 3: Border Inconsistency
```
POS Cards:     border-2 border-white/10 (thick)
Vendor Cards:  border border-white/10 (thin)
Buttons:       border-2 border-white/20 (thick)
Recommendation: border (single) for all, border-white/20 for active
```

### Pattern 4: Navigation Three-Way Split
```
POS:           Custom breadcrumbs only
Vendor:        60px sidebar + 200px expandable panel
TV Menus:      Explicit exclusion from sidebar + custom header
Recommendation: Unified navigation with app-specific customization
```

### Pattern 5: Background Color Chaos
```
Hard-coded hex: bg-[#0a0a0a], bg-[#141414]
White opacity:  bg-white/5, bg-white/10
Named colors:   bg-zinc-900/50
Recommendation: Use ONLY bg-black or bg-white/x notation
```

---

## 7. DESIGN SYSTEM VIOLATIONS

### Violations Found:

1. **Typography System Not Followed**
   - No consistent scale (text-xs through text-4xl mixed arbitrarily)
   - Font weights all over place (light, normal, semibold, bold, black)
   - Some text uses style={{ fontWeight: 900 }} inline instead of Tailwind

2. **Color System Not Followed**
   - Hardcoded hex colors instead of opacity
   - Mixed shorthand and array notation for opacity
   - Named colors used instead of white opacity

3. **Spacing System Not Followed**
   - Padding ranges from p-1 to p-8 with no clear scale
   - Inconsistent directional padding (px-3 py-2.5 vs px-4 py-3)
   - Gap values vary (gap-2, gap-3, gap-4 all used)

4. **Border System Not Followed**
   - Mix of border and border-2
   - Opacity varies (border-white/5 through border-white/30)
   - Inconsistent rounded values (xl vs 2xl)

5. **Component Pattern Not Followed**
   - Buttons styled 6+ different ways
   - Cards have different backgrounds
   - Modals use different techniques

---

## 8. RECOMMENDED UNIFIED DESIGN SYSTEM

### Typography (Tailwind classes only, NO inline styles):

```tsx
// Page Titles
className="text-2xl md:text-3xl font-semibold"

// Section Headers
className="text-lg font-semibold"

// Card Titles
className="text-sm font-semibold"

// Labels (ALL CAPS)
className="text-[10px] uppercase tracking-[0.15em] font-medium"

// Body Text
className="text-sm text-white/80"

// Small Text
className="text-xs text-white/60"

// Emphasis (rare)
className="text-sm font-semibold text-white"

// NEVER use inline style={{ fontWeight: 900 }}
```

### Colors (Opacity only):

```tsx
// Backgrounds
bg-black                    // Primary
bg-white/5                  // Secondary
bg-white/10                 // Tertiary
bg-white/15                 // Hover on primary
bg-white/20                 // Hover on secondary

// Text
text-white                  // Primary text
text-white/80               // Body text
text-white/60               // Secondary text
text-white/40               // Tertiary text
text-white/20               // Disabled text

// Borders
border border-white/10      // Standard border
border border-white/20      // Active border
border border-white/30      // Strong border (rare)

// NEVER use:
// - Hex colors (bg-[#0a0a0a])
// - Named colors (bg-zinc-900)
// - Array notation (border-white/[0.06])
```

### Spacing (Consistent Scale):

```tsx
// Padding
p-2   // Extra small
p-3   // Small (default for buttons)
p-4   // Medium (default for cards/sections)
p-6   // Large
p-8   // Extra large (reserved)

// Gaps
gap-2   // Extra small
gap-3   // Small
gap-4   // Medium
gap-6   // Large

// ALWAYS use: py-X px-Y (not random combinations)
// Use gap for flexbox/grid, margin for specific spacing
```

### Borders (Unified):

```tsx
// Standard
rounded-xl      // Buttons & inputs
rounded-2xl     // Cards & sections

// Borders
border          // Single pixel ONLY
border-white/10 // Default
border-white/20 // Hover state
border-white/30 // Active state

// NEVER use border-2, border-4, etc.
```

### Buttons (4 Standard Types):

```tsx
// PRIMARY (white background, max 1 per page)
className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all"

// SECONDARY (light background)
className="bg-white/10 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl hover:bg-white/15 hover:border-white/30 transition-all"

// TERTIARY (no background)
className="text-white/60 border border-white/10 font-medium px-6 py-3 rounded-xl hover:bg-white/5 hover:text-white/80 transition-all"

// DANGER (red variant)
className="bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-6 py-3 rounded-xl hover:bg-red-500/30 hover:border-red-500/40 transition-all"
```

### Cards (Unified):

```tsx
// Standard Card
className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all"

// Interactive Card
className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"

// Card Header
className="bg-white/5 border-b border-white/10 p-4 -mx-4 -mt-4 mb-4"
```

### Modals (Unified):

```tsx
// Overlay
className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"

// Modal Container
className="bg-black border border-white/20 rounded-2xl p-8 max-w-md w-full"

// NEVER use: bg-white/10, backdrop-blur-xl
```

### Navigation (Unified for Vendor):

```tsx
// 60px Icon Bar (keep existing)
w-[60px] h-11 rounded-lg border border-transparent
hover:bg-white/[0.04] transition-all

// Secondary Panel (keep existing)
w-[200px] bg-black border-r border-white/[0.06]
z-[95] transition-all duration-300

// Top Header (CHANGE to match sidebar)
border-b border-white/5 (not backdrop-blur-xl)
```

---

## 9. MIGRATION PLAN

### Phase 1: Foundation (Week 1)
1. Create `/styles/design-system.css` with CSS variables for all values
2. Update Tailwind config to use consistent scale
3. Create component library with standard button/card/modal components

### Phase 2: POS Refactor (Week 2)
1. Update all font weights to recommended scale
2. Replace hardcoded colors with opacity
3. Standardize borders and spacing
4. Update all buttons to use 4 standard patterns
5. Update all cards to use unified card style

### Phase 3: Vendor Refactor (Week 3)
1. Integrate TV Menus into vendor navigation properly
2. Remove duplicate styling patterns
3. Update headers to use consistent opacity notation
4. Standardize modal implementations
5. Remove inline style attributes

### Phase 4: Media Library & Misc (Week 4)
1. Align media library with overall design
2. Fix receiving page styling
3. Test across all applications
4. Documentation

---

## 10. FILES NEEDING CHANGES

### CRITICAL (Must Change):

1. `/app/pos/layout.tsx` - Add navigation integration
2. `/app/pos/register/page.tsx` - Fix font weights, borders, buttons
3. `/components/component-registry/pos/POSLocationSelector.tsx` - Standardize styling
4. `/components/component-registry/pos/POSRegisterSelector.tsx` - Standardize styling
5. `/components/component-registry/pos/POSProductGrid.tsx` - Fix colors, buttons, cards
6. `/app/vendor/layout.tsx` - Keep sidebar, but integrate TV Menus
7. `/app/vendor/tv-menus/page.tsx` - Integrate with vendor nav, standardize styling

### HIGH PRIORITY:

8. `/app/pos/receiving/page.tsx` - Align with register page styling
9. `/app/vendor/media-library/MediaLibraryClient.tsx` - Ensure consistency
10. `/app/pos/register/components/OpenCashDrawerModal.tsx` - Fix modal styling
11. `/app/pos/register/components/CloseCashDrawerModal.tsx` - Fix modal styling

### MEDIUM PRIORITY:

12. All vendor pages (products, operations, analytics, etc.) - Update opacity notation
13. POS Cart component - Verify button/card styling
14. POS Payment component - Verify styling consistency

---

## 11. SPECIFIC LINE-BY-LINE FIXES

### Fix 1: POS Location Selector

**File:** `/components/component-registry/pos/POSLocationSelector.tsx`

**Line 55:**
```tsx
// CURRENT (WRONG):
className="text-3xl font-black text-white uppercase tracking-tight mb-2"
style={{ fontWeight: 900 }}

// CHANGE TO:
className="text-3xl font-semibold text-white uppercase tracking-tight mb-2"
// REMOVE style={{ fontWeight: 900 }}
```

**Line 71:**
```tsx
// CURRENT (WRONG):
className="bg-white/5 border-2 border-white/10 rounded-2xl p-6..."

// CHANGE TO:
className="bg-white/5 border border-white/10 rounded-2xl p-6..."
// Remove -2 from border
```

---

### Fix 2: POS Register Page Modal

**File:** `/app/pos/register/page.tsx`

**Line 820:**
```tsx
// CURRENT (WRONG):
className="text-2xl font-black text-white uppercase tracking-tight mb-4"
style={{ fontWeight: 900 }}

// CHANGE TO:
className="text-2xl font-semibold text-white uppercase tracking-tight mb-4"
// REMOVE inline style
```

**Line 817:**
```tsx
// CURRENT (WRONG):
className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"

// For modal background - ADD:
className="bg-black border border-white/20 rounded-2xl p-8 max-w-md w-full"
// Remove backdrop-blur-sm from main background, add to overlay only
```

---

### Fix 3: TV Menus Header

**File:** `/app/vendor/tv-menus/page.tsx`

**Line 842:**
```tsx
// CURRENT (WRONG):
<div className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-10">

// CHANGE TO:
<div className="border-b border-white/5 bg-black sticky top-0 z-10">
// Remove backdrop-blur-xl (keep flat design)
```

---

### Fix 4: Receiving Page Header

**File:** `/app/pos/receiving/page.tsx`

**Line 399:**
```tsx
// CURRENT (WRONG):
<div className="bg-zinc-900/50 border-b border-white/5 p-4">

// CHANGE TO:
<div className="bg-white/5 border-b border-white/10 p-4">
```

**Line 242:**
```tsx
// CURRENT (WRONG):
<h1 className="text-xl font-light mb-1">{selectedPO.po_number}</h1>

// CHANGE TO:
<h1 className="text-lg font-semibold mb-1">{selectedPO.po_number}</h1>
```

---

## 12. SUMMARY TABLE

### All Inconsistencies at a Glance:

| Issue | Current State | Recommended | Priority | Files |
|-------|---------------|------------|----------|-------|
| Font Weights | BLACK/LIGHT mix | SEMIBOLD/NORMAL | CRITICAL | 10+ |
| Color Notation | Hardcoded hex + array opacity | White opacity shorthand | CRITICAL | 15+ |
| Border Width | border vs border-2 | border only | CRITICAL | 8+ |
| Border Opacity | Multiple values | border-white/20 standard | HIGH | 10+ |
| Button Styles | 6+ variations | 4 standard types | CRITICAL | 20+ |
| Card Styles | Different backgrounds | Unified bg-white/5 | HIGH | 8+ |
| Spacing | No scale | px/py scale | HIGH | 15+ |
| Navigation | 3-way split | Unified with customization | CRITICAL | 5+ |
| Opacity Notation | Shorthand + array | Shorthand ONLY | MEDIUM | 10+ |
| Glassmorphism | Inconsistent | Modals/overlays only | MEDIUM | 3+ |
| Rounding | xl vs 2xl | xl for inputs, 2xl for cards | MEDIUM | 10+ |
| Inline Styles | Multiple | Tailwind ONLY | MEDIUM | 5+ |

---

## CONCLUSION

Your application has **3 distinct design systems running in parallel**:

1. **POS** - Heavy typography, thick borders, modern but inconsistent
2. **Vendor Dashboard** - Light typography, thin borders, mixed patterns
3. **TV Menus** - Different approach entirely, excluding vendor nav

**Recommendation:** Implement the unified design system in Phase 1 (Week 1), then migrate all applications in Phases 2-4. This will provide:
- Consistent user experience across all apps
- Easier maintenance and future updates
- Faster development (component reuse)
- Better accessibility (consistent patterns)
- Professional appearance

The most critical fixes are:
1. Font weight consistency
2. Color opacity standardization
3. Navigation integration
4. Button/card style unification

