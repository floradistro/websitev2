# 🚀 Vendor Storefront Deployment Architecture

## Overview

Instead of deploying separate apps per vendor (expensive, complex), we use a **multi-tenant architecture** where all vendor storefronts run from ONE Next.js application with dynamic theming.

**This is how Shopify, Webflow, Squarespace, and all major platforms work.**

---

## Architecture: Multi-Tenant Storefronts

```
┌─────────────────────────────────────────────────────────────┐
│                    Custom Domains                           │
│                                                             │
│  vendor1.com  →  ┐                                         │
│  vendor2.com  →  ├─→  [Vercel Edge Middleware]            │
│  vendor3.yachtclub.com → ┘                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Single Next.js Application                     │
│                                                             │
│  1. Detect domain → Find vendor in Supabase                │
│  2. Load vendor's AI-generated theme specs                  │
│  3. Apply colors, fonts, layout dynamically                 │
│  4. Render products from vendor's catalog                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│                                                             │
│  - vendors (with domain mappings)                           │
│  - vendor_storefronts (AI-generated specs)                  │
│  - products (filtered by vendor_id)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Database Schema Updates

Add domain mapping to vendors table:

```sql
-- Add primary_domain to vendors
ALTER TABLE public.vendors 
  ADD COLUMN IF NOT EXISTS primary_domain TEXT UNIQUE;

-- Create index for fast domain lookups
CREATE INDEX IF NOT EXISTS vendors_primary_domain_idx 
  ON public.vendors(primary_domain);

-- Update vendor_domains to track custom domains
ALTER TABLE public.vendor_domains
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS vendor_domains_primary_idx 
  ON public.vendor_domains(vendor_id) 
  WHERE is_primary = true;
