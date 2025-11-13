import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📦 Applying atomic receive function migration...');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20251113070000_atomic_receive_po_items.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct execution if exec_sql doesn't exist
      console.log('Trying direct SQL execution...');

      // Split by statement and execute each
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('create or replace function')) {
          console.log('Creating function...');
          const { error: fnError } = await (supabase as any).rpc('query', {
            query: statement + ';'
          });

          if (fnError) {
            console.error('❌ Error creating function:', fnError);
          } else {
            console.log('✅ Function created successfully');
          }
        }
      }
    } else {
      console.log('✅ Migration applied successfully!');
      console.log(data);
    }
  } catch (err) {
    console.error('❌ Error applying migration:', err);
    process.exit(1);
  }
}

applyMigration();
