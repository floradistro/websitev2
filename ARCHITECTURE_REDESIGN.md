# Storefront Architecture Redesign - Industry Best Practice

## Current Architecture (BROKEN)

```
floradistro.com/shop
    ↓
middleware rewrites to: /storefront/shop
    ↓
Next.js tries to render: app/storefront/shop/page.tsx
    ↓
BUT app/layout.tsx (root) wraps EVERYTHING
    ↓
RESULT: Nested html/body, double headers
```

**Why It's Broken:**
- Middleware rewrite doesn't bypass root layout
- Route groups don't work with rewrites
- Band-aid fixes everywhere (ConditionalLayout hacks, CSS overrides)
- Duplicating layouts (root + storefront)

## Industry Standard (Shopify, Webflow, BigCommerce)

### How Shopify Does It:

```
merchant.shopify.com → Subdomain for each merchant
customdomain.com → CNAME to Shopify, serves from ROOT
```

**Key Principle:** Custom domains serve content from domain ROOT, not nested paths.

```
# Shopify:
mystore.com/ → Store home (not /storefront)
mystore.com/products → Products (not /storefront/products)
mystore.com/cart → Cart (not /storefront/cart)
```

### How Vercel Multi-Tenant Works:

**Recommended Pattern:**
1. Middleware detects tenant from domain
2. Injects tenant context (headers, cookies)
3. Pages fetch data based on tenant context
4. NO URL rewriting to nested paths
5. Content renders at natural URL

## Proper Architecture for Yacht Club

### Option A: Dynamic Routes with Tenant Context (RECOMMENDED)

```
app/
├── layout.tsx                          # Main Yacht Club site
├── page.tsx                            # Yacht Club home
├── products/                           # Yacht Club products
├── vendors/                            # Yacht Club vendors
│
└── [tenant]/                           # Catch-all for vendor domains
      ├── layout.tsx                    # Vendor layout (isolated)
      ├── page.tsx                      # Vendor home
      ├── shop/
      │   └── page.tsx                  # Vendor shop
      ├── products/
      │   └── [slug]/page.tsx           # Vendor product detail
      └── about/
            └── page.tsx                # Vendor about
```

**How it works:**
```
floradistro.com/ → middleware detects custom domain → renders app/[tenant]/page.tsx
floradistro.com/shop → middleware detects custom domain → renders app/[tenant]/shop/page.tsx
localhost:3000/yachtclub → main site → app/page.tsx
```

**Benefits:**
- ✅ No nested paths
- ✅ No URL rewrites
- ✅ No layout conflicts
- ✅ Clean URLs (floradistro.com/shop not /storefront/shop)
- ✅ Route-based isolation

### Option B: Parallel Routes

```
app/
├── @main/                             # Main Yacht Club
│   ├── layout.tsx
│   └── ...pages
│
└── @storefront/                       # Vendor storefronts
      ├── layout.tsx
      └── ...pages
```

Middleware sets which slot to render based on domain.

### Option C: Subdomain-First (Hybrid)

```
Main site: yachtclub.com
Vendor subdomain: flora-distro.yachtclub.com
Custom domain: floradistro.com → CNAME to flora-distro.yachtclub.com
```

All vendor pages at:
```
app/v/[vendor]/
```

## The Real Issue

**What We're Doing (Wrong):**
```
floradistro.com/ → /storefront (rewrite) → app/storefront/page.tsx
│                                               ↑
└─── app/layout.tsx STILL WRAPS THIS ─────────┘
```

**What Industry Does (Right):**
```
floradistro.com/ → app/[tenant]/page.tsx
│
└─── app/[tenant]/layout.tsx (isolated, no root layout)
```

OR:

```
floradistro.com/ → middleware sets tenant → app/page.tsx fetches tenant data
│
└─── ONE layout, conditionally renders based on tenant
```

## Recommended Implementation

### Step 1: Move Vendor Pages to Root-Level Dynamic Route

```
app/
├── (marketplace)/          # Route group for main Yacht Club
│   ├── layout.tsx          # Yacht Club layout
│   ├── page.tsx
│   ├── products/
│   └── vendors/
│
└── (vendor)/               # Route group for vendor storefronts
      ├── layout.tsx        # Vendor layout (isolated)
      ├── page.tsx          # Dynamic - renders based on domain
      ├── shop/
      ├── about/
      └── products/
```

### Step 2: Middleware Detects Tenant, Sets Context

```typescript
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Check if custom domain
  const vendor = await getVendorByDomain(hostname);
  
  if (vendor) {
    // Set tenant context in headers
    const response = NextResponse.next();
    response.headers.set('x-vendor-id', vendor.id);
    response.headers.set('x-tenant-type', 'vendor');
    return response; // NO REWRITE!
  }
  
  // Main Yacht Club site
  const response = NextResponse.next();
  response.headers.set('x-tenant-type', 'marketplace');
  return response;
}
```

### Step 3: Root Layout Conditionally Renders

```typescript
// app/layout.tsx
export default async function RootLayout({ children }) {
  const headers = await headers();
  const tenantType = headers.get('x-tenant-type');
  
  if (tenantType === 'vendor') {
    // Render vendor layout completely separately
    return <VendorRootLayout>{children}</VendorRootLayout>;
  }
  
  // Render Yacht Club layout
  return <YachtClubRootLayout>{children}</YachtClubRootLayout>;
}
```

OR use separate route groups like Option 1.

## Why This Matters

### Current Problems:
1. **Nested layouts** → 2 html/body tags (invalid HTML)
2. **Double headers** → Both rendering
3. **URL rewrites** → Breaking routing logic
4. **Band-aid fixes** → ConditionalLayout hacks, CSS !important
5. **Maintenance hell** → Can't cleanly separate concerns

### With Proper Architecture:
1. **Clean HTML** → 1 html/body tag
2. **Single header** → Tenant-appropriate
3. **Natural URLs** → No rewrites needed
4. **Clean code** → No hacks
5. **Scalable** → Add vendors without code changes

## Action Items

### Immediate Fix (Band-Aid):
Keep current structure, fix ConditionalLayout to NOT render wrapper for storefront

### Proper Fix (Recommended):
1. Create `app/(vendor)/` route group
2. Move all storefront pages there
3. Remove /storefront path entirely
4. Update middleware to NOT rewrite, just inject tenant
5. Vendor pages render at domain ROOT

## Comparison

### Shopify:
```
mystore.com/ → Store (root)
shopify.com/ → Platform (root)
Clear separation, no path tricks
```

### Us (Current):
```
floradistro.com/ → rewrites to /storefront → nested in yacht club layout
yachtclub.com/ → Main site
MESSY separation, rewrite hacks
```

### Us (Proper):
```
floradistro.com/ → app/(vendor)/page.tsx → isolated layout
yachtclub.com/ → app/(marketplace)/page.tsx → isolated layout
Clean separation, no tricks
```

## Conclusion

You're right - we're band-aiding bad architecture. The proper solution is to restructure vendor storefronts to render at ROOT level of their domains, not nested under /storefront.

**Quick win:** The ConditionalLayout fix will work for now
**Long-term:** Restructure to proper route groups + dynamic routing without path rewrites

