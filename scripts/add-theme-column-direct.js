const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function addThemeColumn() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔧 Connecting to Supabase...');
  console.log('   URL:', supabaseUrl);

  // Use the REST API to execute raw SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'tv_menus' AND column_name = 'theme'
          ) THEN
            ALTER TABLE tv_menus ADD COLUMN theme VARCHAR(50) DEFAULT 'midnight-elegance';
            RAISE NOTICE 'Column added successfully';
          ELSE
            RAISE NOTICE 'Column already exists';
          END IF;
        END $$;
      `
    })
  });

  if (response.ok) {
    console.log('✅ SQL executed successfully');
  } else {
    const error = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', error);

    // Try alternative approach: direct Supabase query
    console.log('\n📝 Trying direct approach with Supabase client...');

    const supabase = createClient(supabaseUrl, serviceKey);

    // First, try to query and see if column exists
    const { data: testData, error: testError } = await supabase
      .from('tv_menus')
      .select('id, name, theme')
      .limit(1);

    if (testError && testError.message.includes('column') && testError.message.includes('theme')) {
      console.log('❌ Column definitely does not exist');
      console.log('\n🔨 Using Supabase Management API...');

      // We'll use a workaround: add via the database REST endpoint
      const sqlEndpoint = `${supabaseUrl}/rest/v1/`;
      console.log('   Endpoint:', sqlEndpoint);
      console.log('\n📋 Please run this SQL manually in Supabase dashboard:');
      console.log('   ALTER TABLE tv_menus ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT \'midnight-elegance\';');
    } else if (!testError) {
      console.log('✅ Column already exists!');
      console.log('Found menus:', testData.length);

      // Update menus without themes
      const menusWithoutTheme = testData.filter(m => !m.theme);
      if (menusWithoutTheme.length > 0) {
        console.log(`\n🔄 Setting default theme for ${menusWithoutTheme.length} menus...`);
        for (const menu of menusWithoutTheme) {
          await supabase
            .from('tv_menus')
            .update({ theme: 'midnight-elegance' })
            .eq('id', menu.id);
          console.log(`   ✅ ${menu.name}`);
        }
      }
    }
  }
}

addThemeColumn().catch(console.error);
