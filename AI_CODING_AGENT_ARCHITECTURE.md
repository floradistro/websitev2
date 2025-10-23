# AI Coding Agent for Yacht Club Vendor Storefronts
## Complete Architecture & Implementation Plan

---

## Executive Summary

This document outlines the architecture for an **AI Coding Agent** that generates custom vendor storefronts on the Yacht Club multi-vendor marketplace platform. The agent will enable vendors to describe their desired storefront in natural language, and the AI will generate a fully functional, branded e-commerce site that integrates seamlessly with the Yacht Club backend.

**Key Capabilities:**
- Natural language to code generation for vendor storefronts
- Full integration with Yacht Club's Supabase backend
- Custom branding, themes, and layouts per vendor
- Real-time product sync, inventory management, and order processing
- Custom domain support with SSL
- Mobile-first, responsive design generation
- SEO-optimized pages

---

## 1. Platform Analysis: Current Yacht Club Architecture

### 1.1 Database Schema (Supabase)

Based on analysis of your migrations, here's the core schema:

#### **Vendors Table**
```sql
vendors (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  store_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT (active|suspended|pending),
  
  -- Contact Info
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  store_description TEXT,
  store_tagline TEXT,
  brand_colors JSONB,
  social_links JSONB,
  custom_css TEXT,
  custom_font TEXT,
  business_hours JSONB,
  return_policy TEXT,
  shipping_policy TEXT,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### **Products Table**
```sql
products (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  sku TEXT,
  
  -- Type & Status
  type TEXT (simple|variable|grouped|external),
  status TEXT (draft|pending|published|archived),
  
  -- Pricing
  regular_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  on_sale BOOLEAN GENERATED,
  price DECIMAL(10,2) GENERATED,
  
  -- Categories & Organization
  primary_category_id UUID,
  
  -- Images
  featured_image TEXT,
  image_gallery TEXT[],
  
  -- Attributes
  attributes JSONB,
  blueprint_fields JSONB,
  
  -- Stock
  manage_stock BOOLEAN,
  stock_quantity DECIMAL(10,2),
  stock_status TEXT (instock|outofstock|onbackorder),
  
  -- Reviews & Stats
  reviews_allowed BOOLEAN,
  average_rating DECIMAL(3,2),
  rating_count INTEGER,
  view_count INTEGER,
  sales_count INTEGER,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### **Inventory Table**
```sql
inventory (
  id UUID PRIMARY KEY,
  vendor_id UUID,
  location_id UUID,
  product_id UUID,
  quantity DECIMAL(10,2),
  low_stock_threshold DECIMAL(10,2),
  unit TEXT (grams|units|ounces),
  batch_number TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### **Orders Table**
```sql
orders (
  id UUID PRIMARY KEY,
  customer_id UUID,
  
  -- Order Details
  order_number TEXT UNIQUE,
  status TEXT (pending|processing|completed|cancelled|refunded),
  payment_status TEXT,
  
  -- Amounts
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  shipping DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  
  -- Shipping
  shipping_method TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  
  -- Tracking
  tracking_number TEXT,
  fulfillment_status TEXT,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### **Vendor Custom Domains**
```sql
vendor_domains (
  id UUID PRIMARY KEY,
  vendor_id UUID,
  domain TEXT UNIQUE NOT NULL,
  
  -- Verification
  verification_token TEXT,
  verified BOOLEAN,
  verified_at TIMESTAMPTZ,
  
  -- DNS
  dns_configured BOOLEAN,
  ssl_status TEXT (pending|active|failed),
  
  is_primary BOOLEAN,
  is_active BOOLEAN,
  
  created_at TIMESTAMPTZ
)
```

### 1.2 API Endpoints

#### **Vendor Authentication**
- `POST /api/vendor/login` - Vendor login
- `GET /api/vendor/session` - Check session

#### **Product Management**
- `GET /api/vendor/products` - List vendor products
- `POST /api/vendor/products` - Create product
- `PUT /api/vendor/products/[id]` - Update product
- `DELETE /api/vendor/products/[id]` - Delete product

#### **Inventory**
- `GET /api/vendor/inventory` - Get inventory
- `POST /api/vendor/inventory/create` - Add inventory
- `PUT /api/vendor/inventory/[id]` - Update inventory

#### **Orders**
- `GET /api/vendor/orders` - List orders
- `PUT /api/vendor/orders/[id]` - Update order status

#### **Branding**
- `GET /api/vendor/branding` - Get branding settings
- `PUT /api/vendor/branding` - Update branding

#### **Bulk Data Endpoints**
- `GET /api/page-data/vendor-dashboard` - Dashboard data in one call
- `GET /api/page-data/vendors` - All vendor data

### 1.3 Current Vendor Portal Features

From analyzing `/app/vendor/`, the platform includes:

1. **Dashboard** - Analytics, sales, inventory warnings
2. **Products** - Full product CRUD with variations, attributes
3. **Inventory** - Multi-location stock management
4. **Pricing Tiers** - Volume-based pricing
5. **Orders** - Order fulfillment and tracking
6. **Lab Results** - COA management
7. **Locations** - Multi-location support
8. **Media Library** - Image/asset management
9. **Branding** - Logo, colors, fonts, custom CSS
10. **Domains** - Custom domain configuration
11. **Payouts** - Financial tracking
12. **Reviews** - Customer review management

---

## 2. AI Coding Agent Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AI CODING AGENT                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │   Natural    │  │  Code        │  │  Deployment │       │
│  │   Language   │→ │  Generation  │→ │  Pipeline   │       │
│  │   Processor  │  │  Engine      │  │             │       │
│  └──────────────┘  └──────────────┘  └─────────────┘       │
│         ↓                  ↓                   ↓            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │  Template    │  │   Component  │  │   Vercel    │       │
│  │  Analyzer    │  │   Library    │  │   Deploy    │       │
│  └──────────────┘  └──────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              YACHT CLUB PLATFORM (Supabase)                  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Vendors  │  │ Products │  │ Orders   │  │ Inventory│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│           GENERATED VENDOR STOREFRONTS                       │
│                                                              │
│  vendor1.yachtclub.com  │  vendor2.yachtclub.com           │
│  customdomain.com       │  anotherdomain.com               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Core Components

#### **2.2.1 Natural Language Processor (NLP Layer)**

**Purpose:** Parse vendor requirements from natural language into structured specifications.

**Technology Stack:**
- OpenAI GPT-4 / Claude 3.5 Sonnet (your current choice)
- Structured output extraction
- Intent classification

**Input Examples:**
```
"I want a minimalist black and white store with large product images"
"Create a luxury boutique feel with gold accents and serif fonts"
"I need a modern cannabis dispensary with green tones and product filters"
```

**Output Schema:**
```typescript
interface StoreRequirements {
  theme: {
    style: 'minimalist' | 'luxury' | 'modern' | 'classic' | 'bold';
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
      sizes: Record<string, string>;
    };
  };
  layout: {
    header: 'sticky' | 'static' | 'hidden';
    navigation: 'top' | 'side' | 'mega-menu';
    productGrid: 2 | 3 | 4 | 5;
    showCategories: boolean;
    showSearch: boolean;
    showCart: boolean;
  };
  features: {
    ageVerification: boolean;
    productFilters: string[];
    wishlist: boolean;
    productReviews: boolean;
    socialSharing: boolean;
  };
  pages: {
    home: PageConfig;
    shop: PageConfig;
    about?: PageConfig;
    contact?: PageConfig;
    custom?: PageConfig[];
  };
}
```

#### **2.2.2 Template Library**

Pre-built, production-ready templates that serve as starting points:

**Template Categories:**
1. **Minimalist** - Clean, spacious, image-focused
2. **Luxury** - High-end, sophisticated, serif fonts
3. **Modern** - Bold colors, geometric shapes, sans-serif
4. **Classic** - Traditional e-commerce layout
5. **Cannabis-Specific** - Compliant, age-gated, strain-focused

**Each Template Includes:**
```
templates/
├── minimalist/
│   ├── layout.tsx          # Next.js layout
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── home.tsx
│   │   ├── shop.tsx
│   │   ├── product/[id].tsx
│   │   └── ...
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.css
│   └── config.json         # Template metadata
```

#### **2.2.3 Code Generation Engine**

**Purpose:** Generate production-ready Next.js code from specifications.

**Process:**
1. **Select Base Template** - Choose template matching requirements
2. **Apply Customizations** - Modify colors, fonts, layout
3. **Generate Components** - Create React components with TypeScript
4. **Add Business Logic** - Integrate Supabase queries
5. **Generate API Routes** - Create Next.js API routes for vendor data
6. **Build Configuration** - Generate package.json, next.config.ts, etc.

**Technology:**
- Template engine (Handlebars / EJS)
- AST manipulation (Babel / TypeScript Compiler API)
- File system operations
- Git operations for version control

**Generated File Structure:**
```
vendor-storefront-{vendor-slug}/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── shop/
│   │   └── page.tsx
│   ├── products/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── cart/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   └── api/
│       ├── products/route.ts
│       ├── cart/route.ts
│       └── orders/route.ts
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── Cart.tsx
│   └── ...
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── cart.ts             # Cart logic
│   └── api.ts              # API helpers
├── public/
│   └── assets/
├── styles/
│   └── globals.css
├── .env.local
├── next.config.ts
├── package.json
├── tsconfig.json
└── vercel.json
```

#### **2.2.4 Component Generation with AI**

**Dynamic Component Creation:**

The AI agent can generate custom React components based on vendor needs:

```typescript
interface ComponentRequest {
  type: 'ProductCard' | 'Hero' | 'CategoryGrid' | 'Testimonial' | 'Custom';
  style: 'minimalist' | 'luxury' | 'modern';
  features: string[];
  data: any;
}

async function generateComponent(request: ComponentRequest): Promise<string> {
  const prompt = `
Generate a Next.js React component with the following specifications:

Type: ${request.type}
Style: ${request.style}
Features: ${request.features.join(', ')}

Requirements:
- TypeScript
- Tailwind CSS for styling
- Responsive design (mobile-first)
- Accessible (ARIA labels, semantic HTML)
- Performance optimized (lazy loading, image optimization)
- Match the ${request.style} aesthetic

Data structure:
${JSON.stringify(request.data, null, 2)}

Return ONLY the component code with no explanation.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert Next.js developer specializing in e-commerce components.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}
```

#### **2.2.5 Data Integration Layer**

**Supabase Connection Configuration:**

Each generated storefront includes a pre-configured Supabase client:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Vendor-specific queries
export async function getVendorProducts(vendorId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*), inventory(*)')
    .eq('vendor_id', vendorId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string, vendorId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*), inventory(*), reviews(*)')
    .eq('slug', slug)
    .eq('vendor_id', vendorId)
    .eq('status', 'published')
    .single();

  if (error) throw error;
  return data;
}

export async function createOrder(orderData: any) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Real-time inventory updates
export function subscribeToInventory(vendorId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`inventory-${vendorId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inventory',
        filter: `vendor_id=eq.${vendorId}`,
      },
      callback
    )
    .subscribe();
}
```

#### **2.2.6 Deployment Pipeline**

**Automated Deployment to Vercel:**

```typescript
import { execSync } from 'child_process';
import { Octokit } from '@octokit/rest';

