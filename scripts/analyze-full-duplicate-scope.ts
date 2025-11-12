import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeFullScope() {
  console.log("🔍 Analyzing FULL DATABASE duplicate scope...\n");

  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  // Get ALL customers
  const { data: allCustomers, count } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone, loyalty_points, created_at", { count: "exact" })
    .eq("vendor_id", vendorId);

  console.log(`📊 Total customers in database: ${count}`);
  console.log(`📊 Fetched: ${allCustomers?.length || 0}\n`);

  if (!allCustomers || allCustomers.length === 0) {
    console.error("No customers found");
    return;
  }

  // Group by phone number (normalized - remove all non-digits)
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

  console.log(`📞 Total phone numbers: ${Object.keys(phoneGroups).length}`);

  // Find duplicates by phone
  const duplicatePhones = Object.entries(phoneGroups).filter(([_, records]) => records.length > 1);

  console.log(`❌ Phone numbers with duplicates: ${duplicatePhones.length}`);
  console.log(`❌ Duplicate rate: ${((duplicatePhones.length / Object.keys(phoneGroups).length) * 100).toFixed(1)}%\n`);

  // Count total duplicate records
  let totalDuplicateRecords = 0;
  duplicatePhones.forEach(([_, records]) => {
    totalDuplicateRecords += records.length - 1; // -1 because we keep one
  });

  console.log(`📈 Statistics:`);
  console.log(`   Total customer records: ${count}`);
  console.log(`   Unique phone numbers: ${Object.keys(phoneGroups).length}`);
  console.log(`   Duplicate phone numbers: ${duplicatePhones.length}`);
  console.log(`   Excess duplicate records: ${totalDuplicateRecords}`);
  console.log(`   Records after cleanup: ${(count || 0) - totalDuplicateRecords}\n`);

  // Analyze the pattern
  console.log(`🔬 Analyzing duplicate patterns...\n`);

  let phoneLocalPattern = 0;
  let differentEmailPattern = 0;
  let sameEmailPattern = 0;
  let differentPointsPattern = 0;

  duplicatePhones.slice(0, 50).forEach(([phone, records]) => {
    const hasPhoneLocal = records.some(r => r.email?.includes('@phone.local'));
    const hasAlpineLocal = records.some(r => r.email?.includes('@alpine.local'));
    const emails = [...new Set(records.map(r => r.email).filter(Boolean))];
    const points = [...new Set(records.map(r => r.loyalty_points || 0))];

    if (hasPhoneLocal || hasAlpineLocal) phoneLocalPattern++;
    if (emails.length > 1) differentEmailPattern++;
    if (emails.length === 1) sameEmailPattern++;
    if (points.length > 1) differentPointsPattern++;
  });

  console.log(`Pattern Analysis (first 50 duplicates):`);
  console.log(`   With @phone.local or @alpine.local: ${phoneLocalPattern} (${((phoneLocalPattern / 50) * 100).toFixed(1)}%)`);
  console.log(`   Different emails: ${differentEmailPattern} (${((differentEmailPattern / 50) * 100).toFixed(1)}%)`);
  console.log(`   Same email: ${sameEmailPattern} (${((sameEmailPattern / 50) * 100).toFixed(1)}%)`);
  console.log(`   Different points: ${differentPointsPattern} (${((differentPointsPattern / 50) * 100).toFixed(1)}%)\n`);

  // Show sample duplicates
  console.log(`📋 Sample duplicates (first 10):\n`);

  duplicatePhones.slice(0, 10).forEach(([phone, records], idx) => {
    console.log(`${idx + 1}. Phone: ${phone} (${records.length} records)`);
    records.forEach((rec, i) => {
      console.log(`   [${i + 1}] ${rec.first_name} ${rec.last_name} | Email: ${rec.email || 'N/A'} | Points: ${rec.loyalty_points || 0} | ID: ${rec.id.substring(0, 8)}...`);
    });
    console.log('');
  });

  // Check for extreme cases
  const extremeCases = duplicatePhones.filter(([_, records]) => records.length > 2);
  if (extremeCases.length > 0) {
    console.log(`\n⚠️  EXTREME CASES (more than 2 duplicates):`);
    console.log(`   Found: ${extremeCases.length} phone numbers with 3+ records\n`);
    extremeCases.slice(0, 5).forEach(([phone, records]) => {
      console.log(`   Phone ${phone}: ${records.length} records`);
      records.forEach((rec, i) => {
        console.log(`     [${i + 1}] ${rec.first_name} ${rec.last_name} | ${rec.email}`);
      });
      console.log('');
    });
  }
}

analyzeFullScope().catch(console.error);
