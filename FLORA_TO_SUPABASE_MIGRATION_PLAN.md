# 🚀 FLORA MATRIX → SUPABASE MIGRATION PLAN
## Complete Backend Functionality Replication

**Project:** Flora Distro - Backend Migration  
**Objective:** Replicate all Flora Matrix plugin functionality in modern Supabase architecture  
**Timeline:** 6-8 weeks (phased approach)  
**Risk Level:** HIGH - Retail operations critical

---

## 📊 EXECUTIVE SUMMARY

This plan migrates all Flora Matrix inventory management, vendor management, and POS integration from WordPress plugin to Supabase PostgreSQL with modern REST APIs.

**Current State:**
- Flora Matrix Plugin (WordPress)
- ~2000+ inventory records
- 7+ retail locations + vendor warehouses
- POS systems integrated
- 535 house products + vendor products

**Target State:**
- Supabase PostgreSQL database
- Next.js API routes (modern REST)
- Same functionality, better performance
- Gradual migration without downtime

---

## 🗄️ DATABASE SCHEMA - SUPABASE

### **Phase 1: Core Tables**

```sql
-- ============================================================================
-- LOCATIONS TABLE
-- Replaces: avu_flora_locations
-- ============================================================================
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id INTEGER UNIQUE, -- WordPress location ID for migration
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
  
  -- Operating hours (JSONB)
  operating_hours JSONB DEFAULT '{}',
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX locations_type_idx ON public.locations(type);
CREATE INDEX locations_vendor_id_idx ON public.locations(vendor_id);
CREATE INDEX locations_active_idx ON public.locations(is_active);


-- ============================================================================
-- INVENTORY TABLE
-- Replaces: avu_flora_im_inventory
-- This is the CRITICAL table - handles all stock tracking
-- ============================================================================
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id INTEGER UNIQUE, -- WordPress inventory ID for migration
  
  -- References
  product_id INTEGER NOT NULL, -- WordPress product ID (still using WooCommerce catalog)
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Quantities
  quantity DECIMAL(10,2) DEFAULT 0 NOT NULL,
  reserved_quantity DECIMAL(10,2) DEFAULT 0, -- Reserved for orders
  in_transit_quantity DECIMAL(10,2) DEFAULT 0, -- In transfer
  available_quantity DECIMAL(10,2) GENERATED ALWAYS AS (quantity - COALESCE(reserved_quantity, 0)) STORED,
  
  -- Stock levels
  low_stock_threshold DECIMAL(10,2) DEFAULT 10,
  reorder_point DECIMAL(10,2),
  reorder_quantity DECIMAL(10,2),
  
  -- Costing
  unit_cost DECIMAL(10,2),
  average_cost DECIMAL(10,2),
  last_cost DECIMAL(10,2),
  cost_method TEXT CHECK (cost_method IN ('fifo', 'lifo', 'average', 'standard')),
  
  -- Tracking
  batch_number TEXT,
  lot_number TEXT,
  serial_numbers TEXT[], -- For tracked items
  expiry_date DATE,
  manufactured_date DATE,
  
  -- Status
  stock_status TEXT CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'on_backorder')) 
    GENERATED ALWAYS AS (
      CASE 
        WHEN quantity <= 0 THEN 'out_of_stock'
        WHEN quantity <= low_stock_threshold THEN 'low_stock'
        ELSE 'in_stock'
      END
    ) STORED,
  
  -- Alerts
  enable_low_stock_alert BOOLEAN DEFAULT true,
  last_stock_alert_sent TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_counted_at TIMESTAMPTZ,
  last_counted_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX inventory_product_id_idx ON public.inventory(product_id);
CREATE INDEX inventory_location_id_idx ON public.inventory(location_id);
CREATE INDEX inventory_vendor_id_idx ON public.inventory(vendor_id);
CREATE INDEX inventory_stock_status_idx ON public.inventory(stock_status);
CREATE INDEX inventory_expiry_date_idx ON public.inventory(expiry_date);
CREATE UNIQUE INDEX inventory_product_location_unique ON public.inventory(product_id, location_id);


-- ============================================================================
-- STOCK MOVEMENTS TABLE
-- Audit trail for all inventory changes
-- Replaces: avu_flora_stock_movements (if exists)
-- ============================================================================
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  from_location_id UUID REFERENCES public.locations(id),
  to_location_id UUID REFERENCES public.locations(id),
  
  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'purchase', 'sale', 'transfer', 'adjustment', 
    'return', 'damage', 'loss', 'found', 'production',
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
  reference_type TEXT, -- 'order', 'transfer', 'adjustment', 'pos_transaction'
  reference_id TEXT, -- Order ID, transfer ID, etc.
  
  -- User tracking
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  
  -- Details
  reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  movement_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX stock_movements_inventory_id_idx ON public.stock_movements(inventory_id);
CREATE INDEX stock_movements_product_id_idx ON public.stock_movements(product_id);
CREATE INDEX stock_movements_type_idx ON public.stock_movements(movement_type);
CREATE INDEX stock_movements_date_idx ON public.stock_movements(movement_date);
CREATE INDEX stock_movements_reference_idx ON public.stock_movements(reference_type, reference_id);


-- ============================================================================
-- STOCK TRANSFERS TABLE
-- Manage transfers between locations
-- ============================================================================
CREATE TABLE public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT UNIQUE NOT NULL, -- e.g., TRF-2025-0001
  
  -- Locations
  from_location_id UUID NOT NULL REFERENCES public.locations(id),
  to_location_id UUID NOT NULL REFERENCES public.locations(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'in_transit', 'received', 'partial', 'cancelled'
  )),
  
  -- Users
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  shipped_by UUID REFERENCES auth.users(id),
  received_by UUID REFERENCES auth.users(id),
  
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
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX stock_transfers_from_location_idx ON public.stock_transfers(from_location_id);
CREATE INDEX stock_transfers_to_location_idx ON public.stock_transfers(to_location_id);
CREATE INDEX stock_transfers_status_idx ON public.stock_transfers(status);


-- ============================================================================
-- STOCK TRANSFER ITEMS TABLE
-- Line items for transfers
-- ============================================================================
CREATE TABLE public.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  
  -- Quantities
  quantity_requested DECIMAL(10,2) NOT NULL,
  quantity_shipped DECIMAL(10,2),
  quantity_received DECIMAL(10,2),
  
  -- Costing
  unit_cost DECIMAL(10,2),
  
  -- Tracking
  batch_number TEXT,
  lot_number TEXT,
  serial_numbers TEXT[],
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX stock_transfer_items_transfer_id_idx ON public.stock_transfer_items(transfer_id);
CREATE INDEX stock_transfer_items_product_id_idx ON public.stock_transfer_items(product_id);


-- ============================================================================
-- VENDOR PRODUCTS TABLE (Enhanced)
-- Already exists, but add inventory tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  wordpress_product_id INTEGER NOT NULL,
  
  -- Approval workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  
  -- Product details at submission
  submitted_data JSONB,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Inventory settings
  manage_inventory BOOLEAN DEFAULT true,
  track_quantity BOOLEAN DEFAULT true,
  
  -- Pricing
  base_cost DECIMAL(10,2), -- Vendor's cost
  suggested_price DECIMAL(10,2), -- Vendor's suggested retail
  commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Commission percentage
  
  -- Metadata
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vendor_id, wordpress_product_id)
);

CREATE INDEX vendor_products_vendor_id_idx ON public.vendor_products(vendor_id);
CREATE INDEX vendor_products_wordpress_id_idx ON public.vendor_products(wordpress_product_id);
CREATE INDEX vendor_products_status_idx ON public.vendor_products(status);


-- ============================================================================
-- VENDOR ORDERS TABLE
-- Track vendor-specific order data
-- ============================================================================
CREATE TABLE public.vendor_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  woocommerce_order_id INTEGER NOT NULL,
  
  -- Fulfillment
  fulfillment_status TEXT DEFAULT 'pending' CHECK (fulfillment_status IN (
    'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  )),
  
  -- Financial
  vendor_subtotal DECIMAL(10,2), -- Vendor's share of order
  commission_amount DECIMAL(10,2), -- Platform commission
  vendor_net_amount DECIMAL(10,2), -- What vendor receives
  
  -- Payout
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN (
    'pending', 'processing', 'paid', 'on_hold'
  )),
  payout_date TIMESTAMPTZ,
  payout_reference TEXT,
  
  -- Dates
  order_date TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_date TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX vendor_orders_vendor_id_idx ON public.vendor_orders(vendor_id);
CREATE INDEX vendor_orders_woocommerce_id_idx ON public.vendor_orders(woocommerce_order_id);
CREATE INDEX vendor_orders_fulfillment_status_idx ON public.vendor_orders(fulfillment_status);
CREATE INDEX vendor_orders_payout_status_idx ON public.vendor_orders(payout_status);


-- ============================================================================
-- POS TRANSACTIONS TABLE
-- Critical for POS system integration
-- ============================================================================
CREATE TABLE public.pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT UNIQUE NOT NULL,
  
  -- Location and device
  location_id UUID NOT NULL REFERENCES public.locations(id),
  pos_device_id TEXT,
  cashier_id UUID REFERENCES auth.users(id),
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'sale', 'return', 'void', 'no_sale'
  )),
  
  -- Financial
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_method TEXT, -- 'cash', 'card', 'digital', etc.
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN (
    'pending', 'completed', 'refunded', 'voided'
  )),
  
  -- Customer (optional)
  customer_id INTEGER, -- WooCommerce customer ID
  
  -- Metadata
  receipt_data JSONB,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pos_transactions_location_id_idx ON public.pos_transactions(location_id);
CREATE INDEX pos_transactions_date_idx ON public.pos_transactions(transaction_date);
CREATE INDEX pos_transactions_type_idx ON public.pos_transactions(transaction_type);


-- ============================================================================
-- POS TRANSACTION ITEMS TABLE
-- Line items for POS transactions
-- ============================================================================
CREATE TABLE public.pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.pos_transactions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  
  -- Quantities
  quantity DECIMAL(10,2) NOT NULL,
  
  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2),
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Vendor tracking (if vendor product)
  vendor_id UUID REFERENCES public.vendors(id),
  vendor_commission DECIMAL(10,2),
  
  -- Inventory deduction
  inventory_id UUID REFERENCES public.inventory(id),
  stock_movement_id UUID REFERENCES public.stock_movements(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pos_transaction_items_transaction_id_idx ON public.pos_transaction_items(transaction_id);
CREATE INDEX pos_transaction_items_product_id_idx ON public.pos_transaction_items(product_id);
CREATE INDEX pos_transaction_items_vendor_id_idx ON public.pos_transaction_items(vendor_id);


-- ============================================================================
-- LOW STOCK ALERTS TABLE
-- Automated alert system
-- ============================================================================
CREATE TABLE public.low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiring_soon')),
  current_quantity DECIMAL(10,2),
  threshold_quantity DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  
  -- Notification
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX low_stock_alerts_inventory_id_idx ON public.low_stock_alerts(inventory_id);
CREATE INDEX low_stock_alerts_status_idx ON public.low_stock_alerts(status);
CREATE INDEX low_stock_alerts_type_idx ON public.low_stock_alerts(alert_type);


-- ============================================================================
-- INVENTORY COUNTS TABLE
-- Physical inventory audits
-- ============================================================================
CREATE TABLE public.inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_number TEXT UNIQUE NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  
  -- Status
  status TEXT DEFAULT 'in_progress' CHECK (status IN (
    'scheduled', 'in_progress', 'completed', 'cancelled'
  )),
  
  -- Details
  count_type TEXT CHECK (count_type IN ('full', 'partial', 'cycle')),
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Users
  created_by UUID REFERENCES auth.users(id),
  counted_by UUID[] DEFAULT '{}',
  approved_by UUID REFERENCES auth.users(id),
  
  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX inventory_counts_location_id_idx ON public.inventory_counts(location_id);
CREATE INDEX inventory_counts_status_idx ON public.inventory_counts(status);


-- ============================================================================
-- INVENTORY COUNT ITEMS TABLE
-- Individual count records
-- ============================================================================
CREATE TABLE public.inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id),
  product_id INTEGER NOT NULL,
  
  -- Counts
  system_quantity DECIMAL(10,2) NOT NULL, -- What system says
  counted_quantity DECIMAL(10,2), -- What was physically counted
  variance DECIMAL(10,2) GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
  
  -- Variance handling
  variance_reason TEXT,
  adjustment_applied BOOLEAN DEFAULT false,
  adjustment_movement_id UUID REFERENCES public.stock_movements(id),
  
  -- User
  counted_by UUID REFERENCES auth.users(id),
  counted_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX inventory_count_items_count_id_idx ON public.inventory_count_items(count_id);
CREATE INDEX inventory_count_items_inventory_id_idx ON public.inventory_count_items(inventory_id);
```

