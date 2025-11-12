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

async function analyzeAlpineExport() {
  console.log("🔍 ALPINE IQ EXPORT ANALYSIS\n");
  console.log("=".repeat(70) + "\n");

  // Read Alpine CSV
  const csvContent = fs.readFileSync("/Users/whale/Downloads/3999-248226-1762914511-rp.csv", "utf-8");
  const alpineCustomers = csv.parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`📊 Alpine Export Statistics:`);
  console.log(`   Total records: ${alpineCustomers.length}\n`);

  // Analyze Alpine data
  let alpineWithPhone = 0;
  let alpineWithoutPhone = 0;
  let alpineWithEmail = 0;
  let alpineWithPoints = 0;

  const alpinePhoneMap = new Map<string, any>();

  alpineCustomers.forEach((customer: any) => {
    const mobilePhone = customer.mobile_phone;
    const homePhone = customer.home_phone;
    const phone = mobilePhone || homePhone;

    if (phone && String(phone).trim() !== "") {
      const normalizedPhone = String(phone).replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        alpineWithPhone++;
        // Take first occurrence
        if (!alpinePhoneMap.has(normalizedPhone)) {
          alpinePhoneMap.set(normalizedPhone, {
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            phone: normalizedPhone,
            loyaltyPoints: parseFloat(customer.loyalty_points || 0),
            totalSpent: parseFloat(customer.total_spent_as_member || 0),
            signupTime: customer.loyalty_signup_time,
          });
        }
      } else {
        alpineWithoutPhone++;
      }
    } else {
      alpineWithoutPhone++;
    }

    if (customer.email && String(customer.email).trim() !== "") {
      alpineWithEmail++;
    }

    if (parseFloat(customer.loyalty_points || 0) > 0) {
      alpineWithPoints++;
    }
  });

  console.log(`📞 Alpine Phone Analysis:`);
  console.log(`   Records with valid phone: ${alpineWithPhone}`);
  console.log(`   Records without phone: ${alpineWithoutPhone}`);
  console.log(`   Unique phone numbers: ${alpinePhoneMap.size}\n`);

  console.log(`📧 Alpine Email Analysis:`);
  console.log(`   Records with email: ${alpineWithEmail}\n`);

  console.log(`💎 Alpine Points Analysis:`);
  console.log(`   Records with loyalty points > 0: ${alpineWithPoints}\n`);

  // Get database customers
  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  let allDbCustomers: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log("📥 Fetching all database customers...");

  while (hasMore) {
    const { data } = await supabase
      .from("customers")
      .select("id, first_name, last_name, email, phone, loyalty_points, created_at")
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

  console.log(`✅ Total database customers: ${allDbCustomers.length}\n`);

  // Normalize database data by phone
  const dbPhoneMap = new Map<string, any>();

  allDbCustomers.forEach(customer => {
    if (customer.phone) {
      const normalizedPhone = customer.phone.replace(/\D/g, "");
      if (normalizedPhone.length >= 10) {
        dbPhoneMap.set(normalizedPhone, customer);
      }
    }
  });

  console.log(`📞 Database Phone Analysis:`);
  console.log(`   Unique phone numbers: ${dbPhoneMap.size}\n`);

  console.log("=".repeat(70) + "\n");

  // Compare Alpine vs Database
  const inAlpineNotInDB: string[] = [];
  const inBoth: string[] = [];

  alpinePhoneMap.forEach((customer, phone) => {
    if (dbPhoneMap.has(phone)) {
      inBoth.push(phone);
    } else {
      inAlpineNotInDB.push(phone);
    }
  });

  const inDBNotInAlpine: string[] = [];
  dbPhoneMap.forEach((customer, phone) => {
    if (!alpinePhoneMap.has(phone)) {
      inDBNotInAlpine.push(phone);
    }
  });

  console.log("🔬 COMPARISON RESULTS:\n");
  console.log(`   ✅ Customers in BOTH Alpine and Database: ${inBoth.length}`);
  console.log(`   ⚠️  Customers in Alpine but NOT in Database: ${inAlpineNotInDB.length}`);
  console.log(`   ℹ️  Customers in Database but NOT in Alpine: ${inDBNotInAlpine.length}\n`);

  console.log("=".repeat(70) + "\n");

  if (inAlpineNotInDB.length > 0) {
    console.log(`📋 SAMPLE: Customers in Alpine but NOT in Database (first 20):\n`);
    inAlpineNotInDB.slice(0, 20).forEach((phone) => {
      const customer = alpinePhoneMap.get(phone);
      console.log(`   Phone: ${phone}`);
      console.log(`   Name: ${customer?.firstName} ${customer?.lastName}`);
      console.log(`   Email: ${customer?.email || 'N/A'}`);
      console.log(`   Points: ${customer?.loyaltyPoints || 0}`);
      console.log(`   Total Spent: $${customer?.totalSpent || 0}`);
      console.log(`   Signup: ${customer?.signupTime || 'N/A'}\n`);
    });
  }

  console.log("=".repeat(70) + "\n");

  console.log("📈 FINAL SUMMARY:\n");
  console.log(`   Alpine unique customers: ${alpinePhoneMap.size}`);
  console.log(`   Database unique customers: ${dbPhoneMap.size}`);
  console.log(`   Customers matched: ${inBoth.length} (${((inBoth.length / alpinePhoneMap.size) * 100).toFixed(1)}%)`);
  console.log(`   Missing from database: ${inAlpineNotInDB.length}`);

  if (inAlpineNotInDB.length > 0) {
    console.log(`\n   ⚠️  You are missing ${inAlpineNotInDB.length} customers from Alpine IQ!`);
    console.log(`      These customers should be imported to restore full customer base.`);
  } else {
    console.log(`\n   ✅ All Alpine customers are in your database!`);
  }

  console.log("\n" + "=".repeat(70) + "\n");
}

analyzeAlpineExport().catch(console.error);
