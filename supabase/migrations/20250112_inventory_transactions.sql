-- =====================================================
-- ATOMIC INVENTORY TRANSACTIONS SYSTEM
-- Steve Jobs would approve: Simple, powerful, traceable
-- =====================================================

-- Drop existing if rerunning
DROP TABLE IF EXISTS inventory_transactions CASCADE;

-- Create atomic transactions table
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who & Where
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,

  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'adjustment',      -- Manual add/remove
    'sale',           -- Sold to customer
    'purchase',       -- Received from supplier
    'transfer_out',   -- Sent to another location
    'transfer_in',    -- Received from another location
    'audit',          -- Inventory count correction
    'zero_out',       -- Bulk zero operation
    'damage',         -- Damaged/lost product
    'return'          -- Customer return
  )),

  -- Quantities (atomic snapshot)
  quantity_before NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity_change NUMERIC(10, 2) NOT NULL, -- Can be negative
  quantity_after NUMERIC(10, 2) NOT NULL DEFAULT 0,

  -- Audit Trail
  reason TEXT,
  reference_type TEXT, -- 'order', 'purchase_order', 'transfer', 'manual', 'bulk_operation'
  reference_id UUID,   -- ID of related order/PO/transfer

  -- User tracking
  performed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name TEXT,

  -- Rollback support
  is_reversed BOOLEAN DEFAULT FALSE,
  reversed_by_transaction_id UUID REFERENCES inventory_transactions(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_inventory_transactions_vendor ON inventory_transactions(vendor_id);
CREATE INDEX idx_inventory_transactions_location ON inventory_transactions(location_id);
CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_inventory ON inventory_transactions(inventory_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX idx_inventory_transactions_reversed ON inventory_transactions(is_reversed) WHERE is_reversed = FALSE;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_inventory_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_transactions_updated_at
  BEFORE UPDATE ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_transactions_updated_at();

-- RLS Policies
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for now - API handles auth)
CREATE POLICY "Service role full access"
  ON inventory_transactions
  FOR ALL
  USING (true);

COMMENT ON TABLE inventory_transactions IS 'Atomic inventory transaction log - every inventory change is tracked here for perfect audit trail';
COMMENT ON COLUMN inventory_transactions.quantity_change IS 'Positive for additions, negative for removals';
COMMENT ON COLUMN inventory_transactions.is_reversed IS 'TRUE if this transaction was reversed/undone';
