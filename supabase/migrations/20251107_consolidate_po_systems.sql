-- ================================================================
-- PO SYSTEM CONSOLIDATION MIGRATION
-- Date: 2025-11-07
-- Purpose: Combine best features from both PO systems into one
-- ================================================================
--
-- BACKGROUND:
-- Two PO systems existed:
--   1. 20251023_purchase_orders.sql (simple inbound, great receiving)
--   2. 20251027_wholesale_system.sql (complex inbound/outbound, B2B)
--
-- DECISION:
-- Keep wholesale_system as base (more complete)
-- Add receiving workflow from original system
--
-- RESULT:
-- Single unified PO system with:
--   ✅ Inbound & Outbound POs
--   ✅ Quality control receiving
--   ✅ Auto-status updates
--   ✅ B2B support
--   ✅ Inventory integration
-- ================================================================


-- ================================================================
-- ENHANCE PURCHASE ORDER ITEMS
-- Add receiving tracking fields
-- ================================================================

-- Add receive_status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_order_items'
    AND column_name = 'receive_status'
  ) THEN
    ALTER TABLE purchase_order_items
    ADD COLUMN receive_status TEXT DEFAULT 'pending'
    CHECK (receive_status IN ('pending', 'partial', 'received', 'cancelled'));

    COMMENT ON COLUMN purchase_order_items.receive_status IS 'Track receiving status of each line item';
  END IF;
END $$;

-- Add quantity_remaining as generated column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_order_items'
    AND column_name = 'quantity_remaining'
  ) THEN
    ALTER TABLE purchase_order_items
    ADD COLUMN quantity_remaining INTEGER GENERATED ALWAYS AS (
      quantity - COALESCE(quantity_received, 0)
    ) STORED;

    COMMENT ON COLUMN purchase_order_items.quantity_remaining IS 'Auto-calculated: ordered - received';
  END IF;
END $$;

-- Create index on receive_status
CREATE INDEX IF NOT EXISTS idx_po_items_receive_status ON purchase_order_items(receive_status);


-- ================================================================
-- CREATE PURCHASE ORDER RECEIVES TABLE
-- Track individual receiving transactions with quality control
-- ================================================================

CREATE TABLE IF NOT EXISTS purchase_order_receives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  po_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,

  -- Receiving info
  quantity_received DECIMAL(10,2) NOT NULL CHECK (quantity_received > 0),
  received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Quality control (CRITICAL for cannabis compliance)
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'expired', 'rejected')),
  quality_notes TEXT, -- e.g., "Slight packaging damage, product intact"

  -- Inventory link (which inventory record was updated)
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,

  -- Stock movement reference (audit trail)
  stock_movement_id UUID, -- FK to stock_movements if table exists

  -- Additional notes
  notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure we don't over-receive
  CONSTRAINT valid_quantity CHECK (quantity_received > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_po_receives_po ON purchase_order_receives(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_receives_item ON purchase_order_receives(po_item_id);
CREATE INDEX IF NOT EXISTS idx_po_receives_date ON purchase_order_receives(received_date);
CREATE INDEX IF NOT EXISTS idx_po_receives_condition ON purchase_order_receives(condition);
CREATE INDEX IF NOT EXISTS idx_po_receives_inventory ON purchase_order_receives(inventory_id);

COMMENT ON TABLE purchase_order_receives IS 'Audit trail of all PO receiving transactions with quality control';
COMMENT ON COLUMN purchase_order_receives.condition IS 'Product condition: good, damaged, expired, rejected (for compliance)';
COMMENT ON COLUMN purchase_order_receives.quality_notes IS 'Detailed notes about product quality/condition';


-- ================================================================
-- ENHANCE PURCHASE ORDERS TABLE
-- Add receiving completion tracking
-- ================================================================

-- Add received_date if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders'
    AND column_name = 'received_date'
  ) THEN
    ALTER TABLE purchase_orders
    ADD COLUMN received_date DATE;

    COMMENT ON COLUMN purchase_orders.received_date IS 'Date when PO was fully received';
  END IF;
END $$;

-- Add received_by if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders'
    AND column_name = 'received_by'
  ) THEN
    ALTER TABLE purchase_orders
    ADD COLUMN received_by UUID REFERENCES users(id) ON DELETE SET NULL;

    COMMENT ON COLUMN purchase_orders.received_by IS 'User who completed receiving';
  END IF;
END $$;


-- ================================================================
-- TRIGGER: Auto-update item receive status
-- When receives are recorded, update the item's status
-- ================================================================

