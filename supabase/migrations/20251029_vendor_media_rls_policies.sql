-- RLS Policies for vendor_media
-- Fix: vendors don't have user_id, use service role or session for vendor access

-- Drop any existing policies
DROP POLICY IF EXISTS vendor_media_select_own ON vendor_media;
DROP POLICY IF EXISTS vendor_media_insert_own ON vendor_media;
DROP POLICY IF EXISTS vendor_media_update_own ON vendor_media;
DROP POLICY IF EXISTS vendor_media_delete_own ON vendor_media;

-- Service role has full access
CREATE POLICY vendor_media_service_role
  ON vendor_media
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can see their own media (assumes vendor_id session is set)
CREATE POLICY vendor_media_select_own
  ON vendor_media
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id::text = current_setting('request.headers.x-vendor-id', true)
  );

-- Vendors can insert their own media
CREATE POLICY vendor_media_insert_own
  ON vendor_media
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id::text = current_setting('request.headers.x-vendor-id', true)
  );

-- Vendors can update their own media
CREATE POLICY vendor_media_update_own
  ON vendor_media
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id::text = current_setting('request.headers.x-vendor-id', true)
  );

-- Vendors can delete their own media
CREATE POLICY vendor_media_delete_own
  ON vendor_media
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    vendor_id::text = current_setting('request.headers.x-vendor-id', true)
  );
