/**
 * Clean Up Categories - Remove Global Concept
 *
 * This migration:
 * 1. Deletes all global categories (vendor_id IS NULL)
 * 2. Creates Flora Distro specific categories
 * 3. Removes the global category concept entirely
 */

-- Flora Distro vendor ID
DO $$
DECLARE
  flora_vendor_id UUID := 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
BEGIN

  -- Delete any vendor_product_fields that reference global categories
  DELETE FROM vendor_product_fields
  WHERE category_id IN (SELECT id FROM categories WHERE vendor_id IS NULL);

  -- Now delete all global categories
  DELETE FROM categories WHERE vendor_id IS NULL;

  -- Create Flora Distro's specific categories (only if they don't exist)
  IF NOT EXISTS (SELECT 1 FROM categories WHERE vendor_id = flora_vendor_id AND slug = 'flower') THEN
    INSERT INTO categories (id, name, slug, vendor_id, icon, description, is_active, display_order)
    VALUES
      (gen_random_uuid(), 'Flower', 'flower', flora_vendor_id, '🌸', 'Premium cannabis flower', true, 1),
      (gen_random_uuid(), 'Vape', 'vape', flora_vendor_id, '💨', 'Vape cartridges and pens', true, 2),
      (gen_random_uuid(), 'Edibles', 'edibles', flora_vendor_id, '🍫', 'Cannabis-infused edibles', true, 3),
      (gen_random_uuid(), 'Concentrates', 'concentrates', flora_vendor_id, '💎', 'Cannabis concentrates and extracts', true, 4),
      (gen_random_uuid(), 'Beverages', 'beverages', flora_vendor_id, '🥤', 'Cannabis-infused beverages', true, 5),
      (gen_random_uuid(), 'Hash Holes', 'hash-holes', flora_vendor_id, '🔥', 'Premium hash holes', true, 6),
      (gen_random_uuid(), 'Pre-Rolls', 'pre-rolls', flora_vendor_id, '🚬', 'Pre-rolled joints', true, 7);
  END IF;

  RAISE NOTICE 'Categories cleaned up successfully. All global categories deleted and Flora Distro categories created.';

END $$;
