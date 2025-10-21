-- ============================================================================
-- FLORA DISTRO - INVENTORY SYSTEM (Supabase)
-- Replicates Flora Matrix functionality with modern architecture
-- No data migration - fresh system for new apps
-- ============================================================================

-- ============================================================================
-- LOCATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('retail', 'vendor', 'warehouse', 'distribution')),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  
  -- Contact
  phone TEXT,
  email TEXT,
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  accepts_online_orders BOOLEAN DEFAULT true,
  accepts_transfers BOOLEAN DEFAULT true,
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS locations_type_idx ON public.locations(type);
CREATE INDEX IF NOT EXISTS locations_vendor_id_idx ON public.locations(vendor_id);
CREATE INDEX IF NOT EXISTS locations_active_idx ON public.locations(is_active);

-- ============================================================================
-- INVENTORY TABLE
-- Core inventory tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  product_id INTEGER NOT NULL, -- WordPress product ID
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Quantities
  quantity DECIMAL(10,2) DEFAULT 0 NOT NULL,
  reserved_quantity DECIMAL(10,2) DEFAULT 0,
  in_transit_quantity DECIMAL(10,2) DEFAULT 0,
  available_quantity DECIMAL(10,2) GENERATED ALWAYS AS (quantity - COALESCE(reserved_quantity, 0)) STORED,
  
  -- Stock levels
  low_stock_threshold DECIMAL(10,2) DEFAULT 10,
  reorder_point DECIMAL(10,2),
  
  -- Costing
  unit_cost DECIMAL(10,2),
  average_cost DECIMAL(10,2),
  
  -- Status
  stock_status TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN quantity <= 0 THEN 'out_of_stock'
      WHEN quantity <= low_stock_threshold THEN 'low_stock'
      ELSE 'in_stock'
    END
  ) STORED,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(product_id, location_id)
);

CREATE INDEX IF NOT EXISTS inventory_product_id_idx ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS inventory_location_id_idx ON public.inventory(location_id);
CREATE INDEX IF NOT EXISTS inventory_vendor_id_idx ON public.inventory(vendor_id);
CREATE INDEX IF NOT EXISTS inventory_stock_status_idx ON public.inventory(stock_status);

-- ============================================================================
-- STOCK MOVEMENTS TABLE
-- Audit trail for all inventory changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  from_location_id UUID REFERENCES public.locations(id),
  to_location_id UUID REFERENCES public.locations(id),
  
  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'purchase', 'sale', 'transfer', 'adjustment', 
    'return', 'damage', 'loss', 'found',
    'pos_sale', 'online_order', 'manual_adjustment'
  )),
  
  -- Quantities
  quantity DECIMAL(10,2) NOT NULL,
  quantity_before DECIMAL(10,2),
  quantity_after DECIMAL(10,2),
  
  -- Financial
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  
  -- Transaction reference
  reference_type TEXT,
  reference_id TEXT,
  
  -- Details
  reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  movement_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stock_movements_inventory_id_idx ON public.stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS stock_movements_type_idx ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS stock_movements_date_idx ON public.stock_movements(movement_date);

-- ============================================================================
-- STOCK TRANSFERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT UNIQUE NOT NULL,
  
  -- Locations
  from_location_id UUID NOT NULL REFERENCES public.locations(id),
  to_location_id UUID NOT NULL REFERENCES public.locations(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'in_transit', 'received', 'partial', 'cancelled'
  )),
  
  -- Dates
  requested_date TIMESTAMPTZ DEFAULT NOW(),
  approved_date TIMESTAMPTZ,
  shipped_date TIMESTAMPTZ,
  expected_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  
  -- Details
  reason TEXT,
  notes TEXT,
  shipping_carrier TEXT,
  tracking_number TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stock_transfers_from_location_idx ON public.stock_transfers(from_location_id);
CREATE INDEX IF NOT EXISTS stock_transfers_to_location_idx ON public.stock_transfers(to_location_id);
CREATE INDEX IF NOT EXISTS stock_transfers_status_idx ON public.stock_transfers(status);

-- ============================================================================
-- STOCK TRANSFER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  
  quantity_requested DECIMAL(10,2) NOT NULL,
  quantity_shipped DECIMAL(10,2),
  quantity_received DECIMAL(10,2),
  
  unit_cost DECIMAL(10,2),
  batch_number TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stock_transfer_items_transfer_id_idx ON public.stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS stock_transfer_items_product_id_idx ON public.stock_transfer_items(product_id);

