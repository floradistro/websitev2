-- Create function to update product image (bypasses RLS for service role)
CREATE OR REPLACE FUNCTION update_product_image(
  p_product_id UUID,
  p_vendor_id UUID,
  p_image_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the permissions of the function owner
AS $$
BEGIN
  UPDATE products
  SET
    featured_image_storage = p_image_url,
    updated_at = NOW()
  WHERE
    id = p_product_id
    AND vendor_id = p_vendor_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_product_image(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_image(UUID, UUID, TEXT) TO service_role;
