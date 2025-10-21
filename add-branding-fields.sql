-- ============================================================================
-- Add Branding Fields to Vendors Table
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql
-- ============================================================================

-- Add custom_font field for vendor branding
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS custom_font TEXT;

-- Add contact fields for vendor settings
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name IN ('custom_font', 'contact_name', 'tax_id')
ORDER BY column_name;

