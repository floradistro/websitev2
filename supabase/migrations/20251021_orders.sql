-- ============================================================================
-- FLORA DISTRO - ORDERS SYSTEM (Supabase)
-- Complete order management with payment & fulfillment tracking
-- No data loss - full WooCommerce parity
-- ============================================================================

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id INTEGER UNIQUE, -- WooCommerce order ID
  
  order_number TEXT UNIQUE NOT NULL,
  
  -- Customer
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'on-hold', 'completed', 
    'cancelled', 'refunded', 'failed'
  )),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  )),
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
    'unfulfilled', 'partial', 'fulfilled', 'cancelled'
  )),
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Currency
  currency TEXT DEFAULT 'USD',
  
  -- Addresses (JSONB for flexibility)
  billing_address JSONB NOT NULL DEFAULT '{}',
  shipping_address JSONB DEFAULT '{}',
  
  -- Shipping
  shipping_method TEXT,
  shipping_method_title TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipping_carrier TEXT,
  
  -- Delivery type
  delivery_type TEXT CHECK (delivery_type IN ('delivery', 'pickup', 'mixed')),
  pickup_location_id UUID REFERENCES public.locations(id),
  
  -- Payment
  payment_method TEXT,
  payment_method_title TEXT,
  transaction_id TEXT, -- Stripe transaction ID
  
  -- Customer communication
  customer_note TEXT,
  customer_ip_address INET,
  customer_user_agent TEXT,
  
  -- Internal
  internal_notes TEXT[],
  
  -- Dates
  order_date TIMESTAMPTZ DEFAULT NOW(),
  paid_date TIMESTAMPTZ,
  shipped_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  cancelled_date TIMESTAMPTZ,
  
  -- WooCommerce data
  cart_hash TEXT,
  cart_tax DECIMAL(10,2),
  shipping_tax DECIMAL(10,2),
  discount_tax DECIMAL(10,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS orders_customer_idx ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_fulfillment_status_idx ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS orders_order_date_idx ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS orders_wordpress_id_idx ON public.orders(wordpress_id);
CREATE INDEX IF NOT EXISTS orders_delivery_type_idx ON public.orders(delivery_type);


-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id INTEGER UNIQUE,
  
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  wordpress_product_id INTEGER, -- For reference
  
  -- Product snapshot (at time of order)
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image TEXT,
  product_type TEXT,
  
  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  line_subtotal DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Vendor tracking (for commission)
  vendor_id UUID REFERENCES public.vendors(id),
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  vendor_payout_status TEXT DEFAULT 'pending' CHECK (vendor_payout_status IN (
    'pending', 'processing', 'paid', 'on_hold'
  )),
  
  -- Delivery/Pickup type
  order_type TEXT CHECK (order_type IN ('delivery', 'pickup')),
  pickup_location_id UUID REFERENCES public.locations(id),
  pickup_location_name TEXT,
  
  -- Fulfillment
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  fulfilled_quantity DECIMAL(10,2) DEFAULT 0,
  
  -- Inventory deduction
  inventory_id UUID REFERENCES public.inventory(id),
  stock_movement_id UUID REFERENCES public.stock_movements(id),
  
  -- Tier pricing (Flora Distro specific)
  tier_name TEXT,
  tier_qty INTEGER,
  tier_price DECIMAL(10,2),
  
  -- Metadata
  meta_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS order_items_vendor_idx ON public.order_items(vendor_id);
CREATE INDEX IF NOT EXISTS order_items_wordpress_product_idx ON public.order_items(wordpress_product_id);


-- ============================================================================
-- ORDER STATUS HISTORY TABLE
-- Track all status changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Status change
  from_status TEXT,
  to_status TEXT NOT NULL,
  
  -- Details
  note TEXT,
  changed_by UUID REFERENCES auth.users(id),
  customer_notified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS order_status_history_created_idx ON public.order_status_history(created_at);


-- ============================================================================
-- ORDER NOTES TABLE
-- Customer & internal notes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Note details
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'internal' CHECK (note_type IN ('customer', 'internal', 'system')),
  
  -- Visibility
  is_customer_visible BOOLEAN DEFAULT false,
  
  -- User
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_notes_order_idx ON public.order_notes(order_id);
CREATE INDEX IF NOT EXISTS order_notes_type_idx ON public.order_notes(note_type);


-- ============================================================================
-- ORDER REFUNDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id INTEGER UNIQUE,
  
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Refund details
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_reason TEXT,
  
  -- Payment
  refunded_by UUID REFERENCES auth.users(id),
  refund_method TEXT,
  transaction_id TEXT,
  
  -- Dates
  refund_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_refunds_order_idx ON public.order_refunds(order_id);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Orders - customers can view own orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access to orders" ON public.orders;
CREATE POLICY "Service role full access to orders"
  ON public.orders FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Order Items - follow parent order rules
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;
CREATE POLICY "Customers can view own order items"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Vendors can view their order items" ON public.order_items;
CREATE POLICY "Vendors can view their order items"
  ON public.order_items FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

DROP POLICY IF EXISTS "Service role full access to order items" ON public.order_items;
CREATE POLICY "Service role full access to order items"
  ON public.order_items FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Order Status History - follow parent order
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own order history" ON public.order_status_history;
CREATE POLICY "Customers can view own order history"
  ON public.order_status_history FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role full access to order history" ON public.order_status_history;
CREATE POLICY "Service role full access to order history"
  ON public.order_status_history FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Order Notes - customers see customer-visible notes only
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view customer notes" ON public.order_notes;
CREATE POLICY "Customers can view customer notes"
  ON public.order_notes FOR SELECT
  USING (
    is_customer_visible = true
    AND order_id IN (
      SELECT id FROM public.orders 
      WHERE customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role full access to order notes" ON public.order_notes;
CREATE POLICY "Service role full access to order notes"
  ON public.order_notes FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      from_status,
      to_status,
      note
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_status_changes
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();


-- Update customer stats when order is placed
CREATE OR REPLACE FUNCTION update_customer_order_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.customers
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total_amount,
      average_order_value = (total_spent + NEW.total_amount) / (total_orders + 1),
      last_order_date = NEW.order_date,
      is_paying_customer = true
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_order_stats();


-- Auto-deduct inventory when order is completed
CREATE OR REPLACE FUNCTION deduct_inventory_on_order_complete()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  inv_record RECORD;
BEGIN
  -- Only process when status changes to 'completed'
  IF TG_OP = 'UPDATE' 
     AND NEW.status = 'completed' 
     AND OLD.status != 'completed' THEN
    
    -- Process each order item
    FOR item IN 
      SELECT * FROM public.order_items WHERE order_id = NEW.id
    LOOP
      -- Find inventory for this product
      SELECT * INTO inv_record
      FROM public.inventory
      WHERE product_id = item.wordpress_product_id
        AND location_id = COALESCE(item.pickup_location_id, 
          (SELECT id FROM public.locations WHERE type = 'retail' AND is_default = true LIMIT 1)
        )
      LIMIT 1;
      
      IF inv_record.id IS NOT NULL THEN
        -- Create stock movement
        INSERT INTO public.stock_movements (
          inventory_id,
          product_id,
          movement_type,
          quantity,
          from_location_id,
          reference_type,
          reference_id,
          reason
        ) VALUES (
          inv_record.id,
          item.wordpress_product_id,
          'online_order',
          item.quantity,
          inv_record.location_id,
          'order',
          NEW.order_number,
          'Online order ' || NEW.order_number
        );
        
        -- Update inventory quantity
        UPDATE public.inventory
        SET quantity = quantity - item.quantity
        WHERE id = inv_record.id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_inventory_on_complete
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION deduct_inventory_on_order_complete();


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.orders TO authenticated, service_role;
GRANT ALL ON public.order_items TO authenticated, service_role;
GRANT ALL ON public.order_status_history TO authenticated, service_role;
GRANT ALL ON public.order_notes TO authenticated, service_role;
GRANT ALL ON public.order_refunds TO authenticated, service_role;

