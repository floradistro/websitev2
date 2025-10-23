#!/usr/bin/env node

/**
 * Script to fix orphaned products
 * These products belong to vendor ID: cd2e1122-d511-4edb-be5d-98ef274b4baf
 * which appears to be inactive or deleted
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Checking orphaned products...\n');
  
  const orphanedVendorId = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
  
  // Check if vendor exists
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, store_name, status')
    .eq('id', orphanedVendorId)
    .single();
    
  if (vendor) {
    console.log(`✅ Vendor found: ${vendor.store_name} (Status: ${vendor.status})`);
    
    if (vendor.status !== 'active') {
      console.log('\n⚠️  This vendor is not active.');
      console.log('\nOptions:');
      console.log('1. Reactivate the vendor by updating status to "active"');
      console.log('2. Reassign products to another vendor');
      console.log('3. Delete the products');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\nEnter option (1/2/3): ', async (answer) => {
        if (answer === '1') {
          // Reactivate vendor
          const { error } = await supabase
            .from('vendors')
            .update({ status: 'active' })
            .eq('id', orphanedVendorId);
            
          if (error) {
            console.error('❌ Error reactivating vendor:', error.message);
          } else {
            console.log('✅ Vendor reactivated successfully!');
          }
        } else if (answer === '2') {
          // Show active vendors
          const { data: activeVendors } = await supabase
            .from('vendors')
            .select('id, store_name')
            .eq('status', 'active');
            
          console.log('\nActive vendors:');
          activeVendors.forEach((v, i) => {
            console.log(`${i + 1}. ${v.store_name} (${v.id})`);
          });
          
          readline.question('\nEnter number of vendor to reassign to: ', async (vendorNum) => {
            const targetVendor = activeVendors[parseInt(vendorNum) - 1];
            
            if (targetVendor) {
              const { error } = await supabase
                .from('products')
                .update({ vendor_id: targetVendor.id })
                .eq('vendor_id', orphanedVendorId);
                
              if (error) {
                console.error('❌ Error reassigning products:', error.message);
              } else {
                console.log(`✅ Products reassigned to ${targetVendor.store_name}!`);
              }
            }
            readline.close();
          });
          return;
        } else if (answer === '3') {
          // Delete products
          readline.question('\n⚠️  Are you sure you want to delete all 38 products? (yes/no): ', async (confirm) => {
            if (confirm.toLowerCase() === 'yes') {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('vendor_id', orphanedVendorId);
                
              if (error) {
                console.error('❌ Error deleting products:', error.message);
              } else {
                console.log('✅ Products deleted successfully!');
              }
            }
            readline.close();
          });
          return;
        }
        readline.close();
      });
    }
  } else {
    console.log(`❌ Vendor ${orphanedVendorId} not found in database`);
    console.log('\nThese products are orphaned. Options:');
    console.log('1. Create a new vendor for these products');
    console.log('2. Reassign to an existing vendor');
    console.log('3. Delete the orphaned products');
    
    // Get active vendors
    const { data: activeVendors } = await supabase
      .from('vendors')
      .select('id, store_name')
      .eq('status', 'active');
      
    if (activeVendors && activeVendors.length > 0) {
      console.log('\nActive vendors available:');
      activeVendors.forEach(v => {
        console.log(`  - ${v.store_name} (${v.id})`);
      });
    }
  }
}

main().catch(console.error);