---

## 🔒 ROW LEVEL SECURITY (RLS) POLICIES

```sql
-- ============================================================================
-- SECURITY POLICIES
-- ============================================================================

-- INVENTORY: Vendors see only their inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own inventory"
  ON public.inventory FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

CREATE POLICY "Service role full access to inventory"
  ON public.inventory FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "POS can update inventory"
  ON public.inventory FOR UPDATE
  USING (
    location_id IN (
      SELECT id FROM public.locations WHERE type = 'retail'
    )
  );


-- LOCATIONS: Public can view active locations, vendors see their own
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


-- STOCK MOVEMENTS: Audit trail - read only for vendors
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own stock movements"
  ON public.stock_movements FOR SELECT
  USING (
    inventory_id IN (
      SELECT id FROM public.inventory 
      WHERE vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text)
    )
  );

CREATE POLICY "Service role full access to stock movements"
  ON public.stock_movements FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- VENDOR ORDERS: Vendors see only their orders
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own orders"
  ON public.vendor_orders FOR SELECT
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text));

CREATE POLICY "Service role full access to vendor orders"
  ON public.vendor_orders FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- POS TRANSACTIONS: Location-based access
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POS devices can create transactions"
  ON public.pos_transactions FOR INSERT
  WITH CHECK (location_id IN (SELECT id FROM public.locations WHERE type = 'retail'));

CREATE POLICY "Service role full access to POS transactions"
  ON public.pos_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

---

## 🔧 DATABASE FUNCTIONS & TRIGGERS

```sql
-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function: Update inventory after stock movement
CREATE OR REPLACE FUNCTION update_inventory_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update inventory quantity
  UPDATE public.inventory
  SET 
    quantity = CASE 
      WHEN NEW.movement_type IN ('purchase', 'return', 'found', 'adjustment') 
        THEN quantity + NEW.quantity
      WHEN NEW.movement_type IN ('sale', 'damage', 'loss', 'pos_sale', 'online_order')
        THEN quantity - NEW.quantity
      ELSE quantity
    END,
    updated_at = NOW()
  WHERE id = NEW.inventory_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_on_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_movement();


