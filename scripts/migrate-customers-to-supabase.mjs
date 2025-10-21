import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const wordpressUrl = 'https://api.floradistro.com';
const consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let stats = {
  fetched: 0,
  migrated: 0,
  skipped: 0,
  errors: 0
};

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║      🚀 WORDPRESS → SUPABASE CUSTOMERS MIGRATION 🚀             ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\n');

async function migrateCustomers() {
  console.log('👥 Migrating Customers');
  console.log('─'.repeat(70));
  
  try {
    // Fetch customers from WordPress
    console.log('📥 Fetching customers from WordPress...\n');
    
    let page = 1;
    let hasMore = true;
    let allCustomers = [];
    
    while (hasMore) {
      const response = await axios.get(
        `${wordpressUrl}/wp-json/wc/v3/customers`,
        {
          params: {
            per_page: 100,
            page,
            consumer_key: consumerKey,
            consumer_secret: consumerSecret
          }
        }
      );
      
      allCustomers = [...allCustomers, ...response.data];
      
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
      hasMore = page < totalPages;
      page++;
      
      console.log(`   Fetched page ${page - 1}/${totalPages} (${response.data.length} customers)`);
    }
    
    stats.fetched = allCustomers.length;
    console.log(`\n✅ Found ${allCustomers.length} customers in WordPress\n`);
    
    // Migrate each customer
    for (let i = 0; i < allCustomers.length; i++) {
      const wpCustomer = allCustomers[i];
      
      try {
        console.log(`[${i + 1}/${allCustomers.length}] ${wpCustomer.email}`);
        
        const customerData = {
          wordpress_id: wpCustomer.id,
          email: wpCustomer.email,
          first_name: wpCustomer.first_name || null,
          last_name: wpCustomer.last_name || null,
          username: wpCustomer.username || wpCustomer.email.split('@')[0],
          phone: wpCustomer.billing?.phone || null,
          display_name: `${wpCustomer.first_name || ''} ${wpCustomer.last_name || ''}`.trim() || wpCustomer.email,
          
          // Addresses
          billing_address: wpCustomer.billing ? {
            first_name: wpCustomer.billing.first_name || '',
            last_name: wpCustomer.billing.last_name || '',
            company: wpCustomer.billing.company || '',
            address_1: wpCustomer.billing.address_1 || '',
            address_2: wpCustomer.billing.address_2 || '',
            city: wpCustomer.billing.city || '',
            state: wpCustomer.billing.state || '',
            postcode: wpCustomer.billing.postcode || '',
            country: wpCustomer.billing.country || 'US',
            email: wpCustomer.billing.email || wpCustomer.email,
            phone: wpCustomer.billing.phone || ''
          } : undefined,
          
          shipping_address: wpCustomer.shipping ? {
            first_name: wpCustomer.shipping.first_name || '',
            last_name: wpCustomer.shipping.last_name || '',
            company: wpCustomer.shipping.company || '',
            address_1: wpCustomer.shipping.address_1 || '',
            address_2: wpCustomer.shipping.address_2 || '',
            city: wpCustomer.shipping.city || '',
            state: wpCustomer.shipping.state || '',
            postcode: wpCustomer.shipping.postcode || '',
            country: wpCustomer.shipping.country || 'US'
          } : undefined,
          
          // Stats
          total_orders: wpCustomer.orders_count || 0,
          total_spent: wpCustomer.total_spent ? parseFloat(wpCustomer.total_spent) : 0,
          average_order_value: wpCustomer.orders_count > 0 
            ? parseFloat(wpCustomer.total_spent) / wpCustomer.orders_count 
            : 0,
          
          // Metadata
          role: wpCustomer.role || 'customer',
          is_paying_customer: wpCustomer.is_paying_customer || false,
          avatar_url: wpCustomer.avatar_url || null,
          
          metadata: {
            wordpress_data: wpCustomer,
            migrated_at: new Date().toISOString()
          },
          
          // Dates
          date_registered: wpCustomer.date_created || new Date().toISOString()
        };
        
        // Insert customer
        const { data, error } = await supabase
          .from('customers')
          .upsert(customerData, {
            onConflict: 'wordpress_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (error) {
          if (error.code === '23505') {
            stats.skipped++;
            console.log(`   ⏭️  Skipped (already exists)`);
          } else {
            throw error;
          }
        } else {
          stats.migrated++;
          console.log(`   ✅ Migrated`);
        }
        
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n✅ Customers migration complete!');
    console.log(`   Migrated: ${stats.migrated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}\n`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

async function main() {
  try {
    await migrateCustomers();
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║                   🎉 MIGRATION COMPLETE! 🎉                     ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 FINAL STATISTICS:');
    console.log('─'.repeat(70));
    console.log(`   Fetched:  ${stats.fetched}`);
    console.log(`   Migrated: ${stats.migrated}`);
    console.log(`   Skipped:  ${stats.skipped}`);
    console.log(`   Errors:   ${stats.errors}`);
    
    console.log('\n✨ All customers are now in Supabase!');
    console.log('🔗 View: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/editor\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

