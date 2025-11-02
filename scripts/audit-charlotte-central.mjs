#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const CHARLOTTE_LOCATION_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';
const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function header(text) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
  console.log('='.repeat(80));
}

function log(icon, text, color = colors.white) {
  console.log(`${color}${icon} ${text}${colors.reset}`);
}

async function main() {
  header('🏪 CHARLOTTE CENTRAL LOCATION AUDIT');

  // Get location details
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', CHARLOTTE_LOCATION_ID)
    .single();

  if (locationError || !location) {
    console.error('Location query error:', locationError);
    // Try finding by slug instead
    const { data: locationBySlug } = await supabase
      .from('locations')
      .select('*')
      .eq('slug', 'charlotte-central')
      .single();

    if (!locationBySlug) {
      log('❌', 'Location not found!', colors.red);
      process.exit(1);
    }

    // Use the found location
    Object.assign(location || {}, locationBySlug);
  }

  log('📍', `Location: ${location.name}`, colors.green);
  log('  ', `Address: ${location.address}`, colors.cyan);
  log('  ', `Vendor ID: ${location.vendor_id}`, colors.cyan);
  log('  ', `Slug: ${location.slug}`, colors.cyan);

  // Get inventory count
  const { data: inventory, count: inventoryCount } = await supabase
    .from('inventory')
    .select('*, products(*)', { count: 'exact' })
    .eq('location_id', CHARLOTTE_LOCATION_ID)
    .gt('quantity', 0);

  log('📦', `Active Inventory: ${inventoryCount} products`, colors.blue);
  const totalInventoryQty = inventory?.reduce((sum, inv) => sum + Number(inv.quantity), 0) || 0;
  log('  ', `Total Units: ${totalInventoryQty.toFixed(2)}`, colors.cyan);

  // Get order statistics
  const { data: orders, count: orderCount } = await supabase
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .eq('pickup_location_id', CHARLOTTE_LOCATION_ID)
    .eq('status', 'completed');

  log('📋', `Total Completed Orders: ${orderCount}`, colors.blue);

  if (orders && orders.length > 0) {
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const avgOrderValue = totalRevenue / orders.length;
    const uniqueCustomers = new Set(orders.filter(o => o.customer_id).map(o => o.customer_id)).size;

    log('  ', `Total Revenue: $${totalRevenue.toFixed(2)}`, colors.cyan);
    log('  ', `Average Order Value: $${avgOrderValue.toFixed(2)}`, colors.cyan);
    log('  ', `Unique Customers: ${uniqueCustomers}`, colors.cyan);
    log('  ', `Walk-in Sales: ${orders.filter(o => !o.customer_id).length}`, colors.cyan);
  }

  // Get recent orders (last 20)
  header('📊 RECENT ORDERS (Last 20)');

  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      order_number,
      total_amount,
      created_at,
      customer_id,
      customers(first_name, last_name),
      order_items(count)
    `)
    .eq('pickup_location_id', CHARLOTTE_LOCATION_ID)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentOrders && recentOrders.length > 0) {
    recentOrders.forEach((order, i) => {
      const customerName = order.customers
        ? `${order.customers.first_name} ${order.customers.last_name}`
        : 'Walk-in';
      const date = new Date(order.created_at).toLocaleString();
      console.log(`${i + 1}. ${order.order_number} - $${order.total_amount} - ${customerName} - ${date}`);
    });
  } else {
    log('ℹ️ ', 'No recent orders found', colors.yellow);
  }

  // Get loyalty customer statistics
  header('🎁 LOYALTY PROGRAM STATS');

  const { data: loyaltyCustomers } = await supabase
    .from('customer_loyalty')
    .select('*, customers(first_name, last_name, email)')
    .eq('vendor_id', FLORA_VENDOR_ID);

  if (loyaltyCustomers && loyaltyCustomers.length > 0) {
    log('👥', `Total Loyalty Members: ${loyaltyCustomers.length}`, colors.green);

    const tierCounts = loyaltyCustomers.reduce((acc, c) => {
      acc[c.current_tier] = (acc[c.current_tier] || 0) + 1;
      return acc;
    }, {});

    Object.entries(tierCounts).forEach(([tier, count]) => {
      log('  ', `${tier}: ${count} members`, colors.cyan);
    });

    const totalPoints = loyaltyCustomers.reduce((sum, c) => sum + Number(c.points_balance), 0);
    const totalLifetimePoints = loyaltyCustomers.reduce((sum, c) => sum + Number(c.lifetime_points), 0);

    log('  ', `Total Active Points: ${totalPoints}`, colors.cyan);
    log('  ', `Total Lifetime Points: ${totalLifetimePoints}`, colors.cyan);
  }

  // Get Alpine IQ sync status
  header('🔄 ALPINE IQ SYNC STATUS');

  const { data: alpineQueue } = await supabase
    .from('alpine_iq_sync_queue')
    .select('*')
    .eq('vendor_id', FLORA_VENDOR_ID)
    .order('created_at', { ascending: false })
    .limit(10);

  if (alpineQueue && alpineQueue.length > 0) {
    log('⚠️ ', `${alpineQueue.length} items in sync queue`, colors.yellow);
    alpineQueue.forEach(item => {
      const status = item.status === 'pending' ? '⏳' : item.status === 'completed' ? '✅' : '❌';
      console.log(`  ${status} ${item.type} - ${item.status} - Retries: ${item.retry_count}`);
    });
  } else {
    log('✅', 'No items in Alpine IQ sync queue (all synced)', colors.green);
  }

  // Get POS session information
  header('💰 POS SESSIONS');

  const { data: sessions } = await supabase
    .from('pos_sessions')
    .select('*, pos_registers(name), users(first_name, last_name)')
    .eq('location_id', CHARLOTTE_LOCATION_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  if (sessions && sessions.length > 0) {
    log('📱', `Recent Sessions: ${sessions.length}`, colors.green);
    sessions.forEach(session => {
      const status = session.status === 'open' ? '🟢' : '🔴';
      const user = session.users ? `${session.users.first_name} ${session.users.last_name}` : 'Unknown';
      const register = session.pos_registers?.name || 'Unknown';
      console.log(`  ${status} ${register} - ${user} - ${session.status}`);
    });
  }

  header('✅ AUDIT COMPLETE');
}

main().catch(console.error);
