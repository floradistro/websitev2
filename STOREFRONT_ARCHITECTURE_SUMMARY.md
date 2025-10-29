# Storefront Builder Architecture - Search Results Summary

**Date:** October 29, 2025
**Search Scope:** Very Thorough
**Total Files Analyzed:** 50+ files

---

## QUICK REFERENCE

### Storefront Builder Location
- **Main:** `/Users/whale/Desktop/Website/app/storefront-builder/`
- **Library:** `/Users/whale/Desktop/Website/lib/storefront-builder/`
- **Status:** Recently refactored (117KB → 350 lines in main file)

### Smart Components Location
- **Directory:** `/Users/whale/Desktop/Website/components/component-registry/smart/`
- **Count:** 21 different smart components
- **Pattern:** All fetch real vendor data via API

### Media Library Location
- **API:** `/Users/whale/Desktop/Website/app/api/vendor/media/route.ts`
- **UI:** `/Users/whale/Desktop/Website/app/vendor/media-library/MediaLibraryClient.tsx`
- **Storage:** Supabase bucket `vendor-product-images`

### Component Registry
- **Registry:** `/Users/whale/Desktop/Website/lib/component-registry/registry.ts`
- **Renderer:** `/Users/whale/Desktop/Website/lib/component-registry/renderer.tsx`
- **Database:** `component_templates`, `vendor_component_instances`, etc.

---

## KEY FINDINGS

### 1. TWO-SYSTEM ARCHITECTURE

Your system has **two completely different builders**:

#### A. Component Editor (Production)
- Location: `/vendor/component-editor`
- Purpose: Vendors visually edit their storefronts
- Features: Drag-drop, visual prop editing, multi-page
- Storage: Database-driven (`vendor_component_instances`)
- Output: Live website

#### B. Storefront Builder (Development)
- Location: `/storefront-builder`
- Purpose: Developers create/prototype components
- Features: AI generation, code editing, live preview
- Storage: Temporary (in editor, localStorage backup)
- Output: React component code

**You were using Storefront Builder for both. They're designed for different purposes.**

### 2. SMART COMPONENTS ARE THE KEY

Smart components are the bridge between your data and your UI:

```typescript
// Smart = Vendor-aware + Data-fetching + Real-time
SmartProductGrid ({
  vendorId: "abc123",  // ← Links to vendor
  columns: 3,          // ← User can customize
  showPrice: true
})
  └─> Fetches /api/page-data/products
      └─> Filters by vendorId
          └─> Returns vendor's real products
              └─> Renders with product images
```

**21 Smart Components exist:**
- Data-aware: SmartProductGrid, SmartProductShowcase, SmartHeader, SmartTestimonials
- UI-aware: SmartHero, SmartFAQ, SmartContact, SmartAbout
- Flora Distro specific: FloraDistroHero, FloraDistroHomepage

### 3. COMPONENT REGISTRY IS SCHEMA-DRIVEN

Components aren't hard-coded. They're defined in database:

```sql
component_templates
  ├── component_key (e.g., 'smart_product_grid')
  ├── name, description, category
  ├── required_fields, optional_fields
  ├── data_sources (e.g., ['products', 'inventory'])
  ├── fetches_real_data: boolean
  ├── variants (e.g., ['grid', 'carousel', 'list'])
  └── props_schema (TypeScript definitions)

vendor_component_instances
  ├── vendor_id
  ├── component_key (references template)
  ├── props (customization by vendor)
  ├── field_bindings (maps to vendor fields)
  ├── position_order
  └── is_enabled, is_visible
```

This allows **dynamic rendering** - same component works for all vendors with different data.

### 4. DATA FLOW IS WELL-ESTABLISHED

```
User selects vendor in Builder
  ↓
Builder renders preview iframe
  ↓
Preview loads component with vendorId
  ↓
Component fetches /api/page-data/products
  ↓
API queries database for vendor's products
  ↓
Component renders with REAL data (featured_image, price, etc.)
  ↓
User sees live preview with their actual products
```

**API Endpoints:**
- `/api/page-data/products` - All products + locations
- `/api/page-data/vendors` - Vendor data
- `/api/vendor/media` - Vendor's media files
- `/api/component-registry/*` - Template definitions

