import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function fixDisplayGroupThemes() {
  console.log('🔧 Fixing display group theme system...\n');

  // Step 1: Make the column nullable
  console.log('1. Making shared_theme column nullable...');
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql_query: 'ALTER TABLE public.tv_display_groups ALTER COLUMN shared_theme DROP NOT NULL;'
  });

  if (alterError) {
    console.error('⚠️  Could not alter column (may already be nullable):', alterError.message);
  } else {
    console.log('✅ Column is now nullable\n');
  }

  // Step 2: Clear existing theme from NATIONS group
  console.log('2. Clearing NATIONS display group shared theme...');
  const { data, error } = await supabase
    .from('tv_display_groups')
    .update({ shared_theme: null })
    .eq('name', 'NATIONS')
    .select();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Successfully cleared shared_theme from NATIONS display group');
  console.log('\n🎉 Done! Menu themes will now apply correctly.\n');
  console.log('   How it works now:');
  console.log('   - If display group theme is NULL → each menu uses its own theme');
  console.log('   - If display group theme is set → overrides all menu themes for visual unity\n');
}

fixDisplayGroupThemes().catch(console.error);
