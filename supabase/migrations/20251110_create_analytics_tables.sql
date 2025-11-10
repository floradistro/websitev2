-- =====================================================
-- ANALYTICS SYSTEM - DATABASE SCHEMA
-- World-Class Analytics Infrastructure
-- =====================================================

-- =====================================================
-- 1. ANALYTICS DAILY CACHE
-- Pre-aggregated daily metrics for fast queries
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_daily_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Revenue Metrics
  gross_sales NUMERIC(12,2) DEFAULT 0,
  net_sales NUMERIC(12,2) DEFAULT 0,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  refund_amount NUMERIC(12,2) DEFAULT 0,
  tip_amount NUMERIC(12,2) DEFAULT 0,

  -- Cost Metrics
  cost_of_goods NUMERIC(12,2) DEFAULT 0,
  gross_profit NUMERIC(12,2) DEFAULT 0,
  gross_margin NUMERIC(5,2) DEFAULT 0,

  -- Transaction Metrics
  total_orders INTEGER DEFAULT 0,
  total_refunds INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  total_quantity NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(10,2) DEFAULT 0,
  avg_items_per_order NUMERIC(5,2) DEFAULT 0,
  avg_quantity_per_order NUMERIC(5,2) DEFAULT 0,

  -- Payment Methods (JSONB for flexibility)
  payment_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Example: {"cash": 1500.00, "card": 3500.00, "digital": 1000.00}

  -- Category Breakdown (JSONB)
  category_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Example: {"flower": {"sales": 5000, "margin": 52.5}, ...}

  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_vendor_location_date UNIQUE(vendor_id, location_id, date),
  CONSTRAINT check_margin CHECK (gross_margin >= 0 AND gross_margin <= 100)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_daily_vendor_date
ON analytics_daily_cache(vendor_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_location_date
ON analytics_daily_cache(location_id, date DESC) WHERE location_id IS NOT NULL;

-- RLS Policies
ALTER TABLE analytics_daily_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own analytics cache"
ON analytics_daily_cache FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM vendors WHERE id = auth.uid()
    UNION
    SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
  )
);


-- =====================================================
-- 2. ANALYTICS PRODUCT CACHE
-- Product performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_product_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Sales Metrics
  units_sold INTEGER DEFAULT 0,
  quantity_sold NUMERIC(12,2) DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  profit NUMERIC(12,2) DEFAULT 0,
  margin NUMERIC(5,2) DEFAULT 0,

  -- Performance Metrics
  total_orders INTEGER DEFAULT 0,
  avg_price NUMERIC(10,2) DEFAULT 0,
  discount_given NUMERIC(12,2) DEFAULT 0,
  markdown_percent NUMERIC(5,2) DEFAULT 0,

  -- Inventory Metrics
  stock_on_hand NUMERIC(12,2),
  days_of_inventory NUMERIC(5,1),
  turnover_rate NUMERIC(5,2),

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_product_period UNIQUE(vendor_id, product_id, location_id, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_product_vendor_period
ON analytics_product_cache(vendor_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_analytics_product_performance
ON analytics_product_cache(vendor_id, margin DESC, revenue DESC);

-- RLS
ALTER TABLE analytics_product_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own product analytics"
ON analytics_product_cache FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM vendors WHERE id = auth.uid()
    UNION
    SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
  )
);


