-- ================================================================
-- WHOLESALE SYSTEM MIGRATION
-- Multi-tenant B2B/B2C order management
-- ================================================================

-- ================================================================
-- SUPPLIERS
-- Vendors can buy from suppliers (external or other vendors)
-- ================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Supplier can be another vendor (B2B) or external
  supplier_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- External supplier info (used when supplier_vendor_id is NULL)
  external_name TEXT,
  external_company TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',

  -- Business details
  tax_id TEXT,
  payment_terms TEXT, -- net30, net60, prepaid, etc.
  currency TEXT DEFAULT 'USD',

  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suppliers_vendor ON suppliers(vendor_id);
CREATE INDEX idx_suppliers_supplier_vendor ON suppliers(supplier_vendor_id);


-- ================================================================
-- WHOLESALE CUSTOMERS
-- Vendors sell to wholesale customers (other vendors or businesses)
-- ================================================================
CREATE TABLE IF NOT EXISTS wholesale_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Customer can be another vendor (B2B) or external business
  customer_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- External customer info (used when customer_vendor_id is NULL)
  external_company_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Business details
  business_type TEXT, -- retail, wholesale, distributor, restaurant, etc.
  tax_id TEXT,
  resale_certificate TEXT,

  -- Address
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_zip TEXT,
  shipping_country TEXT DEFAULT 'US',

  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip TEXT,
  billing_country TEXT DEFAULT 'US',

  -- Pricing & Terms
  pricing_tier TEXT, -- wholesale, distributor, vip
  discount_percent DECIMAL(5,2) DEFAULT 0,
  payment_terms TEXT, -- net30, net60, prepaid, cod
  credit_limit DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wholesale_customers_vendor ON wholesale_customers(vendor_id);
CREATE INDEX idx_wholesale_customers_customer_vendor ON wholesale_customers(customer_vendor_id);


-- ================================================================
-- PURCHASE ORDERS (Both inbound from suppliers & outbound to customers)
-- ================================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number TEXT NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- PO Type
  po_type TEXT NOT NULL, -- 'inbound' (from supplier) or 'outbound' (to customer)

  -- For INBOUND: buying from supplier
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,

  -- For OUTBOUND: selling to wholesale customer
  wholesale_customer_id UUID REFERENCES wholesale_customers(id) ON DELETE SET NULL,

  -- Location
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Order details
  status TEXT NOT NULL DEFAULT 'draft',
  -- draft, sent, confirmed, in_transit, received, fulfilled, cancelled

  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Dates
  ordered_at TIMESTAMP WITH TIME ZONE,
  expected_delivery_date DATE,
  received_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,

  -- Payment
  payment_terms TEXT,
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid
  payment_due_date DATE,

  -- Shipping
  shipping_method TEXT,
  tracking_number TEXT,
  carrier TEXT,

  -- Notes
  internal_notes TEXT,
  customer_notes TEXT,

  -- Created by
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT po_type_check CHECK (po_type IN ('inbound', 'outbound')),
  CONSTRAINT po_relation_check CHECK (
    (po_type = 'inbound' AND supplier_id IS NOT NULL) OR
    (po_type = 'outbound' AND wholesale_customer_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_po_number_vendor ON purchase_orders(vendor_id, po_number);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_customer ON purchase_orders(wholesale_customer_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_type ON purchase_orders(po_type);


-- ================================================================
-- PURCHASE ORDER LINE ITEMS
-- ================================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID, -- No FK constraint since product_variants table may not exist

  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,

  -- For inbound POs: track what was received
  quantity_received INTEGER DEFAULT 0,

  -- For outbound POs: track what was fulfilled
  quantity_fulfilled INTEGER DEFAULT 0,

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);


-- ================================================================
-- PURCHASE ORDER PAYMENTS
-- Track payments for POs
-- ================================================================
CREATE TABLE IF NOT EXISTS purchase_order_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- cash, check, card, wire, etc.
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

  reference_number TEXT,
  notes TEXT,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_po_payments_po ON purchase_order_payments(purchase_order_id);


-- ================================================================
-- INVENTORY RESERVATIONS
-- Reserve inventory for outbound POs
-- ================================================================
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID, -- No FK constraint since product_variants table may not exist
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- What is this reservation for?
  reservation_type TEXT NOT NULL, -- 'purchase_order', 'order', etc.
  reference_id UUID NOT NULL, -- ID of the PO or order

  quantity INTEGER NOT NULL CHECK (quantity > 0),

  status TEXT DEFAULT 'active', -- active, fulfilled, cancelled, released
  expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_reservations_product ON inventory_reservations(product_id);
CREATE INDEX idx_inventory_reservations_location ON inventory_reservations(location_id);
CREATE INDEX idx_inventory_reservations_reference ON inventory_reservations(reference_id);
CREATE INDEX idx_inventory_reservations_status ON inventory_reservations(status);


-- ================================================================
-- RLS POLICIES
-- ================================================================

-- Suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own suppliers"
  ON suppliers
  FOR ALL
  USING (vendor_id = current_setting('app.current_vendor_id')::uuid);


-- Wholesale Customers
ALTER TABLE wholesale_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own wholesale customers"
  ON wholesale_customers
  FOR ALL
  USING (vendor_id = current_setting('app.current_vendor_id')::uuid);


-- Purchase Orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own purchase orders"
  ON purchase_orders
  FOR ALL
  USING (vendor_id = current_setting('app.current_vendor_id')::uuid);


-- Purchase Order Items
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage PO items for their POs"
  ON purchase_order_items
  FOR ALL
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders
      WHERE vendor_id = current_setting('app.current_vendor_id')::uuid
    )
  );


