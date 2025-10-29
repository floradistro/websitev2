# Storefront Builder Architecture & Media Library Integration Guide

**Date:** October 29, 2025
**Scope:** Complete architectural overview for integrating media library with storefront builder
**Thoroughness Level:** Very Thorough

---

## EXECUTIVE SUMMARY

Your system has **TWO distinct building tools**:

1. **Component Editor** (Production) - Visual drag-and-drop editor for vendors to customize storefronts
2. **Storefront Builder** (Development) - AI-powered tool for creating/prototyping new components

This guide focuses on integrating the **Media Library** with the **Storefront Builder** to enable real data pulling capabilities.

---

## 1. STOREFRONT BUILDER LOCATION & STRUCTURE

### Main Location
```
/Users/whale/Desktop/Website/app/storefront-builder/
├── page.tsx (350 lines - main orchestrator)
├── components/
│   ├── VendorSelector.tsx (vendor switching)
│   ├── TopBar.tsx (navigation)
│   ├── ToolsPanel.tsx (direct manipulation tools)
│   ├── AIPanel.tsx (AI prompt interface)
│   ├── PreviewFrame.tsx (live preview renderer)
│   ├── StreamingPanel.tsx (AI generation status)
│   ├── FontPicker.tsx (Google Fonts library)
│   └── ComponentBrowser.tsx (smart component browser)
├── hooks/
│   ├── useCodeEditor.ts (code state + history + undo/redo)
│   ├── useVendorSelection.ts (vendor fetching/switching)
│   ├── useAIGeneration.ts (Claude Sonnet 4.5 streaming)
│   ├── usePreview.ts (iframe preview rendering)
│   └── useKeyboardShortcuts.ts (keyboard commands)
└── page-old-backup.tsx (original 117KB backup)

/Users/whale/Desktop/Website/lib/storefront-builder/
├── types.ts (TypeScript interfaces - Vendor, Section, SmartComponent, etc.)
├── constants.ts (FONT_LIBRARY, SMART_COMPONENTS, initial code)
├── utils.ts (section parsing, code manipulation, backups)
└── codeManipulation.ts (15+ direct manipulation tools)
```

### Technology Stack
- **AI Model:** Claude Sonnet 4.5 (streaming)
- **Frontend:** React + Next.js + Tailwind
- **Preview:** iframe-based with postMessage communication
- **Code Display:** Typewriter effect with streaming
- **State Management:** Custom hooks + localStorage backup

---

## 2. SMART COMPONENTS: WHAT ARE THEY?

### Definition
Smart components are **React components that auto-fetch real vendor data** from your database.

### Location
```
/Users/whale/Desktop/Website/components/component-registry/smart/
├── SmartHero.tsx (Hero section - no data fetch)
├── SmartProductGrid.tsx (Product grid - fetches products)
├── SmartProductShowcase.tsx (Featured products)
├── SmartProductDetail.tsx (Single product)
├── SmartTestimonials.tsx (Reviews/testimonials)
├── SmartHeader.tsx (Navigation with product fetch)
├── SmartFooter.tsx (Footer)
├── SmartShopControls.tsx (Shop filter/sort)
├── SmartCategoryNav.tsx (Category navigation)
├── SmartFAQ.tsx (FAQ accordion)
├── SmartContact.tsx (Contact form)
├── SmartAbout.tsx (About page)
├── SmartFeatures.tsx (Feature highlights)
├── SmartLocationMap.tsx (Store locations)
├── SmartLabResults.tsx (Lab results display)
├── SmartStatsCounter.tsx (Animated stats)
├── SmartShipping.tsx (Shipping info)
├── SmartReturns.tsx (Return policy)
├── SmartPOS.tsx (POS system)
├── SmartLegalPage.tsx (Legal page generator)
├── FloraDistroHero.tsx (Flora Distro branded hero)
├── FloraDistroHomepage.tsx (Complete homepage template)
└── index.ts (exports)
```

### Smart Component Pattern

