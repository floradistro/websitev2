/**
 * Business Templates System
 * Allows admins to create pre-configured business templates (Cannabis, Beverages, etc.)
 * with categories and field groups that vendors can import and customize
 */

-- Business Templates (Admin-managed industry templates)
CREATE TABLE IF NOT EXISTS business_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  industry_type TEXT, -- 'cannabis', 'beverage', 'retail', etc.
  icon TEXT, -- emoji or icon identifier
  image_url TEXT, -- preview image
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Categories (Categories included in each template)
CREATE TABLE IF NOT EXISTS template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES business_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📦',
  image_url TEXT,
  parent_id UUID REFERENCES template_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, slug)
);

-- Template Field Groups (Field configurations included in each template)
CREATE TABLE IF NOT EXISTS template_field_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES business_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]', -- Array of field definitions
  applicable_to_category_slugs TEXT[] DEFAULT '{}', -- Which template categories use these fields
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, slug)
);

-- Template Usage Tracking (Track which vendors imported which templates)
CREATE TABLE IF NOT EXISTS vendor_template_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES business_templates(id) ON DELETE CASCADE,
  imported_categories BOOLEAN DEFAULT false,
  imported_field_groups BOOLEAN DEFAULT false,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(vendor_id, template_id)
);

-- Add source tracking to existing categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS source_template_id UUID REFERENCES business_templates(id),
ADD COLUMN IF NOT EXISTS source_template_category_id UUID REFERENCES template_categories(id);

-- Add source tracking to vendor product fields
ALTER TABLE vendor_product_fields
ADD COLUMN IF NOT EXISTS source_template_id UUID REFERENCES business_templates(id),
ADD COLUMN IF NOT EXISTS source_template_field_group_id UUID REFERENCES template_field_groups(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_templates_active ON business_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_business_templates_industry ON business_templates(industry_type);
CREATE INDEX IF NOT EXISTS idx_template_categories_template ON template_categories(template_id);
CREATE INDEX IF NOT EXISTS idx_template_field_groups_template ON template_field_groups(template_id);
CREATE INDEX IF NOT EXISTS idx_vendor_template_imports_vendor ON vendor_template_imports(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_template_imports_template ON vendor_template_imports(template_id);
CREATE INDEX IF NOT EXISTS idx_categories_source_template ON categories(source_template_id);
CREATE INDEX IF NOT EXISTS idx_vendor_product_fields_source_template ON vendor_product_fields(source_template_id);

-- Updated_at trigger for business_templates
CREATE OR REPLACE FUNCTION update_business_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_templates_updated_at
BEFORE UPDATE ON business_templates
FOR EACH ROW
EXECUTE FUNCTION update_business_templates_updated_at();

-- Updated_at trigger for template_categories
CREATE TRIGGER template_categories_updated_at
BEFORE UPDATE ON template_categories
FOR EACH ROW
EXECUTE FUNCTION update_business_templates_updated_at();

-- Updated_at trigger for template_field_groups
CREATE TRIGGER template_field_groups_updated_at
BEFORE UPDATE ON template_field_groups
FOR EACH ROW
EXECUTE FUNCTION update_business_templates_updated_at();

-- Seed initial Cannabis template
INSERT INTO business_templates (name, slug, description, industry_type, icon, is_active, display_order)
VALUES
  ('Cannabis Dispensary', 'cannabis-dispensary', 'Complete setup for cannabis retail with standard categories and product fields', 'cannabis', '🌿', true, 1),
  ('Beverage Store', 'beverage-store', 'Pre-configured for beverage retail with drink categories and attributes', 'beverage', '🥤', true, 2),
  ('General Retail', 'general-retail', 'Basic retail setup for any product type', 'retail', '🏪', true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Seed Cannabis template categories
WITH cannabis_template AS (
  SELECT id FROM business_templates WHERE slug = 'cannabis-dispensary'
)
INSERT INTO template_categories (template_id, name, slug, description, icon, display_order)
SELECT
  (SELECT id FROM cannabis_template),
  name,
  slug,
  description,
  icon,
  display_order
FROM (VALUES
  ('Flower', 'flower', 'Premium cannabis flower products', '🌸', 1),
  ('Pre-Rolls', 'pre-rolls', 'Pre-rolled joints and blunts', '🚬', 2),
  ('Concentrates', 'concentrates', 'Extracts, wax, shatter, and oils', '💎', 3),
  ('Edibles', 'edibles', 'Cannabis-infused food products', '🍬', 4),
  ('Vapes', 'vapes', 'Vape cartridges and disposables', '💨', 5),
  ('Topicals', 'topicals', 'Lotions, balms, and patches', '💊', 6),
  ('Tinctures', 'tinctures', 'Sublingual drops and oils', '💧', 7),
  ('Accessories', 'accessories', 'Pipes, papers, and gear', '🔥', 8)
) AS t(name, slug, description, icon, display_order)
ON CONFLICT (template_id, slug) DO NOTHING;

-- Seed Cannabis template field groups
WITH cannabis_template AS (
  SELECT id FROM business_templates WHERE slug = 'cannabis-dispensary'
)
INSERT INTO template_field_groups (template_id, name, slug, description, fields, applicable_to_category_slugs, display_order)
SELECT
  (SELECT id FROM cannabis_template),
  'Cannabis Product Details',
  'cannabis-details',
  'Essential cannabis product information',
  '[
    {"name": "THC Content", "type": "number", "unit": "%", "required": true},
    {"name": "CBD Content", "type": "number", "unit": "%", "required": false},
    {"name": "Strain Type", "type": "select", "options": ["Indica", "Sativa", "Hybrid"], "required": true},
    {"name": "Terpenes", "type": "text", "required": false},
    {"name": "Batch Number", "type": "text", "required": true},
    {"name": "Harvest Date", "type": "date", "required": false},
    {"name": "Lab Tested", "type": "boolean", "required": true}
  ]'::jsonb,
  ARRAY['flower', 'pre-rolls', 'concentrates'],
  1
ON CONFLICT (template_id, slug) DO NOTHING;

COMMENT ON TABLE business_templates IS 'Admin-managed business templates for rapid vendor setup';
COMMENT ON TABLE template_categories IS 'Pre-configured categories included in business templates';
COMMENT ON TABLE template_field_groups IS 'Pre-configured field groups included in business templates';
COMMENT ON TABLE vendor_template_imports IS 'Track which templates vendors have imported';
