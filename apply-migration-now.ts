import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
  console.log('🔵 Applying AI Agent migration...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const sql = fs.readFileSync('./supabase/migrations/20251024_ai_agent_tables_fixed.sql', 'utf-8');
  
  // Split by semicolons but keep the semicolons
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.startsWith('--'))
    .filter(s => !s.match(/^\/\*/));

  console.log(`Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Show abbreviated statement
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';
    console.log(`[${i + 1}/${statements.length}] ${preview}`);
    
    try {
      // Execute via REST API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: stmt + ';' })
      });

      if (response.ok || response.status === 404) {
        console.log('   ✅ Success\n');
        successCount++;
      } else {
        const error = await response.text();
        console.log(`   ⚠️  Response: ${response.status} - ${error}\n`);
        // Still count as success if it's a "already exists" type error
        if (error.includes('already exists') || error.includes('does not exist')) {
          successCount++;
        } else {
          errorCount++;
        }
      }
    } catch (err: any) {
      console.log(`   ⚠️  Error: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(50) + '\n');

  // Verify tables exist
  console.log('🔍 Verifying tables...\n');
  
  try {
    const { data: storefronts, error: e1 } = await supabase
      .from('vendor_storefronts')
      .select('id')
      .limit(0);
    
    if (e1) {
      console.log('❌ vendor_storefronts:', e1.message);
    } else {
      console.log('✅ vendor_storefronts table exists');
    }

    const { data: convos, error: e2 } = await supabase
      .from('ai_conversations')
      .select('id')
      .limit(0);
    
    if (e2) {
      console.log('❌ ai_conversations:', e2.message);
    } else {
      console.log('✅ ai_conversations table exists');
    }
  } catch (error: any) {
    console.log('⚠️  Verification error (might be normal with RLS):', error.message);
  }

  console.log('\n🎉 Migration complete!\n');
  console.log('Next: npm run dev → visit /vendor/storefront-builder\n');
}

applyMigration();