```typescript
// Example: SmartProductGrid
"use client";

import React, { useState, useEffect } from 'react';
import { ProductGrid } from '../composite/ProductGrid';

export interface SmartProductGridProps {
  vendorId: string;
  selectedProductIds?: string[];
  selectedCategoryIds?: string[];
  headline?: string;
  maxProducts?: number;
  columns?: 2 | 3 | 4 | 5;
  showPrice?: boolean;
}

export function SmartProductGrid({
  vendorId,
  selectedProductIds = [],
  selectedCategoryIds = [],
  headline,
  maxProducts = 12,
  columns = 3,
  showPrice = true,
}: SmartProductGridProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Hydration fix - client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fetch real product data
  useEffect(() => {
    if (!isClient) return;
    
    async function loadProducts() {
      try {
        const res = await fetch('/api/page-data/products', { cache: 'no-store' });
        const result = await res.json();
        
        if (result.success) {
          let vendorProducts = result.data.products.filter(
            (p: any) => p.vendor_id === vendorId
          );
          
          if (selectedCategoryIds.length > 0) {
            vendorProducts = vendorProducts.filter((p: any) =>
              p.categories?.some((cat: any) => selectedCategoryIds.includes(cat.id))
            );
          }
          
          setProducts(vendorProducts.slice(0, maxProducts));
        }
      } catch (err) {
        console.error('Products fetch error:', err);
      }
    }
    
    loadProducts();
  }, [isClient, vendorId, JSON.stringify(selectedProductIds)]);
  
  if (!isClient) return <div className="py-12">Loading...</div>;
  
  return (
    <div>
      {headline && <h2 className="text-3xl font-bold">{headline}</h2>}
      <ProductGrid
        products={products}
        columns={columns}
        showPrice={showPrice}
      />
    </div>
  );
}
```

### Key Characteristics

1. **"use client"** directive - Client-side rendering
2. **Props** - Control appearance & behavior
3. **Data Fetching** - Automatic via useEffect hooks
4. **Vendor-Aware** - Accept `vendorId` to filter data
5. **Real Data** - Pull from `/api/page-data/*` endpoints
6. **Error Handling** - Graceful fallbacks

### Smart Component Base Classes

Located at `/lib/smart-component-base.tsx`:

```typescript
// Base props all smart components extend
interface SmartComponentBaseProps {
  vendorId?: string;
  vendorSlug?: string;
  vendorName?: string;
  vendorLogo?: string;
  className?: string;
  animate?: boolean;
}

// Hooks
export function useScrollAnimation(options?) { ... }
export function useVendorData<T>(endpoint, vendorId) { ... }

// Utilities
export const SmartTypography = { Headline, Subheadline, Body, Label }
export const SmartContainers = { Section, MaxWidth, Card, Grid }
export function SmartButton(...) { ... }
export function SmartComponentWrapper(...) { ... }
```

---

## 3. DATA FLOW: HOW THE BUILDER PULLS DATA

### Data Source Hierarchy

```
┌─────────────────────────────────────────────────────┐
│ Storefront Builder Preview                          │
│ (iframe with React component)                       │
└────────────────┬────────────────────────────────────┘
                 │
                 │ fetch('/api/page-data/products')
                 │ fetch('/api/vendor/media')
                 │
         ┌───────▼──────────┐
         │ API Routes       │
         │ /app/api/**      │
         └───────┬──────────┘
                 │
         ┌───────▼──────────────────┐
         │ Supabase Database        │
         │ - vendors                │
         │ - products               │
         │ - vendor_component...    │
         │ - component_templates    │
         └─────────────────────────┘
                 │
         ┌───────▼──────────────────┐
         │ Supabase Storage         │
         │ vendor-product-images    │
         │ (media library files)    │
         └─────────────────────────┘
```

### Data Flow Example: Product Grid Component

**Step 1: Builder selects vendor**
```typescript
// VendorSelector component
const [selectedVendor, setSelectedVendor] = useState(vendors[0]);
// Updates code: vendorId = "abc123"
```

**Step 2: Preview renders component**
```typescript
// PreviewFrame.tsx
<iframe srcDoc={`
  <Component vendorId="abc123" />
`} />
```

**Step 3: Component fetches data**
```typescript
// SmartProductGrid.tsx (running in iframe)
useEffect(() => {
  fetch('/api/page-data/products')
    .then(r => r.json())
    .then(result => {
      const vendorProducts = result.data.products
        .filter(p => p.vendor_id === vendorId);
      setProducts(vendorProducts);
    });
}, [vendorId]);
```

**Step 4: Display with real data**
```typescript
return (
  <ProductGrid products={products} columns={3} />
);
```

### API Endpoints for Data Pulling

#### Product Data
```
GET /api/page-data/products
├── Returns: { success: true, data: { products: [...], locations: [...] } }
└── Fetched by: SmartProductGrid, SmartProductShowcase, SmartShopControls
```

