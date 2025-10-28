#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('📦 Running wholesale system migration...\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20251027_wholesale_system.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comment-only statements
    if (statement.trim().startsWith('--')) continue;

    try {
      // Use raw SQL execution
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        // Try alternative: direct query
        const { error: directError } = await supabase.from('_').select('*').limit(0);

        console.log(`⚠️  Statement ${i + 1}: ${error.message.substring(0, 100)}`);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          process.stdout.write(`✓ ${successCount}... `);
        }
      }
    } catch (err) {
      console.error(`\n❌ Statement ${i + 1} exception:`, err.message.substring(0, 100));
      errorCount++;
    }
  }

  console.log(`\n\n📊 Migration Results:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${statements.length}`);

  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. This is often normal for:');
    console.log('   - CREATE IF NOT EXISTS (table already exists)');
    console.log('   - DROP ... IF EXISTS (object doesn\'t exist)');
    console.log('   - Policies that already exist');
    console.log('\n💡 Check Supabase Table Editor to verify tables were created');
  } else {
    console.log('\n✅ Migration completed successfully!');
  }
}

runMigration().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
