# WhaleTools Evolution Plan: Living Platform Architecture

**Vision:** Transform WhaleTools from a database-configured platform into a real-time, AI-driven, living organism that adapts to users, optimizes for revenue, and transforms layouts dynamically.

**Timeline:** 6 phases over 12 months  
**Goal:** Handle 100,000+ vendors, 10M+ daily users, real-time AI optimization

---

## 🎯 **CORE VISION**

### **The Living Platform Paradigm:**

```
Traditional Platform:              WhaleTools 2.0:
┌──────────────────┐              ┌──────────────────┐
│  Static Pages    │              │  Living Organisms│
│  ↓               │              │  ↓               │
│  Load → Render   │              │  Stream → Adapt  │
│  ↓               │              │  ↓               │
│  Done            │              │  Optimize        │
└──────────────────┘              │  ↓               │
                                  │  Transform       │
                                  │  ↓               │
                                  │  Learn           │
                                  │  ↓               │
                                  │  Evolve (loop)   │
                                  └──────────────────┘
```

**Key Concepts:**
1. **Component Streaming** - Send UI in chunks as they're ready
2. **AI Layout Engine** - Real-time layout optimization based on behavior
3. **Event-Driven Architecture** - Everything is a reactive event
4. **Predictive Pre-loading** - Load what users will need next
5. **Hot-Swapping** - Replace components without page refresh
6. **Adaptive Personalization** - Every user sees a different layout

---

## 📊 **PHASE 0: CURRENT STATE AUDIT**

### **What We Have:**
✅ Component registry system  
✅ Database-driven UI  
✅ Smart components with vendor context  
✅ Basic caching (client-side only)  
✅ Server-side rendering  
✅ TypeScript/Next.js 15  

### **Critical Gaps:**
❌ No real-time updates  
❌ No edge caching  
❌ No AI layout engine  
❌ No component versioning  
❌ No performance monitoring  
❌ No read replicas  
❌ Props stored as JSONB (unbounded)  
❌ N+1 query patterns  
❌ No event-driven architecture  
❌ Limited AI control (content only)  

### **Architecture Debt:**
```typescript
// Current: Static component mapping
const COMPONENT_MAP = {
  'smart_hero': SmartHero,  // Hardcoded
  'smart_product_grid': SmartProductGrid
};

// Future: Dynamic, versioned, streaming
const COMPONENT_STREAM = {
  'smart_hero': {
    v1: () => import('@/smart/SmartHero.v1'),
    v2: () => import('@/smart/SmartHero.v2'),
    experimental: () => import('@/smart/SmartHero.next'),
    loader: StreamingLoader,
    fallback: HeroSkeleton,
    metrics: { avgRenderTime: 45, conversionRate: 0.12 }
  }
};
```

---

## 🚀 **PHASE 1: FOUNDATION (Weeks 1-4)**
### **Goal: Performance + Monitoring + Stability**

### **1.1 Database Optimizations**

#### **A. Connection Pooling (Week 1)**
```typescript
// lib/supabase/pooler.ts
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

// Use Supabase Pooler for serverless
const poolerUrl = process.env.SUPABASE_POOLER_URL || 
  'https://uaednwpxursknmwdeejn.pooler.supabase.com';

export const supabasePooled = createClient(poolerUrl, serviceKey, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-connection-mode': 'transaction', // Transaction pooling
      'x-application-name': 'whaletools-edge'
    }
  }
});

// Direct Postgres pool for heavy queries
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Migration Path:**
1. Add pooler client alongside existing client
2. Route read queries to pooler
3. Keep writes on primary
4. Monitor connection count
5. Gradually shift all traffic

**Backwards Compatible:** ✅ Yes (new client, old client still works)

---

#### **B. JSONB Optimization (Week 1-2)**
```sql
-- supabase/migrations/20250127_jsonb_optimization.sql

-- Step 1: Add size constraint (non-breaking)
ALTER TABLE vendor_component_instances 
ADD CONSTRAINT props_size_check 
CHECK (pg_column_size(props) < 102400); -- 100KB limit

