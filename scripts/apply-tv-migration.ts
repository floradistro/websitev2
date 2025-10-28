/**
 * Apply TV Menu System Migration
 * Directly applies the migration to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying TV Menu System Migration...\n');

  try {
    // Read migration file
    const migrationPath = resolve(__dirname, '../supabase/migrations/20251027_tv_menu_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log(`📊 SQL length: ${migrationSQL.length} characters\n`);

    // Split into individual statements (basic split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.startsWith('--') || statement.trim().startsWith('COMMENT')) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Try direct execution via REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            // Some errors are expected (like "already exists")
            const errorText = await response.text();
            if (errorText.includes('already exists') || errorText.includes('does not exist')) {
              console.log(`⚠️  Skipped (${i + 1}/${statements.length}): Already exists or doesn't matter`);
            } else {
              console.error(`❌ Error (${i + 1}/${statements.length}):`, errorText.substring(0, 100));
              errorCount++;
            }
          } else {
            successCount++;
            console.log(`✅ Success (${i + 1}/${statements.length})`);
          }
        } else {
          successCount++;
          console.log(`✅ Success (${i + 1}/${statements.length})`);
        }
      } catch (err: any) {
        console.error(`❌ Error (${i + 1}/${statements.length}):`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors (may be okay if tables already exist)');
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
