#!/usr/bin/env node
const { Pool } = require('pg');

const connectionString = `postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function createMissingTables() {
  console.log('🔧 Creating missing wholesale tables...\n');

  try {
    // Create purchase_order_items table
    console.log('Creating purchase_order_items table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        variant_id UUID,

        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10,2) NOT NULL,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 0,
        line_total DECIMAL(10,2) NOT NULL,

        quantity_received INTEGER DEFAULT 0,
        quantity_fulfilled INTEGER DEFAULT 0,

        notes TEXT,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ purchase_order_items created');

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_po_items_product ON purchase_order_items(product_id);`);
    console.log('✅ Indexes created for purchase_order_items');

    // Create inventory_reservations table
    console.log('\nCreating inventory_reservations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_reservations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_id UUID,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

        reservation_type TEXT NOT NULL,
        reference_id UUID NOT NULL,

        quantity INTEGER NOT NULL CHECK (quantity > 0),

        status TEXT DEFAULT 'active',
        expires_at TIMESTAMP WITH TIME ZONE,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ inventory_reservations created');

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product ON inventory_reservations(product_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_inventory_reservations_location ON inventory_reservations(location_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_inventory_reservations_reference ON inventory_reservations(reference_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_inventory_reservations_status ON inventory_reservations(status);`);
    console.log('✅ Indexes created for inventory_reservations');

    // Enable RLS
    console.log('\nEnabling RLS policies...');
    await pool.query(`ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`
      CREATE POLICY IF NOT EXISTS "Vendors can manage PO items for their POs"
        ON purchase_order_items
        FOR ALL
        USING (
          purchase_order_id IN (
            SELECT id FROM purchase_orders
            WHERE vendor_id = current_setting('app.current_vendor_id')::uuid
          )
        );
    `);
    console.log('✅ RLS enabled for purchase_order_items');

    await pool.query(`ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`
      CREATE POLICY IF NOT EXISTS "Vendors can manage their own inventory reservations"
        ON inventory_reservations
        FOR ALL
        USING (
          location_id IN (
            SELECT id FROM locations
            WHERE vendor_id = current_setting('app.current_vendor_id')::uuid
          )
        );
    `);
    console.log('✅ RLS enabled for inventory_reservations');

    // Create triggers
    console.log('\nCreating triggers...');
    await pool.query(`
      CREATE TRIGGER IF NOT EXISTS update_purchase_order_items_updated_at
      BEFORE UPDATE ON purchase_order_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      CREATE TRIGGER IF NOT EXISTS update_inventory_reservations_updated_at
      BEFORE UPDATE ON inventory_reservations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      CREATE TRIGGER IF NOT EXISTS recalculate_po_total_on_item_change
      AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
      FOR EACH ROW
      EXECUTE FUNCTION trigger_recalculate_po_total();
    `);
    console.log('✅ Triggers created');

    console.log('\n✅ All missing tables created successfully!');
    await pool.end();

  } catch (error) {
    console.error('\n❌ Error creating tables:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

createMissingTables();
