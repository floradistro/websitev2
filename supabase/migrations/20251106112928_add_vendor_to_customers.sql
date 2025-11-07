-- Add vendor_id to customers table for proper vendor isolation
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customers_vendor_id ON customers(vendor_id);

-- Update existing customers to assign them to Flora Distro
-- (based on the fact that they were imported for Flora)
UPDATE customers 
SET vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
WHERE vendor_id IS NULL;

-- Add RLS policies for vendor isolation
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Vendors can only see their own customers
CREATE POLICY "Vendors can view their own customers"
ON customers
FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM vendors WHERE id = current_setting('app.current_vendor_id', true)::uuid
  )
);

-- Policy: Vendors can only insert customers for themselves
CREATE POLICY "Vendors can create their own customers"
ON customers
FOR INSERT
WITH CHECK (
  vendor_id IN (
    SELECT id FROM vendors WHERE id = current_setting('app.current_vendor_id', true)::uuid
  )
);

-- Policy: Vendors can only update their own customers
CREATE POLICY "Vendors can update their own customers"
ON customers
FOR UPDATE
USING (
  vendor_id IN (
    SELECT id FROM vendors WHERE id = current_setting('app.current_vendor_id', true)::uuid
  )
);

-- Policy: Service role can see all customers
CREATE POLICY "Service role has full access"
ON customers
FOR ALL
USING (current_setting('role') = 'service_role');

COMMENT ON COLUMN customers.vendor_id IS 'Links customer to their primary vendor. Customers are vendor-specific.';
