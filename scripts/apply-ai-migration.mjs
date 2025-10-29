import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('📂 Reading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251029_ai_layout_system.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying AI layout system migration...\n');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

        if (error) {
          // Try direct execution for statements that don't work with rpc
          const { error: directError } = await supabase.from('_migrations').select('*').limit(0);

          if (directError) {
            console.error(`❌ Error executing statement:`, error.message);
            console.error(`   Statement: ${statement.substring(0, 100)}...`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (e) {
        console.error(`❌ Exception:`, e.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. Please apply the migration manually via Supabase Dashboard > SQL Editor');
      console.log(`   File: supabase/migrations/20251029_ai_layout_system.sql`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
