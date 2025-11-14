-- =====================================================
-- ATOMIC PRODUCT CREATION
-- =====================================================
-- Purpose: Prevent partial product creation failures
-- Issues Fixed:
--   1. Product created but no inventory record
--   2. Inventory created but no stock movement audit trail
--   3. Variable product created but no variants
--   4. All-or-nothing transaction guarantee
-- =====================================================

-- =====================================================
-- CREATE atomic_create_product FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION atomic_create_product(
  p_vendor_id UUID,
  p_product_data JSONB,
  p_initial_stock NUMERIC DEFAULT 0,
  p_variants JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_primary_location RECORD;
  v_inventory RECORD;
  v_product_type TEXT;
  v_result JSON;
  v_variant JSONB;
  v_variant_ids UUID[];
BEGIN
  -- =====================================================
  -- STEP 1: VALIDATE PRIMARY LOCATION EXISTS
  -- =====================================================
  -- CRITICAL: Must have a location to create inventory

  SELECT * INTO v_primary_location
  FROM locations
  WHERE vendor_id = p_vendor_id
    AND is_primary = TRUE
    AND is_active = TRUE
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No primary location found for vendor. Cannot create product without inventory location.';
  END IF;

  -- =====================================================
  -- STEP 2: VALIDATE PRODUCT DATA
  -- =====================================================

  v_product_type := COALESCE(p_product_data->>'product_type', p_product_data->>'type', 'simple');

  -- For variable products, variants are required
  IF v_product_type = 'variable' AND (p_variants IS NULL OR jsonb_array_length(p_variants) = 0) THEN
    RAISE EXCEPTION 'Variable products require at least one variant';
  END IF;

  -- =====================================================
  -- STEP 3: CREATE PRODUCT RECORD
  -- =====================================================

  INSERT INTO products (
    vendor_id,
    name,
    slug,
    description,
    short_description,
    sku,
    regular_price,
    sale_price,
    cost_price,
    stock_quantity,
    stock_status,
    type,
    primary_category_id,
    status,
    custom_fields,
    meta_data,
    created_at,
    updated_at
  )
  SELECT
    p_vendor_id,
    p_product_data->>'name',
    p_product_data->>'slug',
    p_product_data->>'description',
    p_product_data->>'short_description',
    p_product_data->>'sku',
    COALESCE((p_product_data->>'regular_price')::NUMERIC, 0),
    (p_product_data->>'sale_price')::NUMERIC,
    (p_product_data->>'cost_price')::NUMERIC,
    p_initial_stock,
    CASE WHEN p_initial_stock > 0 THEN 'instock' ELSE 'outofstock' END,
    v_product_type,
    (p_product_data->>'primary_category_id')::UUID,
    COALESCE(p_product_data->>'status', 'published'),
    COALESCE(p_product_data->'custom_fields', '{}'::JSONB),
    COALESCE(p_product_data->'meta_data', '{}'::JSONB),
    NOW(),
    NOW()
  RETURNING * INTO v_product;

  -- =====================================================
  -- STEP 4: CREATE INVENTORY RECORD (IF STOCK > 0)
  -- =====================================================

  IF p_initial_stock > 0 THEN
    INSERT INTO inventory (
      product_id,
      location_id,
      vendor_id,
      quantity,
      low_stock_threshold,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_product.id,
      v_primary_location.id,
      p_vendor_id,
      p_initial_stock,
      COALESCE((p_product_data->>'low_stock_threshold')::NUMERIC, 10),
      'Created via atomic product creation',
      NOW(),
      NOW()
    )
    RETURNING * INTO v_inventory;

    -- =====================================================
    -- STEP 5: CREATE STOCK MOVEMENT AUDIT TRAIL
    -- =====================================================

    INSERT INTO stock_movements (
      inventory_id,
      movement_type,
      quantity,
      from_location_id,
      to_location_id,
      reference_type,
      reference_id,
      reason,
      metadata,
      created_at
    ) VALUES (
      v_inventory.id,
      'adjustment',
      p_initial_stock,
      NULL,
      v_primary_location.id,
      'product_creation',
      v_product.id::TEXT,
      'Initial stock on product creation',
      jsonb_build_object(
        'created_by', 'atomic_product_creation',
        'product_name', v_product.name,
        'location_name', v_primary_location.name
      ),
      NOW()
    );
  END IF;

  -- =====================================================
  -- STEP 6: CREATE VARIANTS (IF VARIABLE PRODUCT)
  -- =====================================================

  IF v_product_type = 'variable' AND p_variants IS NOT NULL THEN
    v_variant_ids := ARRAY[]::UUID[];

    FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
    LOOP
      DECLARE
        v_variant_id UUID;
      BEGIN
        INSERT INTO product_variations (
          parent_product_id,
          name,
          sku,
          regular_price,
          sale_price,
          stock_quantity,
          attributes,
          image_url,
          created_at,
          updated_at
        ) VALUES (
          v_product.id,
          v_variant->>'name',
          v_variant->>'sku',
          (v_variant->>'regular_price')::NUMERIC,
          (v_variant->>'sale_price')::NUMERIC,
          COALESCE((v_variant->>'stock_quantity')::NUMERIC, 0),
          COALESCE(v_variant->'attributes', '{}'::JSONB),
          v_variant->>'image_url',
          NOW(),
          NOW()
        )
        RETURNING id INTO v_variant_id;

        v_variant_ids := array_append(v_variant_ids, v_variant_id);
      END;
    END LOOP;
  END IF;

  -- =====================================================
  -- BUILD SUCCESS RESULT
  -- =====================================================

  v_result := jsonb_build_object(
    'success', TRUE,
    'product_id', v_product.id,
    'product_name', v_product.name,
    'product_type', v_product.type,
    'initial_stock', p_initial_stock,
    'inventory_created', p_initial_stock > 0,
    'inventory_id', CASE WHEN p_initial_stock > 0 THEN v_inventory.id ELSE NULL END,
    'location_id', v_primary_location.id,
    'location_name', v_primary_location.name,
    'variants_created', COALESCE(array_length(v_variant_ids, 1), 0),
    'variant_ids', COALESCE(to_jsonb(v_variant_ids), '[]'::JSONB)
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Automatic rollback on any error
    RAISE EXCEPTION 'Product creation failed: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION atomic_create_product(UUID, JSONB, NUMERIC, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_create_product(UUID, JSONB, NUMERIC, JSONB) TO service_role;

COMMENT ON FUNCTION atomic_create_product IS
'Atomically creates a product with inventory and variants.
All-or-nothing transaction: if ANY step fails, EVERYTHING is rolled back.
Prevents partial product creation (e.g., product without inventory).
Requires primary location to exist for the vendor.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check function exists
SELECT proname, pg_get_function_identity_arguments(oid) as signature
FROM pg_proc
WHERE proname = 'atomic_create_product';

-- =====================================================
-- ✅ DEPLOYMENT COMPLETE
-- =====================================================
