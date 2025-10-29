-- Vendor Media Library Schema
-- Comprehensive media management with AI tagging, categorization, and product linking

-- Media categories enum
CREATE TYPE media_category AS ENUM (
  'product_photos',
  'marketing',
  'menus',
  'brand'
);

-- Media item status
CREATE TYPE media_status AS ENUM (
  'active',
  'archived',
  'processing'
);

-- Main vendor_media table
CREATE TABLE IF NOT EXISTS vendor_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- File information
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE, -- Full Supabase storage path
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type

  -- Organization
  category media_category NOT NULL DEFAULT 'product_photos',
  status media_status NOT NULL DEFAULT 'active',

  -- AI-generated metadata
  ai_tags TEXT[] DEFAULT '{}', -- Array of AI-detected tags
  ai_description TEXT, -- GPT-4 Vision description
  dominant_colors TEXT[], -- Hex color codes
  detected_content JSONB DEFAULT '{}', -- What's in the image (objects, people, etc.)
  quality_score INTEGER, -- 1-100, AI-assessed quality

  -- Manual metadata
  custom_tags TEXT[] DEFAULT '{}',
  title TEXT,
  alt_text TEXT,
  notes TEXT,

  -- Product linking
  linked_product_ids UUID[] DEFAULT '{}',

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  used_in_components TEXT[] DEFAULT '{}', -- Component IDs where this is used

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),

  -- Indexes for fast queries
  CONSTRAINT unique_vendor_file UNIQUE(vendor_id, file_name)
);

-- Indexes for performance
CREATE INDEX idx_vendor_media_vendor ON vendor_media(vendor_id);
CREATE INDEX idx_vendor_media_category ON vendor_media(category);
CREATE INDEX idx_vendor_media_status ON vendor_media(status);
CREATE INDEX idx_vendor_media_created ON vendor_media(created_at DESC);
CREATE INDEX idx_vendor_media_tags ON vendor_media USING GIN(ai_tags);
CREATE INDEX idx_vendor_media_custom_tags ON vendor_media USING GIN(custom_tags);
CREATE INDEX idx_vendor_media_products ON vendor_media USING GIN(linked_product_ids);
CREATE INDEX idx_vendor_media_usage ON vendor_media(usage_count DESC);

-- Smart Collections (auto-updating views)
CREATE OR REPLACE VIEW vendor_media_smart_collections AS
SELECT
  vendor_id,
  category,
  -- Recently Added (last 7 days)
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_count,
  -- AI Generated (file_name contains 'dalle' or 'reimagined')
  COUNT(*) FILTER (WHERE file_name ILIKE '%dalle%' OR file_name ILIKE '%reimagined%') as ai_generated_count,
  -- Needs Editing (quality_score < 70)
  COUNT(*) FILTER (WHERE quality_score < 70) as needs_editing_count,
  -- Unused (usage_count = 0 and created_at < 30 days ago)
  COUNT(*) FILTER (WHERE usage_count = 0 AND created_at < NOW() - INTERVAL '30 days') as unused_count,
  -- High Performing (usage_count > 10)
  COUNT(*) FILTER (WHERE usage_count > 10) as high_performing_count,
  -- Total
  COUNT(*) as total_count
FROM vendor_media
WHERE status = 'active'
GROUP BY vendor_id, category;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_vendor_media_updated_at
  BEFORE UPDATE ON vendor_media
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_media_updated_at();

-- Function to track media usage
CREATE OR REPLACE FUNCTION increment_media_usage(
  p_media_id UUID,
  p_component_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE vendor_media
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    used_in_components = CASE
      WHEN p_component_id IS NOT NULL AND NOT (p_component_id = ANY(used_in_components))
      THEN array_append(used_in_components, p_component_id)
      ELSE used_in_components
    END
  WHERE id = p_media_id;
END;
$$ LANGUAGE plpgsql;

-- Function to link media to product
CREATE OR REPLACE FUNCTION link_media_to_product(
  p_media_id UUID,
  p_product_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE vendor_media
  SET linked_product_ids = array_append(linked_product_ids, p_product_id)
  WHERE id = p_media_id
  AND NOT (p_product_id = ANY(linked_product_ids));
END;
$$ LANGUAGE plpgsql;

-- Function to unlink media from product
CREATE OR REPLACE FUNCTION unlink_media_from_product(
  p_media_id UUID,
  p_product_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE vendor_media
  SET linked_product_ids = array_remove(linked_product_ids, p_product_id)
  WHERE id = p_media_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get media suggestions for a product
CREATE OR REPLACE FUNCTION get_product_media_suggestions(
  p_vendor_id UUID,
  p_product_name TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  file_url TEXT,
  ai_description TEXT,
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vm.id,
    vm.file_name,
    vm.file_url,
    vm.ai_description,
    CASE
      -- Higher score if product name matches tags or description
      WHEN p_product_name IS NOT NULL AND (
        vm.ai_description ILIKE '%' || p_product_name || '%' OR
        EXISTS (SELECT 1 FROM unnest(vm.ai_tags) tag WHERE tag ILIKE '%' || p_product_name || '%')
      ) THEN 100
      -- Medium score for product photos category
      WHEN vm.category = 'product_photos' THEN 50
      ELSE 25
    END as relevance_score
  FROM vendor_media vm
  WHERE vm.vendor_id = p_vendor_id
  AND vm.status = 'active'
  AND vm.category = 'product_photos'
  ORDER BY relevance_score DESC, vm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE vendor_media ENABLE ROW LEVEL SECURITY;

-- Vendors can see their own media
CREATE POLICY vendor_media_select_own
  ON vendor_media
  FOR SELECT
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE user_id = auth.uid()
  ));

-- Vendors can insert their own media
CREATE POLICY vendor_media_insert_own
  ON vendor_media
  FOR INSERT
  WITH CHECK (vendor_id IN (
    SELECT id FROM vendors WHERE user_id = auth.uid()
  ));

-- Vendors can update their own media
CREATE POLICY vendor_media_update_own
  ON vendor_media
  FOR UPDATE
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE user_id = auth.uid()
  ));

-- Vendors can delete their own media
CREATE POLICY vendor_media_delete_own
  ON vendor_media
  FOR DELETE
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE user_id = auth.uid()
  ));

-- Grant permissions
GRANT ALL ON vendor_media TO authenticated;
GRANT SELECT ON vendor_media_smart_collections TO authenticated;

-- Comments for documentation
COMMENT ON TABLE vendor_media IS 'Comprehensive media library with AI tagging and smart organization';
COMMENT ON COLUMN vendor_media.ai_tags IS 'AI-detected tags from GPT-4 Vision analysis';
COMMENT ON COLUMN vendor_media.dominant_colors IS 'Dominant color palette extracted from image';
COMMENT ON COLUMN vendor_media.quality_score IS 'AI-assessed image quality (1-100)';
COMMENT ON COLUMN vendor_media.linked_product_ids IS 'Products using this media';
COMMENT ON COLUMN vendor_media.used_in_components IS 'Storefront components using this media';
