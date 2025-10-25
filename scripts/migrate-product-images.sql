-- ============================================================================
-- Migrate Legacy Product Images to Flora Distro Vendor Bucket
-- ============================================================================
-- Migrates images from product-images to vendor-product-images/flora-distro/
-- ============================================================================

BEGIN;

-- Create a temporary function to copy storage objects
CREATE OR REPLACE FUNCTION copy_storage_object(
  source_bucket TEXT,
  source_path TEXT,
  dest_bucket TEXT,
  dest_path TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  obj_metadata JSONB;
  obj_owner UUID;
BEGIN
  -- Get source object metadata
  SELECT metadata, owner INTO obj_metadata, obj_owner
  FROM storage.objects
  WHERE bucket_id = source_bucket
    AND name = source_path;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Insert into destination (will be handled by Supabase storage)
  -- Note: Actual file copy happens at application level via Supabase client
  RAISE NOTICE 'Would copy: % -> %', source_path, dest_path;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- List all legacy product images that need migration
SELECT 
  'Legacy images to migrate:' as status,
  COUNT(*) as image_count,
  SUM((metadata->>'size')::bigint)/1024/1024 as total_mb
FROM storage.objects
WHERE bucket_id = 'product-images';

-- List current Flora Distro images
SELECT 
  'Current Flora Distro images:' as status,
  COUNT(*) as image_count,
  SUM((metadata->>'size')::bigint)/1024/1024 as total_mb
FROM storage.objects
WHERE bucket_id = 'vendor-product-images'
  AND name LIKE 'cd2e1122-d511-4edb-be5d-98ef274b4baf/%';

COMMIT;

-- Note: Actual file migration needs to happen via Supabase Storage API
-- SQL can only manipulate metadata, not move actual blobs

