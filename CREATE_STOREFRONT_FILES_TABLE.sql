-- Copy and paste this into Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.storefront_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES public.vendor_storefronts(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  file_path TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_type TEXT,
  
  version INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES public.storefront_files(id),
  
  created_by_prompt TEXT,
  ai_explanation TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(storefront_id, file_path, version)
);

CREATE INDEX storefront_files_storefront_idx ON public.storefront_files(storefront_id);
CREATE INDEX storefront_files_vendor_idx ON public.storefront_files(vendor_id);
CREATE INDEX storefront_files_path_idx ON public.storefront_files(file_path);

ALTER TABLE public.storefront_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage own files"
  ON public.storefront_files FOR ALL
  USING (vendor_id::text = auth.uid()::text);

CREATE POLICY "Service role full access"
  ON public.storefront_files FOR ALL
  USING (true);

GRANT ALL ON public.storefront_files TO authenticated, service_role;

