# Template Isolation & Vendor Customization Strategy

## ✅ Current State

**Working Architecture:**
- ✅ Marketplace isolated in `(marketplace)/` route group
- ✅ Storefronts isolated in `(storefront)/` route group  
- ✅ Single deployment serves unlimited vendors
- ✅ Database-driven vendor data (logo, colors, etc.)
- ✅ Template loader system: `lib/storefront/template-loader.ts`

---

## 🎨 Template Isolation Architecture

### Phase 1: Multiple Template Components (NOW)

#### Directory Structure

```
components/storefront/
├── templates/
│   ├── minimalist/           ← Current default template
│   │   ├── MinimalistHeader.tsx
│   │   ├── MinimalistFooter.tsx
│   │   ├── MinimalistHero.tsx
│   │   ├── MinimalistProductCard.tsx
│   │   ├── MinimalistProductGrid.tsx
│   │   └── MinimalistCart.tsx
│   │
│   ├── luxury/               ← NEW: Elegant, premium feel
│   │   ├── LuxuryHeader.tsx
│   │   ├── LuxuryFooter.tsx
│   │   ├── LuxuryHero.tsx
│   │   ├── LuxuryProductCard.tsx
│   │   ├── LuxuryProductGrid.tsx
│   │   └── LuxuryCart.tsx
│   │
│   ├── bold/                 ← NEW: Vibrant, modern
│   │   ├── BoldHeader.tsx
│   │   ├── BoldFooter.tsx
│   │   ├── BoldHero.tsx
│   │   ├── BoldProductCard.tsx
│   │   ├── BoldProductGrid.tsx
│   │   └── BoldCart.tsx
│   │
│   └── organic/              ← NEW: Natural, earthy
│       ├── OrganicHeader.tsx
│       ├── OrganicFooter.tsx
│       ├── OrganicHero.tsx
│       ├── OrganicProductCard.tsx
│       ├── OrganicProductGrid.tsx
│       └── OrganicCart.tsx
│
├── ThemeProvider.tsx         ← Provides vendor customization
├── StorefrontHeader.tsx      ← Current (becomes MinimalistHeader)
└── StorefrontFooter.tsx      ← Current (becomes MinimalistFooter)
```

---

### Phase 2: Template Loader Enhancement

#### Enhanced Template Loader

```typescript
// lib/storefront/template-loader.ts

import { MinimalistHeader, MinimalistFooter, MinimalistHero, MinimalistProductCard } from '@/components/storefront/templates/minimalist';
import { LuxuryHeader, LuxuryFooter, LuxuryHero, LuxuryProductCard } from '@/components/storefront/templates/luxury';
import { BoldHeader, BoldFooter, BoldHero, BoldProductCard } from '@/components/storefront/templates/bold';
import { OrganicHeader, OrganicFooter, OrganicHero, OrganicProductCard } from '@/components/storefront/templates/organic';

export interface TemplateComponents {
  Header: React.ComponentType<any>;
  Footer: React.ComponentType<any>;
  Hero: React.ComponentType<any>;
  ProductCard: React.ComponentType<any>;
  ProductGrid: React.ComponentType<any>;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  category: string;
  features: string[];
  best_for: string[];
}

/**
 * Load template components based on vendor's template_id
 */
export function getTemplateComponents(templateId: string = 'minimalist'): TemplateComponents {
  switch (templateId) {
    case 'minimalist':
    case 'default':
      return {
        Header: MinimalistHeader,
        Footer: MinimalistFooter,
        Hero: MinimalistHero,
        ProductCard: MinimalistProductCard,
        ProductGrid: MinimalistProductGrid,
      };
    
    case 'luxury':
      return {
        Header: LuxuryHeader,
        Footer: LuxuryFooter,
        Hero: LuxuryHero,
        ProductCard: LuxuryProductCard,
        ProductGrid: LuxuryProductGrid,
      };
    
    case 'bold':
      return {
        Header: BoldHeader,
        Footer: BoldFooter,
        Hero: BoldHero,
        ProductCard: BoldProductCard,
        ProductGrid: BoldProductGrid,
      };
    
    case 'organic':
      return {
        Header: OrganicHeader,
        Footer: OrganicFooter,
        Hero: OrganicHero,
        ProductCard: OrganicProductCard,
        ProductGrid: OrganicProductGrid,
      };
    
    default:
      // Fallback to minimalist
      return getTemplateComponents('minimalist');
  }
}

/**
 * Get all available templates for vendor selection
 */
export function getAvailableTemplates(): TemplateMetadata[] {
  return [
    {
      id: 'minimalist',
      name: 'Minimalist',
      description: 'Clean, modern design focused on products with minimal distractions',
      preview_image: '/templates/minimalist-preview.jpg',
      category: 'Modern',
      features: ['Clean layout', 'Fast loading', 'Mobile-first', 'High contrast'],
      best_for: ['Concentrates', 'Vapes', 'Modern brands'],
    },
    {
      id: 'luxury',
      name: 'Luxury',
      description: 'Premium, elegant design with sophisticated typography and animations',
      preview_image: '/templates/luxury-preview.jpg',
      category: 'Premium',
      features: ['Serif fonts', 'Smooth animations', 'Elegant spacing', 'Gold accents'],
      best_for: ['High-end flower', 'Craft cannabis', 'Boutique brands'],
    },
    {
      id: 'bold',
      name: 'Bold',
      description: 'Vibrant, energetic design with strong colors and modern aesthetics',
      preview_image: '/templates/bold-preview.jpg',
      category: 'Energetic',
      features: ['Vibrant colors', 'Large typography', 'Dynamic layouts', 'Eye-catching'],
      best_for: ['Edibles', 'Beverages', 'Youth-focused brands'],
    },
    {
      id: 'organic',
      name: 'Organic',
      description: 'Natural, earthy design with warm tones and organic shapes',
      preview_image: '/templates/organic-preview.jpg',
      category: 'Natural',
      features: ['Earthy colors', 'Natural textures', 'Soft edges', 'Eco-friendly vibe'],
      best_for: ['Organic flower', 'Wellness products', 'Sustainable brands'],
    },
  ];
}

/**
 * Get template by ID with metadata
 */
export function getTemplateMetadata(templateId: string): TemplateMetadata | null {
  const templates = getAvailableTemplates();
  return templates.find(t => t.id === templateId) || null;
}
```

