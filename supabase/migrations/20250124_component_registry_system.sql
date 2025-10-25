-- Component Registry System
-- Makes sections as dynamic as fields - schema-driven components

-- ============================================================================
-- TABLE: component_templates
-- Defines reusable UI components with their schemas
-- ============================================================================
CREATE TABLE IF NOT EXISTS component_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  component_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'atomic', 'composite', 'smart', 'layout'
  sub_category TEXT, -- 'product', 'content', 'media', 'conversion', 'navigation'
  
  -- Field Requirements
  required_fields JSONB DEFAULT '[]'::jsonb, -- ['product_picker', 'headline']
  optional_fields JSONB DEFAULT '[]'::jsonb, -- ['show_prices', 'columns']
  field_schema JSONB DEFAULT '{}'::jsonb, -- Full field definitions
  
  -- Backend Connections
  data_sources JSONB DEFAULT '[]'::jsonb, -- ['products', 'inventory', 'pricing', 'categories']
  fetches_real_data BOOLEAN DEFAULT false, -- Does this component auto-fetch from DB?
  
  -- Rendering
  variants JSONB DEFAULT '[]'::jsonb, -- ['grid', 'carousel', 'masonry', 'list']
  default_variant TEXT,
  props_schema JSONB DEFAULT '{}'::jsonb, -- TypeScript-style prop definitions
  
  -- Layout
  default_layout JSONB DEFAULT '{}'::jsonb, -- Grid, flex, positioning
  responsive_breakpoints JSONB DEFAULT '{}'::jsonb,
  
  -- Component Composition
  child_components JSONB DEFAULT '[]'::jsonb, -- For composite components
  slot_definitions JSONB DEFAULT '{}'::jsonb, -- Named slots for children
  
  -- Metadata
  is_public BOOLEAN DEFAULT true,
  is_deprecated BOOLEAN DEFAULT false,
  replaces_component_key TEXT,
  version TEXT DEFAULT '1.0.0',
  tags JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: component_variant_configs
-- Stores different layout/style variants for each component
-- ============================================================================
CREATE TABLE IF NOT EXISTS component_variant_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_key TEXT NOT NULL REFERENCES component_templates(component_key) ON DELETE CASCADE,
  
  variant_key TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  description TEXT,
  
  -- Layout Configuration
  layout_type TEXT, -- 'grid', 'flex', 'absolute', 'stack'
  layout_config JSONB DEFAULT '{}'::jsonb, -- columns, rows, gaps, etc.
  
  -- Component Arrangement
  component_positions JSONB DEFAULT '[]'::jsonb, -- Which child components go where
  
  -- Style Overrides
  style_overrides JSONB DEFAULT '{}'::jsonb,
  
  -- Preview
  preview_image_url TEXT,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(component_key, variant_key)
);

-- ============================================================================
-- TABLE: field_component_bindings
-- Maps field types to compatible components
-- ============================================================================
CREATE TABLE IF NOT EXISTS field_component_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  field_type TEXT NOT NULL, -- 'product_picker', 'category_picker', 'image', etc.
  component_key TEXT NOT NULL REFERENCES component_templates(component_key) ON DELETE CASCADE,
  
  -- Binding Rules
  is_recommended BOOLEAN DEFAULT false, -- AI suggests this pairing
  compatibility_score INTEGER DEFAULT 50, -- 0-100, how well they work together
  
  -- Auto-Configuration
  auto_config JSONB DEFAULT '{}'::jsonb, -- Default props when field is added
  
  -- Constraints
  min_items INTEGER, -- For array fields
  max_items INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(field_type, component_key)
);

-- ============================================================================
-- TABLE: vendor_component_instances
-- Vendor-specific component instances with custom configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendor_component_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  section_id UUID REFERENCES vendor_storefront_sections(id) ON DELETE CASCADE,
  
  component_key TEXT NOT NULL REFERENCES component_templates(component_key),
  instance_name TEXT, -- Vendor's custom name for this instance
  
  -- Configuration
  active_variant TEXT, -- Which variant is being used
  props JSONB DEFAULT '{}'::jsonb, -- Component-specific props
  field_bindings JSONB DEFAULT '{}'::jsonb, -- Maps component slots to field values
  
  -- Layout in Section
  position_order INTEGER DEFAULT 0,
  container_config JSONB DEFAULT '{}'::jsonb, -- Wrapper div styling
  
  -- State
  is_enabled BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: smart_component_cache
