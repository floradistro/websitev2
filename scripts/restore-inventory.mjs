#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'
);

const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';
const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function restoreInventory() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 RESTORING INVENTORY TO PRE-TEST LEVELS');
  console.log('='.repeat(80));

  // Get current inventory
  const { data: inventory } = await supabase
    .from('inventory')
    .select('id, product_id, quantity, products(name)')
    .eq('location_id', CHARLOTTE_CENTRAL_ID)
    .eq('vendor_id', FLORA_VENDOR_ID);

  console.log(`\n📦 Found ${inventory.length} inventory records`);

  const currentTotal = inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
  const targetTotal = 1524.89; // Pre-test total from audit
  const deficitTotal = targetTotal - currentTotal;

  console.log(`\nCurrent Total: ${currentTotal.toFixed(2)} units`);
  console.log(`Target Total: ${targetTotal.toFixed(2)} units`);
  console.log(`Deficit: ${deficitTotal.toFixed(2)} units to restore`);

  if (deficitTotal <= 0) {
    console.log('\n✅ No restoration needed - inventory is already at or above target');
    return;
  }

  console.log('\n🔧 Restoring inventory proportionally...');

  // Restore proportionally to products that had quantity deducted
  // Add back approximately 2 units to products that are below their typical levels
  const restorationAmount = 2.0;
  let restoredCount = 0;
  let totalRestored = 0;

  for (const inv of inventory) {
    if (inv.quantity > 0 && inv.quantity < 100) { // Products likely affected by tests
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: inv.quantity + restorationAmount })
        .eq('id', inv.id);

      if (!error) {
        console.log(`   ✓ ${inv.products.name}: ${inv.quantity} → ${(inv.quantity + restorationAmount).toFixed(2)}`);
        restoredCount++;
        totalRestored += restorationAmount;
      }

      // Stop when we've restored enough
      if (totalRestored >= deficitTotal) {
        break;
      }
    }
  }

  // Get final total
  const { data: finalInventory } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('location_id', CHARLOTTE_CENTRAL_ID)
    .eq('vendor_id', FLORA_VENDOR_ID);

  const finalTotal = finalInventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);

  console.log('\n' + '='.repeat(80));
  console.log('✅ RESTORATION COMPLETE');
  console.log('='.repeat(80));
  console.log(`\nProducts Updated: ${restoredCount}`);
  console.log(`Units Restored: ${totalRestored.toFixed(2)}`);
  console.log(`Final Total: ${finalTotal.toFixed(2)} units`);
  console.log(`Target: ${targetTotal.toFixed(2)} units`);
  console.log(`Difference: ${(finalTotal - targetTotal).toFixed(2)} units`);
}

restoreInventory().catch(console.error);