#### Media Library
```
GET /api/vendor/media
├── Headers: x-vendor-id: "uuid"
├── Returns: { success: true, files: [...], count: number }
└── Used by: MediaLibraryClient (vendor dashboard)

POST /api/vendor/media (upload)
├── Body: FormData { file: File }
├── Headers: x-vendor-id: "uuid"
└── Returns: { success: true, file: { name, url, size } }

DELETE /api/vendor/media?file=filename
├── Headers: x-vendor-id: "uuid"
└── Returns: { success: true, message: "..." }
```

#### Component Registry
```
GET /api/component-registry/route
├── Returns: { components: [...], variants: {...} }

GET /api/component-registry/variants/[componentKey]
└── Returns: { variants: [...] }
```

---

## 4. COMPONENT TYPES & ARCHITECTURE

### Component Categories (3 Layers)

```
┌────────────────────────────────────────┐
│ SMART COMPONENTS (data-aware)          │
│ - Auto-fetch real data                 │
│ - Vendor-specific                      │
│ - Examples: SmartProductGrid,          │
│   SmartTestimonials, SmartHeader       │
└────────────────────────────────────────┘

         ↓ (use/wrap)

┌────────────────────────────────────────┐
│ COMPOSITE COMPONENTS (layout)          │
│ - Combine atomic components            │
│ - Data-agnostic                        │
│ - Examples: ProductGrid, Card, Layout  │
└────────────────────────────────────────┘

         ↓ (compose)

┌────────────────────────────────────────┐
│ ATOMIC COMPONENTS (basic)              │
│ - Single responsibility                │
│ - No data fetching                     │
│ - Examples: Button, Text, Image, Icon  │
└────────────────────────────────────────┘
```

### Component Registry System

Located at `/lib/component-registry/registry.ts`:

```typescript
interface ComponentTemplate {
  id: UUID;
  component_key: string;
  name: string;
  description: string;
  category: 'atomic' | 'composite' | 'smart' | 'layout';
  required_fields: string[];
  optional_fields: string[];
  field_schema: Record<string, any>;
  data_sources: string[]; // ['products', 'inventory', 'reviews']
  fetches_real_data: boolean;
  variants: string[]; // ['grid', 'carousel', 'list']
  props_schema: Record<string, any>;
  default_layout: Record<string, any>;
  responsive_breakpoints: Record<string, any>;
  child_components: string[];
  slot_definitions: Record<string, any>;
  is_public: boolean;
  is_deprecated: boolean;
  version: string;
  tags: string[];
}

interface VendorComponentInstance {
  id: UUID;
  vendor_id: UUID;
  section_id: UUID | null;
  component_key: string; // 'smart_product_grid'
  instance_name: string | null; // "Featured Products"
  active_variant: string | null; // 'grid'
  props: Record<string, any>; // { columns: 3, showPrice: true }
  field_bindings: Record<string, any>; // Maps to vendor fields
  position_order: number;
  container_config: Record<string, any>;
  is_enabled: boolean;
  is_visible: boolean;
}
```

### Dynamic Component Rendering

Located at `/lib/component-registry/renderer.tsx`:

```typescript
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  // Atomic
  'text': Atomic.Text,
  'image': Atomic.Image,
  'button': Atomic.Button,
  
  // Composite
  'product_card': Composite.ProductCard,
  'product_grid': Composite.ProductGrid,
  
  // Smart
  'smart_product_grid': Smart.SmartProductGrid,
  'smart_product_showcase': Smart.SmartProductShowcase,
  'smart_testimonials': Smart.SmartTestimonials,
  'smart_hero': Smart.SmartHero,
  'smart_header': Smart.SmartHeader,
  'smart_footer': Smart.SmartFooter,
  // ... 15+ more
};

export function DynamicComponent({
  componentKey,
  props,
  fieldBindings,
  vendorId,
  vendorSlug,
  vendorName,
  vendorLogo,
}: DynamicComponentProps) {
  const Component = COMPONENT_MAP[componentKey];
  
  const mergedProps = {
    ...props,
    ...fieldBindings,
    // Inject vendor data for smart components
    ...(componentKey.startsWith('smart_') && vendorId ? { 
      vendorId, vendorSlug, vendorName, vendorLogo 
    } : {}),
  };
  
  return <Component {...mergedProps} />;
}
```

---

## 5. MEDIA USAGE: CURRENT IMPLEMENTATION

### Media Library Endpoint

Location: `/app/api/vendor/media/route.ts`

**Features:**
- List files (with pagination)
- Upload with validation (JPEG, PNG, WebP, max 10MB)
- Delete files
- Generate public URLs
- Metadata storage

