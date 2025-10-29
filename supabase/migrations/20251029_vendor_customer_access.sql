-- ============================================================================
-- VENDOR CUSTOMER ACCESS
-- Allow vendors to view and manage customers
-- ============================================================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Vendors can view all customers" ON public.customers;

-- Create policy for vendors to view all customers
CREATE POLICY "Vendors can view all customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

-- Allow vendors to update customer data
DROP POLICY IF EXISTS "Vendors can update customers" ON public.customers;
CREATE POLICY "Vendors can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (true);

-- Allow vendors to insert new customers (for POS, etc.)
DROP POLICY IF EXISTS "Vendors can insert customers" ON public.customers;
CREATE POLICY "Vendors can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also grant anon read access for public-facing features (like order tracking)
DROP POLICY IF EXISTS "Anon can view customers" ON public.customers;
CREATE POLICY "Anon can view customers"
  ON public.customers FOR SELECT
  TO anon
  USING (true);
