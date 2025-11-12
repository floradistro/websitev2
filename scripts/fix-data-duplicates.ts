import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixDuplicates() {
  console.log("🔧 Starting data cleanup and deduplication...\n");

  let fixed = 0;
  let errors = 0;

  // STEP 1: Merge the one duplicate customer (Tameeka Williford)
  console.log("1️⃣  Merging duplicate customer records...\n");

  const duplicateCustomerId1 = "2a25d90e-4e66-4ed1-a7d9-2ce6d51719c0"; // Older, correct spelling
  const duplicateCustomerId2 = "b83f5200-a3f2-41b6-bd00-799cb3c52822"; // Newer, typo

  // Merge: Keep the older record (better spelling), update with any missing data from newer
  const { data: oldRecord } = await supabase
    .from("customers")
    .select("*")
    .eq("id", duplicateCustomerId1)
    .single();

  const { data: newRecord } = await supabase
    .from("customers")
    .select("*")
    .eq("id", duplicateCustomerId2)
    .single();

  if (oldRecord && newRecord) {
    console.log(`   Merging: ${oldRecord.first_name} ${oldRecord.last_name}`);
    console.log(`   Old ID: ${duplicateCustomerId1}`);
    console.log(`   New ID: ${duplicateCustomerId2} (will be deleted)\n`);

    // Update any references to point to the old (correct) record
    const { error: updateTxError } = await supabase
      .from("transactions")
      .update({ customer_id: duplicateCustomerId1 })
      .eq("customer_id", duplicateCustomerId2);

    if (updateTxError) {
      console.error("   ❌ Error updating transactions:", updateTxError);
      errors++;
    } else {
      console.log("   ✅ Updated transaction references");
      fixed++;
    }

    const { error: updateLoyaltyError } = await supabase
      .from("loyalty_transactions")
      .update({ customer_id: duplicateCustomerId1 })
      .eq("customer_id", duplicateCustomerId2);

    if (updateLoyaltyError) {
      console.error("   ❌ Error updating loyalty transactions:", updateLoyaltyError);
      errors++;
    } else {
      console.log("   ✅ Updated loyalty transaction references");
      fixed++;
    }

    const { error: updatePassesError } = await supabase
      .from("wallet_passes")
      .update({ customer_id: duplicateCustomerId1 })
      .eq("customer_id", duplicateCustomerId2);

    if (updatePassesError) {
      console.error("   ❌ Error updating wallet passes:", updatePassesError);
      errors++;
    } else {
      console.log("   ✅ Updated wallet pass references");
      fixed++;
    }

    // Use the lowercase email (more standard)
    const { error: updateEmailError } = await supabase
      .from("customers")
      .update({ email: newRecord.email.toLowerCase() })
      .eq("id", duplicateCustomerId1);

    if (updateEmailError) {
      console.error("   ❌ Error updating email:", updateEmailError);
      errors++;
    } else {
      console.log("   ✅ Standardized email to lowercase");
      fixed++;
    }

    // Delete the duplicate record
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", duplicateCustomerId2);

    if (deleteError) {
      console.error("   ❌ Error deleting duplicate:", deleteError);
      errors++;
    } else {
      console.log("   ✅ Deleted duplicate customer record");
      fixed++;
    }
  }

  // STEP 2: Clean up orphaned wallet passes
  console.log("\n2️⃣  Cleaning up orphaned wallet passes...\n");

  const { data: allPasses } = await supabase
    .from("wallet_passes")
    .select("*");

  const { data: validCustomers } = await supabase
    .from("customers")
    .select("id");

  const validCustomerIds = new Set(validCustomers?.map(c => c.id) || []);

  const orphanedPasses = allPasses?.filter(p => !validCustomerIds.has(p.customer_id)) || [];

  console.log(`   Found ${orphanedPasses.length} orphaned passes`);

  for (const pass of orphanedPasses) {
    console.log(`   Deleting orphaned pass: ${pass.serial_number} (customer ${pass.customer_id.substring(0, 8)}...)`);

    const { error } = await supabase
      .from("wallet_passes")
      .delete()
      .eq("id", pass.id);

    if (error) {
      console.error(`     ❌ Error:`, error);
      errors++;
    } else {
      fixed++;
    }
  }

  if (orphanedPasses.length > 0) {
    console.log(`   ✅ Deleted ${orphanedPasses.length} orphaned passes`);
  }

  // STEP 3: Remove duplicate wallet passes (same customer, multiple active passes)
  console.log("\n3️⃣  Removing duplicate wallet passes...\n");

  const { data: remainingPasses } = await supabase
    .from("wallet_passes")
    .select("*")
    .order("created_at", { ascending: false });

  const passesByCustomer = (remainingPasses || []).reduce((acc: any, pass) => {
    if (!acc[pass.customer_id]) acc[pass.customer_id] = [];
    acc[pass.customer_id].push(pass);
    return acc;
  }, {});

  for (const [customerId, passes] of Object.entries(passesByCustomer) as any) {
    if (passes.length > 1) {
      const { data: cust } = await supabase
        .from("customers")
        .select("first_name, last_name")
        .eq("id", customerId)
        .single();

      console.log(`   Customer ${cust?.first_name} ${cust?.last_name} has ${passes.length} passes`);

      // Keep the most recent pass, delete older ones
      const passesToDelete = passes.slice(1);

      for (const pass of passesToDelete) {
        console.log(`     Deleting older pass: ${pass.serial_number}`);

        const { error } = await supabase
          .from("wallet_passes")
          .delete()
          .eq("id", pass.id);

        if (error) {
          console.error(`       ❌ Error:`, error);
          errors++;
        } else {
          fixed++;
        }
      }

      console.log(`   ✅ Kept most recent pass, deleted ${passesToDelete.length} duplicate(s)`);
    }
  }

  // STEP 4: Clean up orphaned loyalty transactions
  console.log("\n4️⃣  Cleaning up orphaned loyalty transactions...\n");

  const { data: allLoyaltyTx } = await supabase
    .from("loyalty_transactions")
    .select("*");

  const orphanedLoyalty = allLoyaltyTx?.filter(tx => !validCustomerIds.has(tx.customer_id)) || [];

  console.log(`   Found ${orphanedLoyalty.length} orphaned loyalty transactions`);

  for (const tx of orphanedLoyalty) {
    const { error } = await supabase
      .from("loyalty_transactions")
      .delete()
      .eq("id", tx.id);

    if (error) {
      console.error(`   ❌ Error:`, error);
      errors++;
    } else {
      fixed++;
    }
  }

  if (orphanedLoyalty.length > 0) {
    console.log(`   ✅ Deleted ${orphanedLoyalty.length} orphaned loyalty transactions`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 CLEANUP SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully fixed: ${fixed} items`);
  console.log(`❌ Errors encountered: ${errors} items`);
  console.log("=".repeat(60));

  if (errors === 0) {
    console.log("\n🎉 All duplicates and orphaned data cleaned up successfully!");
    console.log("\n✨ Database is now clean and optimized!");
  } else {
    console.log("\n⚠️  Some errors occurred. Please review the log above.");
  }
}

// Ask for confirmation before running
console.log("⚠️  DATA CLEANUP SCRIPT ⚠️\n");
console.log("This script will:");
console.log("  1. Merge the 1 duplicate customer (Tameeka Williford)");
console.log("  2. Delete 8 orphaned wallet passes");
console.log("  3. Remove duplicate wallet passes");
console.log("  4. Clean up orphaned loyalty transactions\n");
console.log("Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n");

setTimeout(() => {
  fixDuplicates().catch(console.error);
}, 5000);