-- Step 2: Extract hot columns (non-breaking, additive)
ALTER TABLE vendor_component_instances 
ADD COLUMN headline TEXT,
ADD COLUMN button_text TEXT,
ADD COLUMN button_url TEXT,
ADD COLUMN variant TEXT DEFAULT 'default',
ADD COLUMN background_color TEXT,
ADD COLUMN text_color TEXT;

-- Step 3: Create migration function
CREATE OR REPLACE FUNCTION migrate_props_to_columns()
RETURNS void AS $$
BEGIN
  UPDATE vendor_component_instances
  SET 
    headline = props->>'headline',
    button_text = props->>'buttonText',
    button_url = props->>'buttonUrl',
    variant = props->>'variant',
    background_color = props->>'backgroundColor',
    text_color = props->>'textColor'
  WHERE props IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Run migration (can run in background)
SELECT migrate_props_to_columns();

-- Step 5: Add indexes for common queries
CREATE INDEX idx_vendor_components_variant 
ON vendor_component_instances(vendor_id, component_key, variant);

CREATE INDEX idx_vendor_components_headline 
ON vendor_component_instances USING GIN(to_tsvector('english', headline));
```

**Code Changes:**
```typescript
// lib/component-registry/registry.ts
export interface VendorComponentInstance {
  id: string;
  vendor_id: string;
  component_key: string;
  
  // New: Extracted columns (for common props)
  headline?: string;
  button_text?: string;
  button_url?: string;
  variant?: string;
  background_color?: string;
  text_color?: string;
  
  // Old: JSONB (for rare/dynamic props only)
  props: Record<string, any>;
  
  // Auto-merge helper
  getAllProps() {
    return {
      headline: this.headline,
      buttonText: this.button_text,
      buttonUrl: this.button_url,
      variant: this.variant,
      backgroundColor: this.background_color,
      textColor: this.text_color,
      ...this.props // JSONB overrides
    };
  }
}
```

**Backwards Compatible:** ✅ Yes (columns are additive, old code still works)

---

#### **C. Query Optimization (Week 2)**
```typescript
// lib/data/vendor-queries.ts (NEW FILE)
import { supabasePooled, pgPool } from '@/lib/supabase/pooler';

/**
 * Optimized vendor storefront data fetcher
 * Batches all queries, uses read replica
 */
export async function getVendorStorefrontData(vendorSlug: string) {
  // Use direct pg pool for complex join
  const result = await pgPool.query(`
    WITH vendor_data AS (
      SELECT v.id, v.slug, v.store_name, v.logo_url, v.settings
      FROM vendors v
      WHERE v.slug = $1 AND v.status = 'active'
    ),
    section_data AS (
      SELECT s.*
      FROM vendor_storefront_sections s, vendor_data v
      WHERE s.vendor_id = v.id 
        AND s.page_type = 'home'
        AND s.is_enabled = true
      ORDER BY s.section_order
    ),
    component_data AS (
      SELECT 
        c.*,
        -- Pre-extract props for fast access
        c.headline,
        c.button_text,
        c.variant
      FROM vendor_component_instances c, section_data s
      WHERE c.section_id = s.id
        AND c.is_enabled = true
        AND c.is_visible = true
      ORDER BY c.position_order
    ),
    product_data AS (
      SELECT p.*, cat.name as category_name
      FROM products p, vendor_data v
      LEFT JOIN categories cat ON p.primary_category_id = cat.id
      WHERE p.vendor_id = v.id 
        AND p.status = 'published'
      LIMIT 50 -- Pre-limit for performance
    )
    SELECT 
      (SELECT row_to_json(vendor_data) FROM vendor_data) as vendor,
      (SELECT json_agg(section_data) FROM section_data) as sections,
      (SELECT json_agg(component_data) FROM component_data) as components,
      (SELECT json_agg(product_data) FROM product_data) as products
  `, [vendorSlug]);

  return result.rows[0];
}
```

**Performance Gain:** 10-20 queries → **1 query** (20x faster)  
**Backwards Compatible:** ✅ Yes (new function, optional)

---

### **1.2 Caching Infrastructure (Week 2-3)**

#### **A. Next.js Cache Strategy**
```typescript
// app/(storefront)/storefront/page.tsx
import { unstable_cache } from 'next/cache';

