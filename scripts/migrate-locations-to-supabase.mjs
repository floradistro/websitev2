import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const wordpressUrl = 'https://api.floradistro.com';
const consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║      📍 LOCATIONS MIGRATION TO SUPABASE 📍                      ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function migrateLocations() {
  try {
    console.log('📥 Fetching locations from Flora Matrix...\n');
    
    const response = await axios.get(
      `${wordpressUrl}/wp-json/flora-im/v1/locations`,
      {
        params: {
          per_page: 100,
          consumer_key: consumerKey,
          consumer_secret: consumerSecret
        }
      }
    );
    
    const wpLocations = response.data;
    console.log(`✅ Found ${wpLocations.length} locations in Flora Matrix\n`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const wpLoc of wpLocations) {
      try {
        console.log(`Processing: ${wpLoc.name}`);
        
        // Determine if this is a vendor location or retail location
        const isVendor = wpLoc.type === 'vendor' || wpLoc.vendor_id > 0;
        const locationType = isVendor ? 'vendor' : 'retail';
        
        const locationData = {
          name: wpLoc.name,
          slug: wpLoc.slug || wpLoc.name.toLowerCase().replace(/\s+/g, '-'),
          type: locationType,
          vendor_id: null, // Will need to map if vendor location
          
          // Address
          address_line1: wpLoc.address_line_1 || wpLoc.address || null,
          address_line2: wpLoc.address_line_2 || null,
          city: wpLoc.city || null,
          state: wpLoc.state || null,
          zip: wpLoc.postal_code || wpLoc.zip || null,
          country: wpLoc.country || 'US',
          
          // Contact
          phone: wpLoc.phone || null,
          email: wpLoc.email || null,
          
          // Settings
          is_default: wpLoc.is_default === '1' || wpLoc.is_default === 1 || wpLoc.is_default === true,
          is_active: wpLoc.is_active === '1' || wpLoc.is_active === 1 || wpLoc.status === 'active',
          accepts_online_orders: true,
          accepts_transfers: true,
          
          settings: {
            wordpress_id: wpLoc.id,
            priority: wpLoc.priority || 0,
            manager_user_id: wpLoc.manager_user_id,
            original_data: wpLoc
          }
        };
        
        // Insert into Supabase
        const { data, error } = await supabase
          .from('locations')
          .insert(locationData)
          .select()
          .single();
        
        if (error) {
          if (error.code === '23505') {
            console.log(`   ⏭️  Already exists`);
            skipped++;
          } else {
            throw error;
          }
        } else {
          migrated++;
          console.log(`   ✅ Migrated (${data.type} location)`);
        }
        
      } catch (error) {
        errors++;
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n✅ Locations migration complete!');
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}\n`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await migrateLocations();
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║                   🎉 MIGRATION COMPLETE! 🎉                     ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    // Show final locations
    const { data: locations } = await supabase
      .from('locations')
      .select('*')
      .order('name');
    
    console.log('📍 All Locations in Supabase:');
    console.log('─'.repeat(70));
    locations.forEach(loc => {
      console.log(`   ${loc.name} (${loc.type}) - ${loc.city}, ${loc.state}`);
    });
    
    console.log('\n✨ All locations are now in Supabase!');
    console.log('🔗 View: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/editor\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

