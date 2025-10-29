# Storefront Builder Architecture - Visual Diagrams

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VENDOR STOREFRONT SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │ Storefront Builder   │  │ Component Editor     │  │ Media Library    │ │
│  │ (Development)        │  │ (Production)         │  │ (Management)     │ │
│  │                      │  │                      │  │                  │ │
│  │ - AI Code Generation │  │ - Visual Editor      │  │ - Upload Files   │ │
│  │ - Prototype Testing  │  │ - Drag & Drop        │  │ - Search/Filter  │ │
│  │ - Component Creation │  │ - Live Preview       │  │ - AI Operations  │ │
│  │                      │  │ - Multi-page Support │  │ - Organize Files │ │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬──────────┘ │
│             │                         │                        │             │
└─────────────┼─────────────────────────┼────────────────────────┼─────────────┘
              │                         │                        │
┌─────────────▼─────────────────────────▼────────────────────────▼─────────────┐
│ COMPONENT LAYER                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────┐    ┌────────────────────────────────┐  │
│  │  SMART COMPONENTS              │    │  COMPONENT REGISTRY            │  │
│  │  (Auto-fetch vendor data)      │    │  (Schema-driven rendering)     │  │
│  │                                │    │                                │  │
│  │ • SmartProductGrid             │    │ • Component Templates          │  │
│  │ • SmartProductShowcase         │    │ • Variant Configs              │  │
│  │ • SmartTestimonials            │    │ • Field Bindings               │  │
│  │ • SmartHeader/Footer           │    │ • Instance Data                │  │
│  │ • SmartCategoryNav             │    │ • Dynamic Rendering            │  │
│  │ • SmartShopControls            │    │ • Cache Management             │  │
│  │ • SmartFAQ/Contact             │    │                                │  │
│  │ • 15+ more...                  │    │ DynamicComponent Renderer      │  │
│  │                                │    │ (Route smart_* to components)  │  │
│  └────────────┬───────────────────┘    └────────┬───────────────────────┘  │
│               │                                 │                           │
│  ┌────────────▼────────────────────────────────▼──────────────────────────┐ │
│  │  COMPOSITE COMPONENTS        │   ATOMIC COMPONENTS                    │ │
│  │  (Layout & Structure)        │   (Basic Elements)                     │ │
│  │                              │                                        │ │
│  │ • ProductGrid                │ • Text                                 │ │
│  │ • ProductCard                │ • Image                                │ │
│  │ • Hero Layout                │ • Button                               │ │
│  │ • Grid/Flex Layouts          │ • Icon                                 │ │
│  │ • Card Containers            │ • Spacer/Divider                       │ │
│  │                              │ • Badge                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
              │                         │                        │
