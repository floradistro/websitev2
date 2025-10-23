-- Create vendor_storefronts table
CREATE TABLE IF NOT EXISTS public.vendor_storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  
  deployment_id TEXT UNIQUE,
  repository_url TEXT,
  live_url TEXT,
  preview_url TEXT,
  
  template TEXT,
  customizations JSONB DEFAULT '{}',
  ai_specs JSONB DEFAULT '{}',
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'building', 'deployed', 'failed')),
  build_logs TEXT,
  
  version INTEGER DEFAULT 1,
  last_deployed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key
ALTER TABLE public.vendor_storefronts 
  DROP CONSTRAINT IF EXISTS vendor_storefronts_vendor_id_fkey;
  
ALTER TABLE public.vendor_storefronts 
  ADD CONSTRAINT vendor_storefronts_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS vendor_storefronts_vendor_idx ON public.vendor_storefronts(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_storefronts_status_idx ON public.vendor_storefronts(status);
CREATE INDEX IF NOT EXISTS vendor_storefronts_deployment_idx ON public.vendor_storefronts(deployment_id);

-- Enable RLS
ALTER TABLE public.vendor_storefronts ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Vendors manage own storefronts" ON public.vendor_storefronts;
CREATE POLICY "Vendors manage own storefronts"
  ON public.vendor_storefronts FOR ALL
  USING (vendor_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Service role storefronts" ON public.vendor_storefronts;
CREATE POLICY "Service role storefronts"
  ON public.vendor_storefronts FOR ALL
  USING (true);

-- Create trigger
DROP TRIGGER IF EXISTS vendor_storefronts_updated_at ON public.vendor_storefronts;
CREATE TRIGGER vendor_storefronts_updated_at 
  BEFORE UPDATE ON public.vendor_storefronts
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.vendor_storefronts TO authenticated, service_role;

-- Add comment
COMMENT ON TABLE public.vendor_storefronts IS 'AI-generated vendor storefronts with deployment info';

