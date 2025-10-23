-- ============================================================================
-- PURCHASE ORDERS SYSTEM
-- Complete PO management for vendor restocking
-- ============================================================================

-- ============================================================================
-- PURCHASE ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  
  -- References
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  
  -- Dates
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  received_date DATE,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Being created
    'submitted',    -- Submitted to supplier
    'confirmed',    -- Confirmed by supplier
    'in_transit',   -- On the way
    'received',     -- Fully received
    'partial',      -- Partially received
    'cancelled'     -- Cancelled
  )),
  
  -- Financials
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (
    COALESCE(subtotal, 0) + COALESCE(tax_amount, 0) + COALESCE(shipping_cost, 0)
  ) STORED,
  
  -- Supplier info
  supplier_name TEXT,
  supplier_email TEXT,
  supplier_phone TEXT,
  supplier_reference TEXT,
  
  -- Shipping
  tracking_number TEXT,
  carrier TEXT,
  shipping_notes TEXT,
  
  -- Notes
  internal_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_dates CHECK (
    expected_delivery_date IS NULL OR 
    expected_delivery_date >= order_date
  )
);

CREATE INDEX IF NOT EXISTS po_vendor_id_idx ON public.purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS po_location_id_idx ON public.purchase_orders(location_id);
CREATE INDEX IF NOT EXISTS po_status_idx ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS po_order_date_idx ON public.purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS po_number_idx ON public.purchase_orders(po_number);

COMMENT ON TABLE public.purchase_orders IS 'Purchase orders for vendor restocking';


-- ============================================================================
-- PURCHASE ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL, -- WordPress product ID
  
  -- Quantities
  quantity_ordered DECIMAL(10,2) NOT NULL,
  quantity_received DECIMAL(10,2) DEFAULT 0,
  quantity_remaining DECIMAL(10,2) GENERATED ALWAYS AS (
    quantity_ordered - COALESCE(quantity_received, 0)
  ) STORED,
  
  -- Pricing
  unit_cost DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) GENERATED ALWAYS AS (
    quantity_ordered * unit_cost
  ) STORED,
  
  -- Product info snapshot (for historical record)
  product_name TEXT NOT NULL,
  product_sku TEXT,
  
  -- Receiving
  receive_status TEXT DEFAULT 'pending' CHECK (receive_status IN (
    'pending',
    'partial',
    'received',
    'cancelled'
  )),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_quantities CHECK (
    quantity_ordered > 0 AND
    quantity_received >= 0 AND
    quantity_received <= quantity_ordered
  )
);

CREATE INDEX IF NOT EXISTS po_items_po_id_idx ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS po_items_product_id_idx ON public.purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS po_items_receive_status_idx ON public.purchase_order_items(receive_status);

COMMENT ON TABLE public.purchase_order_items IS 'Line items for purchase orders';


-- ============================================================================
-- PURCHASE ORDER RECEIVING LOG
-- Track partial receives and adjustments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_receives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  po_item_id UUID NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
  
  -- Receiving info
  quantity_received DECIMAL(10,2) NOT NULL,
  received_date TIMESTAMPTZ DEFAULT NOW(),
  received_by UUID REFERENCES auth.users(id),
  
  -- Quality control
  condition TEXT CHECK (condition IN ('good', 'damaged', 'expired', 'rejected')),
  quality_notes TEXT,
  
  -- Inventory link
  inventory_id UUID REFERENCES public.inventory(id),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS po_receives_po_id_idx ON public.purchase_order_receives(purchase_order_id);
CREATE INDEX IF NOT EXISTS po_receives_item_id_idx ON public.purchase_order_receives(po_item_id);
CREATE INDEX IF NOT EXISTS po_receives_date_idx ON public.purchase_order_receives(received_date);

