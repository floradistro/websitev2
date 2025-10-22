-- ============================================================================
-- VERIFY ALL CRITICAL TABLES EXIST IN SUPABASE
-- Run this in Supabase SQL Editor to check your database setup
-- ============================================================================

-- Check all critical tables
SELECT 
  'vendors' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendors') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'products', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'inventory', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'locations', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'categories', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'stock_movements', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'purchase_orders', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'purchase_order_items', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_items') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'purchase_order_receives', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_receives') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'vendor_coas', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_coas') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'vendor_settings', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_settings') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'field_groups', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'field_groups') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'orders', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'order_items', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'users', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'pos_transactions', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pos_transactions') THEN '✅ EXISTS' ELSE '❌ MISSING' END
ORDER BY table_name;

-- ============================================================================
-- Check storage buckets
-- ============================================================================

SELECT 
  id as bucket_name,
  CASE 
    WHEN public THEN '✅ Public'
    ELSE '🔒 Private'
  END as access,
  (file_size_limit / 1048576)::text || ' MB' as max_size,
  array_to_string(allowed_mime_types, ', ') as allowed_types
FROM storage.buckets
WHERE id IN ('vendor-coas', 'product-images', 'vendor-logos', 'category-images')
ORDER BY id;

-- ============================================================================
-- Check critical columns exist
-- ============================================================================

-- Check if locations has vendor_id and multi-location columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'locations'
AND column_name IN ('vendor_id', 'is_primary', 'pos_enabled', 'billing_status', 'monthly_fee')
ORDER BY column_name;

-- Check if inventory has cost tracking columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory'
AND column_name IN ('unit_cost', 'average_cost', 'vendor_id', 'reserved_quantity')
ORDER BY column_name;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 
  'Total Tables' as metric,
  COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
  'Total Storage Buckets',
  COUNT(*)::text
FROM storage.buckets
UNION ALL
SELECT 
  'Total Vendors',
  COUNT(*)::text
FROM public.vendors
UNION ALL
SELECT 
  'Total Products',
  COUNT(*)::text
FROM public.products
UNION ALL
SELECT 
  'Total Inventory Records',
  COUNT(*)::text
FROM public.inventory
UNION ALL
SELECT 
  'Total Locations',
  COUNT(*)::text
FROM public.locations;

-- ============================================================================
-- If ANY tables are missing, you need to run the migrations!
-- See: APPLY_MIGRATIONS_GUIDE.md
-- ============================================================================