---

### Phase 3: Database Schema

#### Add Template Support to Vendors Table

```sql
-- Add template columns to vendors table
ALTER TABLE vendors 
  ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'minimalist',
  ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{}';

-- Template config stores template-specific customization
-- Example: { "layout": "grid", "products_per_row": 3, "show_filters": true }

-- Update Flora Distro to use luxury template
UPDATE vendors 
SET template_id = 'luxury',
    template_config = '{"layout": "masonry", "products_per_row": 4}'
WHERE slug = 'flora-distro';
```

#### Create Templates Catalog Table (Optional)

```sql
-- Store template metadata in database for dynamic loading
CREATE TABLE IF NOT EXISTS storefront_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  category TEXT,
  features JSONB,
  best_for JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with available templates
INSERT INTO storefront_templates (id, name, description, category, features, best_for) VALUES
  ('minimalist', 'Minimalist', 'Clean, modern design focused on products', 'Modern', 
   '["Clean layout", "Fast loading", "Mobile-first"]'::jsonb, 
   '["Concentrates", "Vapes", "Modern brands"]'::jsonb),
  ('luxury', 'Luxury', 'Premium, elegant design with sophistication', 'Premium',
   '["Serif fonts", "Smooth animations", "Elegant spacing"]'::jsonb,
   '["High-end flower", "Craft cannabis", "Boutique brands"]'::jsonb),
  ('bold', 'Bold', 'Vibrant, energetic design with strong colors', 'Energetic',
   '["Vibrant colors", "Large typography", "Dynamic layouts"]'::jsonb,
   '["Edibles", "Beverages", "Youth-focused brands"]'::jsonb),
  ('organic', 'Organic', 'Natural, earthy design with warm tones', 'Natural',
   '["Earthy colors", "Natural textures", "Soft edges"]'::jsonb,
   '["Organic flower", "Wellness products", "Sustainable brands"]'::jsonb);
```

---

## 🎛️ Vendor Dashboard Template Selector

### Page: `/vendor/storefront-builder`

