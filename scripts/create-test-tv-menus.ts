/**
 * Create Test TV Menu Configuration
 * Sets up 3 menus for 2x 85" horizontal TVs side-by-side
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestMenus() {
  console.log('🖥️  Creating Test TV Menu Configuration...\n');
  console.log('Setup: 2x 85" Horizontal TVs Side-by-Side\n');

  // Get Flora vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, store_name')
    .ilike('store_name', '%flora%')
    .single();

  if (!vendor) {
    console.error('❌ Flora vendor not found');
    process.exit(1);
  }

  console.log(`✅ Vendor: ${vendor.store_name} (${vendor.id})\n`);

  // Get vendor's first location
  const { data: location } = await supabase
    .from('locations')
    .select('id, address_1, city, state')
    .eq('vendor_id', vendor.id)
    .limit(1)
    .single();

  const locationId = location?.id || null;
  console.log(`📍 Location: ${location ? `${location.city}, ${location.state}` : 'All Locations'}\n`);

  // Menu configurations
  const menus = [
    {
      name: 'Menu A - Flower Showcase (Left TV)',
      description: 'Premium flowers and exotic strains - optimized for left 85" display',
      menu_type: 'product_menu',
      is_active: true,
      config_data: {
        // Layout
        orientation: 'horizontal',
        isDualMenu: true,

        // Dual menu configuration
        dualMenu: {
          left: {
            category: 'flower', // You'll need to replace with actual category slug
            viewMode: 'card',
            showImages: true,
            priceLocation: 'header'
          },
          right: {
            category: 'premium-flower', // You'll need to replace with actual category slug
            viewMode: 'card',
            showImages: true,
            priceLocation: 'header'
          },
          enableLeftStacking: false,
          enableRightStacking: false
        },

        // Theme - Modern Dark with Blue Accent
        backgroundColor: '#000000',
        fontColor: '#ffffff',
        cardFontColor: '#ffffff',
        containerColor: '#1a1a2e',
        imageBackgroundColor: '#0f3460',

        // Fonts
        titleFont: 'Inter, sans-serif',
        pricingFont: 'Inter, sans-serif',
        cardFont: 'Inter, sans-serif',

        // Sizes (optimized for 85" @ 1080p)
        headerTitleSize: 48,
        cardTitleSize: 20,
        priceSize: 36,
        categorySize: 42,

        // Effects
        containerOpacity: 90,
        borderWidth: 2,
        borderOpacity: 20,
        imageOpacity: 100,
        blurIntensity: 8,
        glowIntensity: 10,

        // Pricing display
        pricingTiersShape: 'circle',
        pricingContainerOpacity: 85,
        pricingBorderWidth: 2,
        pricingBorderOpacity: 20
      }
    },
    {
      name: 'Menu B - Concentrates & Edibles (Right TV)',
      description: 'Concentrates and edibles - optimized for right 85" display',
      menu_type: 'product_menu',
      is_active: true,
      config_data: {
        // Layout
        orientation: 'horizontal',
        isDualMenu: true,

        // Dual menu configuration
        dualMenu: {
          left: {
            category: 'concentrates',
            viewMode: 'table',
            showImages: true,
            priceLocation: 'inline'
          },
          right: {
            category: 'edibles',
            viewMode: 'card',
            showImages: true,
            priceLocation: 'header'
          },
          enableLeftStacking: false,
          enableRightStacking: false
        },

        // Theme - Modern Dark with Purple Accent
        backgroundColor: '#000000',
        fontColor: '#ffffff',
        cardFontColor: '#ffffff',
        containerColor: '#16213e',
        imageBackgroundColor: '#533483',

        // Fonts
        titleFont: 'Inter, sans-serif',
        pricingFont: 'Inter, sans-serif',
        cardFont: 'Inter, sans-serif',

        // Sizes
        headerTitleSize: 48,
        cardTitleSize: 20,
        priceSize: 36,
        categorySize: 42,

        // Effects
        containerOpacity: 90,
        borderWidth: 2,
        borderOpacity: 20,
        imageOpacity: 100,
        blurIntensity: 8,
        glowIntensity: 10,

        // Pricing display
        pricingTiersShape: 'circle',
        pricingContainerOpacity: 85,
        pricingBorderWidth: 2,
        pricingBorderOpacity: 20
      }
    },
    {
      name: 'Menu C - Daily Specials (Both TVs)',
      description: 'Today\'s deals and featured products - synchronized across both displays',
      menu_type: 'product_menu',
      is_active: true,
      config_data: {
        // Layout - Single wide menu
        orientation: 'horizontal',
        isDualMenu: false,

        // Single menu configuration
        singleMenu: {
          category: 'specials', // Daily specials category
          viewMode: 'card',
          showImages: true,
          priceLocation: 'header'
        },

        // Theme - Bold with Green Accent (Cannabis theme)
        backgroundColor: '#000000',
        fontColor: '#ffffff',
        cardFontColor: '#ffffff',
        containerColor: '#1a1a1a',
        imageBackgroundColor: '#2d4a2b',

        // Fonts
        titleFont: 'Inter, sans-serif',
        pricingFont: 'Inter, sans-serif',
        cardFont: 'Inter, sans-serif',

        // Sizes - Larger for wide display
        headerTitleSize: 64,
        cardTitleSize: 24,
        priceSize: 42,
        categorySize: 48,

        // Effects - More prominent
        containerOpacity: 95,
        borderWidth: 3,
        borderOpacity: 30,
        imageOpacity: 100,
        blurIntensity: 10,
        glowIntensity: 15,

        // Pricing display
        pricingTiersShape: 'rectangle',
        pricingContainerOpacity: 90,
        pricingBorderWidth: 3,
        pricingBorderOpacity: 25
      }
    }
  ];

  console.log('📋 Creating menus...\n');

  const createdMenus = [];

  for (let i = 0; i < menus.length; i++) {
    const menuData = menus[i];

    try {
      const { data: menu, error } = await supabase
        .from('tv_menus')
        .insert({
          vendor_id: vendor.id,
          location_id: locationId,
          ...menuData
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${menuData.name}:`, error.message);
        continue;
      }

      createdMenus.push(menu);
      console.log(`✅ Created: ${menuData.name}`);
      console.log(`   ID: ${menu.id}`);
      console.log(`   Type: ${menu.menu_type}`);
      console.log(`   Active: ${menu.is_active ? 'Yes' : 'No'}\n`);

    } catch (err: any) {
      console.error(`❌ Error creating menu:`, err.message);
    }
  }

  if (createdMenus.length === 0) {
    console.error('❌ No menus were created');
    process.exit(1);
  }

  console.log('\n🎉 Test Menus Created Successfully!\n');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📺 TV SETUP GUIDE');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('🖥️  HARDWARE SETUP:');
  console.log('   • 2x 85" TVs mounted horizontally side-by-side');
  console.log('   • Each TV running Chrome/Firefox in fullscreen\n');

  console.log('📱 TV #1 (LEFT DISPLAY):');
  console.log(`   URL: http://localhost:3000/tv-display?vendor_id=${vendor.id}&location_id=${locationId || ''}&tv_number=1`);
  console.log('   Shows: Menu A (Flower Showcase)\n');

  console.log('📱 TV #2 (RIGHT DISPLAY):');
  console.log(`   URL: http://localhost:3000/tv-display?vendor_id=${vendor.id}&location_id=${locationId || ''}&tv_number=2`);
  console.log('   Shows: Menu B (Concentrates & Edibles)\n');

  console.log('🔄 ROTATION SCHEDULE (Optional):');
  console.log('   Create schedules to rotate Menu C (Daily Specials) onto both TVs:');
  console.log('   • 9:00 AM - 12:00 PM: Show Menu C on both TVs');
  console.log('   • 12:00 PM - 5:00 PM: TV1=Menu A, TV2=Menu B');
  console.log('   • 5:00 PM - 9:00 PM: Show Menu C on both TVs\n');

  console.log('🎨 THEME COLORS:');
  console.log('   Menu A: Dark with Blue Accent (#0f3460)');
  console.log('   Menu B: Dark with Purple Accent (#533483)');
  console.log('   Menu C: Dark with Green Accent (#2d4a2b)\n');

  console.log('⚡ NEXT STEPS:');
  console.log('   1. Open the URLs on each TV in fullscreen (F11)');
  console.log('   2. Each TV will auto-register as a device');
  console.log('   3. Assign menus to each TV from the vendor dashboard');
  console.log('   4. Create schedules for automated rotation\n');

  console.log('💡 TIPS:');
  console.log('   • Use Menu C for special promotions/happy hour');
  console.log('   • Update categories in each menu\'s config_data');
  console.log('   • Adjust font sizes based on viewing distance');
  console.log('   • Enable auto-refresh for real-time inventory updates\n');

  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('🔗 Access your TV Menu Dashboard:');
  console.log('   http://localhost:3000/vendor/tv-menus\n');

  console.log('✨ Menus created:');
  createdMenus.forEach((menu, idx) => {
    console.log(`   ${idx + 1}. ${menu.name} (ID: ${menu.id})`);
  });
}

createTestMenus()
  .then(() => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
