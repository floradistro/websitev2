import { getServiceSupabase } from '../lib/supabase/client';

async function addIndexes() {
  const supabase = getServiceSupabase();
  
  const indexes = [
    // Products indexes
    `CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`,
    `CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`,
    `CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured)`,
    `CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(on_sale)`,
    `CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)`,
    `CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON products(vendor_id, status)`,
    
    // Product Categories
    `CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_product_categories_both ON product_categories(product_id, category_id)`,
    
    // Categories
    `CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)`,
    
    // Product Images
    `CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(product_id, position)`,
    
    // Inventory
    `CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory(location_id)`,
    `CREATE INDEX IF NOT EXISTS idx_inventory_both ON inventory(product_id, location_id)`,
    `CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON inventory(updated_at DESC)`,
    
    // Stock Movements
    `CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_stock_movements_location_id ON stock_movements(location_id)`,
    `CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC)`,
    
    // Orders
    `CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id)`,
    
    // Order Items
    `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)`,
    
    // Customers
    `CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`,
    `CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC)`,
    
    // Vendors
    `CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status)`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email)`,
    
    // Locations
    `CREATE INDEX IF NOT EXISTS idx_locations_vendor_id ON locations(vendor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_locations_slug ON locations(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active)`,
    
    // Reviews
    `CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)`,
  ];

  console.log('Adding performance indexes...');
  
  for (const query of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`Note: ${query.substring(0, 50)}... - ${error.message}`);
      } else {
        console.log(`✓ ${query.substring(0, 60)}...`);
      }
    } catch (err) {
      console.log(`Skipping: ${query.substring(0, 50)}...`);
    }
  }
  
  console.log('\nIndexes setup complete!');
}

addIndexes().catch(console.error);

