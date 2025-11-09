-- Update Media Categories for Marketing Hub
-- Expand media categories to support social media, print marketing, and promotional content

-- First, add the new category values to the enum
ALTER TYPE media_category ADD VALUE IF NOT EXISTS 'social_media';
ALTER TYPE media_category ADD VALUE IF NOT EXISTS 'print_marketing';
ALTER TYPE media_category ADD VALUE IF NOT EXISTS 'promotional';
ALTER TYPE media_category ADD VALUE IF NOT EXISTS 'brand_assets';

-- Update existing records to use new categories
-- Map 'marketing' to appropriate new categories based on AI tags/description
UPDATE vendor_media
SET category = 'social_media'
WHERE category = 'marketing'
AND (
  ai_description ILIKE '%instagram%' OR
  ai_description ILIKE '%facebook%' OR
  ai_description ILIKE '%social%' OR
  ai_description ILIKE '%post%' OR
  'social' = ANY(ai_tags) OR
  'instagram' = ANY(ai_tags)
);

UPDATE vendor_media
SET category = 'print_marketing'
WHERE category = 'marketing'
AND (
  ai_description ILIKE '%flyer%' OR
  ai_description ILIKE '%poster%' OR
  ai_description ILIKE '%print%' OR
  'flyer' = ANY(ai_tags) OR
  'poster' = ANY(ai_tags)
);

UPDATE vendor_media
SET category = 'promotional'
WHERE category = 'marketing'
AND (
  ai_description ILIKE '%promo%' OR
  ai_description ILIKE '%deal%' OR
  ai_description ILIKE '%sale%' OR
  ai_description ILIKE '%event%' OR
  'promotional' = ANY(ai_tags)
);

-- Map 'brand' to 'brand_assets'
UPDATE vendor_media
SET category = 'brand_assets'
WHERE category = 'brand';

-- Update the get_product_media_suggestions function to handle new categories
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
      -- Lower score for other categories but still show them
      WHEN vm.category IN ('social_media', 'promotional') THEN 30
      ELSE 25
    END as relevance_score
  FROM vendor_media vm
  WHERE vm.vendor_id = p_vendor_id
  AND vm.status = 'active'
  ORDER BY relevance_score DESC, vm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Update comments
COMMENT ON TYPE media_category IS 'Media file categories: product_photos, social_media, print_marketing, promotional, brand_assets, menus';
COMMENT ON TABLE vendor_media IS 'Comprehensive media library with AI tagging, smart organization, and marketing hub features';