-- Function: Create low stock alert
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if inventory is low and create alert
  IF NEW.quantity <= NEW.low_stock_threshold AND NEW.enable_low_stock_alert = true THEN
    INSERT INTO public.low_stock_alerts (
      inventory_id, product_id, location_id, alert_type, 
      current_quantity, threshold_quantity
    )
    VALUES (
      NEW.id, NEW.product_id, NEW.location_id, 
      CASE WHEN NEW.quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
      NEW.quantity, NEW.low_stock_threshold
    )
    ON CONFLICT (inventory_id) WHERE status = 'active'
    DO UPDATE SET 
      current_quantity = NEW.quantity,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_low_stock
  AFTER UPDATE OF quantity ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock();


-- Function: Calculate vendor order amounts
CREATE OR REPLACE FUNCTION calculate_vendor_order_amounts()
RETURNS TRIGGER AS $$
DECLARE
  commission_rate DECIMAL(5,2);
BEGIN
  -- Get commission rate for vendor
  SELECT COALESCE(
    (SELECT vp.commission_rate 
     FROM public.vendor_products vp 
     WHERE vp.vendor_id = NEW.vendor_id 
     LIMIT 1), 
    15.00
  ) INTO commission_rate;
  
  -- Calculate amounts
  NEW.commission_amount := NEW.vendor_subtotal * (commission_rate / 100);
  NEW.vendor_net_amount := NEW.vendor_subtotal - NEW.commission_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_vendor_order_amounts
  BEFORE INSERT OR UPDATE ON public.vendor_orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_vendor_order_amounts();


