-- Performance Indexes for Supabase Tables
-- These indexes will dramatically improve query performance

-- Products Table Indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(on_sale);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON products(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Product Categories (Junction Table)
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_both ON product_categories(product_id, category_id);

-- Categories Table Indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_featured ON categories(featured);

-- Product Images Indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(product_id, position);

-- Inventory Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_both ON inventory(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON inventory(updated_at DESC);

-- Stock Movements Indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_location_id ON stock_movements(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);

-- Order Items Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);

-- Customers Indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_wordpress_id ON customers(wordpress_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- Vendors Indexes
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_wordpress_id ON vendors(wordpress_user_id);

-- Locations Indexes
CREATE INDEX IF NOT EXISTS idx_locations_vendor_id ON locations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_vendor_active ON locations(vendor_id, is_active);

-- Vendor Branding Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_branding_vendor_id ON vendor_branding(vendor_id);

-- Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Coupons Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- Vendor Domains Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_domains_vendor_id ON vendor_domains(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_domains_domain ON vendor_domains(domain);
CREATE INDEX IF NOT EXISTS idx_vendor_domains_is_primary ON vendor_domains(is_primary);
CREATE INDEX IF NOT EXISTS idx_vendor_domains_verified ON vendor_domains(verified);

-- Create or replace inventory summary function for bulk queries
CREATE OR REPLACE FUNCTION get_inventory_summary()
RETURNS TABLE (
  product_id INTEGER,
  total_quantity NUMERIC,
  total_reserved NUMERIC,
  available NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.product_id,
    SUM(i.quantity) as total_quantity,
    SUM(i.reserved_quantity) as total_reserved,
    SUM(i.quantity - i.reserved_quantity) as available
  FROM inventory i
  GROUP BY i.product_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index for full-text search on products
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- Analyze tables to update statistics for query planner
ANALYZE products;
ANALYZE product_categories;
ANALYZE categories;
ANALYZE inventory;
ANALYZE orders;
ANALYZE order_items;
ANALYZE vendors;
ANALYZE locations;
ANALYZE customers;
ANALYZE reviews;

-- Add comments for documentation
COMMENT ON INDEX idx_products_status IS 'Fast filtering by product status';
COMMENT ON INDEX idx_products_vendor_status IS 'Composite index for vendor product listings';
COMMENT ON INDEX idx_inventory_both IS 'Composite index for inventory lookups by product and location';
COMMENT ON INDEX idx_products_search IS 'Full-text search index for products';

