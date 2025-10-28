const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔄 Applying new products migration...\n');

  try {
    // Step 1: Update status constraint
    console.log('Step 1: Updating product status constraint...');
    const { error: e1 } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
        ALTER TABLE products ADD CONSTRAINT products_status_check
          CHECK (status IN ('draft', 'pending', 'published', 'archived', 'po_only', 'in_stock_unpublished'));
      `
    });

    if (e1) {
      console.log('⚠️  Status constraint might already be updated:', e1.message);
    } else {
      console.log('✅ Status constraint updated');
    }

    // Step 2: Add columns to products
    console.log('\nStep 2: Adding columns to products table...');
    const { error: e2 } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS supplier_product_id TEXT,
        ADD COLUMN IF NOT EXISTS created_from_po_id UUID;
      `
    });

    if (e2) {
      console.log('⚠️  Columns might already exist:', e2.message);
    } else {
      console.log('✅ Columns added to products');
    }

    // Step 3: Add columns to purchase_order_items
    console.log('\nStep 3: Adding columns to purchase_order_items...');
    const { error: e3 } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE purchase_order_items
        ADD COLUMN IF NOT EXISTS is_new_product BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS supplier_sku TEXT;
      `
    });

    if (e3) {
      console.log('⚠️  Columns might already exist:', e3.message);
    } else {
      console.log('✅ Columns added to purchase_order_items');
    }

    // Step 4: Create indexes
    console.log('\nStep 4: Creating indexes...');
    const { error: e4 } = await supabase.rpc('execute_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_products_created_from_po ON products(created_from_po_id);
        CREATE INDEX IF NOT EXISTS idx_products_status_po_only ON products(status) WHERE status IN ('po_only', 'in_stock_unpublished');
      `
    });

    if (e4) {
      console.log('⚠️  Indexes might already exist:', e4.message);
    } else {
      console.log('✅ Indexes created');
    }

    console.log('\n✅ Migration complete!');
    console.log('\nNew features enabled:');
    console.log('  • Product statuses: po_only, in_stock_unpublished');
    console.log('  • Supplier product tracking');
    console.log('  • PO-linked product creation');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
  }
}

applyMigration();
