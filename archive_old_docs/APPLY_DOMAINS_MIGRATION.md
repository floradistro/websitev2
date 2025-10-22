# Apply Custom Domains Migration

## Quick Setup

### Step 1: Apply Database Migration

Go to your Supabase Dashboard and run this SQL:

**Location**: SQL Editor

**Copy this file**: `/supabase/migrations/20251021_vendor_custom_domains.sql`

Or run directly:

```sql
-- ============================================================================
-- FLORA DISTRO - VENDOR CUSTOM DOMAINS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  
  -- Verification
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- DNS Configuration
  dns_configured BOOLEAN DEFAULT false,
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  
  -- Status
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  last_checked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS vendor_domains_vendor_id_idx ON public.vendor_domains(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_domains_domain_idx ON public.vendor_domains(domain);
CREATE INDEX IF NOT EXISTS vendor_domains_verified_idx ON public.vendor_domains(verified);
CREATE UNIQUE INDEX IF NOT EXISTS vendor_domains_primary_idx ON public.vendor_domains(vendor_id) WHERE is_primary = true;

-- Updated at trigger
CREATE TRIGGER set_vendor_domains_updated_at
  BEFORE UPDATE ON public.vendor_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
ALTER TABLE public.vendor_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view own domains" ON public.vendor_domains;
CREATE POLICY "Vendors can view own domains"
  ON public.vendor_domains FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Vendors can manage own domains" ON public.vendor_domains;
CREATE POLICY "Vendors can manage own domains"
  ON public.vendor_domains FOR ALL
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Service role has full access to domains" ON public.vendor_domains;
CREATE POLICY "Service role has full access to domains"
  ON public.vendor_domains FOR ALL
  USING (true);

-- Grant permissions
GRANT ALL ON public.vendor_domains TO authenticated;
GRANT ALL ON public.vendor_domains TO service_role;
```

### Step 2: Update Middleware Platform Domains

Edit `/middleware.ts` line 26:

```typescript
const platformDomains = [
  'localhost',
  'floradistro.com',           // Your actual domain
  'www.floradistro.com',       // Your actual domain
  'vercel.app'                 // Vercel preview domains
];
```

### Step 3: Test It

1. Start dev server: `npm run dev`
2. Login as vendor: `/vendor/login`
3. Go to: `/vendor/domains`
4. Add a test domain
5. Check admin panel: `/admin/domains`

### Step 4: Production (Vercel)

When ready for production:

1. Deploy to Vercel
2. Go to Vercel Project > Settings > Domains
3. Add vendor domains as they sign up
4. Vercel automatically provisions SSL
5. Domains go live once DNS propagates

---

## That's It!

✅ Custom domains are now ready to use.

Vendors can manage domains from: `/vendor/domains`
Admins can oversee everything from: `/admin/domains`