```

---

## Step 2: Create Storefront App Structure

```
storefront-app/                  ← New Next.js app for storefronts
├── app/
│   ├── layout.tsx              ← Dynamic layout based on vendor
│   ├── page.tsx                ← Home page
│   ├── shop/
│   │   └── page.tsx            ← Shop page with products
│   ├── products/
│   │   └── [slug]/
│   │       └── page.tsx        ← Product detail
│   ├── cart/
│   │   └── page.tsx            ← Cart
│   └── checkout/
│       └── page.tsx            ← Checkout
├── components/
│   ├── ThemeProvider.tsx       ← Applies AI-generated theme
│   ├── Header.tsx              ← Dynamic header
│   ├── ProductCard.tsx         ← Product cards
│   └── ...
├── lib/
│   ├── get-vendor.ts           ← Get vendor from domain
│   ├── apply-theme.ts          ← Apply AI specs to CSS
│   └── supabase.ts
└── middleware.ts               ← Domain detection
```

---

## Step 3: Middleware for Domain Detection

**File: `storefront-app/middleware.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  console.log('🔍 Request from:', hostname);
  
  // Extract domain (remove port if localhost)
  const domain = hostname.split(':')[0];
  
  // Skip for assets, api routes, etc.
  if (
    domain.startsWith('localhost') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Get vendor from domain
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Check if domain matches a vendor
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('id, slug, store_name, primary_domain')
    .or(`primary_domain.eq.${domain},slug.eq.${domain.split('.')[0]}`)
    .single();
  
  if (error || !vendor) {
    // Domain not found - show 404 or redirect to main site
    return NextResponse.rewrite(new URL('/404', request.url));
  }
  
  // Add vendor info to request headers (accessible in pages)
  const response = NextResponse.next();
  response.headers.set('x-vendor-id', vendor.id);
  response.headers.set('x-vendor-slug', vendor.slug);
  
  console.log(`✅ Vendor found: ${vendor.store_name} (${vendor.id})`);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## Step 4: Dynamic Theme Provider

**File: `storefront-app/components/ThemeProvider.tsx`**

```typescript
'use client';

import { createContext, useContext, useEffect } from 'react';

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  layout: {
    header: 'sticky' | 'static';
    productGrid: number;
  };
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ 
  children, 
  theme 
}: { 
  children: React.ReactNode; 
  theme: Theme;
}) {
  useEffect(() => {
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-text', theme.colors.text);
    
    // Load Google Fonts
    const fontLink = document.createElement('link');
    fontLink.href = `https://fonts.googleapis.com/css2?family=${theme.typography.headingFont.replace(' ', '+')}:wght@300;400;600;700&family=${theme.typography.bodyFont.replace(' ', '+')}:wght@300;400;500;600&display=swap`;
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    // Apply font families
    root.style.setProperty('--font-heading', theme.typography.headingFont);
    root.style.setProperty('--font-body', theme.typography.bodyFont);
    
    // Apply layout settings
    root.style.setProperty('--grid-columns', theme.layout.productGrid.toString());
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

---

## Step 5: Root Layout with Dynamic Theme

**File: `storefront-app/app/layout.tsx`**

```typescript
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

async function getVendorTheme(vendorId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get vendor's AI-generated storefront
  const { data: storefront } = await supabase
    .from('vendor_storefronts')
    .select('ai_specs')
    .eq('vendor_id', vendorId)
    .eq('status', 'deployed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (storefront?.ai_specs) {
    return storefront.ai_specs;
  }
  
  // Default theme if no AI specs
  return {
    theme: {
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#666666',
        background: '#FFFFFF',
        text: '#1A1A1A',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
    },
    layout: {
      header: 'sticky',
      productGrid: 3,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const vendorId = headersList.get('x-vendor-id');
  const vendorSlug = headersList.get('x-vendor-slug');
  
  if (!vendorId) {
    return <html><body>Vendor not found</body></html>;
  }
  
  const themeSpecs = await getVendorTheme(vendorId);
  
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={themeSpecs.theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Step 6: Home Page with Vendor Products

**File: `storefront-app/app/page.tsx`**

```typescript
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { ProductGrid } from '@/components/ProductGrid';
import { Header } from '@/components/Header';

async function getVendorData(vendorId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const [vendorResult, productsResult] = await Promise.all([
    supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single(),
    
    supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
  ]);
  
  return {
    vendor: vendorResult.data,
    products: productsResult.data || [],
  };
}

export default async function HomePage() {
  const headersList = headers();
  const vendorId = headersList.get('x-vendor-id')!;
  
  const { vendor, products } = await getVendorData(vendorId);
  
  return (
    <>
      <Header vendor={vendor} />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-light mb-8">
          {vendor.store_name}
        </h1>
        <p className="text-lg mb-12">
          {vendor.store_tagline || 'Premium products'}
        </p>
        <ProductGrid products={products} />
      </main>
    </>
  );
}
```

---

## Step 7: Deployment Setup

### Option A: Deploy to Vercel (Recommended)

```bash
# 1. Create new Next.js app for storefronts
npx create-next-app@latest storefront-app --typescript --tailwind --app

# 2. Add the files above

# 3. Configure environment variables in Vercel:
NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key

# 4. Deploy to Vercel
vercel --prod

# 5. Configure wildcard domain in Vercel:
# Go to Project Settings → Domains
# Add: *.yachtclub.com
# Add: Custom domains as vendors add them
```

### Option B: Use Vercel's Edge Config (Advanced)

For better performance, store vendor→domain mappings in Vercel Edge Config:

```typescript
import { get } from '@vercel/edge-config';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  
  // Fast lookup from Edge Config
  const vendorId = await get(`domain:${hostname}`);
  
  if (vendorId) {
    const response = NextResponse.next();
    response.headers.set('x-vendor-id', vendorId);
    return response;
  }
  
  // Fallback to Supabase
  // ...
}
```

---

## Step 8: Custom Domain Setup Flow

### For Vendors:

1. **Vendor adds domain in portal:**
   ```typescript
   // In /vendor/domains page
   await supabase.from('vendor_domains').insert({
     vendor_id: vendorId,
     domain: 'example.com',
     verification_token: generateToken(),
   });
   ```

2. **Vendor configures DNS:**
   ```
   Type: CNAME
   Name: @ (or www)
   Value: storefronts.yachtclub.com
   ```

3. **Verify domain:**
   ```typescript
   async function verifyDomain(domain: string) {
     const response = await fetch(`https://${domain}`);
     const token = response.headers.get('x-verification-token');
     
     if (token === expectedToken) {
       await supabase
         .from('vendor_domains')
         .update({ verified: true })
         .eq('domain', domain);
     }
   }
   ```

4. **Add to Vercel:**
   ```bash
   # Via Vercel API
   curl -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/domains" \
     -H "Authorization: Bearer ${VERCEL_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"name": "example.com"}'
   ```

---

## Step 9: Update Vendor Portal

Add "Deploy Storefront" button to vendor dashboard:

```typescript
// In /vendor/storefront-builder
async function deployStorefront() {
  // 1. Update status to deployed
  await supabase
    .from('vendor_storefronts')
    .update({ status: 'deployed' })
    .eq('id', storefrontId);
  
  // 2. Set primary domain
  await supabase
    .from('vendors')
    .update({ 
      primary_domain: `${vendorSlug}.yachtclub.com` 
    })
    .eq('id', vendorId);
  
  // 3. Show success
  alert(`🎉 Storefront deployed to: ${vendorSlug}.yachtclub.com`);
}
```

---

## Step 10: Global Styles with CSS Variables

**File: `storefront-app/app/globals.css`**

```css
:root {
  /* Colors (set by ThemeProvider) */
  --color-primary: #000000;
  --color-secondary: #FFFFFF;
  --color-accent: #666666;
  --color-background: #FFFFFF;
  --color-text: #1A1A1A;
  
  /* Typography (set by ThemeProvider) */
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  
  /* Layout (set by ThemeProvider) */
  --grid-columns: 3;
}

body {
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: var(--color-text);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-secondary);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  gap: 2rem;
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## Architecture Benefits

✅ **Cost-Effective**: Single deployment vs. hundreds
✅ **Easy Management**: Update all stores at once
✅ **Performance**: Edge caching for all domains
✅ **Scalability**: Handle thousands of vendors
✅ **Flexibility**: Each vendor gets custom theme
✅ **SEO**: Each domain fully optimized

---

## Cost Comparison

### Separate Apps (Bad):
- 100 vendors × $20/month (Vercel) = **$2,000/month**
- Complex CI/CD per vendor
- Maintenance nightmare

### Multi-Tenant (Good):
- 1 app × $20/month (Vercel Pro) = **$20/month**
- Or Vercel Enterprise: **$500/month** (unlimited everything)
- Single deployment
- Easy to manage

**Savings: $1,480-1,980/month!**

---

## Next Steps

1. ✅ Create `storefront-app/` directory
2. ✅ Implement middleware
3. ✅ Create theme provider
4. ✅ Build dynamic pages
5. ✅ Deploy to Vercel
6. ✅ Configure wildcard domain
7. ✅ Add deploy button to vendor portal

---

**This is production-ready, scalable architecture used by major platforms!** 🚀

