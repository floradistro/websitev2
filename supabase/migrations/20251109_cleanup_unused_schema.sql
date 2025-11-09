-- ============================================================================
-- CLEANUP UNUSED SCHEMA TABLES AND VIEWS
-- Date: 2025-11-09
-- 
-- This migration removes all identified unused tables, views, and policies
-- from the database schema audit.
-- 
-- SAFETY: Review DATABASE_AUDIT_REPORT.md before running
-- ============================================================================

-- ============================================================================
-- PHASE 1: DROP UNUSED VIEWS (SAFE - NO CODE DEPENDENCIES)
-- ============================================================================

-- Billing & Summary Views
DROP VIEW IF EXISTS public.billable_locations CASCADE;
DROP VIEW IF EXISTS public.vendor_billing_summary CASCADE;

-- Employee & RBAC Views
DROP VIEW IF EXISTS public.active_employees CASCADE;

-- Pricing Views
DROP VIEW IF EXISTS public.vendor_pricing_comparison CASCADE;
DROP VIEW IF EXISTS public.product_pricing_overview CASCADE;
DROP VIEW IF EXISTS public.vendor_profit_margins CASCADE;
DROP VIEW IF EXISTS public.vendor_tier_summary CASCADE;

-- Purchase Order Views
DROP VIEW IF EXISTS public.purchase_order_summary CASCADE;

-- Product Views
DROP VIEW IF EXISTS public.pending_products CASCADE;

-- POS Views
DROP VIEW IF EXISTS public.pos_session_cash_summary CASCADE;
DROP VIEW IF EXISTS public.active_pos_registers CASCADE;
DROP VIEW IF EXISTS public.active_pos_sessions CASCADE;
DROP VIEW IF EXISTS public.pos_session_summary CASCADE;

-- Media Views
DROP VIEW IF EXISTS public.vendor_media_smart_collections CASCADE;

-- Template & Payment Views
DROP VIEW IF EXISTS public.pricing_template_hierarchy CASCADE;
DROP VIEW IF EXISTS public.terminal_overview CASCADE;
DROP VIEW IF EXISTS public.payment_transactions_detail CASCADE;

-- Performance View
DROP VIEW IF EXISTS public.products_display_view CASCADE;

-- ============================================================================
-- PHASE 2: DROP UNUSED TABLES (REQUIRES CAREFUL REVIEW)
-- ============================================================================
-- NOTE: Uncomment section below only after stakeholder review

/*
-- TV Menu System (Unused)
DROP TABLE IF EXISTS public.tv_content CASCADE;
DROP TABLE IF EXISTS public.tv_playlists CASCADE;
DROP TABLE IF EXISTS public.tv_playlist_items CASCADE;

-- Session & Audit (Unused)
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- AI & Storefront (Unused)
DROP TABLE IF EXISTS public.storefront_files CASCADE;

-- Templates (Unused)
DROP TABLE IF EXISTS public.vendor_templates CASCADE;

-- Pricing (Unused)
DROP TABLE IF EXISTS public.vendor_cost_plus_configs CASCADE;
DROP TABLE IF EXISTS public.product_cost_history CASCADE;

-- Distribution (Unused)
DROP TABLE IF EXISTS public.distributor_access_requests CASCADE;

-- RBAC (Unused)
DROP TABLE IF EXISTS public.role_permissions CASCADE;
*/

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ CLEANUP MIGRATION COMPLETED';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Phase 1 (Views): COMPLETED';
  RAISE NOTICE 'Phase 2 (Tables): COMMENTED OUT - requires manual review';
  RAISE NOTICE '';
  RAISE NOTICE 'Review DATABASE_AUDIT_REPORT.md for details';
  RAISE NOTICE '============================================================';
END $$;

