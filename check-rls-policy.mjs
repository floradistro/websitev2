#!/usr/bin/env node
/**
 * Check RLS policy on loyalty_programs table
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'public' }
})

async function checkPolicy() {
  console.log('🔍 Checking RLS policies on loyalty_programs table...\n')

  // Query pg_policies view
  const query = `
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename = 'loyalty_programs'
    ORDER BY policyname;
  `

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      console.log('⚠️  exec_sql not available, using direct query...\n')

      // Alternative: Use PostgREST to query a table directly
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'loyalty_programs')
        .single()

      if (error) {
        console.log('❌ Cannot query information schema')
        console.log('Manual check needed via Supabase Dashboard:')
        console.log('https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/database/tables')
        return
      }

      console.log('✅ loyalty_programs table exists')
      console.log('\n📝 To check RLS policies, run this SQL in Dashboard:')
      console.log(query)
      return
    }

    const result = await response.json()
    console.log('Policies found:\n')
    console.log(JSON.stringify(result, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📝 Manual check needed. Run this in Supabase SQL Editor:')
    console.log(query)
  }
}

checkPolicy()
