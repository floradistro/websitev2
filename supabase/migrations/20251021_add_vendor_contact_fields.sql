-- Add contact_name and tax_id fields to vendors table for the settings page
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS tax_id TEXT;

