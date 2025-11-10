-- =====================================================
-- FIX ANALYTICS RLS POLICIES
-- Update to use correct vendor-user relationship
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Vendors can view their own analytics cache" ON analytics_daily_cache;
DROP POLICY IF EXISTS "Vendors can view their own product analytics" ON analytics_product_cache;
DROP POLICY IF EXISTS "Vendors can view their employee analytics" ON analytics_employee_cache;
DROP POLICY IF EXISTS "Vendors can view their own exports" ON report_exports;
DROP POLICY IF EXISTS "Vendors can create exports" ON report_exports;
DROP POLICY IF EXISTS "Vendors can manage their schedules" ON report_schedules;

-- =====================================================
-- ANALYTICS DAILY CACHE
-- =====================================================

CREATE POLICY "Vendors can view their own analytics cache"
ON analytics_daily_cache FOR SELECT
USING (
  vendor_id = auth.uid()
  OR vendor_id IN (
    SELECT vendor_id FROM users WHERE id = auth.uid() AND vendor_id IS NOT NULL
  )
);

-- =====================================================
-- ANALYTICS PRODUCT CACHE
-- =====================================================

CREATE POLICY "Vendors can view their own product analytics"
ON analytics_product_cache FOR SELECT
USING (
  vendor_id = auth.uid()
  OR vendor_id IN (
    SELECT vendor_id FROM users WHERE id = auth.uid() AND vendor_id IS NOT NULL
  )
);

-- =====================================================
-- ANALYTICS EMPLOYEE CACHE
-- =====================================================

CREATE POLICY "Vendors can view their employee analytics"
ON analytics_employee_cache FOR SELECT
USING (
  vendor_id = auth.uid()
  OR vendor_id IN (
    SELECT vendor_id FROM users WHERE id = auth.uid() AND vendor_id IS NOT NULL
  )
);

-- =====================================================
-- REPORT EXPORTS
-- =====================================================

CREATE POLICY "Vendors can view their own exports"
ON report_exports FOR SELECT
USING (
  vendor_id = auth.uid()
  OR vendor_id IN (
    SELECT vendor_id FROM users WHERE id = auth.uid() AND vendor_id IS NOT NULL
  )
);

CREATE POLICY "Vendors can create exports"
ON report_exports FOR INSERT
WITH CHECK (
  vendor_id = auth.uid()
  OR vendor_id IN (
    SELECT vendor_id FROM users WHERE id = auth.uid() AND vendor_id IS NOT NULL
  )
);

-- =====================================================
-- REPORT SCHEDULES
-- =====================================================

CREATE POLICY "Vendors can manage their schedules"
ON report_schedules FOR ALL
USING (
  vendor_id = auth.uid()
  OR vendor_id IN (
    SELECT vendor_id FROM users WHERE id = auth.uid() AND vendor_id IS NOT NULL
  )
);

-- Done
COMMENT ON POLICY "Vendors can view their own analytics cache" ON analytics_daily_cache IS 'Allow vendors and their staff to view analytics cache';
