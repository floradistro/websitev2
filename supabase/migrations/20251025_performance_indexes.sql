-- Performance optimization indexes
-- Created: 2025-10-25
-- Purpose: Add missing indexes to speed up common queries

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_stock_qty ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status_stock ON products(status, stock_quantity) WHERE status = 'published' AND stock_quantity > 0;

-- Inventory table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity) WHERE quantity > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_product_location ON inventory(product_id, location_id);

-- Product categories junction table indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);

-- Locations table indexes
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_locations_vendor_id ON locations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);

-- Vendors table indexes  
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);

-- Orders table indexes (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
  END IF;
END $$;

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON products(vendor_id, status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_inventory_location_product_qty ON inventory(location_id, product_id, quantity) WHERE quantity > 0;

-- Optimize JSONB queries on meta_data
CREATE INDEX IF NOT EXISTS idx_products_meta_data_gin ON products USING gin(meta_data);
CREATE INDEX IF NOT EXISTS idx_products_blueprint_fields_gin ON products USING gin(blueprint_fields);

-- Analyze tables to update statistics
ANALYZE products;
ANALYZE inventory;
ANALYZE product_categories;
ANALYZE locations;
ANALYZE vendors;

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE 'Performance indexes created successfully at %', NOW();
END $$;