```typescript
// GET /api/vendor/media
// Lists vendor's images from Supabase storage
const files = data.map(file => {
  const { data: { publicUrl } } = supabase.storage
    .from('vendor-product-images')
    .getPublicUrl(`${vendorId}/${file.name}`);
  
  return {
    id: file.id,
    name: file.name,
    url: publicUrl,
    size: file.metadata?.size || 0,
    created_at: file.created_at,
    metadata: file.metadata
  };
});

// POST /api/vendor/media (with file upload)
// Uploads to: vendor-product-images/{vendorId}/{filename}

// DELETE /api/vendor/media?file=filename
// Removes from Supabase storage
```

### Media Library Client

Location: `/app/vendor/media-library/MediaLibraryClient.tsx`

**Features:**
- Grid/List view switching
- Drag-and-drop upload
- Search/filter
- Bulk operations
- AI image operations:
  - Remove background
  - Enhance
  - Upscale
  - Reimagine
- Quick preview
- AI image generator integration

### How Images Are Used in Components

```typescript
// SmartProductGrid.tsx
<img 
  src={p.featured_image_storage} 
  className="w-full aspect-square object-cover rounded-xl"
/>

// SmartHero.tsx
{vendorLogo && (
  <img 
    src={vendorLogo} 
    alt="Logo"
    className="h-24 w-auto object-contain"
  />
)}

// Product from database
// products table has:
// - featured_image: TEXT (URL)
// - image_gallery: TEXT[] (array of URLs)
```

### Database Schema for Images

Products table:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  featured_image TEXT,           -- Main product image URL
  image_gallery TEXT[] DEFAULT '{}', -- Array of gallery images
  ...
);
```

Media files stored in:
```
Supabase Storage Bucket: vendor-product-images
├── {vendorId}/
│   ├── product-photo-1.jpg
│   ├── product-photo-2.jpg
│   ├── logo.png
│   └── ...
```

---

## 6. INTEGRATION POINTS FOR MEDIA LIBRARY

### Key Integration Opportunities

#### 1. **Smart Component Generator (Storefront Builder)**
```typescript
// When generating component code, allow media selection
<AIPanel>
  <textarea placeholder="Describe your component...">
    Create a product showcase with images from media library
  </textarea>
  <button>Generate with Media</button>
</AIPanel>
```

#### 2. **Component Editor (Live Editing)**
```typescript
// When editing SmartProductGrid props, allow image selection
<ImagePicker
  onSelect={(image) => updateComponentProps({ 
    featuredImage: image.url 
  })}
/>
```

#### 3. **Direct Manipulation Tools**
```typescript
// ToolsPanel.tsx - add image manipulation
<button onClick={() => {
  // Replace images in selected component
  const newCode = replaceImageUrls(code, selectedImages);
}}>
  Replace Images
</button>
```

#### 4. **Section Data Binding**
```typescript
// Component instance -> field binding to media library
vendor_component_instances {
  props: {
    bannerImage: "/api/vendor/media/banner.jpg"
  },
  field_bindings: {
    featured_image: "media_library_image_id"
  }
}
```

---

## 7. ARCHITECTURE SUMMARY FOR INTEGRATION

### Three-Tier System

```
┌─────────────────────────────────────────────────────┐
│ PRESENTATION TIER (UI)                              │
├─────────────────────────────────────────────────────┤
│ ✓ Storefront Builder (AI-powered development)       │
│ ✓ Component Editor (Visual production editing)      │
│ ✓ Media Library (File management)                   │
└────────────────────┬────────────────────────────────┘
                     │
┌─────────────────────▼────────────────────────────────┐
│ COMPONENT TIER (React Components)                    │
├─────────────────────────────────────────────────────┤
│ ✓ Smart Components (auto-fetch data)                │
│ ✓ Composite Components (layout & structure)         │
│ ✓ Atomic Components (basic elements)                │
│ ✓ Component Registry (dynamic rendering)            │
└────────────────────┬────────────────────────────────┘
                     │
