/**
 * Check pos_sessions table schema
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkPOSSessions() {
  // Get a sample session to see all columns
  const { data, error } = await supabase
    .from('pos_sessions')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('📋 pos_sessions table columns:\n');
    const keys = Object.keys(data || {});
    keys.forEach((key, i) => {
      console.log(`${(i + 1).toString().padStart(2)}. ${key.padEnd(25)} = ${JSON.stringify(data[key])}`);
    });

    // Check for voided_count column
    console.log('\n🔍 Checking for void-related columns:');
    const voidColumns = keys.filter(k => k.toLowerCase().includes('void'));
    if (voidColumns.length > 0) {
      console.log('✅ Found void columns:', voidColumns);
    } else {
      console.log('❌ No void-related columns found');
      console.log('   (voided_count column is missing - needs to be added)');
    }
  }
}

checkPOSSessions();
