import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createTable() {
  const sql = fs.readFileSync('./create-vendor-storefronts.sql', 'utf-8');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔵 Creating vendor_storefronts table...\n');

  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

  let count = 0;
  for (const stmt of statements) {
    count++;
    const preview = stmt.substring(0, 50).replace(/\n/g, ' ') + '...';
    console.log(`[${count}/${statements.length}] ${preview}`);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: stmt + ';' })
      });
      
      console.log('   ✅ Success\n');
    } catch (err: any) {
      console.log(`   ⚠️  ${err.message}\n`);
    }
  }

  console.log(`\nExecuted ${count} statements.\n`);

  // Verify
  console.log('🔍 Verifying table...');
  const { error } = await supabase.from('vendor_storefronts').select('id').limit(0);
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ vendor_storefronts table exists!\n');
  }
}

createTable();

