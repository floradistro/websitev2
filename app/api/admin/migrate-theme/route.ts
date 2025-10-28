import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🔧 Running theme column migration...');

    // Use raw SQL query via Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'tv_menus' AND column_name = 'theme'
          ) THEN
            ALTER TABLE tv_menus ADD COLUMN theme VARCHAR(50) DEFAULT 'midnight-elegance';
            RAISE NOTICE 'Column theme added successfully';
          ELSE
            RAISE NOTICE 'Column theme already exists';
          END IF;
        END $$;
      `
    });

    if (error) {
      // If exec_sql doesn't exist, try direct approach
      console.log('exec_sql not available, trying direct insert test');

      // Try to select the column to see if it exists
      const { data: testData, error: testError } = await supabase
        .from('tv_menus')
        .select('id, theme')
        .limit(1);

      if (testError && testError.message.includes('column') && testError.message.includes('theme')) {
        return NextResponse.json({
          success: false,
          message: 'Column does not exist. Please run SQL manually in Supabase dashboard.',
          sql: "ALTER TABLE tv_menus ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'midnight-elegance';"
        });
      }

      if (!testError) {
        console.log('✅ Column already exists!');

        // Update menus without themes
        const { data: allMenus } = await supabase
          .from('tv_menus')
          .select('id, name, theme');

        const menusWithoutTheme = allMenus?.filter(m => !m.theme) || [];

        if (menusWithoutTheme.length > 0) {
          console.log(`Setting default theme for ${menusWithoutTheme.length} menus...`);

          for (const menu of menusWithoutTheme) {
            await supabase
              .from('tv_menus')
              .update({ theme: 'midnight-elegance' })
              .eq('id', menu.id);
          }

          return NextResponse.json({
            success: true,
            message: `Column exists. Updated ${menusWithoutTheme.length} menus with default theme.`
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Column exists and all menus have themes!'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration executed successfully',
      data
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