export const revalidate = 300; // 5-minute cache
export const runtime = 'edge'; // Run on edge

// Cached data fetcher
const getCachedVendorData = unstable_cache(
  async (slug: string) => {
    return await getVendorStorefrontData(slug);
  },
  ['vendor-storefront'], // Cache key prefix
  {
    revalidate: 300, // 5 minutes
    tags: (slug) => [`vendor-${slug}`, 'storefronts']
  }
);

export default async function StorefrontPage({ searchParams }) {
  const params = await searchParams;
  const vendorSlug = params.vendor || 'flora-distro';
  
  // Use cached data
  const data = await getCachedVendorData(vendorSlug);
  
  return <ComponentBasedPageRenderer {...data} />;
}
```

#### **B. Upstash Redis (Week 3)**
```bash
npm install @upstash/redis
```

```typescript
// lib/cache/redis.ts (NEW FILE)
import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();

// Cache wrapper
export async function withRedisCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached) {
    console.log('✅ Cache hit:', key);
    return cached;
  }

  // Fetch and cache
  console.log('❌ Cache miss:', key);
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Cache invalidation
export async function invalidateVendorCache(vendorId: string) {
  const keys = await redis.keys(`vendor:${vendorId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Preload cache (for hot vendors)
export async function preloadVendorCache(vendorId: string) {
  const data = await getVendorStorefrontData(vendorId);
  await redis.setex(`vendor:${vendorId}:storefront`, 3600, JSON.stringify(data));
}
```

**Usage:**
```typescript
// app/api/vendor-storefront/[slug]/route.ts
export async function GET(request, { params }) {
  const { slug } = await params;
  
  const data = await withRedisCache(
    `vendor:${slug}:storefront`,
    () => getVendorStorefrontData(slug),
    300 // 5 min TTL
  );
  
  return Response.json(data);
}
```

**Performance Gain:** 500ms → **10ms** (50x faster)  
**Backwards Compatible:** ✅ Yes (wrapper, drop-in)

---

### **1.3 Monitoring & Observability (Week 3-4)**

#### **A. Query Performance Tracking**
```typescript
// lib/monitoring/query-tracker.ts (NEW FILE)
export class QueryTracker {
  static async trackQuery<T>(
    queryName: string,
    query: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await query();
      const duration = Date.now() - start;
      
      // Log slow queries (>500ms)
      if (duration > 500) {
        console.warn(`🐌 Slow query: ${queryName} took ${duration}ms`);
      }
      
      // Send to analytics
      if (typeof window === 'undefined') {
        // Server-side: Send to logging service
        await fetch('https://logs.whaletools.com/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryName, duration, timestamp: Date.now() })
        }).catch(() => {}); // Don't fail on logging errors
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ Query failed: ${queryName} after ${duration}ms`, error);
      throw error;
    }
  }
}

// Usage
const data = await QueryTracker.trackQuery(
  'getVendorStorefront',
  () => getVendorStorefrontData(slug)
);
```

#### **B. Sentry Integration**
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts (NEW FILE)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  
  // Track component errors
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ["localhost", /^\//],
    }),
  ],
});

// sentry.server.config.ts (NEW FILE)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% sampling
});
```

