-- Migration: Create function to set vendor context for RLS
-- Purpose: Allow setting app.current_vendor_id session variable for RLS policies
-- Date: 2025-11-17

-- Create function to set vendor context
CREATE OR REPLACE FUNCTION set_vendor_context(vendor_id_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the current vendor ID in the session
  -- This is used by RLS policies that check current_setting('app.current_vendor_id')
  PERFORM set_config('app.current_vendor_id', vendor_id_param, false);
END;
$$;

-- Allow anon and authenticated users to call this function
GRANT EXECUTE ON FUNCTION set_vendor_context TO anon, authenticated;

COMMENT ON FUNCTION set_vendor_context IS 'Sets the vendor context (app.current_vendor_id) for the current session. Used by RLS policies to scope queries to a specific vendor.';
