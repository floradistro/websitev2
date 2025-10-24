-- Add UPDATE policy for vendors to update their own records
-- This allows vendors to update their settings including site_hidden toggle

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vendors can update own data" ON public.vendors;

-- Create UPDATE policy for vendors
CREATE POLICY "Vendors can update own data"
  ON public.vendors
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

COMMENT ON POLICY "Vendors can update own data" ON public.vendors IS 
  'Allows vendors to update their own vendor record including settings like site_hidden toggle';

