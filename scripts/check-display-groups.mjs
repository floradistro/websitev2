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

async function checkDisplayGroups() {
  console.log('🔍 Checking display groups...\n');

  // Get all display groups
  const { data: groups, error } = await supabase
    .from('tv_display_groups')
    .select('id, name, shared_theme, created_at');

  if (error) {
    console.error('❌ Error fetching display groups:', error);
    return;
  }

  if (!groups || groups.length === 0) {
    console.log('No display groups found');
    return;
  }

  console.log(`Found ${groups.length} display groups:\n`);

  for (const group of groups) {
    console.log(`📺 ${group.name}`);
    console.log(`   ID: ${group.id}`);
    console.log(`   Shared Theme: ${group.shared_theme || '(none - menus use their own themes)'}`);

    // Get members
    const { data: members } = await supabase
      .from('tv_display_group_members')
      .select('device_id, tv_devices(device_name)')
      .eq('group_id', group.id);

    if (members && members.length > 0) {
      console.log(`   Members (${members.length}):`);
      members.forEach(m => {
        console.log(`     - ${m.tv_devices?.device_name || m.device_id}`);
      });
    }

    console.log('');
  }

  // Highlight the issue
  const groupsWithTheme = groups.filter(g => g.shared_theme);
  if (groupsWithTheme.length > 0) {
    console.log('\n⚠️  WARNING: The following groups have shared themes that OVERRIDE menu themes:');
    groupsWithTheme.forEach(g => {
      console.log(`   - "${g.name}" is forcing theme: ${g.shared_theme}`);
    });
    console.log('\n   To let menus use their own themes, clear the shared_theme in Display Groups settings.');
  }
}

checkDisplayGroups().catch(console.error);
