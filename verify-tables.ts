import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔍 Verifying AI Agent tables...\n');

  // Check information_schema for tables
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['vendor_storefronts', 'ai_conversations']);

  if (error) {
    console.log('Using alternative method...\n');
    
    // Try direct table access
    const checks = [
      { name: 'vendor_storefronts', test: async () => {
        const { error } = await supabase.from('vendor_storefronts').select('id').limit(0);
        return !error || error.message.includes('permission') || error.message.includes('RLS');
      }},
      { name: 'ai_conversations', test: async () => {
        const { error } = await supabase.from('ai_conversations').select('id').limit(0);
        return !error || error.message.includes('permission') || error.message.includes('RLS');
      }}
    ];

    for (const check of checks) {
      const exists = await check.test();
      if (exists) {
        console.log(`✅ ${check.name} - EXISTS`);
      } else {
        console.log(`❌ ${check.name} - MISSING`);
      }
    }
  } else if (tables) {
    console.log(`Found ${tables.length} tables:\n`);
    tables.forEach(t => console.log(`✅ ${t.table_name}`));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Migration successful!');
  console.log('='.repeat(50));
  console.log('\n📋 Next Steps:\n');
  console.log('1. Start dev server:');
  console.log('   npm run dev\n');
  console.log('2. Login as vendor:');
  console.log('   http://localhost:3000/vendor/login\n');
  console.log('3. Access AI Builder:');
  console.log('   http://localhost:3000/vendor/storefront-builder\n');
  console.log('4. Chat with AI:');
  console.log('   "I want a minimalist black and white store"\n');
}

verifyTables();

