# 🚨 APPLY THIS MIGRATION TO FIX THE ERROR

The 500 error is because the `vendor_domains` table doesn't exist yet.

## Quick Fix - Apply Migration Now:

### Go to Supabase Dashboard:
1. Open: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Copy and paste this SQL:

```sql
-- Create vendor_domains table
CREATE TABLE IF NOT EXISTS public.vendor_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  dns_configured BOOLEAN DEFAULT false,
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  last_checked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_domains_vendor_id_idx ON public.vendor_domains(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_domains_domain_idx ON public.vendor_domains(domain);
CREATE INDEX IF NOT EXISTS vendor_domains_verified_idx ON public.vendor_domains(verified);
CREATE UNIQUE INDEX IF NOT EXISTS vendor_domains_primary_idx ON public.vendor_domains(vendor_id) WHERE is_primary = true;

CREATE TRIGGER set_vendor_domains_updated_at
  BEFORE UPDATE ON public.vendor_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

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

GRANT ALL ON public.vendor_domains TO authenticated;
GRANT ALL ON public.vendor_domains TO service_role;
```

### Click "Run" (or press Cmd+Enter)

### Verify it worked:
Run this to check:
```sql
SELECT * FROM vendor_domains;
```

Should return an empty table (no rows, but table exists).

---

## Then refresh your app at http://localhost:3000/admin/domains

✅ Error should be gone!

