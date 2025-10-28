const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function addThemeColumn() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔧 Step 1: Creating helper function...');

  // First, create a function that can run DDL
  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION add_theme_column_to_tv_menus()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tv_menus' AND column_name = 'theme'
  ) THEN
    ALTER TABLE tv_menus ADD COLUMN theme VARCHAR(50) DEFAULT 'midnight-elegance';
    RETURN 'Column added successfully';
  ELSE
    RETURN 'Column already exists';
  END IF;
END;
$$;
  `;

  try {
    // Try to create the function via direct query
    const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    });

    if (createError) {
      console.log('⚠️  Cannot create function directly. Trying alternative...');

      // Alternative: Just try to query the column to see if it exists
      const { data: testData, error: testError } = await supabase
        .from('tv_menus')
        .select('id, theme')
        .limit(1);

      if (testError) {
        console.log('\n❌ Column does not exist and cannot be added via API.');
        console.log('\n📋 Please run this SQL manually in Supabase dashboard:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ALTER TABLE tv_menus ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT \'midnight-elegance\';');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🔗 Open SQL Editor: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new');
        return;
      }

      console.log('✅ Column already exists!');
      console.log(`   Found ${testData.length} menus`);

      // Update menus without themes
      const { data: allMenus } = await supabase
        .from('tv_menus')
        .select('id, name, theme');

      const menusWithoutTheme = allMenus?.filter(m => !m.theme) || [];

      if (menusWithoutTheme.length > 0) {
        console.log(`\n🔄 Setting default theme for ${menusWithoutTheme.length} menus...`);
        for (const menu of menusWithoutTheme) {
          await supabase
            .from('tv_menus')
            .update({ theme: 'midnight-elegance' })
            .eq('id', menu.id);
          console.log(`   ✅ ${menu.name}`);
        }
        console.log('\n✨ All done! Theme system ready!');
      } else {
        console.log('\n✅ All menus already have themes!');
      }
    } else {
      console.log('✅ Function created successfully');

      // Now call the function
      console.log('\n🔧 Step 2: Running function to add column...');
      const { data, error } = await supabase.rpc('add_theme_column_to_tv_menus');

      if (error) {
        console.error('❌ Error calling function:', error);
      } else {
        console.log('✅', data);
        console.log('\n✨ Theme column added successfully!');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

addThemeColumn();
