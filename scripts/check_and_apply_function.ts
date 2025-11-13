import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('🔍 Checking if receive_purchase_order_items function exists...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Try to call the function to see if it exists
  try {
    const { data, error } = await supabase.rpc('receive_purchase_order_items', {
      p_po_id: '00000000-0000-0000-0000-000000000000',
      p_items: [],
      p_vendor_id: '00000000-0000-0000-0000-000000000000'
    });

    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ Function does NOT exist in database');
        console.log('\n📋 To fix this, please:');
        console.log('1. Go to https://uaednwpxursknmwdeejn.supabase.co/project/uaednwpxursknmwdeejn/sql/new');
        console.log('2. Copy and paste the SQL from: supabase/migrations/20251113070000_atomic_receive_po_items.sql');
        console.log('3. Click "Run" to execute the SQL\n');

        // Show the SQL file contents
        const migrationPath = path.join(__dirname, '../supabase/migrations/20251113070000_atomic_receive_po_items.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log('📄 SQL to execute:\n');
        console.log('='.repeat(80));
        console.log(sql);
        console.log('='.repeat(80));
      } else {
        console.log('✅ Function exists! Error is expected (testing with invalid IDs)');
        console.log('Error:', error.message);
      }
    } else {
      console.log('✅ Function exists and responded!');
      console.log('Response:', data);
    }
  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message);
  }
}

main();
