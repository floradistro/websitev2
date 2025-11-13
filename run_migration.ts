import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('Running Marketing Studio migration...')

  const sql = fs.readFileSync('fix_marketing_studio.sql', 'utf8')

  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }

  console.log('Migration completed successfully!')
  console.log(data)
}

runMigration()
