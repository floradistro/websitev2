import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const wordpressUrl = 'https://api.floradistro.com';
const consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

let stats = {
  orders: { fetched: 0, migrated: 0, skipped: 0, errors: 0 },
  items: { migrated: 0, errors: 0 }
};

// Cache customer and product mappings
const customerMap = new Map(); // WP ID → Supabase UUID
const productMap = new Map(); // WP ID → Supabase UUID

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║      🚀 WORDPRESS → SUPABASE ORDERS MIGRATION 🚀                ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// LOAD MAPPINGS
// ============================================================================

async function loadMappings() {
  console.log('📥 Loading customer & product mappings...\n');
  
  // Load customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id, wordpress_id');
  
  customers?.forEach(c => {
    if (c.wordpress_id) {
      customerMap.set(c.wordpress_id, c.id);
    }
  });
  
  console.log(`   ✅ Loaded ${customerMap.size} customer mappings`);
  
  // Load products
  const { data: products } = await supabase
    .from('products')
    .select('id, wordpress_id');
  
  products?.forEach(p => {
    if (p.wordpress_id) {
      productMap.set(p.wordpress_id, p.id);
    }
  });
  
  console.log(`   ✅ Loaded ${productMap.size} product mappings\n`);
}

// ============================================================================
// MIGRATE ORDERS
// ============================================================================

async function migrateOrders() {
  console.log('📦 Migrating Orders');
  console.log('─'.repeat(70));
  
  try {
    console.log('📥 Fetching orders from WordPress...\n');
    
    let page = 1;
    let hasMore = true;
    let allOrders = [];
    
    while (hasMore) {
      const response = await axios.get(
        `${wordpressUrl}/wp-json/wc/v3/orders`,
        {
          params: {
            per_page: 100,
            page,
            orderby: 'date',
            order: 'desc',
            consumer_key: consumerKey,
            consumer_secret: consumerSecret
          }
        }
      );
      
      allOrders = [...allOrders, ...response.data];
      
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
      hasMore = page < totalPages;
      page++;
      
      console.log(`   Fetched page ${page - 1}/${totalPages} (${response.data.length} orders)`);
    }
    
    stats.orders.fetched = allOrders.length;
    console.log(`\n✅ Found ${allOrders.length} orders in WordPress\n`);
    
    // Migrate each order
    for (let i = 0; i < allOrders.length; i++) {
      const wpOrder = allOrders[i];
      
      try {
        console.log(`[${i + 1}/${allOrders.length}] Order #${wpOrder.number}`);
        
        // Map customer
        const customerId = customerMap.get(wpOrder.customer_id);
        if (!customerId && wpOrder.customer_id > 0) {
          console.log(`   ⚠️  Customer ${wpOrder.customer_id} not found, skipping`);
          stats.orders.skipped++;
          continue;
        }
        
        // Prepare order data
        const orderData = {
          wordpress_id: wpOrder.id,
          order_number: wpOrder.number,
          customer_id: customerId || null,
          
          status: wpOrder.status,
          payment_status: wpOrder.date_paid ? 'paid' : 'pending',
          fulfillment_status: wpOrder.status === 'completed' ? 'fulfilled' : 'unfulfilled',
          
          subtotal: parseFloat(wpOrder.line_items_subtotal || wpOrder.total || 0),
          tax_amount: parseFloat(wpOrder.total_tax || 0),
          shipping_amount: parseFloat(wpOrder.shipping_total || 0),
          discount_amount: parseFloat(wpOrder.discount_total || 0),
          total_amount: parseFloat(wpOrder.total || 0),
          
          currency: wpOrder.currency || 'USD',
          
          billing_address: wpOrder.billing || {},
          shipping_address: wpOrder.shipping || {},
          
          shipping_method: wpOrder.shipping_lines?.[0]?.method_id || null,
          shipping_method_title: wpOrder.shipping_lines?.[0]?.method_title || null,
          
          payment_method: wpOrder.payment_method || null,
          payment_method_title: wpOrder.payment_method_title || null,
          transaction_id: wpOrder.transaction_id || null,
          
          customer_note: wpOrder.customer_note || null,
          customer_ip_address: wpOrder.customer_ip_address || null,
          
          order_date: wpOrder.date_created || new Date().toISOString(),
          paid_date: wpOrder.date_paid || null,
          completed_date: wpOrder.date_completed || null,
          
          metadata: {
            wordpress_data: wpOrder,
            migrated_at: new Date().toISOString()
          }
        };
        
        // Insert order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .upsert(orderData, {
            onConflict: 'wordpress_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (orderError) {
          if (orderError.code === '23505') {
            stats.orders.skipped++;
            console.log(`   ⏭️  Skipped (already exists)`);
            continue;
          } else {
            throw orderError;
          }
        }
        
        // Migrate order items
        if (wpOrder.line_items && wpOrder.line_items.length > 0) {
          for (const wpItem of wpOrder.line_items) {
            try {
              const productId = productMap.get(wpItem.product_id);
              
              const itemData = {
                wordpress_id: wpItem.id,
                order_id: order.id,
                product_id: productId || null,
                wordpress_product_id: wpItem.product_id,
                product_name: wpItem.name,
                product_sku: wpItem.sku || null,
                product_image: wpItem.image?.src || null,
                unit_price: parseFloat(wpItem.price || 0),
                quantity: parseFloat(wpItem.quantity || 1),
                line_subtotal: parseFloat(wpItem.subtotal || 0),
                line_total: parseFloat(wpItem.total || 0),
                tax_amount: parseFloat(wpItem.total_tax || 0),
                meta_data: wpItem.meta_data || {}
              };
              
              await supabase
                .from('order_items')
                .upsert(itemData, {
                  onConflict: 'wordpress_id'
                });
              
              stats.items.migrated++;
            } catch (itemError) {
              stats.items.errors++;
              console.error(`     ❌ Item error: ${itemError.message}`);
            }
          }
        }
        
        stats.orders.migrated++;
        console.log(`   ✅ Migrated (${wpOrder.line_items?.length || 0} items)`);
        
      } catch (error) {
        stats.orders.errors++;
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n✅ Orders migration complete!');
    console.log(`   Migrated: ${stats.orders.migrated} orders, ${stats.items.migrated} items`);
    console.log(`   Skipped: ${stats.orders.skipped}`);
    console.log(`   Errors: ${stats.orders.errors}\n`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    await loadMappings();
    await migrateOrders();
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║                   🎉 MIGRATION COMPLETE! 🎉                     ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 FINAL STATISTICS:');
    console.log('─'.repeat(70));
    console.log(`\n📦 ORDERS:`);
    console.log(`   Fetched:  ${stats.orders.fetched}`);
    console.log(`   Migrated: ${stats.orders.migrated}`);
    console.log(`   Skipped:  ${stats.orders.skipped}`);
    console.log(`   Errors:   ${stats.orders.errors}`);
    
    console.log(`\n🛒 ORDER ITEMS:`);
    console.log(`   Migrated: ${stats.items.migrated}`);
    console.log(`   Errors:   ${stats.items.errors}`);
    
    console.log('\n✨ All orders are now in Supabase!');
    console.log('🔗 View: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/editor\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