-- ============================================================================
-- VENDOR ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vendor_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  woocommerce_order_id INTEGER NOT NULL,
  
  -- Fulfillment
  fulfillment_status TEXT DEFAULT 'pending' CHECK (fulfillment_status IN (
    'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  )),
  
  -- Financial
  vendor_subtotal DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  vendor_net_amount DECIMAL(10,2),
  
  -- Payout
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN (
    'pending', 'processing', 'paid', 'on_hold'
  )),
  payout_date TIMESTAMPTZ,
  payout_reference TEXT,
  
  order_date TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_date TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_orders_vendor_id_idx ON public.vendor_orders(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_orders_woocommerce_id_idx ON public.vendor_orders(woocommerce_order_id);
CREATE INDEX IF NOT EXISTS vendor_orders_fulfillment_status_idx ON public.vendor_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS vendor_orders_payout_status_idx ON public.vendor_orders(payout_status);

-- ============================================================================
-- POS TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT UNIQUE NOT NULL,
  
  -- Location
  location_id UUID NOT NULL REFERENCES public.locations(id),
  pos_device_id TEXT,
  
  -- Transaction
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'sale', 'return', 'void', 'no_sale'
  )),
  
  -- Financial
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_method TEXT,
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN (
    'pending', 'completed', 'refunded', 'voided'
  )),
  
  -- Customer
  customer_id INTEGER,
  
  metadata JSONB DEFAULT '{}',
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pos_transactions_location_id_idx ON public.pos_transactions(location_id);
CREATE INDEX IF NOT EXISTS pos_transactions_date_idx ON public.pos_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS pos_transactions_type_idx ON public.pos_transactions(transaction_type);

-- ============================================================================
-- POS TRANSACTION ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.pos_transactions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2),
  line_total DECIMAL(10,2) NOT NULL,
  
  vendor_id UUID REFERENCES public.vendors(id),
  vendor_commission DECIMAL(10,2),
  
  inventory_id UUID REFERENCES public.inventory(id),
  stock_movement_id UUID REFERENCES public.stock_movements(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pos_transaction_items_transaction_id_idx ON public.pos_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS pos_transaction_items_product_id_idx ON public.pos_transaction_items(product_id);
CREATE INDEX IF NOT EXISTS pos_transaction_items_vendor_id_idx ON public.pos_transaction_items(vendor_id);

-- ============================================================================
-- VENDOR PAYOUTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  payout_number TEXT UNIQUE NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Amounts
  gross_sales DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  adjustments DECIMAL(10,2) DEFAULT 0,
  net_payout DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'on_hold', 'cancelled'
  )),
  
  -- Payment details
  payment_method TEXT,
  payment_reference TEXT,
  paid_date TIMESTAMPTZ,
  
  -- Order IDs included
  order_ids INTEGER[] DEFAULT '{}',
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendor_payouts_vendor_id_idx ON public.vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_payouts_status_idx ON public.vendor_payouts(status);
CREATE INDEX IF NOT EXISTS vendor_payouts_period_idx ON public.vendor_payouts(period_start, period_end);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own inventory"
  ON public.inventory FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

CREATE POLICY "Service role full access"
  ON public.inventory FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active retail locations"
  ON public.locations FOR SELECT
  USING (is_active = true AND type = 'retail');

CREATE POLICY "Vendors can view own locations"
  ON public.locations FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

CREATE POLICY "Service role full access to locations"
  ON public.locations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Stock Movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own stock movements"
  ON public.stock_movements FOR SELECT
  USING (
    inventory_id IN (
      SELECT id FROM public.inventory 
      WHERE vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text)
    )
  );

CREATE POLICY "Service role full access to movements"
  ON public.stock_movements FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Vendor Orders
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own orders"
  ON public.vendor_orders FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

CREATE POLICY "Service role full access to vendor orders"
  ON public.vendor_orders FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Vendor Payouts
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own payouts"
  ON public.vendor_payouts FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

CREATE POLICY "Service role full access to payouts"
  ON public.vendor_payouts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.stock_transfers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vendor_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vendor_payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.locations TO authenticated, service_role;
GRANT ALL ON public.inventory TO authenticated, service_role;
GRANT ALL ON public.stock_movements TO authenticated, service_role;
GRANT ALL ON public.stock_transfers TO authenticated, service_role;
GRANT ALL ON public.stock_transfer_items TO authenticated, service_role;
GRANT ALL ON public.vendor_orders TO authenticated, service_role;
GRANT ALL ON public.pos_transactions TO authenticated, service_role;
GRANT ALL ON public.pos_transaction_items TO authenticated, service_role;
GRANT ALL ON public.vendor_payouts TO authenticated, service_role;

