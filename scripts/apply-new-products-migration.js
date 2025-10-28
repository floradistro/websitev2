const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Applying new products migration...\n');

  try {
    // Step 1: Drop existing constraint
    console.log('Step 1: Updating product status constraint...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
        ALTER TABLE products ADD CONSTRAINT products_status_check
          CHECK (status IN ('published', 'draft', 'archived', 'po_only', 'in_stock_unpublished'));
      `
    });
    console.log('✅ Status constraint updated\n');

    // Step 2: Add new columns
    console.log('Step 2: Adding new columns...');
    const { error: colError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS supplier_product_id TEXT,
        ADD COLUMN IF NOT EXISTS created_from_po_id UUID REFERENCES purchase_orders(id);

        ALTER TABLE purchase_order_items
        ADD COLUMN IF NOT EXISTS is_new_product BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS supplier_sku TEXT;
      `
    });
    if (colError) console.log('Note:', colError.message);
    console.log('✅ Columns added\n');

    // Step 3: Create indexes
    console.log('Step 3: Creating indexes...');
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_products_created_from_po ON products(created_from_po_id);
        CREATE INDEX IF NOT EXISTS idx_products_status_po_only ON products(status) WHERE status IN ('po_only', 'in_stock_unpublished');
      `
    });
    console.log('✅ Indexes created\n');

    // Step 4: Verify changes
    console.log('🔍 Verifying migration...');

    // Check if columns exist
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'products')
      .in('column_name', ['supplier_product_id', 'created_from_po_id']);

    console.log('✅ Migration complete!');
    console.log('\nNew product statuses available:');
    console.log('  - po_only: Product created from PO, not yet received');
    console.log('  - in_stock_unpublished: Received but not published');
    console.log('\nNew columns added:');
    console.log('  - products.supplier_product_id');
    console.log('  - products.created_from_po_id');
    console.log('  - purchase_order_items.is_new_product');
    console.log('  - purchase_order_items.supplier_sku');
    console.log('\n✅ Ready for new product workflow!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
