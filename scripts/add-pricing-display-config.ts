/**
 * Add pricing display configuration columns
 * Run with: npx tsx scripts/add-pricing-display-config.ts
 */

import { getServiceSupabase } from '../lib/supabase/client';

async function addPricingDisplayConfig() {
  const supabase = getServiceSupabase();

  console.log('📊 Adding pricing display configuration columns...');

  try {
    // Add columns to tv_menus
    const { error: menuError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE tv_menus
        ADD COLUMN IF NOT EXISTS hero_price_tier TEXT DEFAULT '3_5g',
        ADD COLUMN IF NOT EXISTS price_display_mode TEXT DEFAULT 'hero_with_supporting';
      `
    });

    if (menuError) {
      console.error('Error adding menu columns:', menuError);
    } else {
      console.log('✅ Added columns to tv_menus');
    }

    // Add columns to tv_display_groups
    const { error: groupError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE tv_display_groups
        ADD COLUMN IF NOT EXISTS shared_hero_price_tier TEXT DEFAULT '3_5g',
        ADD COLUMN IF NOT EXISTS shared_price_display_mode TEXT DEFAULT 'hero_with_supporting';
      `
    });

    if (groupError) {
      console.error('Error adding display group columns:', groupError);
    } else {
      console.log('✅ Added columns to tv_display_groups');
    }

    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

addPricingDisplayConfig();