### 5. MEDIA LIBRARY EXISTS BUT NOT INTEGRATED WITH BUILDER

**Current state:**
- Media Library: ✓ Exists (upload, delete, list, preview)
- API: ✓ Exists (GET, POST, DELETE)
- Database: ✓ Exists (products.featured_image, image_gallery)
- Component Rendering: ✓ Uses images from products table

**Missing integration:**
- Builder doesn't load available media when generating code
- Claude doesn't know what images are available
- No media picker in ToolsPanel
- No real-time media library access in preview

---

## CRITICAL FILE PATHS

### Core Architecture
```
/Users/whale/Desktop/Website/
├── app/storefront-builder/
│   ├── page.tsx (350 lines - main orchestrator)
│   ├── components/
│   │   ├── VendorSelector.tsx
│   │   ├── AIPanel.tsx (AI prompt input)
│   │   ├── ToolsPanel.tsx (manipulation tools)
│   │   ├── PreviewFrame.tsx (iframe preview)
│   │   └── 5 more...
│   ├── hooks/
│   │   ├── useAIGeneration.ts (Claude Sonnet 4.5)
│   │   ├── useCodeEditor.ts (state + history)
│   │   ├── useVendorSelection.ts (vendor loading)
│   │   ├── usePreview.ts (iframe rendering)
│   │   └── useKeyboardShortcuts.ts
│   └── page-old-backup.tsx (117KB original)
│
├── lib/storefront-builder/
│   ├── types.ts (interfaces & types)
│   ├── constants.ts (SMART_COMPONENTS, FONT_LIBRARY)
│   ├── utils.ts (section parsing)
│   └── codeManipulation.ts (15+ tools)
│
├── components/component-registry/smart/
│   ├── SmartProductGrid.tsx (fetches products)
│   ├── SmartHero.tsx (no data fetch)
│   ├── SmartTestimonials.tsx (fetches reviews)
│   ├── SmartHeader.tsx (fetches nav data)
│   └── 17 more...
│
├── lib/component-registry/
│   ├── registry.ts (database interface)
│   ├── renderer.tsx (DynamicComponent)
│   └── field-binding-resolver.ts
│
├── app/api/
│   ├── vendor/media/route.ts (upload, list, delete)
│   ├── page-data/products/route.ts
│   ├── page-data/vendors/route.ts
│   └── component-registry/**
│
├── app/vendor/media-library/
│   ├── page.tsx (lazy loader)
│   └── MediaLibraryClient.tsx (full UI)
│
└── supabase/migrations/
    ├── 20250124_component_registry_system.sql
    └── 20251021_products_catalog.sql
```

---

## INTEGRATION POINTS FOR MEDIA LIBRARY

### Opportunity 1: AI Code Generation Context
**Location:** `/app/storefront-builder/hooks/useAIGeneration.ts`
**Action:** Pass available media files to Claude

```typescript
// Before sending to Claude, fetch media files
const mediaFiles = await fetch('/api/vendor/media', {
  headers: { 'x-vendor-id': vendorId }
}).then(r => r.json());

// Include in prompt to Claude:
const prompt = `${userPrompt}

Available media files:
${mediaFiles.files.map(f => f.name + ': ' + f.url).join('\n')}

Generate components that reference these images.`;
```

### Opportunity 2: Media Tools Panel
**Location:** `/app/storefront-builder/components/ToolsPanel.tsx`
**Action:** Add media manipulation tools

```typescript
<button onClick={() => {
  // Show media picker modal
  // User selects image
  // Update component code with image URL
}}>
  Replace Images from Media Library
</button>
```

### Opportunity 3: Component Prop Binding
**Location:** `/lib/component-registry/renderer.tsx`
**Action:** Support media library URLs in props

```typescript
// vendor_component_instances.props could have:
{
  heroImage: "/api/vendor/media/hero-banner.jpg",
  productImages: ["img1.jpg", "img2.jpg"]
}
```

