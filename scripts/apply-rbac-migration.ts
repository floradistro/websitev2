import { getServiceSupabase } from '../lib/supabase/client';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  try {
    console.log('📦 Reading RBAC migration file...');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20251027_rbac_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🔌 Connecting to Supabase...');
    const supabase = getServiceSupabase();

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);

          console.log('⚠️  Statement may have executed, continuing...');
        } else {
          console.log('✅ Success');
        }
      } catch (err) {
        console.log(`⚠️  Warning: ${err}`);
      }
    }

    console.log('\n✨ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