-- Purchase Order Payments
ALTER TABLE purchase_order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage payments for their POs"
  ON purchase_order_payments
  FOR ALL
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders
      WHERE vendor_id = current_setting('app.current_vendor_id')::uuid
    )
  );


-- Inventory Reservations
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own inventory reservations"
  ON inventory_reservations
  FOR ALL
  USING (
    location_id IN (
      SELECT id FROM locations
      WHERE vendor_id = current_setting('app.current_vendor_id')::uuid
    )
  );


-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Generate PO Number
CREATE OR REPLACE FUNCTION generate_po_number(v_vendor_id UUID, po_type TEXT)
RETURNS TEXT AS $$
DECLARE
  po_count INTEGER;
  prefix TEXT;
BEGIN
  -- Get count of POs for this vendor
  SELECT COUNT(*) INTO po_count
  FROM purchase_orders
  WHERE vendor_id = v_vendor_id AND purchase_orders.po_type = generate_po_number.po_type;

  -- Set prefix based on type
  prefix := CASE
    WHEN po_type = 'inbound' THEN 'IN-PO-'
    WHEN po_type = 'outbound' THEN 'OUT-PO-'
    ELSE 'PO-'
  END;

  RETURN prefix || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((po_count + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;


-- Calculate PO total
CREATE OR REPLACE FUNCTION calculate_po_total(po_id UUID)
RETURNS void AS $$
DECLARE
  calculated_subtotal DECIMAL(10,2);
  po_discount DECIMAL(10,2);
  po_shipping DECIMAL(10,2);
  po_tax DECIMAL(10,2);
  calculated_total DECIMAL(10,2);
BEGIN
  -- Get subtotal from line items
  SELECT COALESCE(SUM(line_total), 0) INTO calculated_subtotal
  FROM purchase_order_items
  WHERE purchase_order_id = po_id;

  -- Get discount, shipping, tax from PO
  SELECT discount, shipping, tax INTO po_discount, po_shipping, po_tax
  FROM purchase_orders
  WHERE id = po_id;

  -- Calculate total
  calculated_total := calculated_subtotal - COALESCE(po_discount, 0) + COALESCE(po_shipping, 0) + COALESCE(po_tax, 0);

  -- Update PO
  UPDATE purchase_orders
  SET subtotal = calculated_subtotal,
      total = calculated_total,
      updated_at = NOW()
  WHERE id = po_id;
END;
$$ LANGUAGE plpgsql;


-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update PO totals when items change
CREATE OR REPLACE FUNCTION trigger_recalculate_po_total()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_po_total(COALESCE(NEW.purchase_order_id, OLD.purchase_order_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_po_total_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_po_total();


-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wholesale_customers_updated_at BEFORE UPDATE ON wholesale_customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_reservations_updated_at BEFORE UPDATE ON inventory_reservations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
