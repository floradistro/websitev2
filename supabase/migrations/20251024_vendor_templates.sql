-- Add template_id field to vendors table for multi-template support
-- This allows each vendor to choose their own storefront design template

-- Add template_id column to vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'default' NOT NULL;

-- Create index for template lookups
CREATE INDEX IF NOT EXISTS vendors_template_id_idx ON public.vendors(template_id);

-- Add comment
COMMENT ON COLUMN public.vendors.template_id IS 
  'Template ID for vendor storefront (e.g., default, minimalist, luxury, modern). Determines which design template is used for the vendor''s storefront.';

-- Set Flora Distro to use the minimalist template (current design)
UPDATE public.vendors 
SET template_id = 'minimalist'
WHERE store_name = 'Flora Distro';

-- Create vendor_templates table to store available templates
CREATE TABLE IF NOT EXISTS public.vendor_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.vendor_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates
DROP POLICY IF EXISTS "Anyone can view templates" ON public.vendor_templates;
CREATE POLICY "Anyone can view templates"
  ON public.vendor_templates FOR SELECT
  USING (is_active = true);

-- Service role can manage templates
DROP POLICY IF EXISTS "Service role manages templates" ON public.vendor_templates;
CREATE POLICY "Service role manages templates"
  ON public.vendor_templates FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT ON public.vendor_templates TO authenticated, anon;
GRANT ALL ON public.vendor_templates TO service_role;

-- Insert default templates
INSERT INTO public.vendor_templates (id, name, description) VALUES
  ('default', 'Default Template', 'Clean, modern template suitable for all vendors'),
  ('minimalist', 'Minimalist Template', 'Ultra-modern minimalist design with black/white aesthetic (Flora Distro style)')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.vendor_templates IS 
  'Registry of available storefront templates that vendors can choose from';