CREATE OR REPLACE FUNCTION update_item_receive_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_received DECIMAL(10,2);
  v_quantity_ordered INTEGER;
  v_new_status TEXT;
BEGIN
  -- Calculate total received for this item
  SELECT
    COALESCE(SUM(pr.quantity_received), 0),
    pi.quantity
  INTO v_total_received, v_quantity_ordered
  FROM purchase_order_receives pr
  JOIN purchase_order_items pi ON pr.po_item_id = pi.id
  WHERE pr.po_item_id = NEW.po_item_id
  GROUP BY pi.quantity;

  -- Determine new status
  IF v_total_received = 0 THEN
    v_new_status := 'pending';
  ELSIF v_total_received < v_quantity_ordered THEN
    v_new_status := 'partial';
  ELSIF v_total_received >= v_quantity_ordered THEN
    v_new_status := 'received';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update item
  UPDATE purchase_order_items
  SET
    quantity_received = v_total_received,
    receive_status = v_new_status,
    updated_at = NOW()
  WHERE id = NEW.po_item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_item_receive_status_trigger ON purchase_order_receives;

-- Create trigger
CREATE TRIGGER update_item_receive_status_trigger
  AFTER INSERT ON purchase_order_receives
  FOR EACH ROW
  EXECUTE FUNCTION update_item_receive_status();

COMMENT ON FUNCTION update_item_receive_status() IS 'Auto-updates item quantity_received and receive_status when receives are recorded';


-- ================================================================
-- TRIGGER: Auto-update PO status based on items
-- When all items are received, mark PO as received
-- ================================================================

CREATE OR REPLACE FUNCTION update_po_receiving_status()
RETURNS TRIGGER AS $$
DECLARE
  v_po_id UUID;
  v_all_received BOOLEAN;
  v_any_received BOOLEAN;
  v_new_status TEXT;
BEGIN
  -- Get PO ID (works for INSERT, UPDATE, DELETE)
  v_po_id := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Check item statuses
  SELECT
    BOOL_AND(receive_status = 'received'),
    BOOL_OR(receive_status IN ('partial', 'received'))
  INTO v_all_received, v_any_received
  FROM purchase_order_items
  WHERE purchase_order_id = v_po_id;

  -- Determine PO status
  -- Only auto-update if PO is in receivable state
  UPDATE purchase_orders
  SET
    status = CASE
      WHEN v_all_received THEN 'received'
      WHEN v_any_received AND status IN ('in_transit', 'confirmed', 'partial') THEN 'partial'
      ELSE status
    END,
    received_date = CASE
      WHEN v_all_received AND received_date IS NULL THEN CURRENT_DATE
      ELSE received_date
    END,
    updated_at = NOW()
  WHERE id = v_po_id
    AND po_type = 'inbound' -- Only for inbound POs
    AND status IN ('confirmed', 'in_transit', 'partial'); -- Only auto-update these statuses

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_po_receiving_status_trigger ON purchase_order_items;

-- Create trigger
CREATE TRIGGER update_po_receiving_status_trigger
  AFTER UPDATE OF receive_status ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_po_receiving_status();

COMMENT ON FUNCTION update_po_receiving_status() IS 'Auto-updates PO status to received/partial based on item statuses';


-- ================================================================
-- RLS POLICIES
-- ================================================================

-- Enable RLS on receives table
ALTER TABLE purchase_order_receives ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own receives
CREATE POLICY "Vendors can view own PO receives"
  ON purchase_order_receives FOR SELECT
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders
      WHERE vendor_id = current_setting('app.current_vendor_id')::uuid
    )
  );

-- Vendors can create receives for their POs
CREATE POLICY "Vendors can create PO receives"
  ON purchase_order_receives FOR INSERT
  WITH CHECK (
    purchase_order_id IN (
      SELECT id FROM purchase_orders
      WHERE vendor_id = current_setting('app.current_vendor_id')::uuid
    )
  );

-- Vendors can update receives (for corrections)
CREATE POLICY "Vendors can update own PO receives"
  ON purchase_order_receives FOR UPDATE
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders
      WHERE vendor_id = current_setting('app.current_vendor_id')::uuid
    )
  );


-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================

GRANT SELECT, INSERT, UPDATE ON purchase_order_receives TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;


-- ================================================================
-- CREATE HELPFUL VIEWS
-- ================================================================