-- Caches fetched data for smart components
-- ============================================================================
CREATE TABLE IF NOT EXISTS smart_component_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  component_instance_id UUID NOT NULL REFERENCES vendor_component_instances(id) ON DELETE CASCADE,
  
  -- Cache Key
  cache_key TEXT NOT NULL,
  data_source TEXT NOT NULL, -- 'products', 'categories', 'inventory', etc.
  
  -- Cached Data
  fetched_data JSONB NOT NULL,
  
  -- Cache Management
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vendor_id, component_instance_id, cache_key)
);

-- Indexes
CREATE INDEX idx_component_templates_category ON component_templates(category);
CREATE INDEX idx_component_templates_data_sources ON component_templates USING GIN(data_sources);
CREATE INDEX idx_component_variant_configs_component ON component_variant_configs(component_key);
CREATE INDEX idx_field_component_bindings_field_type ON field_component_bindings(field_type);
CREATE INDEX idx_field_component_bindings_component ON field_component_bindings(component_key);
CREATE INDEX idx_vendor_component_instances_vendor ON vendor_component_instances(vendor_id);
CREATE INDEX idx_vendor_component_instances_section ON vendor_component_instances(section_id);
CREATE INDEX idx_smart_component_cache_vendor ON smart_component_cache(vendor_id);
CREATE INDEX idx_smart_component_cache_expires ON smart_component_cache(expires_at);

-- ============================================================================
-- FUNCTION: get_recommended_components_for_fields
-- AI-powered component suggestions based on fields
-- ============================================================================
CREATE OR REPLACE FUNCTION get_recommended_components_for_fields(
  p_field_types TEXT[]
)
RETURNS TABLE(
  component_key TEXT,
  component_name TEXT,
  compatibility_score INTEGER,
  matching_fields TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.component_key,
    ct.name,
    MAX(fcb.compatibility_score)::INTEGER as compatibility_score,
    ARRAY_AGG(DISTINCT fcb.field_type) as matching_fields
  FROM component_templates ct
  INNER JOIN field_component_bindings fcb ON fcb.component_key = ct.component_key
  WHERE fcb.field_type = ANY(p_field_types)
    AND ct.is_public = true
    AND ct.is_deprecated = false
  GROUP BY ct.component_key, ct.name
  ORDER BY MAX(fcb.compatibility_score) DESC, ct.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: auto_configure_component_instance
-- Auto-configures component based on field data
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_configure_component_instance(
  p_vendor_id UUID,
  p_section_id UUID,
  p_component_key TEXT,
  p_field_data JSONB
)
RETURNS UUID AS $$
DECLARE
  v_instance_id UUID;
  v_auto_config JSONB;
  v_field_bindings JSONB := '{}'::jsonb;
BEGIN
  -- Get auto-configuration for this component
  SELECT 
    jsonb_object_agg(fcb.field_type, fcb.auto_config)
  INTO v_auto_config
  FROM field_component_bindings fcb
  WHERE fcb.component_key = p_component_key
    AND fcb.field_type = ANY(SELECT jsonb_object_keys(p_field_data));
  
  -- Create component instance
  INSERT INTO vendor_component_instances (
    vendor_id,
    section_id,
    component_key,
    props,
    field_bindings
  ) VALUES (
    p_vendor_id,
    p_section_id,
    p_component_key,
    COALESCE(v_auto_config, '{}'::jsonb),
    p_field_data
  )
  RETURNING id INTO v_instance_id;
  
  RETURN v_instance_id;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_component_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER component_templates_updated_at
  BEFORE UPDATE ON component_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_component_updated_at();

CREATE TRIGGER vendor_component_instances_updated_at
  BEFORE UPDATE ON vendor_component_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_component_updated_at();

COMMENT ON TABLE component_templates IS 'Schema-driven component definitions - makes sections fully dynamic';
COMMENT ON TABLE component_variant_configs IS 'Layout variants for each component (grid, carousel, list, etc.)';
COMMENT ON TABLE field_component_bindings IS 'Maps field types to compatible components for AI recommendations';
COMMENT ON TABLE vendor_component_instances IS 'Vendor-specific component instances with custom configuration';
COMMENT ON TABLE smart_component_cache IS 'Caches backend data fetched by smart components';