COMMENT ON TABLE public.purchase_order_receives IS 'Track individual receiving transactions for POs';


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                     LPAD(NEXTVAL('po_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1000;

DROP TRIGGER IF EXISTS generate_po_number_trigger ON public.purchase_orders;
CREATE TRIGGER generate_po_number_trigger
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION generate_po_number();


-- Update PO updated_at timestamp
CREATE OR REPLACE FUNCTION update_po_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_po_timestamp_trigger ON public.purchase_orders;
CREATE TRIGGER update_po_timestamp_trigger
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_po_timestamp();

DROP TRIGGER IF EXISTS update_po_item_timestamp_trigger ON public.purchase_order_items;
CREATE TRIGGER update_po_item_timestamp_trigger
  BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_po_timestamp();


-- Update PO totals when items change
CREATE OR REPLACE FUNCTION update_po_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.purchase_orders
  SET subtotal = (
    SELECT COALESCE(SUM(line_total), 0)
    FROM public.purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  )
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_po_totals_trigger ON public.purchase_order_items;
CREATE TRIGGER update_po_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_po_totals();


-- Update item receive status when receiving
CREATE OR REPLACE FUNCTION update_item_receive_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_received DECIMAL(10,2);
  v_quantity_ordered DECIMAL(10,2);
BEGIN
  -- Get total received for this item
  SELECT 
    COALESCE(SUM(quantity_received), 0),
    poi.quantity_ordered
  INTO v_total_received, v_quantity_ordered
  FROM public.purchase_order_receives por
  JOIN public.purchase_order_items poi ON por.po_item_id = poi.id
  WHERE por.po_item_id = NEW.po_item_id
  GROUP BY poi.quantity_ordered;
  
  -- Update item quantity_received
  UPDATE public.purchase_order_items
  SET 
    quantity_received = v_total_received,
    receive_status = CASE
      WHEN v_total_received = 0 THEN 'pending'
      WHEN v_total_received < v_quantity_ordered THEN 'partial'
      WHEN v_total_received >= v_quantity_ordered THEN 'received'
      ELSE 'pending'
    END
  WHERE id = NEW.po_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_item_receive_status_trigger ON public.purchase_order_receives;
CREATE TRIGGER update_item_receive_status_trigger
  AFTER INSERT ON public.purchase_order_receives
  FOR EACH ROW EXECUTE FUNCTION update_item_receive_status();


-- Update PO status based on items
CREATE OR REPLACE FUNCTION update_po_status()
RETURNS TRIGGER AS $$
DECLARE
  v_all_received BOOLEAN;
  v_any_received BOOLEAN;
BEGIN
  -- Check if all items are received
  SELECT 
    BOOL_AND(receive_status = 'received'),
    BOOL_OR(receive_status IN ('partial', 'received'))
  INTO v_all_received, v_any_received
  FROM public.purchase_order_items
  WHERE purchase_order_id = NEW.purchase_order_id;
  
  -- Update PO status
  UPDATE public.purchase_orders
  SET status = CASE
    WHEN v_all_received THEN 'received'
    WHEN v_any_received THEN 'partial'
    ELSE status
  END,
  received_date = CASE
    WHEN v_all_received AND received_date IS NULL THEN CURRENT_DATE
    ELSE received_date
  END
  WHERE id = NEW.purchase_order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_po_status_trigger ON public.purchase_order_items;
CREATE TRIGGER update_po_status_trigger
  AFTER UPDATE OF receive_status ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_po_status();


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_receives ENABLE ROW LEVEL SECURITY;

-- Vendors can only see their own POs
CREATE POLICY "Vendors can view own purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Vendors can create own purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  ));

CREATE POLICY "Vendors can update own purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  ));

-- PO Items policies
CREATE POLICY "Vendors can view own PO items"
  ON public.purchase_order_items FOR SELECT
  USING (purchase_order_id IN (
    SELECT id FROM public.purchase_orders 
    WHERE vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Vendors can manage own PO items"
  ON public.purchase_order_items FOR ALL
  USING (purchase_order_id IN (
    SELECT id FROM public.purchase_orders 
    WHERE vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  ));

-- Receiving log policies
CREATE POLICY "Vendors can view own receives"
  ON public.purchase_order_receives FOR SELECT
  USING (purchase_order_id IN (
    SELECT id FROM public.purchase_orders 
    WHERE vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Vendors can create receives"
  ON public.purchase_order_receives FOR INSERT
  WITH CHECK (purchase_order_id IN (
    SELECT id FROM public.purchase_orders 
    WHERE vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  ));


-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- PO Summary View
CREATE OR REPLACE VIEW public.purchase_order_summary AS
SELECT 
  po.id,
  po.po_number,
  po.vendor_id,
  v.store_name as vendor_name,
  po.location_id,
  l.name as location_name,
  po.order_date,
  po.expected_delivery_date,
  po.received_date,
  po.status,
  po.total_amount,
  COUNT(poi.id) as item_count,
  SUM(poi.quantity_ordered) as total_quantity_ordered,
  SUM(poi.quantity_received) as total_quantity_received,
  po.supplier_name,
  po.tracking_number,
  po.created_at,
  po.updated_at
FROM public.purchase_orders po
JOIN public.vendors v ON po.vendor_id = v.id
JOIN public.locations l ON po.location_id = l.id
LEFT JOIN public.purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id, v.store_name, l.name;

COMMENT ON VIEW public.purchase_order_summary IS 'Summary view of purchase orders with aggregated data';


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.purchase_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT SELECT, INSERT ON public.purchase_order_receives TO authenticated;
GRANT SELECT ON public.purchase_order_summary TO authenticated;

-- Grant sequence usage
GRANT USAGE, SELECT ON SEQUENCE po_number_seq TO authenticated;



