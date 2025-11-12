import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyDedupComplete() {
  console.log("🔍 Verifying deduplication completion...\n");

  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  // Get all customers
  const { data: allCustomers, count } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone, loyalty_points", { count: "exact" })
    .eq("vendor_id", vendorId);

  console.log(`📊 Total customers after cleanup: ${count}\n`);

  if (!allCustomers || allCustomers.length === 0) {
    console.error("No customers found");
    return;
  }

  // Group by normalized phone
  const phoneGroups: Record<string, any[]> = {};

  allCustomers.forEach(customer => {
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

  // Find any remaining duplicates
  const duplicatePhones = Object.entries(phoneGroups).filter(([_, records]) => records.length > 1);

  console.log(`📞 Unique phone numbers: ${Object.keys(phoneGroups).length}`);
  console.log(`❌ Phone numbers with duplicates: ${duplicatePhones.length}\n`);

  if (duplicatePhones.length > 0) {
    console.log("⚠️  WARNING: Still found duplicates:\n");
    duplicatePhones.slice(0, 10).forEach(([phone, records]) => {
      console.log(`Phone: ${phone} (${records.length} records)`);
      records.forEach((rec, i) => {
        console.log(`  [${i + 1}] ${rec.first_name} ${rec.last_name} | ${rec.email} | Points: ${rec.loyalty_points}`);
      });
      console.log('');
    });
  } else {
    console.log("✅ SUCCESS! No remaining duplicates found!\n");
  }

  // Check first 20 customers (what user sees on first page)
  const { data: topCustomers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone, loyalty_points")
    .eq("vendor_id", vendorId)
    .order("loyalty_points", { ascending: false })
    .range(0, 19);

  console.log(`📱 First 20 customers (by loyalty points):\n`);

  const firstPagePhoneGroups: Record<string, any[]> = {};

  topCustomers?.forEach(customer => {
    if (customer.phone) {
      const normalizedPhone = customer.phone.replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        if (!firstPagePhoneGroups[normalizedPhone]) {
          firstPagePhoneGroups[normalizedPhone] = [];
        }
        firstPagePhoneGroups[normalizedPhone].push(customer);
      }
    }
  });

  const firstPageDuplicates = Object.entries(firstPagePhoneGroups).filter(([_, records]) => records.length > 1);

  console.log(`Total cards shown: ${topCustomers?.length || 0}`);
  console.log(`Unique people: ${Object.keys(firstPagePhoneGroups).length}`);
  console.log(`Duplicates on first page: ${firstPageDuplicates.length}\n`);

  if (firstPageDuplicates.length > 0) {
    console.log("⚠️  WARNING: First page still has duplicates:");
    firstPageDuplicates.forEach(([phone, records]) => {
      console.log(`  ${records[0].first_name} ${records[0].last_name} (${records.length} cards)`);
    });
  } else {
    console.log("✅ First page is clean - no duplicate customer cards!\n");
  }
}

verifyDedupComplete().catch(console.error);
