import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function addThemeColumn() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Adding theme column to tv_menus...');

  // Run the migration SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE tv_menus
      ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'midnight-elegance';
    `
  });

  if (error) {
    console.error('Error:', error);
    console.log('\nTrying direct approach...');

    // Alternative: Update via service role if column already exists
    const { data: menus } = await supabase
      .from('tv_menus')
      .select('id, theme')
      .limit(1);

    if (menus) {
      console.log('✅ Theme column already exists or accessible');

      // Set default theme for menus that don't have one
      const { error: updateError } = await supabase
        .from('tv_menus')
        .update({ theme: 'midnight-elegance' })
        .is('theme', null);

      if (!updateError) {
        console.log('✅ Default theme set for existing menus');
      }
    }
  } else {
    console.log('✅ Theme column added successfully');
  }
}

addThemeColumn();