-- Function: Handle POS transaction (deduct inventory)
CREATE OR REPLACE FUNCTION process_pos_transaction()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  inv_id UUID;
  movement_id UUID;
BEGIN
  -- Only process completed transactions
  IF NEW.payment_status = 'completed' AND NEW.transaction_type = 'sale' THEN
    
    -- Process each item in the transaction
    FOR item IN 
      SELECT * FROM public.pos_transaction_items WHERE transaction_id = NEW.id
    LOOP
      -- Find inventory record
      SELECT id INTO inv_id
      FROM public.inventory
      WHERE product_id = item.product_id 
        AND location_id = NEW.location_id
      LIMIT 1;
      
      IF inv_id IS NOT NULL THEN
        -- Create stock movement
        INSERT INTO public.stock_movements (
          inventory_id, product_id, movement_type, quantity,
          reference_type, reference_id, created_by
        )
        VALUES (
          inv_id, item.product_id, 'pos_sale', item.quantity,
          'pos_transaction', NEW.id::text, NEW.cashier_id
        )
        RETURNING id INTO movement_id;
        
        -- Link movement to transaction item
        UPDATE public.pos_transaction_items
        SET stock_movement_id = movement_id, inventory_id = inv_id
        WHERE id = item.id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_pos_transaction
  AFTER INSERT ON public.pos_transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_pos_transaction();
