const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Reading migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251027_wholesale_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📊 Applying wholesale system migration...');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
        console.log(statement.substring(0, 100) + '...');

        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

        if (error) {
          console.error(`❌ Error on statement ${i + 1}:`, error.message);
          // Continue with next statement
        } else {
          console.log(`✓ Statement ${i + 1} completed`);
        }
      }
    }

    console.log('\n✅ Migration application complete!');
    console.log('\nVerifying tables...');

    // Verify tables exist
    const tables = ['suppliers', 'wholesale_customers', 'purchase_orders', 'purchase_order_items', 'purchase_order_payments'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✓ ${table}: ${count || 0} records`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
