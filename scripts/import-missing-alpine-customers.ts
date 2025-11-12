import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as csv from "csv-parse/sync";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function importMissingAlpineCustomers() {
  console.log("📥 IMPORTING MISSING ALPINE CUSTOMERS\n");
  console.log("=".repeat(70) + "\n");

  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  // Read Alpine CSV
  const csvContent = fs.readFileSync("/Users/whale/Downloads/3999-248226-1762914511-rp.csv", "utf-8");
  const alpineCustomers = csv.parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`📊 Alpine export: ${alpineCustomers.length} total records\n`);

  // Build Alpine phone map
  const alpinePhoneMap = new Map<string, any>();

  alpineCustomers.forEach((customer: any) => {
    const mobilePhone = customer.mobile_phone;
    const homePhone = customer.home_phone;
    const phone = mobilePhone || homePhone;

    if (phone && String(phone).trim() !== "") {
      const normalizedPhone = String(phone).replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        if (!alpinePhoneMap.has(normalizedPhone)) {
          alpinePhoneMap.set(normalizedPhone, customer);
        }
      }
    }
  });

  // Get all database customers
  let allDbCustomers: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log("📥 Fetching current database customers...");

  while (hasMore) {
    const { data } = await supabase
      .from("customers")
      .select("id, phone")
      .eq("vendor_id", vendorId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allDbCustomers = [...allDbCustomers, ...data];
      page++;
      if (data.length < pageSize) {
        hasMore = false;
      }
    }
  }

  console.log(`✅ Fetched ${allDbCustomers.length} database customers\n`);

  // Build database phone set
  const dbPhoneSet = new Set<string>();
  allDbCustomers.forEach(customer => {
    if (customer.phone) {
      const normalizedPhone = customer.phone.replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        dbPhoneSet.add(normalizedPhone);
      }
    }
  });

  // Find missing customers
  const missingCustomers: any[] = [];

  alpinePhoneMap.forEach((customer, phone) => {
    if (!dbPhoneSet.has(phone)) {
      missingCustomers.push({
        phone,
        alpineData: customer,
      });
    }
  });

  console.log(`⚠️  Found ${missingCustomers.length} customers to import\n`);
  console.log("=".repeat(70) + "\n");

  if (missingCustomers.length === 0) {
    console.log("✅ No customers to import. All Alpine customers are in database!\n");
    return;
  }

  // Import customers
  let imported = 0;
  let errors = 0;

  console.log("🚀 Starting import...\n");

  for (const missing of missingCustomers) {
    const alpineData = missing.alpineData;

    // Format phone number
    const rawPhone = String(missing.phone);
    let formattedPhone = rawPhone;
    if (rawPhone.length === 10) {
      formattedPhone = `(${rawPhone.substring(0, 3)}) ${rawPhone.substring(3, 6)}-${rawPhone.substring(6)}`;
    }

    // Prepare customer data
    const customerData = {
      vendor_id: vendorId,
      first_name: alpineData.first_name || null,
      last_name: alpineData.last_name || null,
      email: alpineData.email || `${rawPhone}@alpine.local`,
      phone: formattedPhone,
      loyalty_points: parseFloat(alpineData.loyalty_points || 0),
      total_spent: parseFloat(alpineData.total_spent_as_member || 0),
      total_orders: parseInt(alpineData.count_of_sales || 0),
      created_at: alpineData.loyalty_signup_time || new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert(customerData)
        .select();

      if (error) {
        console.error(`❌ Error importing ${alpineData.first_name} ${alpineData.last_name} (${formattedPhone}):`, error.message);
        errors++;
      } else {
        console.log(`✅ Imported: ${alpineData.first_name || ''} ${alpineData.last_name || ''} (${formattedPhone}) - ${customerData.loyalty_points} points`);
        imported++;
      }
    } catch (err: any) {
      console.error(`❌ Unexpected error:`, err.message);
      errors++;
    }

    // Brief pause to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log("\n" + "=".repeat(70) + "\n");
  console.log("📊 IMPORT SUMMARY\n");
  console.log(`✅ Successfully imported: ${imported} customers`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📈 New total: ${allDbCustomers.length + imported} customers`);
  console.log("\n" + "=".repeat(70) + "\n");

  if (errors === 0) {
    console.log("🎉 All missing Alpine customers have been imported!\n");
  } else {
    console.log("⚠️  Some errors occurred. Please review the log above.\n");
  }
}

// Confirmation
console.log("⚠️  ALPINE CUSTOMER IMPORT ⚠️\n");
console.log("This script will:");
console.log("  1. Find all customers in Alpine IQ that are NOT in database");
console.log("  2. Import them with their loyalty points and history");
console.log("  3. Use @alpine.local placeholder if no email exists\n");
console.log("Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n");

setTimeout(() => {
  importMissingAlpineCustomers().catch(console.error);
}, 3000);