**Backwards Compatible:** ✅ Yes (monitoring layer, doesn't change code)

---

### **Phase 1 Results:**
- ✅ 20x faster queries (batching)
- ✅ 50x faster cache hits (Redis)
- ✅ Connection pool stable to 10,000 vendors
- ✅ Slow query monitoring
- ✅ Error tracking
- ✅ Zero breaking changes

---

## 🧬 **PHASE 2: COMPONENT EVOLUTION (Weeks 5-8)**
### **Goal: Living, Versioned, Streaming Components**

### **2.1 Component Versioning System (Week 5)**

#### **A. Database Schema**
```sql
-- supabase/migrations/20250128_component_versioning.sql

-- Add versioning to component templates
ALTER TABLE component_templates 
ADD COLUMN version_major INTEGER DEFAULT 1,
ADD COLUMN version_minor INTEGER DEFAULT 0,
ADD COLUMN version_patch INTEGER DEFAULT 0,
ADD COLUMN is_stable BOOLEAN DEFAULT true,
ADD COLUMN is_experimental BOOLEAN DEFAULT false,
ADD COLUMN replaces_version TEXT,
ADD COLUMN breaking_changes JSONB DEFAULT '[]'::jsonb;

-- Add version tracking to instances
ALTER TABLE vendor_component_instances
ADD COLUMN component_version TEXT DEFAULT '1.0.0',
ADD COLUMN auto_upgrade BOOLEAN DEFAULT false,
ADD COLUMN locked_version BOOLEAN DEFAULT false;

-- Version history table
CREATE TABLE component_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_key TEXT NOT NULL,
  version TEXT NOT NULL,
  changes JSONB NOT NULL,
  breaking BOOLEAN DEFAULT false,
  released_at TIMESTAMPTZ DEFAULT NOW(),
  deprecated_at TIMESTAMPTZ,
  
  UNIQUE(component_key, version)
);

-- Migration tracking
CREATE TABLE component_instance_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES vendor_component_instances(id),
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,
  migration_status TEXT DEFAULT 'pending', -- pending, success, failed, rollback
  error_message TEXT,
  migrated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instance_migrations_status 
ON component_instance_migrations(migration_status, migrated_at);
```

#### **B. Component Registry 2.0**
```typescript
// lib/component-registry/registry-v2.ts (NEW FILE)

export interface ComponentVersion {
  key: string;
  version: string; // semver: "1.0.0"
  loader: () => Promise<React.ComponentType<any>>;
  fallback: React.ComponentType<any>;
  skeleton: React.ComponentType<any>;
  
  // Metadata
  isStable: boolean;
  isExperimental: boolean;
  deprecatedAt?: Date;
  replacesVersion?: string;
  
  // Performance tracking
  avgRenderTime: number; // ms
  avgLoadTime: number; // ms
  errorRate: number; // 0-1
  
  // A/B testing
  abTestGroup?: string;
  conversionRate?: number;
}

export const COMPONENT_REGISTRY_V2: Record<string, ComponentVersion[]> = {
  'smart_hero': [
    {
      key: 'smart_hero',
      version: '1.0.0',
      loader: () => import('@/components/smart/SmartHero.v1'),
      fallback: HeroFallback,
      skeleton: HeroSkeleton,
      isStable: true,
      isExperimental: false,
      avgRenderTime: 45,
      avgLoadTime: 120,
      errorRate: 0.001
    },
    {
      key: 'smart_hero',
      version: '2.0.0',
      loader: () => import('@/components/smart/SmartHero.v2'),
      fallback: HeroFallback,
      skeleton: HeroSkeleton,
      isStable: false,
      isExperimental: true,
      replacesVersion: '1.0.0',
      avgRenderTime: 32,
      avgLoadTime: 90,
      errorRate: 0.002,
      abTestGroup: 'hero-redesign-2025'
    }
  ],
  'smart_product_grid': [
    {
      key: 'smart_product_grid',
      version: '1.0.0',
      loader: () => import('@/components/smart/SmartProductGrid.v1'),
      fallback: GridFallback,
      skeleton: GridSkeleton,
      isStable: true,
      isExperimental: false,
      avgRenderTime: 180,
      avgLoadTime: 200,
      errorRate: 0.003
    }
  ]
};

// Get component by version
export function getComponentVersion(
  key: string, 
  version: string = 'latest'
): ComponentVersion | null {
  const versions = COMPONENT_REGISTRY_V2[key];
  if (!versions || versions.length === 0) return null;
  
  if (version === 'latest') {
    // Get latest stable version
    const stable = versions.filter(v => v.isStable);
    return stable[stable.length - 1] || versions[versions.length - 1];
  }
  
  return versions.find(v => v.version === version) || null;
}

// Auto-upgrade check
export async function checkForUpgrades(instanceId: string) {
  // Check if newer version available
  // Check if breaking changes
  // Return upgrade recommendation
}
```

#### **C. Streaming Component Loader**
```typescript
// lib/component-registry/streaming-loader.tsx (NEW FILE)
import { Suspense, lazy } from 'react';

export function StreamingComponent({
  componentKey,
  version = 'latest',
  props,
  priority = 'normal'
}: StreamingComponentProps) {
  const componentMeta = getComponentVersion(componentKey, version);
  
  if (!componentMeta) {
    return <ComponentNotFound componentKey={componentKey} />;
  }
  
  // Lazy load component
  const Component = lazy(componentMeta.loader);
  
  // Render with suspense boundary
  return (
    <Suspense fallback={<componentMeta.skeleton {...props} />}>
      <ErrorBoundary fallback={<componentMeta.fallback {...props} />}>
        <Component {...props} />
      </ErrorBoundary>
    </Suspense>
  );
}
```

**Migration Path:**
1. Add version columns (non-breaking)
2. Default all existing components to v1.0.0
3. New components use StreamingComponent
4. Gradually migrate old components
5. Keep legacy ComponentMap for backwards compat

**Backwards Compatible:** ✅ Yes (additive, old code works)

---

### **2.2 Component Streaming (Week 6)**

#### **A. React Server Components + Streaming**
```typescript
// app/(storefront)/storefront/page.tsx (UPDATED)
import { Suspense } from 'react';

export default async function StorefrontPage({ searchParams }) {
  const params = await searchParams;
  const vendorSlug = params.vendor || 'flora-distro';
  
  // Fetch critical data (vendor, sections) - FAST
  const { vendor, sections } = await getCriticalData(vendorSlug);
  
  return (
    <div className="min-h-screen bg-black">
      {/* Stream sections as they load */}
      {sections.map(section => (
        <Suspense 
          key={section.id} 
          fallback={<SectionSkeleton section={section} />}
        >
          <StreamingSection 
            section={section} 
            vendorId={vendor.id}
          />
        </Suspense>
      ))}
    </div>
  );
}

// Server Component - streams to client
async function StreamingSection({ section, vendorId }) {
  // This fetches in parallel with other sections
  const components = await getComponentsForSection(section.id);
  const data = await getDataForComponents(components, vendorId);
  
  return (
    <section className="py-16">
      {components.map(comp => (
        <StreamingComponent 
          key={comp.id}
          componentKey={comp.component_key}
          version={comp.component_version}
          props={{ ...comp.props, ...data }}
        />
      ))}
    </section>
  );
}
```

**Performance:**
- Old: Wait for all data → Render entire page (2-3s)
- New: Stream sections as ready → Progressive render (0.5-1s perceived)

---

### **2.3 Hot-Swapping Components (Week 7)**

#### **A. WebSocket Infrastructure**
```bash
npm install @supabase/realtime-js pusher-js
```

```typescript
// lib/realtime/component-updates.ts (NEW FILE)
import { createClient } from '@supabase/supabase-js';

export class ComponentUpdateStream {
  private supabase = createClient(url, key);
  private channel: any;
  
  subscribe(vendorId: string, onUpdate: (component: any) => void) {
    this.channel = this.supabase
      .channel(`vendor-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vendor_component_instances',
          filter: `vendor_id=eq.${vendorId}`
        },
        (payload) => {
          onUpdate(payload.new);
        }
      )
      .subscribe();
  }
  
  unsubscribe() {
    this.channel?.unsubscribe();
  }
}
```

#### **B. Client-Side Hot Swap**
```typescript
// components/storefront/ComponentBasedPageRenderer.tsx (UPDATED)
"use client";

