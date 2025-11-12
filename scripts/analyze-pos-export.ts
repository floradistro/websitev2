import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as XLSX from "xlsx";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzePOSExport() {
  console.log("🔍 Analyzing POS Customer Export...\n");

  // Read Excel file
  const workbook = XLSX.readFile("/Users/whale/Downloads/Customer Export.csv");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const posCustomers: any[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 POS Export Statistics:`);
  console.log(`   Total records in export: ${posCustomers.length}`);

  // Show column names
  if (posCustomers.length > 0) {
    console.log(`\n📋 Available columns:`);
    Object.keys(posCustomers[0]).forEach((key, idx) => {
      console.log(`   ${idx + 1}. ${key}`);
    });
  }

  // Show first 5 records
  console.log(`\n📄 First 5 records:\n`);
  posCustomers.slice(0, 5).forEach((customer, idx) => {
    console.log(`${idx + 1}. ${JSON.stringify(customer, null, 2)}\n`);
  });

  // Get current database customers
  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";
  const { data: dbCustomers, count: dbCount } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone", { count: "exact" })
    .eq("vendor_id", vendorId);

  console.log(`\n💾 Current Database Statistics:`);
  console.log(`   Total records in database: ${dbCount}\n`);

  // Try to find matching fields
  console.log(`\n🔬 Analysis:`);
  console.log(`   POS Export has ${posCustomers.length} records`);
  console.log(`   Database has ${dbCount} records`);
  console.log(`   Difference: ${posCustomers.length - (dbCount || 0)} records\n`);

  // Group POS customers by phone to check for duplicates
  const posPhoneGroups: Record<string, any[]> = {};
  posCustomers.forEach(customer => {
    // Try common phone field names
    const phone = customer.Phone || customer.phone || customer.PHONE || customer["Phone Number"] || customer["Mobile Phone"];
    if (phone) {
      const normalizedPhone = String(phone).replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        if (!posPhoneGroups[normalizedPhone]) {
          posPhoneGroups[normalizedPhone] = [];
        }
        posPhoneGroups[normalizedPhone].push(customer);
      }
    }
  });

  const posDuplicates = Object.entries(posPhoneGroups).filter(([_, records]) => records.length > 1);

  console.log(`\n📞 POS Export Duplicate Analysis:`);
  console.log(`   Unique phone numbers: ${Object.keys(posPhoneGroups).length}`);
  console.log(`   Phone numbers with duplicates: ${posDuplicates.length}`);
  console.log(`   Duplicate rate: ${((posDuplicates.length / Object.keys(posPhoneGroups).length) * 100).toFixed(1)}%`);

  if (posDuplicates.length > 0) {
    console.log(`\n   Sample duplicates in POS export:`);
    posDuplicates.slice(0, 3).forEach(([phone, records]) => {
      console.log(`   Phone ${phone}: ${records.length} records`);
    });
  }
}

analyzePOSExport().catch(console.error);