```

---

## 🚀 API ENDPOINTS - NEXT.JS

### **Phase 2: API Layer**

Create these API routes to replace Flora Matrix endpoints:

```typescript
// ============================================================================
// INVENTORY APIs
// ============================================================================

// GET /api/supabase/inventory
// List inventory (filtered by location, vendor, product)
// Replaces: /flora-im/v1/inventory

// GET /api/supabase/inventory/[id]
// Get single inventory record
// Replaces: /flora-im/v1/inventory/{id}

// POST /api/supabase/inventory
// Create inventory record
// Replaces: Flora Matrix admin inventory creation

// PUT /api/supabase/inventory/[id]
// Update inventory (quantity, cost, settings)
// Replaces: /flora-im/v1/inventory/{id} (PUT)

// POST /api/supabase/inventory/[id]/adjust
// Adjust inventory quantity with reason
// Replaces: Flora Matrix inventory adjustment

// GET /api/supabase/inventory/bulk
// Bulk inventory fetch (product IDs + locations)
// Replaces: /flora-im/v1/products/bulk


// ============================================================================
// LOCATION APIs
// ============================================================================

// GET /api/supabase/locations
// List all locations (retail + vendor warehouses)
// Replaces: /flora-im/v1/locations

// GET /api/supabase/locations/[id]
// Get single location
// Replaces: /flora-im/v1/locations/{id}

// POST /api/supabase/locations
// Create location
// Replaces: Flora Matrix location creation

// PUT /api/supabase/locations/[id]
// Update location
// Replaces: /flora-im/v1/locations/{id} (PUT)


// ============================================================================
// STOCK MOVEMENT APIs
// ============================================================================

// GET /api/supabase/stock-movements
// List stock movements (filtered)
// NEW: Full audit trail

// POST /api/supabase/stock-movements
// Create stock movement (purchase, sale, adjustment, etc.)
// Replaces: Various Flora Matrix stock operations

// GET /api/supabase/stock-movements/audit
// Audit trail for product/location
// NEW: Enhanced reporting


