-- Create product cost history table for audit trail
CREATE TABLE IF NOT EXISTS public.product_cost_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  old_cost_price NUMERIC(10, 2),
  new_cost_price NUMERIC(10, 2) NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_cost_history_product ON product_cost_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_cost_history_vendor ON product_cost_history(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_cost_history_created ON product_cost_history(created_at DESC);

-- Add RLS policies
ALTER TABLE product_cost_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own cost history"
  ON product_cost_history
  FOR SELECT
  USING (vendor_id = (SELECT vendor_id FROM current_user_session()));

CREATE POLICY "Vendors can insert cost history"
  ON product_cost_history
  FOR INSERT
  WITH CHECK (vendor_id = (SELECT vendor_id FROM current_user_session()));

-- Grant permissions
GRANT SELECT, INSERT ON product_cost_history TO authenticated;
GRANT SELECT, INSERT ON product_cost_history TO service_role;

COMMENT ON TABLE product_cost_history IS 'Audit trail for product cost changes to track margin history';
