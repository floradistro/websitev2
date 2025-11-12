import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkActualDuplicates() {
  console.log("🔍 Checking for actual database duplicates...\n");

  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  // Get first page of customers (sorted by loyalty points, just like the UI)
  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone, loyalty_points, created_at")
    .eq("vendor_id", vendorId)
    .order("loyalty_points", { ascending: false })
    .range(0, 19);

  if (!customers) {
    console.error("No customers found");
    return;
  }

  console.log(`📋 First 20 customers on the page:\n`);

  // Group by full name
  const nameGroups: Record<string, any[]> = {};

  customers.forEach(customer => {
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    if (!nameGroups[fullName]) {
      nameGroups[fullName] = [];
    }
    nameGroups[fullName].push(customer);
  });

  // Find duplicates
  let duplicateCount = 0;
  Object.entries(nameGroups).forEach(([name, records]) => {
    if (records.length > 1) {
      duplicateCount++;
      console.log(`\n❌ DUPLICATE: ${name}`);
      records.forEach((rec, i) => {
        console.log(`   [${i + 1}] ID: ${rec.id.substring(0, 8)}... | Phone: ${rec.phone || 'N/A'} | Email: ${rec.email || 'N/A'} | Points: ${rec.loyalty_points || 0} | Created: ${new Date(rec.created_at).toLocaleDateString()}`);
      });
    } else {
      console.log(`✅ ${name} (unique)`);
    }
  });

  console.log(`\n\n📊 SUMMARY:`);
  console.log(`Total customers on first page: ${customers.length}`);
  console.log(`Unique names: ${Object.keys(nameGroups).length}`);
  console.log(`Names with duplicates: ${duplicateCount}`);
  console.log(`Duplicate rate: ${((duplicateCount / Object.keys(nameGroups).length) * 100).toFixed(1)}%`);

  // Now check by phone number
  console.log(`\n\n📞 Checking duplicates by PHONE NUMBER:\n`);

  const phoneGroups: Record<string, any[]> = {};

  customers.forEach(customer => {
    if (customer.phone) {
      if (!phoneGroups[customer.phone]) {
        phoneGroups[customer.phone] = [];
      }
      phoneGroups[customer.phone].push(customer);
    }
  });

  let phoneDuplicateCount = 0;
  Object.entries(phoneGroups).forEach(([phone, records]) => {
    if (records.length > 1) {
      phoneDuplicateCount++;
      console.log(`\n❌ DUPLICATE PHONE: ${phone}`);
      records.forEach((rec, i) => {
        console.log(`   [${i + 1}] ${rec.first_name} ${rec.last_name} | ID: ${rec.id.substring(0, 8)}... | Points: ${rec.loyalty_points || 0}`);
      });
    }
  });

  console.log(`\n\n📊 PHONE DUPLICATE SUMMARY:`);
  console.log(`Phone numbers with multiple customers: ${phoneDuplicateCount}`);
  console.log(`Phone duplicate rate: ${((phoneDuplicateCount / Object.keys(phoneGroups).length) * 100).toFixed(1)}%`);
}

checkActualDuplicates().catch(console.error);
