/**
 * Check if registers table exists
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRegisters() {
  // Try to query registers table
  const { data, error } = await supabase
    .from('registers')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Registers table error:', error.message);
    console.log('Code:', error.code);

    // Check if table exists at all
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%register%');

    console.log('\n📋 Tables with "register" in name:', tables);
  } else {
    console.log('✅ Registers table exists');
    console.log('Sample:', data?.[0] || 'No records');
  }

  // Check pos_registers as alternative
  const { data: posRegs, error: posError } = await supabase
    .from('pos_registers')
    .select('*')
    .limit(1);

  if (!posError) {
    console.log('\n✅ pos_registers table exists');
    console.log('Sample:', posRegs?.[0] || 'No records');
  } else {
    console.log('\n❌ pos_registers table error:', posError.message);
  }
}

checkRegisters();