```typescript
// app/vendor/storefront-builder/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { getAvailableTemplates, TemplateMetadata } from '@/lib/storefront/template-loader';
import { Check, Eye, Palette } from 'lucide-react';

export default function StorefrontBuilder() {
  const { vendor } = useVendorAuth();
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<string>('minimalist');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    loadTemplates();
    loadCurrentTemplate();
  }, []);

  async function loadTemplates() {
    setTemplates(getAvailableTemplates());
  }

  async function loadCurrentTemplate() {
    const response = await fetch('/api/vendor/storefront');
    const data = await response.json();
    if (data.success) {
      setCurrentTemplate(data.vendor.template_id || 'minimalist');
      setPreviewUrl(`/storefront?vendor=${data.vendor.slug}`);
    }
  }

  async function selectTemplate(templateId: string) {
    const response = await fetch('/api/vendor/storefront', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId })
    });

    if (response.ok) {
      setCurrentTemplate(templateId);
      // Show success notification
      alert('Template updated! View your storefront to see changes.');
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Choose Your Storefront Template</h1>
        <p className="text-white/60">Select a template that matches your brand's style</p>
        
        {previewUrl && (
          <a 
            href={previewUrl} 
            target="_blank" 
            className="inline-flex items-center gap-2 mt-4 text-sm text-white/80 hover:text-white"
          >
            <Eye size={16} />
            Preview Your Storefront
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`bg-[#2a2a2a] border-2 rounded-lg overflow-hidden transition-all ${
              currentTemplate === template.id 
                ? 'border-white' 
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            {/* Template Preview */}
            <div className="aspect-[4/3] bg-[#1a1a1a] relative">
              <img 
                src={template.preview_image} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
              {currentTemplate === template.id && (
                <div className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Check size={14} />
                  Active
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                  {template.category}
                </span>
              </div>
              
              <p className="text-sm text-white/60 mb-4">{template.description}</p>

              {/* Features */}
              <div className="mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Features</p>
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 3).map((feature) => (
                    <span key={feature} className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Best For */}
              <div className="mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Best For</p>
                <p className="text-xs text-white/60">{template.best_for.join(', ')}</p>
              </div>

              {/* Action Button */}
              {currentTemplate === template.id ? (
                <button
                  disabled
                  className="w-full bg-white/10 text-white/40 py-2 rounded text-sm cursor-not-allowed"
                >
                  Current Template
                </button>
              ) : (
                <button
                  onClick={() => selectTemplate(template.id)}
                  className="w-full bg-white text-black py-2 rounded text-sm hover:bg-white/90 transition-colors"
                >
                  Use This Template
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Customization Note */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Palette className="text-white/60 mt-1" size={20} />
          <div>
            <h3 className="text-white font-medium mb-1">Customize Your Template</h3>
            <p className="text-white/60 text-sm">
              After selecting a template, visit <a href="/vendor/branding" className="text-white underline">Branding</a> to customize colors, logo, and content. Your customizations will apply to whichever template you choose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔌 API Endpoint for Template Selection

```typescript
// app/api/vendor/storefront/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch vendor's current storefront settings
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id') || 
                     request.cookies.get('vendor_id')?.value;

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('id, slug, template_id, template_config, logo_url, brand_colors, store_name')
      .eq('id', vendorId)
      .single();

    if (error || !vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// PUT - Update vendor's template selection
export async function PUT(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id') || 
                     request.cookies.get('vendor_id')?.value;

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { template_id, template_config } = body;

    // Validate template_id
    const validTemplates = ['minimalist', 'luxury', 'bold', 'organic'];
    if (template_id && !validTemplates.includes(template_id)) {
      return NextResponse.json({ success: false, error: 'Invalid template' }, { status: 400 });
    }

    // Update vendor's template
    const updates: any = {};
    if (template_id) updates.template_id = template_id;
    if (template_config) updates.template_config = template_config;

    const { error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Template updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 📝 How Template Isolation Works

### Request Flow

```
1. Customer visits floradistro.com
   ↓
2. Middleware: domain → vendor_id = 'flora-distro-id'
   ↓
3. Storefront Layout: getVendorStorefront(vendor_id)
   ↓
4. Database returns:
   {
     template_id: 'luxury',
     logo_url: 'https://...',
     brand_colors: { primary: '#D4AF37' }
   }
   ↓
5. Template Loader: getTemplateComponents('luxury')
   ↓
6. Returns:
   {
     Header: LuxuryHeader,
     Footer: LuxuryFooter,
     Hero: LuxuryHero,
     ...
   }
   ↓
7. Renders: <LuxuryHeader vendor={vendor} />
   ↓
8. LuxuryHeader uses vendor.logo_url and vendor.brand_colors
   ↓
RESULT: Flora Distro gets luxury template with their branding!
```

### Complete Isolation

```
Vendor A: floradistro.com
- template_id: 'luxury'
- Loads: LuxuryHeader, LuxuryFooter, etc.
- Customization: Gold colors, serif fonts

Vendor B: cannaboyz.com  
- template_id: 'bold'
- Loads: BoldHeader, BoldFooter, etc.
- Customization: Neon colors, bold typography

NO OVERLAP! Each vendor gets:
- Their own template components
- Their own branding data
- Complete isolation from other vendors
```

---

## 🎨 Template Customization Hierarchy

### Level 1: Template Selection (Template-Level)
```
Vendor chooses: "Luxury Template"
- Defines overall layout, typography, spacing
- Cannot be changed except by selecting different template
```

### Level 2: Branding Customization (Vendor-Level)
```
Vendor customizes in /vendor/branding:
- Logo upload
- Primary/accent colors
- Font family
- Store name, tagline, description

These apply to WHATEVER template is selected
```

### Level 3: Content Customization (Page-Level)
```
Vendor edits in /vendor/storefront-builder:
- Hero headline/subheadline
- Hero background image
- About content
- Contact information

Content lives in vendors table, rendered by template
```

### Level 4: Advanced Customization (Future)
```
Premium feature:
- Custom CSS injection
- Layout variants within template
- Component visibility toggles
- Advanced animations
```

---

## 🚀 Next Architecture Steps

### 1. Complete Template System (This Week)

**Tasks:**
- [ ] Create luxury template components
- [ ] Create bold template components
- [ ] Create organic template components
- [ ] Add template preview images
- [ ] Build vendor storefront selector UI
- [ ] Create template switching API endpoint
- [ ] Test template isolation
- [ ] Update template loader with all templates

### 2. Advanced Customization (Next Week)

**Tasks:**
- [ ] Content management system for hero/about/etc
- [ ] Visual color picker in branding page
- [ ] Font selector with Google Fonts
- [ ] Template-specific settings (products per row, layout style)
- [ ] Live preview mode for changes
- [ ] Revert/reset to default functionality

### 3. Template Marketplace (Future)

**Tasks:**
- [ ] Create third-party template system
- [ ] Template approval workflow
- [ ] Template pricing/monetization
- [ ] Template ratings/reviews
- [ ] Template installation flow
- [ ] Template documentation

### 4. Performance Optimization

**Tasks:**
- [ ] Code-split templates (lazy load)
- [ ] Template-specific CSS bundles
- [ ] Image optimization per template
- [ ] Font subsetting
- [ ] Critical CSS extraction
- [ ] Edge caching per vendor

### 5. Enterprise Features

**Tasks:**
- [ ] Multi-location template variants
- [ ] A/B testing different templates
- [ ] Template analytics (conversion tracking)
- [ ] White-label custom template builder
- [ ] Template export/import
- [ ] Version control for templates

---

## 📊 Database Schema Complete

```sql
-- VENDORS TABLE (Current + Template Support)
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  store_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  
  -- Template & Customization
  template_id TEXT DEFAULT 'minimalist',
  template_config JSONB DEFAULT '{}',
  
  -- Branding (applies to all templates)
  logo_url TEXT,
  brand_colors JSONB DEFAULT '{"primary": "#0EA5E9", "accent": "#06B6D4"}',
  font_family TEXT DEFAULT 'Inter',
  
  -- Content (rendered by templates)
  hero_headline TEXT,
  hero_subheadline TEXT,
  hero_image_url TEXT,
  about_content TEXT,
  store_description TEXT,
  
  -- Contact/Social
  contact_email TEXT,
  phone TEXT,
  social_links JSONB,
  
  -- Status
  status TEXT DEFAULT 'active',
  site_hidden BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STOREFRONT_TEMPLATES TABLE (Optional - for dynamic templates)
CREATE TABLE storefront_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  category TEXT,
  features JSONB,
  best_for JSONB,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  price DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VENDOR_TEMPLATE_CUSTOMIZATIONS TABLE (Future - per-template settings)
CREATE TABLE vendor_template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  template_id TEXT,
  customization_key TEXT,
  customization_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, template_id, customization_key)
);
```

---

## ✅ Implementation Priority

### Week 1: Core Templates
1. Move current components to `templates/minimalist/`
2. Create luxury template (serif fonts, gold accents, elegant)
3. Create bold template (vibrant, modern, energetic)
4. Update template loader
5. Test template switching

### Week 2: Vendor UI
1. Build storefront builder page
2. Add template preview images
3. Create template selection API
4. Test vendor template switching
5. Ensure branding applies to all templates

### Week 3: Content Management
1. Add hero content editor
2. Add about page editor
3. Add contact page editor
4. Live preview mode
5. Auto-save functionality

### Week 4: Polish & Launch
1. Template documentation
2. Video tutorials
3. Migration guide for existing vendors
4. Performance optimization
5. Launch template marketplace beta

---

## 🎯 Success Metrics

**Template Isolation Success:**
- ✅ Vendor A changes template → NO effect on Vendor B
- ✅ Template loads in < 2 seconds
- ✅ Branding (colors, logo) applies to ALL templates
- ✅ Content (hero, about) renders in ALL templates
- ✅ Zero code deploys needed to switch templates

**Vendor Experience:**
- ✅ Can preview all templates
- ✅ Can switch templates in < 10 seconds
- ✅ Branding persists across template changes
- ✅ No technical knowledge required
- ✅ Mobile-friendly template selector

---

## 📝 Summary

**Template isolation is achieved through:**
1. **Component-based templates** - Each template = set of React components
2. **Database-driven selection** - `vendors.template_id` determines which components load
3. **Dynamic loading** - Template loader returns correct components at runtime
4. **Vendor customization** - Branding/content from database injected into template
5. **Complete isolation** - Vendors NEVER see each other's templates or data

**This scales to:**
- Unlimited templates
- Unlimited vendors
- Unlimited customization
- Zero per-vendor cost
- Real-time template switching

**Next step:** Create the first alternative template (luxury) and build the vendor selector UI!

