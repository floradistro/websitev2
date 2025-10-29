/**
 * Migration: Add pricing display configuration columns to tv_display_groups
 * Run with: node scripts/migrate-pricing-columns.js
 */

const { createClient } = require('@supabase/supabase-js');

async function migrate() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📊 Running migration: Add pricing display columns...\n');

  try {
    // Execute SQL using Supabase client
    // Note: This uses raw SQL through Supabase's SQL endpoint
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        -- Add pricing display configuration to display groups
        ALTER TABLE tv_display_groups
        ADD COLUMN IF NOT EXISTS shared_hero_price_tier TEXT DEFAULT '3_5g',
        ADD COLUMN IF NOT EXISTS shared_price_display_mode TEXT DEFAULT 'hero_with_supporting';

        -- Add comments
        COMMENT ON COLUMN tv_display_groups.shared_hero_price_tier IS 'Which price tier to highlight for all displays in group (e.g., 1g, 3_5g, 7g, 14g, 28g)';
        COMMENT ON COLUMN tv_display_groups.shared_price_display_mode IS 'How to display prices: hero_only, hero_with_supporting, all_tiers, minimal';
      `
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);

      console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
      console.log('─'.repeat(60));
      console.log(`
ALTER TABLE tv_display_groups
ADD COLUMN IF NOT EXISTS shared_hero_price_tier TEXT DEFAULT '3_5g',
ADD COLUMN IF NOT EXISTS shared_price_display_mode TEXT DEFAULT 'hero_with_supporting';

COMMENT ON COLUMN tv_display_groups.shared_hero_price_tier IS 'Which price tier to highlight for all displays in group (e.g., 1g, 3_5g, 7g, 14g, 28g)';
COMMENT ON COLUMN tv_display_groups.shared_price_display_mode IS 'How to display prices: hero_only, hero_with_supporting, all_tiers, minimal';
      `);
      console.log('─'.repeat(60));
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Added columns:');
    console.log('   • shared_hero_price_tier (default: 3_5g)');
    console.log('   • shared_price_display_mode (default: hero_with_supporting)');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

migrate();
