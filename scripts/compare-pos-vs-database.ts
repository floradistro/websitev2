import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as XLSX from "xlsx";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function comparePOSvsDatabase() {
  console.log("🔍 DETAILED COMPARISON: POS Export vs Database\n");
  console.log("=".repeat(70) + "\n");

  // Read POS Excel file
  const workbook = XLSX.readFile("/Users/whale/Downloads/Customer Export.csv");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const posCustomers: any[] = XLSX.utils.sheet_to_json(worksheet);

  // Get database customers - fetch ALL via pagination
  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  let allDbCustomers: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log("📥 Fetching all database customers...");

  while (hasMore) {
    const { data, count } = await supabase
      .from("customers")
      .select("id, first_name, last_name, email, phone, created_at", { count: page === 0 ? "exact" : undefined })
      .eq("vendor_id", vendorId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allDbCustomers = [...allDbCustomers, ...data];
      console.log(`   Fetched ${allDbCustomers.length} customers so far...`);
      page++;
      if (data.length < pageSize) {
        hasMore = false;
      }
    }
  }

  const dbCustomers = allDbCustomers;
  const dbCount = allDbCustomers.length;

  console.log(`✅ Total database customers fetched: ${dbCount}\n`);

  console.log("📊 RAW COUNTS:");
  console.log(`   POS Export: ${posCustomers.length} records`);
  console.log(`   Database: ${dbCount} records`);
  console.log(`   Raw difference: ${posCustomers.length - (dbCount || 0)}\n`);

  // Normalize and dedupe POS data by phone
  const posPhoneMap = new Map<string, any>();
  let posWithPhone = 0;
  let posWithoutPhone = 0;

  posCustomers.forEach(customer => {
    const phone = customer.Phone || customer.phone;
    if (phone && String(phone).trim() !== "") {
      const normalizedPhone = String(phone).replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        // Take first occurrence (oldest)
        if (!posPhoneMap.has(normalizedPhone)) {
          posPhoneMap.set(normalizedPhone, {
            firstName: customer["First Name"] || customer.firstName,
            lastName: customer["Last Name"] || customer.lastName,
            email: customer.Email || customer.email,
            phone: normalizedPhone,
          });
        }
        posWithPhone++;
      }
    } else {
      posWithoutPhone++;
    }
  });

  console.log("📞 POS PHONE ANALYSIS:");
  console.log(`   Records with valid phone: ${posWithPhone}`);
  console.log(`   Records without phone: ${posWithoutPhone}`);
  console.log(`   Unique phone numbers: ${posPhoneMap.size}\n`);

  // Normalize database data by phone
  const dbPhoneMap = new Map<string, any>();
  let dbWithPhone = 0;
  let dbWithoutPhone = 0;

  dbCustomers?.forEach(customer => {
    if (customer.phone) {
      const normalizedPhone = customer.phone.replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        dbPhoneMap.set(normalizedPhone, customer);
        dbWithPhone++;
      } else {
        dbWithoutPhone++;
      }
    } else {
      dbWithoutPhone++;
    }
  });

  console.log("📞 DATABASE PHONE ANALYSIS:");
  console.log(`   Records with valid phone: ${dbWithPhone}`);
  console.log(`   Records without phone: ${dbWithoutPhone}`);
  console.log(`   Unique phone numbers: ${dbPhoneMap.size}\n`);

  console.log("=".repeat(70) + "\n");

  // Find customers in POS but not in DB
  const inPOSNotInDB: string[] = [];
  posPhoneMap.forEach((customer, phone) => {
    if (!dbPhoneMap.has(phone)) {
      inPOSNotInDB.push(phone);
    }
  });

  // Find customers in DB but not in POS
  const inDBNotInPOS: string[] = [];
  dbPhoneMap.forEach((customer, phone) => {
    if (!posPhoneMap.has(phone)) {
      inDBNotInPOS.push(phone);
    }
  });

  // Customers in both
  const inBoth = posPhoneMap.size - inPOSNotInDB.length;

  console.log("🔬 COMPARISON RESULTS:\n");
  console.log(`   ✅ Customers in BOTH systems: ${inBoth}`);
  console.log(`   ⚠️  Customers in POS but NOT in Database: ${inPOSNotInDB.length}`);
  console.log(`   ⚠️  Customers in Database but NOT in POS: ${inDBNotInPOS.length}\n`);

  console.log("=".repeat(70) + "\n");

  if (inPOSNotInDB.length > 0) {
    console.log("📋 SAMPLE: Customers in POS but NOT in Database (first 10):\n");
    inPOSNotInDB.slice(0, 10).forEach((phone) => {
      const customer = posPhoneMap.get(phone);
      console.log(`   Phone: ${phone}`);
      console.log(`   Name: ${customer?.firstName} ${customer?.lastName}`);
      console.log(`   Email: ${customer?.email || 'N/A'}\n`);
    });
  }

  if (inDBNotInPOS.length > 0) {
    console.log("\n📋 SAMPLE: Customers in Database but NOT in POS (first 10):\n");
    inDBNotInPOS.slice(0, 10).forEach((phone) => {
      const customer = dbPhoneMap.get(phone);
      console.log(`   Phone: ${phone}`);
      console.log(`   Name: ${customer?.first_name} ${customer?.last_name}`);
      console.log(`   Email: ${customer?.email || 'N/A'}`);
      console.log(`   Created: ${new Date(customer?.created_at).toLocaleDateString()}\n`);
    });
  }

  console.log("=".repeat(70) + "\n");

  console.log("💡 ANALYSIS:\n");

  if (inPOSNotInDB.length > 0) {
    console.log(`   ⚠️  You have ${inPOSNotInDB.length} customers in POS export that are`);
    console.log(`      NOT in your current database. These may have been:`);
    console.log(`      - Lost during migration`);
    console.log(`      - From a different time period`);
    console.log(`      - Test/invalid customers that were filtered out\n`);
  }

  if (inDBNotInPOS.length > 0) {
    console.log(`   ℹ️  You have ${inDBNotInPOS.length} customers in database that are`);
    console.log(`      NOT in POS export. These could be:`);
    console.log(`      - New customers added after export was created`);
    console.log(`      - Customers from other sources/locations`);
    console.log(`      - Walk-in customers created directly in new system\n`);
  }

  const expectedUniqueCustomers = posPhoneMap.size;
  const actualUniqueCustomers = dbPhoneMap.size;

  console.log(`\n📈 SUMMARY:`);
  console.log(`   Expected unique customers (from POS): ${expectedUniqueCustomers}`);
  console.log(`   Actual unique customers (in database): ${actualUniqueCustomers}`);
  console.log(`   Difference: ${actualUniqueCustomers - expectedUniqueCustomers}`);

  if (actualUniqueCustomers >= expectedUniqueCustomers) {
    console.log(`\n   ✅ GOOD NEWS: You have MORE or equal unique customers than expected!`);
    console.log(`      You did NOT lose customer data during deduplication.`);
  } else {
    console.log(`\n   ⚠️  WARNING: You may have lost ${expectedUniqueCustomers - actualUniqueCustomers} customers.`);
    console.log(`      Review the list above to determine if they need to be restored.`);
  }

  console.log("\n" + "=".repeat(70) + "\n");
}

comparePOSvsDatabase().catch(console.error);
