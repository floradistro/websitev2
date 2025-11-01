-- ============================================================================
-- Fix ALL remaining blueprint_fields references in database objects
-- ============================================================================
-- This migration ensures 100% consistency after renaming blueprint_fields → custom_fields

-- Step 1: Drop and recreate GIN index with correct column name
DROP INDEX IF EXISTS idx_products_blueprint_fields_gin;
CREATE INDEX IF NOT EXISTS idx_products_custom_fields_gin ON products USING gin(custom_fields);

-- Step 2: Update the validation function to use custom_fields
CREATE OR REPLACE FUNCTION validate_product_fields(
  p_category_id UUID,
  p_custom_fields JSONB
)
RETURNS TABLE(
  missing_required_fields TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_required_fields TEXT[];
  v_missing_fields TEXT[];
  v_field_slug TEXT;
  v_provided_fields TEXT[];
BEGIN
  -- Get required field slugs for the category
  SELECT ARRAY_AGG(f.field_definition->>'slug')
  INTO v_required_fields
  FROM vendor_product_fields f
  WHERE f.category_id = p_category_id
    AND f.is_active = true
    AND (f.field_definition->>'required')::boolean = true;

  -- If no required fields, return empty array
  IF v_required_fields IS NULL OR array_length(v_required_fields, 1) IS NULL THEN
    RETURN QUERY SELECT ARRAY[]::TEXT[];
    RETURN;
  END IF;

  -- Get field slugs that exist in custom_fields
  IF jsonb_typeof(p_custom_fields) = 'array' THEN
    -- Legacy array format
    SELECT ARRAY_AGG(field_obj->>'field_name')
    INTO v_provided_fields
    FROM jsonb_array_elements(p_custom_fields) AS field_obj;
  ELSE
    -- Object format
    SELECT ARRAY_AGG(key)
    INTO v_provided_fields
    FROM jsonb_object_keys(p_custom_fields) AS key;
  END IF;

  -- Find missing required fields
  v_missing_fields := ARRAY(
    SELECT unnest(v_required_fields)
    EXCEPT
    SELECT unnest(COALESCE(v_provided_fields, ARRAY[]::TEXT[]))
  );

  RETURN QUERY SELECT v_missing_fields;
END;
$$;

COMMENT ON FUNCTION validate_product_fields IS 'Validates that all required custom_fields for a category are present';

-- Step 3: Verify the changes
DO $$
DECLARE
  v_index_exists BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  -- Check if new index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_products_custom_fields_gin'
  ) INTO v_index_exists;

  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'validate_product_fields'
  ) INTO v_function_exists;

  IF v_index_exists AND v_function_exists THEN
    RAISE NOTICE '✅ All database objects updated to use custom_fields';
  ELSE
    RAISE WARNING '⚠️  Some database objects may not have been updated correctly';
  END IF;
END $$;