// ============================================================================
// STOCK TRANSFER APIs
// ============================================================================

// GET /api/supabase/transfers
// List transfers (filtered by status, location)
// Replaces: Flora Matrix transfer management

// POST /api/supabase/transfers
// Create transfer request
// Replaces: Flora Matrix transfer creation

// PUT /api/supabase/transfers/[id]/approve
// Approve transfer
// Replaces: Flora Matrix approval workflow

// PUT /api/supabase/transfers/[id]/ship
// Mark transfer as shipped
// NEW: Enhanced workflow

// PUT /api/supabase/transfers/[id]/receive
// Receive transfer at destination
// Replaces: Flora Matrix receive operation


// ============================================================================
// POS INTEGRATION APIs
// ============================================================================

// POST /api/supabase/pos/transaction
// Create POS transaction (auto-deducts inventory)
// Replaces: Flora Matrix POS integration
// CRITICAL: Must be fast (<200ms)

// POST /api/supabase/pos/return
// Process return (adds inventory back)
// Replaces: Flora Matrix return handling

// POST /api/supabase/pos/void
// Void transaction
// NEW: Better error handling

// GET /api/supabase/pos/available-stock
// Real-time stock check for POS
// Replaces: Flora Matrix stock check
// CRITICAL: Must be fast (<100ms)


// ============================================================================
// VENDOR MANAGEMENT APIs
// ============================================================================

// GET /api/supabase/vendor/inventory
// Vendor's inventory across all locations
// Replaces: /flora-vendors/v1/vendors/me/inventory

// POST /api/supabase/vendor/products
// Vendor creates product (with inventory)
// Replaces: /flora-vendors/v1/vendors/me/products

// GET /api/supabase/vendor/orders
// Vendor's orders with fulfillment status
// Replaces: /flora-vendors/v1/vendors/me/orders

// GET /api/supabase/vendor/dashboard
// Vendor dashboard stats
// Replaces: /flora-vendors/v1/vendors/me/dashboard

// POST /api/supabase/vendor/inventory/adjust
// Vendor adjusts their inventory
// Replaces: Flora Matrix vendor inventory adjustment


// ============================================================================
// ADMIN APIs
// ============================================================================

// GET /api/supabase/admin/pending-products
// Pending product approvals
// Replaces: /flora-im/v1/vendor-dev/pending-products

// POST /api/supabase/admin/approve-product
// Approve vendor product
// Replaces: /flora-im/v1/vendor-dev/approve-product

// GET /api/supabase/admin/low-stock-alerts
// Low stock alerts across all locations
// NEW: Automated alert system

// GET /api/supabase/admin/inventory-reports
// Inventory reports (valuation, turnover, etc.)
// NEW: Enhanced reporting


// ============================================================================
// INVENTORY COUNT APIs
// ============================================================================

// POST /api/supabase/inventory-count
// Create inventory count
// NEW: Physical audit system

