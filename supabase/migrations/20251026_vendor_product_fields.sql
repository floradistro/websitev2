-- ============================================================================
-- VENDOR PRODUCT FIELDS - Vendor-defined custom product fields
-- ============================================================================
-- Allows vendors to create their own product fields beyond admin-defined ones
-- SEPARATE from vendor_custom_fields which is for storefront/page customization

CREATE TABLE IF NOT EXISTS public.vendor_product_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Field Definition
  field_id TEXT NOT NULL, -- Unique identifier like 'custom_terpene_profile'
  field_definition JSONB NOT NULL,
  -- Example: {
  --   "type": "text",
  --   "label": "Terpene Profile",
  --   "placeholder": "e.g., Myrcene, Limonene",
  --   "required": false,
  --   "description": "Dominant terpenes in this product"
  -- }
  
  -- Optional Category Scope
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  -- NULL = applies to all vendor products
  -- Specified = only applies to products in this category
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0, -- Display order in forms
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Uniqueness: vendor can't have duplicate field_id per category
  UNIQUE(vendor_id, field_id, category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS vendor_product_fields_vendor_idx ON public.vendor_product_fields(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_product_fields_category_idx ON public.vendor_product_fields(category_id);
CREATE INDEX IF NOT EXISTS vendor_product_fields_active_idx ON public.vendor_product_fields(is_active);

-- RLS Policies
ALTER TABLE public.vendor_product_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can manage own product fields" ON public.vendor_product_fields;
CREATE POLICY "Vendors can manage own product fields"
  ON public.vendor_product_fields FOR ALL
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Anyone can view active vendor product fields" ON public.vendor_product_fields;
CREATE POLICY "Anyone can view active vendor product fields"
  ON public.vendor_product_fields FOR SELECT
  USING (is_active = true);

-- Trigger
CREATE TRIGGER set_vendor_product_fields_updated_at
  BEFORE UPDATE ON public.vendor_product_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.vendor_product_fields IS 'Vendor-defined custom product fields (separate from storefront customization fields)';
COMMENT ON COLUMN public.vendor_product_fields.category_id IS 'NULL = all products, or limit to specific category';
COMMENT ON COLUMN public.vendor_product_fields.field_definition IS 'JSONB field schema with type, label, validation, etc.';

-- Example Usage:
-- Vendor wants to add "Harvest Date" field to all their flower products
-- INSERT INTO vendor_product_fields (vendor_id, field_id, field_definition, category_id)
-- VALUES (
--   'vendor-uuid',
--   'harvest_date',
--   '{"type": "date", "label": "Harvest Date", "required": false, "description": "When this batch was harvested"}',
--   'flower-category-uuid'
-- );