### Opportunity 4: Field Bindings to Media
**Location:** Database `field_component_bindings`
**Action:** Map "image_field" to "SmartImage" component that pulls from media library

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Est. 2 hours)
- [ ] Add `MediaFile` interface to types.ts
- [ ] Create `useMediaLibrary` hook to fetch vendor's media
- [ ] Add media examples to SMART_COMPONENTS constant
- [ ] Test media fetching in isolation

### Phase 2: Builder Integration (Est. 4 hours)
- [ ] Modify `useAIGeneration` to include media context
- [ ] Update Claude prompt with available images
- [ ] Create media picker component
- [ ] Add to ToolsPanel

### Phase 3: Component Enhancement (Est. 3 hours)
- [ ] Create `ImageField` component
- [ ] Update smart component templates with image fields
- [ ] Add image_url support to SmartProductGrid
- [ ] Test with real vendor data

### Phase 4: Live Editing (Est. 4 hours)
- [ ] Add media picker to ComponentInstanceEditor
- [ ] Support media library fields in field bindings
- [ ] Enable image replacement via preview
- [ ] Test drag-drop image updates

**Total: ~13 hours of development**

---

## THINGS THAT ALREADY WORK

1. **Vendor Selection** - Correctly loads vendors and their data
2. **Code Generation** - Claude Sonnet 4.5 generates valid React code
3. **Preview Rendering** - iframe-based preview works perfectly
4. **Live Data Fetching** - Components fetch real products from API
5. **Smart Components** - 21 components handle different use cases
6. **Component Registry** - Database-driven, extensible system
7. **Media API** - Upload, list, delete all implemented
8. **Media Storage** - Supabase bucket configured and working
9. **Component Instances** - Can save and reuse component configs
10. **History/Undo** - Code history and localStorage backups work

---

## WHAT TO DO NEXT

1. **Review** the generated documents in `/tmp/`:
   - `STOREFRONT_BUILDER_MEDIA_INTEGRATION_GUIDE.md` (comprehensive)
   - `ARCHITECTURE_DIAGRAM.md` (visual flows)

2. **Choose** your integration approach:
   - Option A: Full integration (all 4 phases)
   - Option B: Partial (Claude context only, skip UI)
   - Option C: Component-level only (no builder changes)

3. **Start** with Phase 1 (foundation)
   - Minimal risk
   - Tests the hooks
   - Validates data flow

4. **Test** with real vendor data
   - Use actual products
   - Verify image URLs
   - Check performance

5. **Deploy** incrementally
   - Start with Phase 1
   - Get feedback
   - Continue phases as needed

---

## KEY INSIGHTS

1. **Smart Components Are Not Created by Builder**
   - Builder generates single-use code
   - Smart Components are pre-built, reusable
   - Builder code → Test → Save as Smart Component → Register

2. **Data Flow is Automatic**
   - Components don't need code changes for new data
   - Just change vendorId or filters
   - API handles all data fetching

3. **Media Library is Ready**
   - All infrastructure exists
   - Just needs integration with builder
   - No database schema changes needed

4. **Registry System is Flexible**
   - Components are defined in database
   - Can add variants, bindings, schemas
   - Supports dynamic rendering

5. **Component Editor is Production**
   - This is where users actually build sites
   - Storefront Builder is for developers
   - They work together, not in conflict

---

## ARCHITECTURE SUMMARY

```
Your system: Builder (AI) + Registry (Database) + Components (React)

Vendor's journey:
  1. Upload images → Media Library
  2. Developer uses Storefront Builder → Generate component
  3. Register component in system
  4. Vendor uses Component Editor → Customize component
  5. Vendor's site renders with Component + Real Data + Real Images

All three connected:
  Components need Data (API)
  Components need Media (Storage)
  Components need Customization (Registry)
  All pull real vendor info automatically
```

---

## FINAL NOTES

- **You have a sophisticated, well-architected system**
- **All the pieces are there - they just need connecting**
- **Media integration is straightforward - no major refactoring needed**
- **Component system is extensible and production-ready**
- **Smart components are the key to vendor-specific, data-driven UI**

Your challenge now is to **bridge Storefront Builder with Media Library** so developers can:
1. See available images when generating code
2. Reference those images in generated components
3. Have real images in preview
4. Provide better component templates to vendors

---

**All necessary files and paths documented above. Ready to integrate!**