// PUT /api/supabase/inventory-count/[id]/complete
// Complete count and apply adjustments
// NEW: Reconciliation workflow
```

---

## 📅 PHASED MIGRATION PLAN

### **Phase 1: Foundation (Week 1-2)**
**Objective:** Set up Supabase schema without touching Flora Matrix

**Tasks:**
1. ✅ Set up Supabase project (DONE)
2. Create all database tables (SQL above)
3. Create database functions & triggers
4. Set up RLS policies
5. Create `.env` configuration
6. Test database connectivity

**Deliverables:**
- Complete Supabase schema
- All indexes and constraints
- Test queries working

**Risk:** LOW - No impact on production

---

### **Phase 2: Read-Only APIs (Week 3-4)**
**Objective:** Create API routes that READ from Supabase (no writes yet)

**Tasks:**
1. Create inventory APIs (GET only)
2. Create location APIs (GET only)
3. Create stock movement APIs (GET only)
4. Create vendor APIs (GET only)
5. Create admin dashboard APIs (GET only)
6. Add caching layer (Redis/Upstash)

**Testing:**
- Compare Supabase responses vs Flora Matrix
- Performance benchmarks
- Load testing (1000+ requests/sec)

**Deliverables:**
- All read APIs functional
- API documentation
- Performance metrics

**Risk:** LOW - Still using Flora Matrix for all writes

---

### **Phase 3: Dual-Write System (Week 5-6)**
**Objective:** Write to BOTH systems (Supabase + Flora Matrix)

**Tasks:**
1. Create write APIs (POST, PUT, DELETE)
2. Implement dual-write:
   - Write to Supabase first
   - If success, write to Flora Matrix
   - If Flora fails, rollback Supabase
3. Sync existing data from Flora Matrix → Supabase
4. Create data reconciliation scripts

**Testing:**
- Data consistency checks
- Rollback testing
- Failure scenarios

**Deliverables:**
- Dual-write system working
- Data sync scripts
- Reconciliation reports

**Risk:** MEDIUM - Data consistency critical

---

### **Phase 4: POS Integration Testing (Week 7)**
**Objective:** Test POS with Supabase (in staging)

**Tasks:**
1. Set up staging POS environment
2. Update POS to use Supabase APIs
3. Test ALL POS workflows:
   - Sales transactions
   - Returns
   - Stock checks
   - Multi-location scenarios
4. Performance testing (sub-200ms responses)
5. Stress testing (Black Friday scenarios)

**Testing:**
- 1000+ test transactions
- Edge cases (network failures, conflicts)
- Performance under load

**Deliverables:**
- POS fully functional with Supabase
- Performance benchmarks met
- Rollback procedure tested

**Risk:** HIGH - POS is business-critical

---

### **Phase 5: Gradual Cutover (Week 8)**
**Objective:** Switch to Supabase as primary, Flora Matrix as backup

**Tasks:**
1. Deploy Phase 4 to production (1 location first)
2. Monitor for 48 hours
3. If stable, roll out to remaining locations
4. Keep Flora Matrix as read-only backup
5. Monitor for 2 weeks

**Monitoring:**
- Real-time error tracking (Sentry)
- Performance dashboards
- Data consistency checks (hourly)
- Business metrics (sales, inventory accuracy)

**Rollback Plan:**
- Switch back to Flora Matrix in <5 minutes
- Keep last 7 days of data in Flora Matrix
- Automated health checks

**Risk:** HIGH - Full production deployment

---

### **Phase 6: Decommission Flora Matrix (Week 9+)**
**Objective:** Remove Flora Matrix plugin (when confident)

**Tasks:**
1. Verify 100% functionality in Supabase
2. Export all Flora Matrix data
3. Disable Flora Matrix endpoints
4. Keep WordPress plugin installed but disabled
5. Final data reconciliation
6. Celebrate! 🎉

**Risk:** LOW - Only after proven stability

---

## 🧪 TESTING STRATEGY

### **Unit Tests**
- API endpoint tests
- Database function tests
- RLS policy tests

### **Integration Tests**
- End-to-end workflows
- Multi-location scenarios
- Vendor workflows
- POS integration

### **Performance Tests**
- Load testing (Locust/k6)
- Stress testing (10x normal load)
- Database query optimization
- API response times

### **Data Integrity Tests**
- Inventory reconciliation
- Stock movement audit
- Financial calculations

---

## 🔄 DATA MIGRATION SCRIPTS

```typescript
// ============================================================================
// MIGRATION: Flora Matrix → Supabase
// Run during Phase 3
// ============================================================================

// Script 1: Migrate Locations
// Copies avu_flora_locations → public.locations

// Script 2: Migrate Inventory
// Copies avu_flora_im_inventory → public.inventory

// Script 3: Migrate Vendor Data
// Enriches public.vendors with Flora Matrix data

// Script 4: Validate Data
// Compares record counts, sums, etc.