import { useEffect, useState } from 'react';
import { ComponentUpdateStream } from '@/lib/realtime/component-updates';

export function ComponentBasedPageRenderer({ vendor, initialComponents }) {
  const [components, setComponents] = useState(initialComponents);
  
  useEffect(() => {
    const stream = new ComponentUpdateStream();
    
    stream.subscribe(vendor.id, (updatedComponent) => {
      // Hot-swap the component
      setComponents(prev => 
        prev.map(c => 
          c.id === updatedComponent.id 
            ? { ...c, ...updatedComponent } 
            : c
        )
      );
      
      // Animate the change
      toast.success('Layout updated!', { duration: 2000 });
    });
    
    return () => stream.unsubscribe();
  }, [vendor.id]);
  
  return (
    <AnimatePresence mode="wait">
      {components.map(comp => (
        <motion.div
          key={comp.id}
          layout // Animate position changes
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <StreamingComponent {...comp} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

**Vision Achieved:** ✅ User sees page transform in real-time without refresh

---

### **Phase 2 Results:**
- ✅ Versioned components (safe upgrades)
- ✅ Streaming architecture (progressive rendering)
- ✅ Hot-swapping (real-time updates)
- ✅ 3x faster perceived load time
- ✅ Backwards compatible (old components still work)

---

## 🤖 **PHASE 3: AI ORCHESTRATION (Weeks 9-12)**
### **Goal: AI Controls Everything**

### **3.1 AI Layout Engine (Week 9-10)**

#### **A. Layout Intelligence Service**
```typescript
// lib/ai/layout-engine.ts (NEW FILE)
import { Anthropic } from '@anthropic-ai/sdk';

export interface LayoutContext {
  vendorId: string;
  vendorType: string; // 'cannabis', 'luxury', 'retail'
  currentLayout: ComponentInstance[];
  userBehavior: {
    bounceRate: number;
    avgSessionTime: number;
    conversionRate: number;
    topExitPoints: string[];
  };
  businessGoals: {
    priority: 'conversions' | 'engagement' | 'revenue';
    targetMetric: string;
    targetValue: number;
  };
  constraints: {
    maxComponents: number;
    requiredComponents: string[];
    brandGuidelines: any;
  };
}

export class AILayoutEngine {
  private claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  async optimizeLayout(context: LayoutContext): Promise<ComponentInstance[]> {
    const prompt = `
You are an expert e-commerce UX designer and conversion optimizer.

Context:
- Vendor Type: ${context.vendorType}
- Current Performance:
  * Bounce Rate: ${context.userBehavior.bounceRate}%
  * Conversion Rate: ${context.userBehavior.conversionRate}%
  * Avg Session: ${context.userBehavior.avgSessionTime}s
- Business Goal: ${context.businessGoals.priority}
- Current Layout: ${JSON.stringify(context.currentLayout, null, 2)}

Task: Redesign the page layout to improve ${context.businessGoals.targetMetric}.

Rules:
1. Keep required components: ${context.constraints.requiredComponents.join(', ')}
2. Max ${context.constraints.maxComponents} components
3. Explain your reasoning for each change
4. Return valid JSON

Output Format:
{
  "reasoning": "Why this layout will improve conversions...",
  "changes": [
    {
      "action": "move" | "replace" | "add" | "remove",
      "component": "smart_hero",
      "newPosition": 2,
      "reason": "Moving hero down because..."
    }
  ],
  "newLayout": [
    {
      "component_key": "smart_header",
      "position_order": 0,
      "props": {...}
    }
  ],
  "expectedImpact": {
    "conversionRate": "+12%",
    "bounceRate": "-8%"
  }
}
`;

    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const result = JSON.parse(response.content[0].text);
    
    // Validate and apply changes
    return this.applyLayoutChanges(context.currentLayout, result.changes);
  }
  
  private async applyLayoutChanges(
    currentLayout: ComponentInstance[],
    changes: any[]
  ): Promise<ComponentInstance[]> {
    // Apply changes one by one
    let newLayout = [...currentLayout];
    
    for (const change of changes) {
      switch (change.action) {
        case 'move':
          newLayout = this.moveComponent(newLayout, change);
          break;
        case 'replace':
          newLayout = this.replaceComponent(newLayout, change);
          break;
        case 'add':
          newLayout = this.addComponent(newLayout, change);
          break;
        case 'remove':
          newLayout = this.removeComponent(newLayout, change);
          break;
      }
    }
    
    return newLayout;
  }
}
```

#### **B. Auto-Optimization Cron**
```typescript
// app/api/cron/optimize-layouts/route.ts (NEW FILE)
import { AILayoutEngine } from '@/lib/ai/layout-engine';
import { getVendorAnalytics } from '@/lib/analytics';

export async function GET(request: Request) {
  // Verify cron secret
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get vendors that opted into AI optimization
  const vendors = await supabase
    .from('vendors')
    .select('*')
    .eq('ai_optimization_enabled', true);
  
  const engine = new AILayoutEngine();
  
  for (const vendor of vendors.data || []) {
    // Get current performance
    const analytics = await getVendorAnalytics(vendor.id);
    
    // Check if optimization needed
    if (analytics.conversionRate < vendor.target_conversion_rate) {
      console.log(`🤖 Optimizing layout for ${vendor.slug}...`);
      
      // Get current layout
      const currentLayout = await getVendorLayout(vendor.id);
      
      // AI optimize
      const newLayout = await engine.optimizeLayout({
        vendorId: vendor.id,
        vendorType: vendor.vendor_type,
        currentLayout,
        userBehavior: analytics,
        businessGoals: vendor.business_goals,
        constraints: vendor.layout_constraints
      });
      
      // A/B test new layout
      await createABTest(vendor.id, {
        name: `AI Layout Optimization ${new Date().toISOString()}`,
        control: currentLayout,
        variant: newLayout,
        metric: 'conversion_rate',
        duration: 7 // days
      });
    }
  }
  
  return Response.json({ success: true });
}
```

**Vision Achieved:** ✅ AI automatically redesigns layouts based on performance

---

### **3.2 Predictive Pre-loading (Week 11)**

#### **A. User Behavior Tracking**
```typescript
// lib/analytics/behavior-tracker.ts (NEW FILE)
export class BehaviorTracker {
  private events: Event[] = [];
  
  track(event: {
    type: 'pageview' | 'click' | 'scroll' | 'hover' | 'add_to_cart';
    target: string;
    timestamp: number;
    metadata?: any;
  }) {
    this.events.push(event);
    
    // Send to analytics service
    if (this.events.length >= 10) {
      this.flush();
    }
  }
  
  async flush() {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: this.events })
    });
    
    this.events = [];
  }
  
  // Predict next action
  async predictNextPage(): Promise<string[]> {
    const response = await fetch('/api/analytics/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: this.events })
    });
    
    const { predictions } = await response.json();
    return predictions; // ['shop', 'product/xyz', 'cart']
  }
}
```

#### **B. Predictive Router**
```typescript
// components/navigation/PredictiveLink.tsx (NEW FILE)
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BehaviorTracker } from '@/lib/analytics/behavior-tracker';

export function PredictiveLink({ href, children, ...props }) {
  const [shouldPreload, setShouldPreload] = useState(false);
  const tracker = new BehaviorTracker();
  
  useEffect(() => {
    // Check if this link is predicted as next
    tracker.predictNextPage().then(predictions => {
      if (predictions.includes(href)) {
        setShouldPreload(true);
        
        // Preload the page data
        fetch(`/api/vendor-storefront/data?page=${href}`);
      }
    });
  }, [href]);
  
  return (
    <Link 
      href={href} 
      prefetch={shouldPreload}
      onMouseEnter={() => {
        tracker.track({ type: 'hover', target: href, timestamp: Date.now() });
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
```

**Vision Achieved:** ✅ Platform predicts and pre-loads what user will do next

---

### **3.3 Dynamic Personalization (Week 12)**

#### **A. User Segmentation Engine**
```typescript
// lib/personalization/segmentation.ts (NEW FILE)
export interface UserSegment {
  id: string;
  name: string;
  rules: SegmentRule[];
  componentOverrides: Record<string, any>;
}

export interface SegmentRule {
  type: 'device' | 'location' | 'behavior' | 'time' | 'referrer';
  operator: 'equals' | 'contains' | 'greater_than';
  value: any;
}

export const USER_SEGMENTS: UserSegment[] = [
  {
    id: 'mobile-first-time',
    name: 'Mobile First-Time Visitors',
    rules: [
      { type: 'device', operator: 'equals', value: 'mobile' },
      { type: 'behavior', operator: 'equals', value: 'first_visit' }
    ],
    componentOverrides: {
      'smart_hero': {
        variant: 'minimal', // Less content for mobile
        buttonSize: 'large', // Easier to tap
        showSubheadline: false
      },
      'smart_product_grid': {
        columns: 1, // Single column on mobile
        showFilters: false, // Hide initially
        cardSize: 'large'
      }
    }
  },
  {
    id: 'high-intent-buyer',
    name: 'High Intent Buyers',
    rules: [
      { type: 'behavior', operator: 'greater_than', value: { cart_abandonment: 2 } },
      { type: 'behavior', operator: 'greater_than', value: { product_views: 10 } }
    ],
    componentOverrides: {
      'smart_hero': {
        headline: 'Welcome Back! Complete Your Order',
        buttonText: 'View Cart',
        buttonUrl: '/cart',
        showDiscount: true
      }
    }
  },
  {
    id: 'luxury-shopper',
    name: 'Luxury Shoppers',
    rules: [
      { type: 'behavior', operator: 'greater_than', value: { avg_order_value: 200 } }
    ],
    componentOverrides: {
      'smart_product_grid': {
        sortBy: 'price_high_to_low',
        showBadges: ['premium', 'exclusive'],
        cardStyle: 'luxury'
      }
    }
  }
];

export function getUserSegment(userContext: any): UserSegment | null {
  for (const segment of USER_SEGMENTS) {
    if (matchesSegment(userContext, segment.rules)) {
      return segment;
    }
  }
  return null;
}
```

#### **B. Personalized Renderer**
```typescript
// components/storefront/PersonalizedRenderer.tsx (NEW FILE)
"use client";

import { useEffect, useState } from 'react';
import { getUserSegment } from '@/lib/personalization/segmentation';
import { getUserContext } from '@/lib/analytics/user-context';

export function PersonalizedRenderer({ vendor, baseComponents }) {
  const [components, setComponents] = useState(baseComponents);
  
  useEffect(() => {
    // Get user context
    const userContext = getUserContext();
    
    // Find matching segment
    const segment = getUserSegment(userContext);
    
    if (segment) {
      // Apply component overrides
      const personalized = baseComponents.map(comp => {
        const overrides = segment.componentOverrides[comp.component_key];
        if (overrides) {
          return {
            ...comp,
            props: { ...comp.props, ...overrides }
          };
        }
        return comp;
      });
      
      setComponents(personalized);
    }
  }, [baseComponents]);
  
  return (
    <ComponentBasedPageRenderer
      vendor={vendor}
      components={components}
    />
  );
}
```

**Vision Achieved:** ✅ Every user sees a different, personalized layout

---

### **Phase 3 Results:**
- ✅ AI controls layout optimization
- ✅ Predictive pre-loading (instant pages)
- ✅ Dynamic personalization (per-user layouts)
- ✅ Auto A/B testing
- ✅ "Living platform" realized

---

## 🌐 **PHASE 4: EDGE COMPUTE (Weeks 13-16)**
### **Goal: Global Performance at Scale**

*(Continued in next response...)*

---

**End of Part 1 - Continue?**

