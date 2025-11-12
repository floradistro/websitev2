require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  const sql = fs.readFileSync('./supabase/migrations/20250112000000_create_generation_configs.sql', 'utf8');
  
  console.log('Creating generation_configs table...\n');
  
  // Execute via query (this uses the connection pool)
  const { data, error } = await supabase.from('generation_configs').select('*').limit(1);
  
  if (error && error.code === '42P01') {
    console.log('Table does not exist, creating...');
    // Table doesn't exist, need to create it
    // Since we can't execute raw SQL via the client easily, let's create it via API
    console.log('Please run this SQL in Supabase SQL Editor or use supabase CLI');
    console.log(sql);
  } else if (error) {
    console.log('Error checking table:', error);
  } else {
    console.log('Table already exists!');
  }
}

runMigration();