// Script 5: Sync Ongoing
// Continuous sync during dual-write period
```

---

## 📊 MONITORING & ALERTS

### **Key Metrics to Track:**
1. API response times (<200ms target)
2. Database query performance
3. Inventory accuracy (vs physical counts)
4. POS transaction success rate (99.9% target)
5. Data consistency (Supabase vs Flora Matrix)

### **Alerts:**
- API errors (immediate Slack alert)
- Slow queries (>500ms)
- Data inconsistencies
- POS failures
- Low stock alerts

---

## 💰 COST ESTIMATION

### **Development Time:**
- Phase 1: 40 hours
- Phase 2: 60 hours
- Phase 3: 50 hours
- Phase 4: 40 hours
- Phase 5: 30 hours
- Phase 6: 10 hours
- **Total: 230 hours (~6 weeks)**

### **Supabase Costs:**
- Pro Plan: $25/month
- Database: Included (8GB)
- API Requests: Included (unlimited)
- Storage: ~$0.25/GB
- **Estimated: $30-50/month**

### **Risk Buffer:**
- Add 30% for unknowns
- **Total: 300 hours (~8 weeks)**

---

## ⚠️ CRITICAL CONSIDERATIONS

### **1. POS System Integration**
- **MUST be fast** (<200ms response time)
- **MUST be reliable** (99.9% uptime)
- Offline mode required
- Rollback in <5 minutes

### **2. Data Consistency**
- Dual-write period critical
- Hourly reconciliation
- Automated alerts

### **3. Inventory Accuracy**
- Physical counts during migration
- Lock inventory during cutover
- Validate all quantities

### **4. Business Continuity**
- Migrate during slow period
- Extra staff on call
- Rollback plan tested

---

## ✅ SUCCESS CRITERIA

**Migration is successful when:**
1. ✅ All Flora Matrix endpoints replaced
2. ✅ POS transactions work flawlessly
3. ✅ Inventory accuracy >99.5%
4. ✅ API response times <200ms (p95)
5. ✅ Zero data loss
6. ✅ 2 weeks stable operation
7. ✅ Business metrics unchanged (sales, etc.)
8. ✅ Vendor portal fully functional

---

## 🚦 GO/NO-GO CHECKLIST

**Before starting migration:**
- [ ] Full Flora Matrix data export
- [ ] Staging environment ready
- [ ] POS test environment set up
- [ ] Rollback plan documented
- [ ] Team trained
- [ ] Business stakeholders informed
- [ ] Slow period scheduled (not Black Friday!)

**Before Phase 5 (production cutover):**
- [ ] All Phase 4 tests passed
- [ ] Performance benchmarks met
- [ ] 100% API endpoint parity
- [ ] Data consistency >99.9%
- [ ] Rollback tested successfully
- [ ] Business approval obtained

---

## 🎯 NEXT STEPS

1. **Review this plan** with stakeholders
2. **Approve/modify** based on business needs
3. **Set timeline** (avoid peak seasons)
4. **Allocate resources** (dev team, QA, business)
5. **Begin Phase 1** (database setup)

---

## 📞 SUPPORT & CONTINGENCY

**If something goes wrong:**
1. Immediate rollback to Flora Matrix
2. Analyze failure in staging
3. Fix issue
4. Re-test thoroughly
5. Try again when confident

**Emergency Contacts:**
- Database issues: Supabase support
- API issues: Dev team
- Business impact: Management
- POS issues: Retail operations

---

## 📝 SUMMARY

This plan provides a **complete, production-ready migration** from Flora Matrix to Supabase with:

✅ **Zero downtime** (dual-write approach)  
✅ **Full functionality** (every Flora Matrix feature replicated)  
✅ **Better performance** (modern database, optimized queries)  
✅ **Enhanced features** (better reporting, alerts, audit trails)  
✅ **Scalability** (Supabase scales infinitely)  
✅ **Maintainability** (clean code, modern stack)  

**Timeline:** 6-8 weeks  
**Risk:** HIGH but manageable with phased approach  
**Cost:** ~$30-50/month + development time  

**Recommendation:** Proceed with Phase 1-2 first (low risk), then evaluate before committing to full migration.

---

**Ready to begin?** Let's start with Phase 1 - setting up the Supabase schema! 🚀

