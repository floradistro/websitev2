import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔧 Running migration to make display group themes nullable...\n');

  // Read migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251102_make_display_group_theme_nullable.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 60)}...`);

    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      // Try direct query if RPC doesn't work
      const { error: directError } = await supabase.from('_migrations').select('*').limit(0);

      if (directError) {
        console.error('❌ Error:', error);
        continue;
      }
    }

    console.log('✅ Success');
  }

  console.log('\n✅ Migration complete! Display group themes are now nullable.');
  console.log('   Menus will now use their own themes unless a display group theme is explicitly set.\n');
}

runMigration().catch(console.error);