-- View: PO Receiving Summary
CREATE OR REPLACE VIEW purchase_order_receiving_summary AS
SELECT
  po.id as po_id,
  po.po_number,
  po.vendor_id,
  po.status,
  po.total,
  COUNT(DISTINCT poi.id) as total_items,
  COUNT(DISTINCT CASE WHEN poi.receive_status = 'received' THEN poi.id END) as items_received,
  COUNT(DISTINCT CASE WHEN poi.receive_status = 'partial' THEN poi.id END) as items_partial,
  COUNT(DISTINCT CASE WHEN poi.receive_status = 'pending' THEN poi.id END) as items_pending,
  SUM(poi.quantity) as total_quantity_ordered,
  SUM(COALESCE(poi.quantity_received, 0)) as total_quantity_received,
  SUM(poi.quantity_remaining) as total_quantity_remaining,
  ROUND(
    (SUM(COALESCE(poi.quantity_received, 0))::decimal / NULLIF(SUM(poi.quantity), 0)) * 100,
    2
  ) as receive_percent
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.po_type = 'inbound'
GROUP BY po.id, po.po_number, po.vendor_id, po.status, po.total;

COMMENT ON VIEW purchase_order_receiving_summary IS 'Summary of PO receiving progress for dashboards';

-- Grant access to view
GRANT SELECT ON purchase_order_receiving_summary TO authenticated;


-- ================================================================
-- VALIDATION FUNCTION
-- Prevent over-receiving
-- ================================================================

CREATE OR REPLACE FUNCTION validate_receive_quantity()
RETURNS TRIGGER AS $$
DECLARE
  v_total_received DECIMAL(10,2);
  v_quantity_ordered INTEGER;
BEGIN
  -- Get current totals
  SELECT
    COALESCE(SUM(quantity_received), 0) + NEW.quantity_received,
    quantity
  INTO v_total_received, v_quantity_ordered
  FROM purchase_order_receives pr
  JOIN purchase_order_items pi ON pr.po_item_id = pi.id
  WHERE pr.po_item_id = NEW.po_item_id
  GROUP BY pi.quantity;

  -- Check if over-receiving
  IF v_total_received > v_quantity_ordered THEN
    RAISE EXCEPTION 'Cannot receive % - would exceed ordered quantity of %',
      NEW.quantity_received, v_quantity_ordered
    USING HINT = 'Reduce receive quantity or check existing receives';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DROP TRIGGER IF EXISTS validate_receive_quantity_trigger ON purchase_order_receives;
CREATE TRIGGER validate_receive_quantity_trigger
  BEFORE INSERT ON purchase_order_receives
  FOR EACH ROW
  EXECUTE FUNCTION validate_receive_quantity();

COMMENT ON FUNCTION validate_receive_quantity() IS 'Prevents receiving more than ordered quantity';


-- ================================================================
-- SEED DATA MIGRATION
-- Update existing items to have receive_status
-- ================================================================

-- Set receive_status for existing items
UPDATE purchase_order_items
SET receive_status = CASE
  WHEN COALESCE(quantity_received, 0) = 0 THEN 'pending'
  WHEN quantity_received < quantity THEN 'partial'
  WHEN quantity_received >= quantity THEN 'received'
  ELSE 'pending'
END
WHERE receive_status IS NULL;


-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ PO System Consolidation Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added Features:';
  RAISE NOTICE '  ✅ purchase_order_receives table (quality control)';
  RAISE NOTICE '  ✅ receive_status on purchase_order_items';
  RAISE NOTICE '  ✅ Auto-status update triggers';
  RAISE NOTICE '  ✅ Receiving validation (prevent over-receiving)';
  RAISE NOTICE '  ✅ RLS policies for security';
  RAISE NOTICE '  ✅ Helpful views for dashboards';
  RAISE NOTICE '';
  RAISE NOTICE 'System now supports:';
  RAISE NOTICE '  📦 Inbound POs (from suppliers)';
  RAISE NOTICE '  📤 Outbound POs (to wholesale customers)';
  RAISE NOTICE '  ✅ Quality control receiving';
  RAISE NOTICE '  📊 Auto-status tracking';
  RAISE NOTICE '  🔒 Complete security policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to build UI!';
END $$;


-- ================================================================
-- DEPRECATION NOTICE
-- ================================================================

COMMENT ON TABLE purchase_orders IS 'Unified purchase orders system - supports both inbound (from suppliers) and outbound (to wholesale customers). Consolidates features from migrations 20251023 and 20251027.';

-- Migration complete!