┌─────────────▼─────────────────────────▼────────────────────────▼─────────────┐
│ API & DATA LAYER                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ API ROUTES           │  │ SUPABASE DATABASE    │  │ SUPABASE STORAGE │  │
│  │ (/api/*)             │  │ (PostgreSQL)         │  │ (Object Storage) │  │
│  │                      │  │                      │  │                  │  │
│  │ • /page-data/*       │  │ Tables:              │  │ Bucket:          │  │
│  │   - products         │  │ • vendors            │  │ vendor-product-  │  │
│  │   - vendors          │  │ • products           │  │   images         │  │
│  │   - categories       │  │ • categories         │  │                  │  │
│  │                      │  │ • vendor_component   │  │ Structure:       │  │
│  │ • /vendor/media      │  │   _instances         │  │ {vendorId}/      │  │
│  │   - GET (list)       │  │ • component_         │  │   {filename}     │  │
│  │   - POST (upload)    │  │   templates          │  │                  │  │
│  │   - DELETE           │  │ • component_variant  │  │ Features:        │  │
│  │                      │  │   _configs           │  │ • Public URLs    │  │
│  │ • /component-        │  │ • field_component    │  │ • Metadata       │  │
│  │   registry/*         │  │   _bindings          │  │ • Cache Control  │  │
│  │   - templates        │  │ • vendor_storefront  │  │                  │  │
│  │   - variants         │  │   _sections          │  │                  │  │
│  │   - instances        │  │ • smart_component    │  │                  │  │
│  │                      │  │   _cache             │  │                  │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram: Building a Component

```
┌──────────────────────────────────────────────────────────────────┐
│                    STOREFRONT BUILDER WORKFLOW                  │
└──────────────────────────────────────────────────────────────────┘

1. USER INITIATES
   ┌─────────────────────────────┐
   │ Vendor Selection            │
   │ User picks vendor from list │
   └──────────┬──────────────────┘
              │
              ▼
2. VENDOR DATA LOADED
   ┌─────────────────────────────────────────┐
   │ VendorSelector → Fetch /api/vendors     │
   │ Load vendor_id, logo, name, products    │
   └──────────┬──────────────────────────────┘
              │
              ▼
3. CODE GENERATION REQUEST
   ┌─────────────────────────────────────────┐
   │ User types prompt:                      │
   │ "Create product grid with images"       │
   │                                         │
   │ AIPanel component sends to Claude:      │
   │ - Prompt                                │
   │ - Current code (if editing)             │
   │ - Vendor ID                             │
   │ - Available media files (NEW)           │
   │ - Component examples                    │
   └──────────┬──────────────────────────────┘
              │
              ▼
4. AI GENERATION (Claude Sonnet 4.5)
   ┌─────────────────────────────────────────┐
   │ useAIGeneration hook                    │
   │ Streaming response to browser           │
   │ Shows: thinking, tools, code            │
   │                                         │
   │ Tools Claude can use:                   │
   │ - screenshot_website                    │
   │ - browse_web                            │
   │ - get_vendor_data                       │
   │ - get_media_files (NEW)                 │
   └──────────┬──────────────────────────────┘
              │
              ▼
5. CODE COMPILATION
   ┌─────────────────────────────────────────┐
   │ useCodeEditor hook                      │
   │ Compiles generated React code           │
   │ Detects any errors                      │
   │ Wraps in html/head/body for iframe      │
   └──────────┬──────────────────────────────┘
              │
              ▼
6. PREVIEW RENDERING
   ┌─────────────────────────────────────────┐
   │ PreviewFrame component                  │
   │ Renders iframe with:                    │
   │ - Compiled code                         │
   │ - Device mode (desktop/tablet/mobile)   │
   │ - Real vendor data                      │
   │                                         │
   │ Inside iframe:                          │
   │ SmartProductGrid loads /api/page-data   │
   │ Shows real products from vendor         │
   └──────────┬──────────────────────────────┘
              │
              ▼
7. LIVE EDITING
   ┌─────────────────────────────────────────┐
   │ User can:                               │
   │ • Modify code directly in editor        │
   │ • Use ToolsPanel for visual changes     │
   │ • Click components in preview to select │
   │ • Undo/Redo with history                │
   │ • Switch vendors to test different data │
   └──────────┬──────────────────────────────┘
              │
              ▼
8. DEPLOYMENT
   ┌─────────────────────────────────────────┐
   │ Copy generated code                     │
   │ → Create new Smart Component file       │
   │ → Register in component registry        │
   │ → Add to database                       │
   │ → Available in Component Editor         │
   └──────────────────────────────────────────┘
```

## Smart Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│          SMART COMPONENT INTERNALS                      │
└─────────────────────────────────────────────────────────┘

Example: SmartProductGrid.tsx

┌─────────────────────────────────────────────────────────┐
│  PROPS INTERFACE                                        │
├─────────────────────────────────────────────────────────┤
│  vendorId: string                                       │
│  selectedProductIds?: string[]                          │
│  selectedCategoryIds?: string[]                         │
│  headline?: string                                      │
│  maxProducts?: number = 12                              │
│  columns?: 2 | 3 | 4 | 5 = 3                           │
│  showPrice?: boolean = true                             │
│  className?: string                                     │
└─────────────────────────────────────────────────────────┘
         │
         │ Component receives props from parent
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  STATE MANAGEMENT                                       │
├─────────────────────────────────────────────────────────┤
│  useState<any[]>('products') = []                       │
│  useState<any[]>('locations') = []                      │
│  useState<boolean>('isClient') = false                  │
└─────────────────────────────────────────────────────────┘
         │
         │ Track state through lifecycle
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  HYDRATION FIX                                          │
├─────────────────────────────────────────────────────────┤
│  useEffect(() => { setIsClient(true) }, [])            │
│  Ensures client-side only code doesn't run on server   │
└─────────────────────────────────────────────────────────┘
         │
         │ If !isClient: show loading state
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  DATA FETCHING                                          │
├─────────────────────────────────────────────────────────┤
│  useEffect(() => {                                      │
│    if (!isClient) return;                               │
│                                                         │
│    async function loadProducts() {                      │
│      const res = await fetch(                           │
│        '/api/page-data/products',                       │
│        { cache: 'no-store' }                            │
│      );                                                 │
│      const result = await res.json();                   │
│                                                         │
│      // Filter by vendor                                │
│      let vendorProducts = result.data.products          │
│        .filter(p => p.vendor_id === vendorId);          │
│                                                         │
│      // Filter by categories if specified               │
│      if (selectedCategoryIds.length > 0) {              │
│        vendorProducts = vendorProducts.filter(p =>      │
│          p.categories?.some(cat =>                      │
│            selectedCategoryIds.includes(cat.id)         │
│          )                                              │
│        );                                               │
│      }                                                  │
│                                                         │
│      // Limit results                                   │
│      setProducts(vendorProducts.slice(0, maxProducts)); │
│    }                                                    │
│                                                         │
│    loadProducts();                                      │
│  }, [vendorId, selectedProductIds, ...])               │
└─────────────────────────────────────────────────────────┘
         │
         │ Products loaded into state
         │ Triggers re-render
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  RENDERING                                              │
├─────────────────────────────────────────────────────────┤
│  return (                                               │
│    <div>                                                │
│      {headline && <h2>{headline}</h2>}                  │
│                                                         │
│      <ProductGrid                                       │
│        products={products}       ◄── Real data          │
│        columns={columns}         ◄── From props         │
│        showPrice={showPrice}                            │
│        vendorId={vendorId}                              │
│      />                                                 │
│    </div>                                               │
│  );                                                     │
└─────────────────────────────────────────────────────────┘
         │
         │ ProductGrid renders each product
         │ Shows images, price, etc.
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  ACTUAL OUTPUT IN BROWSER                               │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │         Featured Products                       │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ [Image] [Image] [Image]                         │    │
│  │ Product A  Product B  Product C                 │    │
│  │ $50        $75        $100                       │    │
│  │                                                 │    │
│  │ [Image] [Image] [Image]                         │    │
│  │ Product D  Product E  Product F                 │    │
│  │ $120       $95        $110                       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Media Library Integration Points

```
┌──────────────────────────────────────────────────────────────┐
│          MEDIA LIBRARY INTEGRATION FLOW                      │
└──────────────────────────────────────────────────────────────┘

CURRENT STATE
─────────────

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Media Library    │ --> │ API Endpoint     │ --> │ Supabase Storage │
│ /vendor/media    │     │ /api/vendor/     │     │ vendor-product-  │
│                  │     │   media          │     │   images         │
│ Features:        │     │                  │     │                  │
│ - Upload         │     │ Operations:      │     │ Files:           │
│ - Delete         │     │ - GET (list)     │     │ {vendorId}/      │
│ - Search         │     │ - POST (upload)  │     │   photo.jpg      │
│ - Preview        │     │ - DELETE         │     │   logo.png       │
│ - AI Ops         │     │                  │     │   banner.jpg     │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        ^
        │
        └─────────────────────────────────┐
                                          │
                                    Vendor Dashboard


PROPOSED INTEGRATION
───────────────────

┌──────────────────────────────────────────────────────────────┐
│                 STOREFRONT BUILDER                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AIPanel (New Feature)                               │   │
│  │                                                      │   │
│  │ Textarea: "Create product showcase with images"     │   │
│  │ [Generate] button                                    │   │
│  │                                                      │   │
│  │ ↓ Sends to Claude with context:                     │   │
│  │   - Prompt                                           │   │
│  │   - Vendor ID                                        │   │
│  │   - AVAILABLE MEDIA FILES ◄── NEW!                  │   │
│  │   - Available products data                          │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │                                              │
│               │ fetch('/api/vendor/media')                   │
│               │                                              │
│               ▼                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ToolsPanel (New: Media Tools)                        │   │
│  │                                                      │   │
│  │ [Replace Images]                                     │   │
│  │ [Add Featured Image]                                 │   │
│  │ [Select from Media Library] ◄── NEW!                │   │
│  │ [Image Size Adjustment]                              │   │
│  │ [Image Positioning]                                  │   │
│  │                                                      │   │
│  └────────────┬─────────────────────────────────────────┘   │
│               │                                              │
│               │ Updates component code                       │
│               │                                              │
│               ▼                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Preview Frame                                        │   │
│  │                                                      │   │
│  │ ┌──────────────────────────────────────────────────┐ │   │
│  │ │ Component renders with REAL IMAGES              │ │   │
│  │ │ from vendor's media library                      │ │   │
│  │ │                                                  │ │   │
│  │ │ [Product Image from media] [Price: $50]         │ │   │
│  │ │ [Product Image from media] [Price: $75]         │ │   │
│  │ │ [Product Image from media] [Price: $100]        │ │   │
│  │ └──────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
        │
        │ All images live from:
        │ /api/vendor/media ↔ Supabase Storage


REAL-TIME DATA CONNECTIONS
──────────────────────────

Component Code Generation
    │
    ├─ Claude receives vendor ID
    │
    ├─ Claude receives available media:
    │   [{ name: "product-photo.jpg", url: "..." }, ...]
    │
    ├─ Claude generates code like:
    │   <img src="/vendor-storage/product-photo.jpg" />
    │
    └─ Preview fetches images in real-time

Component Editing
    │
    ├─ User selects image from media library
    │
    ├─ Tool replaces image URL in component props
    │
    ├─ Preview updates instantly via postMessage
    │
    └─ Images render with correct URLs
```

## Component Registry & Smart Components

```
┌──────────────────────────────────────────────────────────┐
│     COMPONENT REGISTRY SYSTEM ARCHITECTURE               │
└──────────────────────────────────────────────────────────┘

DATABASE LAYER
──────────────

┌────────────────────────────────────────────────────────┐
│ component_templates                                    │
│ (Defines what components exist)                        │
├────────────────────────────────────────────────────────┤
│ • component_key: 'smart_product_grid'                 │
│ • name: 'Product Grid'                                │
│ • category: 'smart'                                   │
│ • required_fields: ['products']                       │
│ • optional_fields: ['columns', 'showPrice']           │
│ • data_sources: ['products', 'inventory']             │
│ • fetches_real_data: true                             │
│ • props_schema: { columns: { type: 'number' }, ... }  │
│ • variants: ['grid', 'carousel', 'list']              │
│ • version: '1.0.0'                                    │
└────────────────────────────────────────────────────────┘
         │
         │ Defines structure
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ component_variant_configs                              │
│ (Different layouts for each component)                 │
├────────────────────────────────────────────────────────┤
│ • variant_key: 'grid_3_cols'                          │
│ • layout_config: { columns: 3, gap: '1rem' }          │
│ • component_positions: [...]                          │
│ • style_overrides: { backgroundColor: '#fff' }        │
└────────────────────────────────────────────────────────┘
         │
         │ Specifies layouts
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ vendor_component_instances                             │
│ (Vendor's specific component uses)                     │
├────────────────────────────────────────────────────────┤
│ • vendor_id: uuid                                     │
│ • component_key: 'smart_product_grid'                │
│ • active_variant: 'grid_3_cols'                       │
│ • props: { headline: 'Featured Products', ... }       │
│ • field_bindings: { products: 'vendor_products' }     │
│ • position_order: 0                                   │
│ • is_enabled: true                                    │
└────────────────────────────────────────────────────────┘


RUNTIME LAYER
─────────────

When a page needs to render...

1. Load component instances for page
   ▼
   SELECT * FROM vendor_component_instances
   WHERE vendor_id = ? AND section_id = ?

2. For each instance, load template
   ▼
   SELECT * FROM component_templates
   WHERE component_key = instance.component_key

3. Get variant config
   ▼
   SELECT * FROM component_variant_configs
   WHERE component_key = ? AND variant_key = ?

4. Route to DynamicComponent renderer
   ▼
   <DynamicComponent
     componentKey="smart_product_grid"
     props={instance.props}
     fieldBindings={instance.field_bindings}
     vendorId={vendor.id}
   />

5. DynamicComponent finds in COMPONENT_MAP
   ▼
   const SmartProductGrid = COMPONENT_MAP['smart_product_grid']

6. SmartProductGrid renders with real data
   ▼
   fetch('/api/page-data/products')
   .then(data => render with data)


COMPONENT_MAP
─────────────

const COMPONENT_MAP = {
  // Atomic
  'text': Atomic.Text,
  'image': Atomic.Image,
  'button': Atomic.Button,

  // Composite
  'product_grid': Composite.ProductGrid,
  'card': Composite.Card,

  // Smart
  'smart_product_grid': Smart.SmartProductGrid,
  'smart_hero': Smart.SmartHero,
  'smart_product_showcase': Smart.SmartProductShowcase,
  'smart_testimonials': Smart.SmartTestimonials,
  'smart_header': Smart.SmartHeader,
  'smart_footer': Smart.SmartFooter,
  // ... 15+ more
};
```

---

**These diagrams show the complete architecture for understanding data flow and integration points.**
