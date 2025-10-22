-- Add product_name_on_coa field to store the product name written on the COA document
-- This is separate from the product_id relationship
ALTER TABLE public.vendor_coas 
ADD COLUMN IF NOT EXISTS product_name_on_coa TEXT;

COMMENT ON COLUMN public.vendor_coas.product_name_on_coa IS 'Product name as written on the COA document by the lab';