-- =====================================================
-- 3. ANALYTICS EMPLOYEE CACHE
-- Employee performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_employee_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Sales Metrics
  total_sales NUMERIC(12,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  total_quantity NUMERIC(12,2) DEFAULT 0,

  -- Performance Metrics
  avg_transaction_value NUMERIC(10,2) DEFAULT 0,
  avg_items_per_transaction NUMERIC(5,2) DEFAULT 0,
  transactions_per_hour NUMERIC(5,2),

  -- Financial Metrics
  total_discounts NUMERIC(12,2) DEFAULT 0,
  total_refunds NUMERIC(12,2) DEFAULT 0,
  gross_profit NUMERIC(12,2) DEFAULT 0,
  gross_margin NUMERIC(5,2) DEFAULT 0,

  -- Commission
  commission_amount NUMERIC(10,2) DEFAULT 0,
  commission_rate NUMERIC(5,2),

  -- Payment Breakdown
  cash_collected NUMERIC(12,2) DEFAULT 0,
  card_processed NUMERIC(12,2) DEFAULT 0,
  tips_collected NUMERIC(12,2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_employee_period UNIQUE(vendor_id, employee_id, location_id, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_employee_vendor_period
ON analytics_employee_cache(vendor_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_analytics_employee_performance
ON analytics_employee_cache(vendor_id, total_sales DESC);

-- RLS
ALTER TABLE analytics_employee_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their employee analytics"
ON analytics_employee_cache FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM vendors WHERE id = auth.uid()
    UNION
    SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
  )
);


-- =====================================================
-- 4. REPORT EXPORTS
-- Track report generation and downloads
-- =====================================================
CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  report_type TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK (file_format IN ('csv', 'xlsx', 'pdf')),

  filters JSONB,
  file_url TEXT,
  file_size_bytes BIGINT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,

  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_exports_vendor
ON report_exports(vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_exports_status
ON report_exports(status) WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_report_exports_expired
ON report_exports(expires_at) WHERE status = 'completed';

-- RLS
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their own exports"
ON report_exports FOR SELECT
USING (
  vendor_id IN (
    SELECT id FROM vendors WHERE id = auth.uid()
    UNION
    SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can create exports"
ON report_exports FOR INSERT
WITH CHECK (
  vendor_id IN (
    SELECT id FROM vendors WHERE id = auth.uid()
    UNION
    SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
  )
);


-- =====================================================
-- 5. REPORT SCHEDULES
-- Scheduled report delivery
-- =====================================================
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  report_type TEXT NOT NULL,

  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
  schedule_config JSONB,

  delivery_method TEXT NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'download', 'webhook')),
  delivery_config JSONB,

  filters JSONB,

  is_active BOOLEAN DEFAULT true,

  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_schedules_vendor
ON report_schedules(vendor_id, is_active);

CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run
ON report_schedules(next_run_at) WHERE is_active = true;

-- RLS
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their schedules"
ON report_schedules FOR ALL
USING (
  vendor_id IN (
    SELECT id FROM vendors WHERE id = auth.uid()
    UNION
    SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
  )
);


-- =====================================================
-- 6. ALTER EXISTING TABLES
-- Add analytics columns
-- =====================================================

-- Orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS cost_of_goods NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS gross_profit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5,2);

CREATE INDEX IF NOT EXISTS idx_orders_analytics
ON orders(vendor_id, order_date DESC, status)
WHERE status IN ('completed', 'processing');

-- Order items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS profit_per_unit NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5,2);

-- POS transactions table
ALTER TABLE pos_transactions
ADD COLUMN IF NOT EXISTS cost_of_goods NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS gross_profit NUMERIC(10,2);

-- Note: employee_id already exists as user_id in pos_transactions

CREATE INDEX IF NOT EXISTS idx_pos_transactions_analytics
ON pos_transactions(vendor_id, transaction_date DESC)
WHERE payment_status = 'completed';


-- =====================================================
-- 7. DATABASE VIEWS
-- Complex query optimization
-- =====================================================

-- Daily Sales View (unified orders + POS)
CREATE OR REPLACE VIEW v_daily_sales AS
WITH order_sales AS (
  SELECT
    o.vendor_id,
    o.pickup_location_id as location_id,
    DATE(o.order_date) as sale_date,
    o.employee_id,
    o.id as order_id,
    NULL::uuid as transaction_id,
    o.total_amount,
    o.subtotal,
    o.tax_amount,
    o.discount_amount,
    COALESCE(o.refund_amount, 0) as refund_amount,
    COALESCE(o.cost_of_goods, 0) as cost_of_goods,
    COALESCE(o.gross_profit, 0) as gross_profit,
    o.payment_method,
    0 as tip_amount,
    o.status
  FROM orders o
  WHERE o.status IN ('completed', 'processing')
),
pos_sales AS (
  SELECT
    pt.vendor_id,
    pt.location_id,
    DATE(pt.transaction_date) as sale_date,
    pt.user_id as employee_id,
    pt.order_id,
    pt.id as transaction_id,
    pt.total_amount,
    pt.subtotal,
    pt.tax_amount,
    pt.discount_amount,
    0 as refund_amount,
    COALESCE(pt.cost_of_goods, 0) as cost_of_goods,
    COALESCE(pt.gross_profit, 0) as gross_profit,
    pt.payment_method,
    COALESCE(pt.tip_amount, 0) as tip_amount,
    pt.payment_status as status
  FROM pos_transactions pt
  WHERE pt.payment_status = 'completed'
)
SELECT * FROM order_sales
UNION ALL
SELECT * FROM pos_sales;

-- Product Performance View
CREATE OR REPLACE VIEW v_product_performance AS
SELECT
  p.id as product_id,
  p.vendor_id,
  p.name as product_name,
  p.primary_category_id,
  c.name as category_name,
  COUNT(DISTINCT oi.order_id) as order_count,
  SUM(oi.quantity) as units_sold,
  SUM(oi.line_total) as revenue,
  SUM(oi.quantity * COALESCE(p.cost_price, 0)) as estimated_cost,
  SUM(oi.line_total) - SUM(oi.quantity * COALESCE(p.cost_price, 0)) as estimated_profit,
  CASE
    WHEN SUM(oi.line_total) > 0
    THEN ((SUM(oi.line_total) - SUM(oi.quantity * COALESCE(p.cost_price, 0))) / SUM(oi.line_total) * 100)
    ELSE 0
  END as margin_percentage
FROM products p
LEFT JOIN categories c ON c.id = p.primary_category_id
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE p.status = 'published'
GROUP BY p.id, p.vendor_id, p.name, p.primary_category_id, c.name;


-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate COGS for an order item
CREATE OR REPLACE FUNCTION calculate_order_item_cogs(
  p_product_id UUID,
  p_quantity NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_cost_price NUMERIC;
BEGIN
  SELECT cost_price INTO v_cost_price
  FROM products
  WHERE id = p_product_id;

  RETURN COALESCE(v_cost_price, 0) * p_quantity;
END;
$$ LANGUAGE plpgsql STABLE;


-- Function to update analytics cache for a specific date
CREATE OR REPLACE FUNCTION update_analytics_daily_cache(
  p_vendor_id UUID,
  p_date DATE
) RETURNS VOID AS $$
BEGIN
  -- Delete existing cache for this date
  DELETE FROM analytics_daily_cache
  WHERE vendor_id = p_vendor_id
    AND date = p_date;

  -- Insert fresh data
  INSERT INTO analytics_daily_cache (
    vendor_id,
    location_id,
    date,
    gross_sales,
    net_sales,
    subtotal,
    tax_amount,
    discount_amount,
    refund_amount,
    tip_amount,
    cost_of_goods,
    gross_profit,
    gross_margin,
    total_orders,
    total_items,
    avg_order_value
  )
  SELECT
    vendor_id,
    location_id,
    sale_date,
    SUM(total_amount) as gross_sales,
    SUM(total_amount - refund_amount) as net_sales,
    SUM(subtotal) as subtotal,
    SUM(tax_amount) as tax_amount,
    SUM(discount_amount) as discount_amount,
    SUM(refund_amount) as refund_amount,
    SUM(tip_amount) as tip_amount,
    SUM(cost_of_goods) as cost_of_goods,
    SUM(gross_profit) as gross_profit,
    CASE
      WHEN SUM(total_amount) > 0
      THEN (SUM(gross_profit) / SUM(total_amount) * 100)
      ELSE 0
    END as gross_margin,
    COUNT(*) as total_orders,
    0 as total_items, -- TODO: Calculate from order_items
    AVG(total_amount) as avg_order_value
  FROM v_daily_sales
  WHERE vendor_id = p_vendor_id
    AND sale_date = p_date
  GROUP BY vendor_id, location_id, sale_date;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- COMPLETE
-- =====================================================

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE analytics_daily_cache IS 'Pre-aggregated daily metrics for fast analytics queries';
COMMENT ON TABLE analytics_product_cache IS 'Product performance metrics cache';
COMMENT ON TABLE analytics_employee_cache IS 'Employee performance metrics cache';
COMMENT ON TABLE report_exports IS 'Track report generation and downloads';
COMMENT ON TABLE report_schedules IS 'Scheduled report delivery configuration';
