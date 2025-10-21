-- ============================================================================
-- SUPABASE STORAGE - RLS POLICIES
-- Secure file storage for images and COAs
-- ============================================================================

-- ============================================================================
-- PRODUCT IMAGES (House Products) - Public bucket, admin upload only
-- ============================================================================

-- Public can view
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Service role can upload product images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Service role can update product images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'product-images');

CREATE POLICY "Service role can delete product images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'product-images');


-- ============================================================================
-- VENDOR PRODUCT IMAGES - Public bucket, vendors can upload their own
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-product-images',
  'vendor-product-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Public can view
CREATE POLICY "Public can view vendor product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-product-images');

-- Vendors can upload to their own folder only
CREATE POLICY "Vendors can upload own product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-product-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE auth.uid()::text = id::text
  )
);

-- Vendors can delete their own images
CREATE POLICY "Vendors can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-product-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE auth.uid()::text = id::text
  )
);

-- Service role can do anything
CREATE POLICY "Service role full access to vendor product images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'vendor-product-images');


-- ============================================================================
-- VENDOR LOGOS - Public bucket, vendors can upload their own
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-logos',
  'vendor-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Public can view
CREATE POLICY "Public can view vendor logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-logos');

-- Vendors can upload their own logo/banner
CREATE POLICY "Vendors can upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE auth.uid()::text = id::text
  )
);

-- Vendors can update their own logo
CREATE POLICY "Vendors can update own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE auth.uid()::text = id::text
  )
);

-- Service role full access
CREATE POLICY "Service role full access to vendor logos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'vendor-logos');


-- ============================================================================
-- VENDOR COAs - PRIVATE bucket (compliance requirement!)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-coas',
  'vendor-coas',
  false, -- PRIVATE!
  26214400, -- 25MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Vendors can view their own COAs
CREATE POLICY "Vendors can view own COAs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-coas'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE auth.uid()::text = id::text
  )
);

-- Vendors can upload their own COAs
CREATE POLICY "Vendors can upload own COAs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-coas'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE auth.uid()::text = id::text
  )
);

-- Vendors can delete their own COAs
CREATE POLICY "Vendors can delete own COAs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-coas'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE auth.uid()::text = id::text
  )
);

-- Service role (admin) can view all COAs
CREATE POLICY "Service role can view all COAs"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'vendor-coas');

-- Service role full access
CREATE POLICY "Service role full access to COAs"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'vendor-coas');


-- ============================================================================
-- CATEGORY IMAGES - Public bucket, admin only
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Public can view
CREATE POLICY "Public can view category images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-images');

-- Service role full access
CREATE POLICY "Service role full access to category images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'category-images');


-- ============================================================================
-- UPDATE PRODUCTS TABLE FOR STORAGE URLS
-- ============================================================================

-- Add storage URL columns (keep WordPress URLs as backup)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured_image_storage TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_gallery_storage TEXT[] DEFAULT '{}';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS products_featured_image_storage_idx 
  ON public.products(featured_image_storage) 
  WHERE featured_image_storage IS NOT NULL;

