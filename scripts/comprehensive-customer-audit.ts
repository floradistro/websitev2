import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as csv from "csv-parse/sync";
import * as XLSX from "xlsx";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function comprehensiveCustomerAudit() {
  console.log("🔍 COMPREHENSIVE CUSTOMER DATA AUDIT\n");
  console.log("=".repeat(80) + "\n");

  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  // ==================== LOAD ALL DATA SOURCES ====================

  console.log("📥 Loading all data sources...\n");

  // 1. Load Alpine IQ data
  console.log("   Loading Alpine IQ export...");
  const alpineCSV = fs.readFileSync("/Users/whale/Downloads/3999-248226-1762914511-rp.csv", "utf-8");
  const alpineCustomers = csv.parse(alpineCSV, { columns: true, skip_empty_lines: true });

  const alpinePhoneMap = new Map<string, any>();
  alpineCustomers.forEach((c: any) => {
    const phone = c.mobile_phone || c.home_phone;
    if (phone) {
      const normalized = String(phone).replace(/\D/g, "");
      if (normalized.length >= 10 && !alpinePhoneMap.has(normalized)) {
        alpinePhoneMap.set(normalized, c);
      }
    }
  });
  console.log(`   ✅ Alpine: ${alpinePhoneMap.size} unique customers\n`);

  // 2. Load COVA POS data
  console.log("   Loading COVA POS export...");
  const covaWorkbook = XLSX.readFile("/Users/whale/Downloads/Customer Export.csv");
  const covaSheet = covaWorkbook.Sheets[covaWorkbook.SheetNames[0]];
  const covaCustomers: any[] = XLSX.utils.sheet_to_json(covaSheet);

  const covaPhoneMap = new Map<string, any>();
  covaCustomers.forEach((c: any) => {
    const phone = c.Phone || c.phone;
    if (phone) {
      const normalized = String(phone).replace(/\D/g, "");
      if (normalized.length >= 10 && !covaPhoneMap.has(normalized)) {
        covaPhoneMap.set(normalized, c);
      }
    }
  });
  console.log(`   ✅ COVA: ${covaPhoneMap.size} unique customers\n`);

  // 3. Load current database
  console.log("   Loading current database...");
  let allDbCustomers: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("vendor_id", vendorId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allDbCustomers = [...allDbCustomers, ...data];
      page++;
      if (data.length < pageSize) hasMore = false;
    }
  }

  const dbPhoneMap = new Map<string, any>();
  allDbCustomers.forEach(c => {
    if (c.phone) {
      const normalized = c.phone.replace(/\D/g, "");
      if (normalized.length >= 10) {
        if (dbPhoneMap.has(normalized)) {
          console.log(`      ⚠️  DUPLICATE DETECTED: ${normalized}`);
        }
        dbPhoneMap.set(normalized, c);
      }
    }
  });

  console.log(`   ✅ Database: ${allDbCustomers.length} total customers`);
  console.log(`   ✅ Database: ${dbPhoneMap.size} unique phone numbers\n`);

  console.log("=".repeat(80) + "\n");

  // ==================== AUDIT 1: DUPLICATE CHECK ====================

  console.log("🔬 AUDIT 1: Checking for duplicate phone numbers in database\n");

  const duplicatePhones: string[] = [];
  const phoneCount = new Map<string, number>();

  allDbCustomers.forEach(c => {
    if (c.phone) {
      const normalized = c.phone.replace(/\D/g, "");
      if (normalized.length >= 10) {
        phoneCount.set(normalized, (phoneCount.get(normalized) || 0) + 1);
      }
    }
  });

  phoneCount.forEach((count, phone) => {
    if (count > 1) {
      duplicatePhones.push(phone);
    }
  });

  if (duplicatePhones.length === 0) {
    console.log("   ✅ NO DUPLICATES FOUND - Database is clean!\n");
  } else {
    console.log(`   ❌ FOUND ${duplicatePhones.length} DUPLICATE PHONE NUMBERS:\n`);
    duplicatePhones.slice(0, 10).forEach(phone => {
      const customers = allDbCustomers.filter(c => c.phone?.replace(/\D/g, "") === phone);
      console.log(`      Phone: ${phone} (${customers.length} records)`);
      customers.forEach(c => {
        console.log(`         - ${c.first_name} ${c.last_name} | ${c.email} | Points: ${c.loyalty_points}`);
      });
    });
    console.log("");
  }

  console.log("=".repeat(80) + "\n");

  // ==================== AUDIT 2: DATA INTEGRITY CHECK ====================

  console.log("🔬 AUDIT 2: Cross-referencing customer data with source systems\n");

  let matchedAlpine = 0;
  let matchedCOVA = 0;
  let pointsMismatch = 0;
  let nameMismatch = 0;

  const sampleChecks: any[] = [];

  dbPhoneMap.forEach((dbCustomer, phone) => {
    const alpineCustomer = alpinePhoneMap.get(phone);
    const covaCustomer = covaPhoneMap.get(phone);

    if (alpineCustomer) {
      matchedAlpine++;

      // Check loyalty points
      const alpinePoints = parseFloat(alpineCustomer.loyalty_points || 0);
      const dbPoints = dbCustomer.loyalty_points || 0;

      if (Math.abs(alpinePoints - dbPoints) > 1) {
        pointsMismatch++;
        if (sampleChecks.length < 10) {
          sampleChecks.push({
            type: "points_mismatch",
            phone,
            name: `${dbCustomer.first_name} ${dbCustomer.last_name}`,
            alpinePoints,
            dbPoints,
            difference: Math.abs(alpinePoints - dbPoints),
          });
        }
      }

      // Check name
      const alpineName = `${alpineCustomer.first_name} ${alpineCustomer.last_name}`.toLowerCase().trim();
      const dbName = `${dbCustomer.first_name} ${dbCustomer.last_name}`.toLowerCase().trim();

      if (alpineName !== dbName && alpineCustomer.first_name && alpineCustomer.last_name) {
        nameMismatch++;
        if (sampleChecks.length < 10) {
          sampleChecks.push({
            type: "name_mismatch",
            phone,
            alpineName,
            dbName,
          });
        }
      }
    }

    if (covaCustomer) {
      matchedCOVA++;
    }
  });

  console.log(`   📊 Coverage Statistics:`);
  console.log(`      Database customers: ${dbPhoneMap.size}`);
  console.log(`      Matched with Alpine: ${matchedAlpine} (${((matchedAlpine / dbPhoneMap.size) * 100).toFixed(1)}%)`);
  console.log(`      Matched with COVA: ${matchedCOVA} (${((matchedCOVA / dbPhoneMap.size) * 100).toFixed(1)}%)\n`);

  console.log(`   🔍 Data Integrity:`);
  console.log(`      Loyalty points mismatches: ${pointsMismatch}`);
  console.log(`      Name mismatches: ${nameMismatch}\n`);

  if (sampleChecks.length > 0) {
    console.log(`   ⚠️  Sample Issues Found:\n`);
    sampleChecks.forEach((check, idx) => {
      if (check.type === "points_mismatch") {
        console.log(`      ${idx + 1}. ${check.name} (${check.phone})`);
        console.log(`         Alpine Points: ${check.alpinePoints}`);
        console.log(`         Database Points: ${check.dbPoints}`);
        console.log(`         Difference: ${check.difference}\n`);
      } else if (check.type === "name_mismatch") {
        console.log(`      ${idx + 1}. Phone: ${check.phone}`);
        console.log(`         Alpine Name: ${check.alpineName}`);
        console.log(`         Database Name: ${check.dbName}\n`);
      }
    });
  }

  console.log("=".repeat(80) + "\n");

  // ==================== AUDIT 3: MISSING CUSTOMERS ====================

  console.log("🔬 AUDIT 3: Checking for missing customers\n");

  const missingFromDB: string[] = [];

  alpinePhoneMap.forEach((customer, phone) => {
    if (!dbPhoneMap.has(phone)) {
      missingFromDB.push(phone);
    }
  });

  console.log(`   Alpine customers NOT in database: ${missingFromDB.length}`);

  if (missingFromDB.length > 0) {
    console.log(`   ⚠️  Sample missing customers (first 5):\n`);
    missingFromDB.slice(0, 5).forEach(phone => {
      const customer = alpinePhoneMap.get(phone);
      console.log(`      ${customer.first_name} ${customer.last_name} (${phone})`);
      console.log(`         Email: ${customer.email || 'N/A'}`);
      console.log(`         Points: ${customer.loyalty_points || 0}\n`);
    });
  } else {
    console.log(`   ✅ All Alpine customers are in the database!\n`);
  }

  console.log("=".repeat(80) + "\n");

  // ==================== FINAL SUMMARY ====================

  console.log("📊 COMPREHENSIVE AUDIT SUMMARY\n");
  console.log("=".repeat(80) + "\n");

  let overallHealth = "EXCELLENT";
  const issues: string[] = [];

  if (duplicatePhones.length > 0) {
    issues.push(`❌ ${duplicatePhones.length} duplicate phone numbers`);
    overallHealth = "CRITICAL";
  }

  if (missingFromDB.length > 5) {
    issues.push(`⚠️  ${missingFromDB.length} customers missing from database`);
    if (overallHealth === "EXCELLENT") overallHealth = "GOOD";
  }

  if (pointsMismatch > 50) {
    issues.push(`⚠️  ${pointsMismatch} loyalty points mismatches`);
    if (overallHealth === "EXCELLENT") overallHealth = "FAIR";
  }

  console.log(`   🎯 Overall Database Health: ${overallHealth}\n`);

  if (issues.length === 0) {
    console.log("   ✅ No critical issues found!");
    console.log("   ✅ All customers are unique (no duplicates)");
    console.log("   ✅ ${((matchedAlpine / dbPhoneMap.size) * 100).toFixed(1)}% coverage from Alpine IQ");
    console.log("   ✅ ${((matchedCOVA / dbPhoneMap.size) * 100).toFixed(1)}% coverage from COVA POS");
    console.log("   ✅ Deduplication was successful!\n");
  } else {
    console.log("   ⚠️  Issues Found:\n");
    issues.forEach(issue => console.log(`      ${issue}`));
    console.log("");
  }

  console.log(`   📈 Statistics:`);
  console.log(`      Total customers: ${allDbCustomers.length}`);
  console.log(`      Unique phone numbers: ${dbPhoneMap.size}`);
  console.log(`      Alpine coverage: ${((matchedAlpine / dbPhoneMap.size) * 100).toFixed(1)}%`);
  console.log(`      COVA coverage: ${((matchedCOVA / dbPhoneMap.size) * 100).toFixed(1)}%`);
  console.log(`      Data integrity: ${(((dbPhoneMap.size - pointsMismatch - nameMismatch) / dbPhoneMap.size) * 100).toFixed(1)}% accurate\n`);

  console.log("=".repeat(80) + "\n");
}

comprehensiveCustomerAudit().catch(console.error);
