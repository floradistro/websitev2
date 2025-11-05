/**
 * Add 112g of specific flower products to Charlotte Central inventory
 * Run with: npx tsx scripts/add-flower-inventory-charlotte-central.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'; // Flora Distro
const QUANTITY = 112; // grams

// Products to add
const PRODUCTS = [
  'Garlic Runtz',
  'GMO',
  'Fizz',
  'Lemon Cherry Gelato',
  'Banana Punch',
  'Kush Mintz',
  'Super Boof',
  'Runtz',
  'Black Cherry Gelato',
  'Lemon Tree',
  'Sour Guava',
  'Blue Zushi'
];

async function addInventory() {
  console.log('🚀 Starting inventory addition...\n');

  // 1. Get Charlotte Central location
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id, name')
    .eq('vendor_id', VENDOR_ID)
    .ilike('name', '%charlotte%central%')
    .single();

  if (locationError || !location) {
    console.error('❌ Charlotte Central location not found:', locationError);
    process.exit(1);
  }

  console.log(`✅ Found location: ${location.name} (${location.id})\n`);

  // 2. Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, sku')
    .eq('vendor_id', VENDOR_ID)
    .in('name', PRODUCTS);

  if (productsError || !products) {
    console.error('❌ Failed to fetch products:', productsError);
    process.exit(1);
  }

  console.log(`✅ Found ${products.length} products:\n`);
  products.forEach(p => console.log(`   - ${p.name} (${p.sku})`));
  console.log();

  // Check for missing products
  const foundNames = products.map(p => p.name);
  const missingProducts = PRODUCTS.filter(name =>
    !foundNames.some(found => found.toLowerCase().includes(name.toLowerCase()))
  );

  if (missingProducts.length > 0) {
    console.log('⚠️  Missing products:');
    missingProducts.forEach(name => console.log(`   - ${name}`));
    console.log();
  }

  // 3. Process each product
  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    console.log(`\n📦 Processing: ${product.name}`);

    // Check if inventory record exists
    const { data: existingInventory } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('product_id', product.id)
      .eq('location_id', location.id)
      .single();

    if (existingInventory) {
      // Update existing inventory
      const newQuantity = parseFloat(existingInventory.quantity) + QUANTITY;

      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInventory.id);

      if (updateError) {
        console.error(`   ❌ Failed to update: ${updateError.message}`);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Updated: ${existingInventory.quantity}g → ${newQuantity}g`);

      // Create stock movement record
      await supabase
        .from('stock_movements')
        .insert({
          inventory_id: existingInventory.id,
          product_id: product.id,
          location_id: location.id,
          movement_type: 'adjustment',
          quantity: QUANTITY,
          reference_type: 'manual_adjustment',
          notes: `Added ${QUANTITY}g to Charlotte Central inventory`,
          created_by: VENDOR_ID
        });

      successCount++;
    } else {
      // Create new inventory record
      const { data: newInventory, error: insertError } = await supabase
        .from('inventory')
        .insert({
          product_id: product.id,
          location_id: location.id,
          vendor_id: VENDOR_ID,
          quantity: QUANTITY,
          low_stock_threshold: 28, // 1 oz
          notes: `Initial stock added via script`
        })
        .select()
        .single();

      if (insertError) {
        console.error(`   ❌ Failed to create: ${insertError.message}`);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Created: ${QUANTITY}g`);

      // Create stock movement record
      await supabase
        .from('stock_movements')
        .insert({
          inventory_id: newInventory.id,
          product_id: product.id,
          location_id: location.id,
          movement_type: 'stock_in',
          quantity: QUANTITY,
          reference_type: 'initial_stock',
          notes: `Initial stock of ${QUANTITY}g added to Charlotte Central`,
          created_by: VENDOR_ID
        });

      successCount++;
    }

    // Update product stock_quantity
    await supabase
      .from('products')
      .update({
        stock_quantity: supabase.rpc('get_total_inventory', { p_product_id: product.id }),
        stock_status: 'instock'
      })
      .eq('id', product.id);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully processed: ${successCount} products`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} products`);
  }
  if (missingProducts.length > 0) {
    console.log(`⚠️  Products not found: ${missingProducts.length}`);
  }
  console.log('='.repeat(60) + '\n');
}

addInventory().catch(console.error);
