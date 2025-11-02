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

async function checkMenuThemes() {
  console.log('🔍 Checking menu themes...\n');

  // Get all menus
  const { data: menus, error } = await supabase
    .from('tv_menus')
    .select('id, name, theme, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching menus:', error);
    return;
  }

  if (!menus || menus.length === 0) {
    console.log('No menus found');
    return;
  }

  console.log(`Found ${menus.length} menus:\n`);

  menus.forEach((menu, idx) => {
    console.log(`${idx + 1}. ${menu.name}`);
    console.log(`   ID: ${menu.id}`);
    console.log(`   Theme: ${menu.theme || '(null)'}`);
    console.log(`   Created: ${new Date(menu.created_at).toLocaleString()}`);
    console.log('');
  });
}

checkMenuThemes().catch(console.error);
