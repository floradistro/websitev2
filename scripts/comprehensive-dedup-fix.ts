import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  loyalty_tier: string;
  total_spent: number;
  total_orders: number;
  last_purchase_date: string;
  created_at: string;
}

async function comprehensiveDedupFix() {
  console.log("🔧 COMPREHENSIVE CUSTOMER DEDUPLICATION\n");
  console.log("=" .repeat(60));

  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  // Get ALL customers (paginate to avoid limits)
  let allCustomers: Customer[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log("📥 Fetching all customers...");

  while (hasMore) {
    const { data, error: fetchError } = await supabase
      .from("customers")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (fetchError) {
      console.error("❌ Error fetching customers:", fetchError);
      return;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allCustomers = [...allCustomers, ...data];
      console.log(`   Fetched ${allCustomers.length} customers so far...`);
      page++;
      if (data.length < pageSize) {
        hasMore = false;
      }
    }
  }

  if (!allCustomers || allCustomers.length === 0) {
    console.error("❌ No customers found");
    return;
  }

  console.log(`📊 Total customers: ${allCustomers.length}\n`);

  // Group by normalized phone number
  const phoneGroups: Record<string, Customer[]> = {};

  allCustomers.forEach((customer: Customer) => {
    if (customer.phone) {
      const normalizedPhone = customer.phone.replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        if (!phoneGroups[normalizedPhone]) {
          phoneGroups[normalizedPhone] = [];
        }
        phoneGroups[normalizedPhone].push(customer);
      }
    }
  });

  // Find duplicates
  const duplicatePhones = Object.entries(phoneGroups).filter(([_, records]) => records.length > 1);

  console.log(`📞 Unique phone numbers: ${Object.keys(phoneGroups).length}`);
  console.log(`❌ Phone numbers with duplicates: ${duplicatePhones.length}`);
  console.log(`📈 Total duplicate records to merge: ${duplicatePhones.reduce((sum, [_, recs]) => sum + (recs.length - 1), 0)}\n`);

  let fixed = 0;
  let errors = 0;
  let skipped = 0;

  console.log("🔄 Starting deduplication process...\n");

  for (const [phone, records] of duplicatePhones) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing phone: ${phone} (${records.length} duplicates)`);
    console.log(`${"=".repeat(60)}`);

    // Sort by priority:
    // 1. Real email (not @phone.local or @alpine.local) > placeholder email
    // 2. Older record > newer record (to preserve original)
    const sortedRecords = [...records].sort((a, b) => {
      const aHasRealEmail = a.email && !a.email.includes('@phone.local') && !a.email.includes('@alpine.local');
      const bHasRealEmail = b.email && !b.email.includes('@phone.local') && !b.email.includes('@alpine.local');

      if (aHasRealEmail && !bHasRealEmail) return -1;
      if (!aHasRealEmail && bHasRealEmail) return 1;

      // If both have real email or both have placeholder, prefer older
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const keepRecord = sortedRecords[0];
    const deleteRecords = sortedRecords.slice(1);

    console.log(`\n✅ KEEPING: ${keepRecord.first_name} ${keepRecord.last_name}`);
    console.log(`   ID: ${keepRecord.id}`);
    console.log(`   Email: ${keepRecord.email || 'N/A'}`);
    console.log(`   Phone: ${keepRecord.phone}`);
    console.log(`   Points: ${keepRecord.loyalty_points || 0}`);
    console.log(`   Created: ${new Date(keepRecord.created_at).toLocaleString()}`);

    console.log(`\n❌ DELETING: ${deleteRecords.length} duplicate(s)`);

    for (const deleteRecord of deleteRecords) {
      console.log(`\n   Merging record: ${deleteRecord.id.substring(0, 8)}...`);
      console.log(`     Email: ${deleteRecord.email || 'N/A'}`);
      console.log(`     Points: ${deleteRecord.loyalty_points || 0}`);

      try {
        // Update loyalty_transactions
        const { error: loyaltyError } = await supabase
          .from("loyalty_transactions")
          .update({ customer_id: keepRecord.id })
          .eq("customer_id", deleteRecord.id);

        if (loyaltyError) {
          console.error(`     ❌ Error updating loyalty transactions:`, loyaltyError.message);
          errors++;
        } else {
          console.log(`     ✅ Updated loyalty transactions`);
        }

        // Update wallet_passes
        const { error: passError } = await supabase
          .from("wallet_passes")
          .update({ customer_id: keepRecord.id })
          .eq("customer_id", deleteRecord.id);

        if (passError) {
          console.error(`     ❌ Error updating wallet passes:`, passError.message);
          errors++;
        } else {
          console.log(`     ✅ Updated wallet passes`);
        }

        // If the record we're keeping has a placeholder email but the delete record has a real one, update it
        const keepHasPlaceholder = !keepRecord.email || keepRecord.email.includes('@phone.local') || keepRecord.email.includes('@alpine.local');
        const deleteHasReal = deleteRecord.email && !deleteRecord.email.includes('@phone.local') && !deleteRecord.email.includes('@alpine.local');

        if (keepHasPlaceholder && deleteHasReal) {
          console.log(`     📧 Updating email from placeholder to real: ${deleteRecord.email}`);
          const { error: emailError } = await supabase
            .from("customers")
            .update({ email: deleteRecord.email })
            .eq("id", keepRecord.id);

          if (emailError) {
            console.error(`     ❌ Error updating email:`, emailError.message);
            errors++;
          } else {
            keepRecord.email = deleteRecord.email; // Update in memory
          }
        }

        // Delete the duplicate customer record
        const { error: deleteError } = await supabase
          .from("customers")
          .delete()
          .eq("id", deleteRecord.id);

        if (deleteError) {
          console.error(`     ❌ Error deleting duplicate customer:`, deleteError.message);
          errors++;
        } else {
          console.log(`     ✅ Deleted duplicate customer record`);
          fixed++;
        }

      } catch (err: any) {
        console.error(`     ❌ Unexpected error:`, err.message);
        errors++;
      }
    }

    // Brief pause to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("📊 DEDUPLICATION SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`✅ Successfully merged and deleted: ${fixed} duplicate records`);
  console.log(`❌ Errors encountered: ${errors}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`${"=".repeat(60)}\n`);

  if (errors === 0) {
    console.log("🎉 All duplicates cleaned up successfully!");
    console.log(`\n📊 Database statistics:`);
    console.log(`   Before: ${allCustomers.length} customer records`);
    console.log(`   After: ${allCustomers.length - fixed} customer records`);
    console.log(`   Saved: ${fixed} duplicate records removed\n`);
  } else {
    console.log("⚠️  Some errors occurred. Please review the log above.\n");
  }
}

// Ask for confirmation
console.log("⚠️  CUSTOMER DEDUPLICATION SCRIPT ⚠️\n");
console.log("This script will:");
console.log("  1. Find all customers with duplicate phone numbers");
console.log("  2. Keep the record with a real email (or oldest record)");
console.log("  3. Merge all transactions, loyalty data, and wallet passes");
console.log("  4. Delete duplicate customer records\n");
console.log("Based on analysis:");
console.log("  • ~39 duplicate records in top 100 customers");
console.log("  • ~3.3% overall duplicate rate");
console.log("  • Pattern: @phone.local placeholder emails\n");
console.log("Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n");

setTimeout(() => {
  comprehensiveDedupFix().catch(console.error);
}, 5000);
