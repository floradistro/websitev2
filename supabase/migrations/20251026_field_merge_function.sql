-- ============================================================================
-- FIELD MERGE HELPERS - Functions to merge admin + vendor product fields
-- ============================================================================

-- Function to get all applicable fields for a product
-- Merges: admin required fields + vendor custom fields
CREATE OR REPLACE FUNCTION public.get_product_fields(
  p_vendor_id UUID,
  p_category_id UUID
) RETURNS JSONB AS $$
DECLARE
  admin_fields JSONB := '[]'::jsonb;
  vendor_fields JSONB := '[]'::jsonb;
  merged_fields JSONB := '[]'::jsonb;
BEGIN
  -- Get admin-defined fields assigned to this category
  SELECT COALESCE(jsonb_agg(fg.fields), '[]'::jsonb)
  INTO admin_fields
  FROM public.field_groups fg
  JOIN public.category_field_groups cfg ON fg.id = cfg.field_group_id
  WHERE cfg.category_id = p_category_id
    AND fg.is_active = true;
  
  -- Get vendor's custom product fields for this category
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', vpf.field_id,
      'definition', vpf.field_definition,
      'source', 'vendor'
    )
  ), '[]'::jsonb)
  INTO vendor_fields
  FROM public.vendor_product_fields vpf
  WHERE vpf.vendor_id = p_vendor_id
    AND (vpf.category_id = p_category_id OR vpf.category_id IS NULL)
    AND vpf.is_active = true;
  
  -- Merge both (admin fields first, then vendor fields)
  merged_fields := admin_fields || vendor_fields;
  
  RETURN merged_fields;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to validate product blueprint_fields against required fields
CREATE OR REPLACE FUNCTION public.validate_product_fields(
  p_vendor_id UUID,
  p_category_id UUID,
  p_blueprint_fields JSONB
) RETURNS JSONB AS $$
DECLARE
  required_fields TEXT[];
  missing_fields TEXT[] := ARRAY[]::TEXT[];
  field_slugs TEXT[];
  field_def JSONB;
  validation_result JSONB;
BEGIN
  -- Get all required field slugs from category assignments
  SELECT array_agg(DISTINCT field_obj->>'slug')
  INTO required_fields
  FROM public.field_groups fg
  JOIN public.category_field_groups cfg ON fg.id = cfg.field_group_id
  CROSS JOIN jsonb_array_elements(fg.fields) AS field_obj
  WHERE cfg.category_id = p_category_id
    AND cfg.is_required = true
    AND fg.is_active = true
    AND (field_obj->>'required')::boolean = true;
  
  -- Get field slugs that exist in blueprint_fields
  IF jsonb_typeof(p_blueprint_fields) = 'array' THEN
    -- Old array format
    SELECT array_agg(field_obj->>'field_name')
    INTO field_slugs
    FROM jsonb_array_elements(p_blueprint_fields) AS field_obj;
  ELSE
    -- New object format
    SELECT array_agg(key)
    INTO field_slugs
    FROM jsonb_object_keys(p_blueprint_fields) AS key;
  END IF;
  
  -- Find missing required fields
  IF required_fields IS NOT NULL THEN
    SELECT array_agg(rf)
    INTO missing_fields
    FROM unnest(required_fields) rf
    WHERE NOT (rf = ANY(COALESCE(field_slugs, ARRAY[]::TEXT[])));
  END IF;
  
  -- Build validation result
  validation_result := jsonb_build_object(
    'valid', COALESCE(array_length(missing_fields, 1), 0) = 0,
    'missing_fields', COALESCE(missing_fields, ARRAY[]::TEXT[]),
    'required_count', COALESCE(array_length(required_fields, 1), 0),
    'provided_count', COALESCE(array_length(field_slugs, 1), 0)
  );
  
  RETURN validation_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comments
COMMENT ON FUNCTION public.get_product_fields IS 'Returns merged admin + vendor product fields for a given vendor and category';
COMMENT ON FUNCTION public.validate_product_fields IS 'Validates that a product has all required fields filled';