┌─────────────────────▼────────────────────────────────┐
│ DATA TIER (APIs & Database)                         │
├─────────────────────────────────────────────────────┤
│ ✓ /api/page-data/* (product, category data)         │
│ ✓ /api/vendor/media (file operations)               │
│ ✓ /api/component-registry/* (templates & variants)  │
│ ✓ Supabase Database (vendors, products, instances)  │
│ ✓ Supabase Storage (media library files)            │
└─────────────────────────────────────────────────────┘
```

### Key Files for Integration

**For Building Components with Media:**
- `/lib/storefront-builder/constants.ts` - Add media library examples
- `/lib/storefront-builder/types.ts` - Add MediaBinding interface
- `/app/storefront-builder/components/ToolsPanel.tsx` - Add media tools
- `/app/storefront-builder/hooks/useAIGeneration.ts` - Pass media context to Claude

**For Editing Components with Media:**
- `/lib/component-registry/renderer.tsx` - Enhance DynamicComponent
- `/components/vendor/ComponentInstanceEditor.tsx` - Add media picker
- `/lib/component-registry/registry.ts` - Media field bindings

**For Media Data:**
- `/app/api/vendor/media/route.ts` - Already exists, enhance if needed
- `/app/vendor/media-library/MediaLibraryClient.tsx` - Already exists
- `/components/storefront/ComponentBasedPageRenderer.tsx` - Supports live updates

### Data Flow for Media Integration

```
1. UPLOAD
   User selects file
   → MediaLibraryClient.tsx
   → POST /api/vendor/media
   → Supabase Storage bucket
   → Database record

2. BUILDER GENERATION
   User: "Create component with media"
   → Storefront Builder (AIPanel)
   → Claude (with media context)
   → Generates component code
   → Preview renders with real media

3. COMPONENT EDITING
   User clicks image in preview
   → ComponentInstanceEditor opens
   → Shows ImagePicker from media library
   → Updates vendor_component_instances.props
   → Preview updates live via postMessage

4. RENDERING
   Component needs image
   → DynamicComponent loads SmartProductGrid
   → Component fetches /api/page-data/products
   → Database returns featured_image URLs
   → Images render with media library URLs
```

---

## 8. READY FOR INTEGRATION CHECKLIST

### What Exists (Ready to Use)
- [x] Storefront Builder infrastructure (refactored, modular)
- [x] Smart Component system (20+ components)
- [x] Component Registry (database-driven)
- [x] Media Library API (upload, delete, list)
- [x] Media Library UI (vendor dashboard)
- [x] DynamicComponent renderer (smart + regular)
- [x] Data fetching patterns (hooks + APIs)
- [x] Database schema (products, media, components)
- [x] Live preview with iframe communication

### What Needs Enhancement
- [ ] Media library integration into AI prompts
- [ ] Image selection UI in ToolsPanel
- [ ] Media binding templates
- [ ] Image field in component schema
- [ ] Media search/filtering

### Recommended Implementation Order

1. **Phase 1: Foundation**
   - Add MediaBinding interface to types.ts
   - Create useMediaLibrary hook
   - Add media examples to SMART_COMPONENTS constant

2. **Phase 2: Builder Integration**
   - Add media context to AIGeneration (Claude receives available images)
   - Add media picker to ToolsPanel
   - Create image insertion helper

3. **Phase 3: Component Enhancement**
   - Create ImageField component
   - Add image_url to component props schema
   - Update SmartProductGrid to support custom images

4. **Phase 4: Live Editing**
   - Add image picker to ComponentInstanceEditor
   - Support media library fields in field bindings
   - Enable drag-drop image replacement

---

## KEY FILE PATHS FOR INTEGRATION

### Core Files
- `/Users/whale/Desktop/Website/app/storefront-builder/page.tsx` - Main builder
- `/Users/whale/Desktop/Website/lib/storefront-builder/constants.ts` - Add media examples
- `/Users/whale/Desktop/Website/lib/storefront-builder/types.ts` - Add media types
- `/Users/whale/Desktop/Website/components/component-registry/smart/*.tsx` - Smart components
- `/Users/whale/Desktop/Website/lib/component-registry/renderer.tsx` - Dynamic rendering
- `/Users/whale/Desktop/Website/lib/component-registry/registry.ts` - Component templates

### Media Files
- `/Users/whale/Desktop/Website/app/api/vendor/media/route.ts` - Media API
- `/Users/whale/Desktop/Website/app/vendor/media-library/MediaLibraryClient.tsx` - Media UI

### Database Schema
- `/Users/whale/Desktop/Website/supabase/migrations/20250124_component_registry_system.sql` - Component tables
- `/Users/whale/Desktop/Website/supabase/migrations/20251021_products_catalog.sql` - Product images

### Documentation
- `/Users/whale/Desktop/Website/STOREFRONT_BUILDER_ARCHITECTURE.md` - Architecture overview
- `/Users/whale/Desktop/Website/STOREFRONT_BUILDER_REFACTORING_COMPLETE.md` - Latest refactoring

---

## NEXT STEPS

1. **Review** this architecture document
2. **Identify** specific media integration points you need
3. **Create** a phased implementation plan
4. **Start** with Phase 1 foundation work
5. **Test** with real vendor data and components
6. **Deploy** incrementally to production

---

**End of Guide**
