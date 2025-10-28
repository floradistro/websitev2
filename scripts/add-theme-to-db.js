const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('📊 Checking theme column in tv_menus table...\n');

  try {
    // Try to select theme column to see if it exists
    const { data: testData, error: testError } = await supabase
      .from('tv_menus')
      .select('id, theme')
      .limit(1);

    if (testError) {
      console.log('❌ Column does not exist yet or error:', testError.message);
      console.log('\n📝 Please run this SQL in your Supabase SQL Editor:\n');
      console.log('ALTER TABLE tv_menus ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT \'midnight-elegance\';\n');
      return;
    }

    console.log('✅ Theme column already exists!');
    console.log('Setting default theme for menus without one...\n');

    // Set default theme for NULL values
    const { data: menus } = await supabase
      .from('tv_menus')
      .select('id, name, theme');

    const menuCount = menus ? menus.length : 0;
    console.log(`Found ${menuCount} menus:`);
    if (menus) {
      menus.forEach(m => {
        console.log(`  - ${m.name}: ${m.theme || '(no theme)'}`);
      });
    }

    const menusWithoutTheme = menus ? menus.filter(m => !m.theme) : [];

    if (menusWithoutTheme.length > 0) {
      console.log(`\nUpdating ${menusWithoutTheme.length} menus to default theme...`);

      for (const menu of menusWithoutTheme) {
        await supabase
          .from('tv_menus')
          .update({ theme: 'midnight-elegance' })
          .eq('id', menu.id);
        console.log(`  ✅ ${menu.name} → Midnight Elegance`);
      }
    } else {
      console.log('\n✅ All menus already have themes!');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

runMigration();