interface DeploymentConfig {
  vendorId: string;
  vendorSlug: string;
  domain?: string;
  repository: string;
  branch: string;
}

async function deployStorefront(config: DeploymentConfig) {
  // 1. Create GitHub repository
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  const repo = await octokit.repos.createInOrg({
    org: 'yacht-club-vendors',
    name: `storefront-${config.vendorSlug}`,
    private: false,
    auto_init: true,
  });

  // 2. Push generated code to GitHub
  execSync(`
    cd /tmp/generated-storefronts/${config.vendorSlug}
    git init
    git remote add origin ${repo.data.clone_url}
    git add .
    git commit -m "Initial storefront generation"
    git push -u origin main
  `);

  // 3. Deploy to Vercel
  const vercelResponse = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `storefront-${config.vendorSlug}`,
      gitSource: {
        type: 'github',
        repo: repo.data.full_name,
        ref: 'main',
      },
      env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_VENDOR_ID: config.vendorId,
      },
      projectSettings: {
        framework: 'nextjs',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
      },
    }),
  });

  const deployment = await vercelResponse.json();

  // 4. Configure custom domain (if provided)
  if (config.domain) {
    await fetch(`https://api.vercel.com/v10/projects/${deployment.projectId}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.domain,
      }),
    });

    // Update vendor_domains table
    await supabase
      .from('vendor_domains')
      .update({
        dns_configured: true,
        ssl_status: 'pending',
      })
      .eq('vendor_id', config.vendorId)
      .eq('domain', config.domain);
  }

  return {
    deploymentUrl: deployment.url,
    repository: repo.data.html_url,
    domain: config.domain || `${config.vendorSlug}.yachtclub.com`,
  };
}
```

---

## 3. Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)

**Deliverables:**
1. ✅ Template library with 3 base templates (Minimalist, Luxury, Modern)
2. ✅ NLP processor for parsing vendor requirements
3. ✅ Code generation engine (basic version)
4. ✅ Supabase integration layer
5. ✅ Basic deployment pipeline to Vercel

**Files to Create:**
```
ai-agent/
├── src/
│   ├── nlp/
│   │   ├── processor.ts
│   │   └── schemas.ts
│   ├── templates/
│   │   ├── minimalist/
│   │   ├── luxury/
│   │   └── modern/
│   ├── generator/
│   │   ├── engine.ts
│   │   ├── components.ts
│   │   └── pages.ts
│   ├── deployment/
│   │   ├── github.ts
│   │   ├── vercel.ts
│   │   └── dns.ts
│   └── supabase/
│       ├── client.ts
│       └── queries.ts
├── templates/
├── tests/
└── package.json
```

### Phase 2: AI Enhancement (Week 3-4)

**Deliverables:**
1. ✅ Custom component generation with GPT-4/Claude
2. ✅ Layout optimization based on product types
3. ✅ Automated SEO optimization
4. ✅ Image optimization and CDN integration
5. ✅ Performance testing and optimization

### Phase 3: Vendor Portal Integration (Week 5-6)

**Deliverables:**
1. ✅ New vendor portal page: `/vendor/storefront-builder`
2. ✅ Chat interface for storefront customization
3. ✅ Live preview of changes
4. ✅ One-click deployment
5. ✅ Domain management UI

**UI Mockup:**

```tsx
// app/vendor/storefront-builder/page.tsx
'use client';

import { useState } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';

export default function StorefrontBuilder() {
  const { vendor } = useVendorAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handleSubmit() {
    setGenerating(true);
    
    const response = await fetch('/api/ai-agent/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vendor-id': vendor.id,
      },
      body: JSON.stringify({
        message: input,
        history: messages,
      }),
    });

    const result = await response.json();
    setPreview(result.preview);
    setMessages([...messages, { role: 'user', content: input }, { role: 'assistant', content: result.response }]);
    setGenerating(false);
  }

  async function deployStorefront() {
    const response = await fetch('/api/ai-agent/deploy', {
      method: 'POST',
      headers: {
        'x-vendor-id': vendor.id,
      },
    });

    const result = await response.json();
    alert(`Deployed to ${result.url}`);
  }

  return (
    <div className="grid grid-cols-2 gap-8 h-screen">
      {/* Left: Chat Interface */}
      <div className="flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`p-4 rounded ${msg.role === 'user' ? 'bg-white/5' : 'bg-purple-500/10'}`}>
              <div className="text-white/60 text-xs mb-2">{msg.role === 'user' ? 'You' : 'AI Agent'}</div>
              <div className="text-white">{msg.content}</div>
            </div>
          ))}
        </div>

        <div className="p-8 border-t border-white/10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your ideal storefront..."
            className="w-full bg-white/5 border border-white/10 text-white p-4 rounded mb-4"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={generating}
            className="w-full bg-white text-black py-3 rounded font-medium hover:bg-white/90 transition"
          >
            {generating ? 'Generating...' : 'Generate Storefront'}
          </button>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="border-l border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-white font-medium">Live Preview</h2>
          <button
            onClick={deployStorefront}
            className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition"
          >
            Deploy Live
          </button>
        </div>
        <iframe
          src={preview || 'about:blank'}
          className="w-full h-full"
          title="Storefront Preview"
        />
      </div>
    </div>
  );
}
```

### Phase 4: Advanced Features (Week 7-8)

**Deliverables:**
1. ✅ A/B testing capabilities
2. ✅ Analytics integration
3. ✅ Multi-language support
4. ✅ Progressive Web App (PWA) generation
5. ✅ Automated accessibility compliance

---

## 4. Technical Specifications

### 4.1 AI Agent API Endpoints

**Create New Storefront:**
```
POST /api/ai-agent/generate
Headers:
  x-vendor-id: <vendor-uuid>
Body:
  {
    "message": "I want a minimalist black and white store",
    "history": []
  }
Response:
  {
    "success": true,
    "preview": "https://preview.yachtclub.com/<token>",
    "response": "I've created a minimalist storefront with...",
    "specs": { ... }
  }
```

**Deploy Storefront:**
```
POST /api/ai-agent/deploy
Headers:
  x-vendor-id: <vendor-uuid>
Body:
  {
    "specs": { ... },
    "domain": "custom-domain.com" (optional)
  }
Response:
  {
    "success": true,
    "url": "https://vendor-slug.yachtclub.com",
    "repository": "https://github.com/yacht-club-vendors/...",
    "deployment_id": "..."
  }
```

**Update Storefront:**
```
PUT /api/ai-agent/update
Headers:
  x-vendor-id: <vendor-uuid>
Body:
  {
    "message": "Make the header sticky and add a search bar",
    "deployment_id": "..."
  }
Response:
  {
    "success": true,
    "preview": "...",
    "response": "..."
  }
```

### 4.2 Environment Variables

```env
# Yacht Club Platform
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# AI Agent
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key (if using Claude)

# Deployment
GITHUB_TOKEN=your-github-token
GITHUB_ORG=yacht-club-vendors
VERCEL_TOKEN=your-vercel-token
VERCEL_TEAM_ID=your-team-id

# DNS (for custom domains)
CLOUDFLARE_API_TOKEN=your-cloudflare-token
CLOUDFLARE_ZONE_ID=your-zone-id

# Storage
STOREFRONT_STORAGE_BUCKET=yachtclub-storefronts
```

### 4.3 Database Extensions

**New Tables:**

```sql
-- AI Generated Storefronts
CREATE TABLE vendor_storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Deployment Info
  deployment_id TEXT UNIQUE,
  repository_url TEXT,
  live_url TEXT,
  preview_url TEXT,
  
  -- Configuration
  template TEXT,
  customizations JSONB,
  ai_specs JSONB,
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'building', 'deployed', 'failed')),
  build_logs TEXT,
  
  -- Versions
  version INTEGER DEFAULT 1,
  last_deployed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agent Conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  storefront_id UUID REFERENCES vendor_storefronts(id),
  
  -- Conversation
  messages JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX vendor_storefronts_vendor_idx ON vendor_storefronts(vendor_id);
CREATE INDEX ai_conversations_vendor_idx ON ai_conversations(vendor_id);
CREATE INDEX ai_conversations_storefront_idx ON ai_conversations(storefront_id);
```

---

## 5. Security & Compliance

### 5.1 Row Level Security (RLS)

```sql
-- Vendors can only access their own storefronts
CREATE POLICY "Vendors manage own storefronts"
  ON vendor_storefronts
  FOR ALL
  USING (vendor_id IN (SELECT id FROM vendors WHERE auth.uid()::text = id::text));

-- Vendors can only access their own conversations
CREATE POLICY "Vendors view own conversations"
  ON ai_conversations
  FOR SELECT
  USING (vendor_id IN (SELECT id FROM vendors WHERE auth.uid()::text = id::text));
```

### 5.2 Code Safety

**Sanitization:**
- All generated code goes through AST validation
- No arbitrary code execution
- Whitelist of allowed packages/imports
- Automated security scanning (Snyk, npm audit)

**Content Security Policy:**
```typescript
// Generated next.config.ts includes:
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-insights.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self' data:;
      connect-src 'self' *.supabase.co;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

---

## 6. Cost Analysis

### 6.1 Per-Storefront Costs

**AI Generation:**
- GPT-4 API: ~$0.10-0.50 per storefront generation
- Claude 3.5 Sonnet: ~$0.15-0.60 per generation

**Hosting (Vercel):**
- Vercel Pro: $20/month per storefront (unlimited bandwidth)
- Or Vercel Enterprise: Custom pricing for bulk

**GitHub:**
- Free for public repos
- GitHub Team: $4/user/month for private repos

**Domain:**
- Subdomain (vendor.yachtclub.com): Free
- Custom domain: Vendor pays (~$12/year)

**Total Cost Per Storefront:**
- One-time generation: $0.50
- Monthly hosting: $20 (Vercel Pro) or included in Enterprise plan
- Annual: ~$240 + $0.50 setup

### 6.2 Optimization Strategies

1. **Template Caching** - Reduce AI calls by reusing templates
2. **Vercel Enterprise** - Volume pricing for multiple storefronts
3. **Incremental Updates** - Only regenerate changed components
4. **Edge Caching** - CDN for static assets

---

## 7. Example: End-to-End Flow

### Scenario: New Vendor Signs Up

**Step 1: Vendor Input**
```
Vendor: "I want a luxury cannabis boutique with gold accents, 
         serif fonts, and large product images. I sell premium 
         pre-rolls and edibles."
```

**Step 2: NLP Processing**
```typescript
{
  theme: {
    style: 'luxury',
    colors: {
      primary: '#D4AF37', // Gold
      secondary: '#1A1A1A', // Black
      accent: '#B8860B', // Dark Gold
      background: '#FFFFFF',
      text: '#2C2C2C'
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Lato',
      sizes: { h1: '4rem', body: '1.125rem' }
    }
  },
  layout: {
    header: 'sticky',
    navigation: 'top',
    productGrid: 3,
    showCategories: true,
    showSearch: true
  },
  features: {
    ageVerification: true,
    productFilters: ['category', 'price', 'thc-content'],
    productReviews: true
  }
}
```

**Step 3: Code Generation**

The agent generates:
- `app/layout.tsx` with luxury theme
- `app/page.tsx` with hero section and featured products
- `app/shop/page.tsx` with product grid and filters
- `components/ProductCard.tsx` with hover effects
- `styles/globals.css` with gold accent colors
- Supabase queries filtered to vendor's products

**Step 4: Preview**

Vendor sees live preview at `https://preview.yachtclub.com/abc123`

**Step 5: Refinement**
```
Vendor: "Make the header transparent on the home page"
```

AI updates `app/page.tsx` with transparent header.

**Step 6: Deployment**

Click "Deploy Live" → 
- Code pushed to GitHub: `yacht-club-vendors/storefront-luxury-cannabis-co`
- Vercel auto-deploys
- Live at: `luxury-cannabis-co.yachtclub.com`
- Custom domain configured: `luxurycannabisco.com`

**Step 7: Automatic Data Sync**

All product data, inventory, orders automatically sync from Yacht Club's Supabase.

---

## 8. Monitoring & Maintenance

### 8.1 Health Checks

```typescript
// Automated monitoring for each storefront
interface HealthCheck {
  url: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
  errors: string[];
}

async function monitorStorefronts() {
  const { data: storefronts } = await supabase
    .from('vendor_storefronts')
    .select('*')
    .eq('status', 'deployed');

  for (const storefront of storefronts) {
    try {
      const start = Date.now();
      const response = await fetch(storefront.live_url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      const responseTime = Date.now() - start;

      await supabase
        .from('storefront_health')
        .insert({
          storefront_id: storefront.id,
          status: response.ok ? 'healthy' : 'degraded',
          response_time: responseTime,
          checked_at: new Date().toISOString(),
        });
    } catch (error) {
      // Alert vendor of downtime
      await supabase
        .from('storefront_health')
        .insert({
          storefront_id: storefront.id,
          status: 'down',
          errors: [error.message],
          checked_at: new Date().toISOString(),
        });
    }
  }
}

// Run every 5 minutes
setInterval(monitorStorefronts, 5 * 60 * 1000);
```

### 8.2 Auto-Updates

**Dependency Updates:**
- Weekly automated PR for package updates
- Security patches auto-merged
- Breaking changes require manual review

**Platform Updates:**
- New Yacht Club features auto-sync to all storefronts
- API version migrations handled automatically

---

## 9. Next Steps

### Immediate Actions:

1. **Set up AI Agent infrastructure:**
   ```bash
   cd /Users/whale/Desktop/Website
   mkdir -p ai-agent/src/{nlp,templates,generator,deployment}
   ```

2. **Create first template:**
   - Design minimalist template in Figma
   - Build Next.js components
   - Test with sample vendor data

3. **Build NLP processor:**
   - Define prompt engineering for GPT-4/Claude
   - Create structured output schemas
   - Test with various inputs

4. **Integrate with vendor portal:**
   - Add `/vendor/storefront-builder` page
   - Build chat interface
   - Connect to AI backend

5. **Deploy pilot:**
   - Test with 1-2 pilot vendors
   - Gather feedback
   - Iterate on templates

---

## 10. Conclusion

This AI Coding Agent will **revolutionize** how vendors create their storefronts on Yacht Club. Instead of requiring technical knowledge or hiring developers, vendors can describe their vision in plain English and receive a fully functional, branded, production-ready e-commerce site in minutes.

**Key Benefits:**
- ⚡ **Speed**: Storefront in 5 minutes vs. weeks of development
- 💰 **Cost**: $0.50 AI generation vs. $5,000-50,000 developer cost
- 🎨 **Customization**: Infinite possibilities vs. rigid templates
- 🔄 **Iteration**: Update anytime with natural language
- 🚀 **Scale**: Deploy hundreds of storefronts effortlessly

**This positions Yacht Club as the most advanced multi-vendor platform in the cannabis industry.**

---

## Appendix A: Sample Templates

### Template 1: Minimalist
- **Colors**: Black, white, gray
- **Typography**: Inter (sans-serif)
- **Layout**: Clean grid, lots of white space
- **Features**: Simple navigation, large images, minimal text

### Template 2: Luxury
- **Colors**: Black, white, gold
- **Typography**: Playfair Display (serif) + Lato (sans-serif)
- **Layout**: Elegant, centered, premium feel
- **Features**: Video backgrounds, parallax scrolling, hover effects

### Template 3: Modern
- **Colors**: Bold primary color + black/white
- **Typography**: Poppins (sans-serif)
- **Layout**: Asymmetric, geometric shapes, gradients
- **Features**: Animations, filters, mega-menu

---

## Appendix B: API Reference

**Full API documentation at:** `/docs/ai-agent-api.md`

**Quick Reference:**
- `POST /api/ai-agent/generate` - Generate storefront
- `POST /api/ai-agent/deploy` - Deploy to production
- `PUT /api/ai-agent/update` - Update existing storefront
- `GET /api/ai-agent/status/:id` - Check deployment status
- `DELETE /api/ai-agent/storefront/:id` - Delete storefront

---

**Document Version:** 1.0  
**Last Updated:** October 23, 2025  
**Author:** Yacht Club Engineering Team

