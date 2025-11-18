#!/usr/bin/env node
/**
 * Verify set_vendor_context function exists
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function verifyFunction() {
  console.log('🔍 Checking if set_vendor_context function exists...\n')

  const { data, error } = await supabase.rpc('sql', {
    query: `
      SELECT
        proname as function_name,
        prosecdef as is_security_definer,
        pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'set_vendor_context';
    `
  })

  if (error) {
    // Try different approach
    console.log('⚠️  sql RPC not available, trying direct query...\n')

    const { data: funcData, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'set_vendor_context')
      .single()

    if (funcError) {
      console.error('❌ Cannot verify function:', funcError.message)
      return
    }

    console.log('✅ Function exists:', funcData)
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ Function set_vendor_context NOT FOUND')
    console.log('Migration may not have been applied successfully')
    return
  }

  console.log('✅ Function exists!')
  console.log('\nDefinition:')
  console.log(data[0].definition)
}

verifyFunction()
