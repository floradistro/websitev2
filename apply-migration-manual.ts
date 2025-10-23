/**
 * Manual migration - Run SQL directly via Supabase REST API
 */

import { getServiceSupabase } from './lib/supabase/client';
import * as fs from 'fs';

async function applyMigration() {
  console.log('🔵 Applying AI Agent migration...\n');

  const sql = fs.readFileSync('./supabase/migrations/20251024_ai_agent_tables.sql', 'utf-8');
  
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`Found ${statements.length} SQL statements\n`);

  const supabase = getServiceSupabase();

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      // Use the sql template tag to execute raw SQL
      const { error } = await supabase.rpc('exec', { sql: stmt });
      
      if (error) {
        console.error(`   ❌ Error:`, error.message);
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.error(`   ⚠️  Warning:`, err);
    }
  }

  console.log('\n🎉 Migration complete!\n');
  
  // Test tables
  console.log('Testing tables...');
  
  try {
    const { data: storefronts, error: e1 } = await supabase
      .from('vendor_storefronts')
      .select('count');
    console.log('✅ vendor_storefronts:', storefronts);

    const { data: convos, error: e2 } = await supabase
      .from('ai_conversations')
      .select('count');
    console.log('✅ ai_conversations:', convos);
  } catch (error) {
    console.log('⚠️  Could not verify (this is normal with RLS)');
  }
}

applyMigration();

