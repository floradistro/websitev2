import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeTopCustomers() {
  console.log("🔍 Analyzing TOP customers (sorted by loyalty points)...\n");

  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  // Get top 100 customers by loyalty points (simulating what user sees)
  const { data: topCustomers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, phone, loyalty_points, created_at")
    .eq("vendor_id", vendorId)
    .order("loyalty_points", { ascending: false })
    .limit(100);

  if (!topCustomers || topCustomers.length === 0) {
    console.error("No customers found");
    return;
  }

  console.log(`📊 Analyzing top ${topCustomers.length} customers by loyalty points\n`);

  // Group by phone number (normalized)
  const phoneGroups: Record<string, any[]> = {};

  topCustomers.forEach(customer => {
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

  console.log(`📊 STATISTICS FOR TOP 100 CUSTOMERS:`);
  console.log(`   Total records: ${topCustomers.length}`);
  console.log(`   Unique phone numbers: ${Object.keys(phoneGroups).length}`);
  console.log(`   Phone numbers with duplicates: ${duplicatePhones.length}`);
  console.log(`   Duplicate rate: ${((duplicatePhones.length / Object.keys(phoneGroups).length) * 100).toFixed(1)}%\n`);

  // Count duplicate records
  let totalDuplicateRecords = 0;
  duplicatePhones.forEach(([_, records]) => {
    totalDuplicateRecords += records.length - 1;
  });

  console.log(`   Excess duplicate records: ${totalDuplicateRecords}`);
  console.log(`   Customer cards that would show: ${topCustomers.length}`);
  console.log(`   Unique people: ${topCustomers.length - totalDuplicateRecords}\n`);

  // Analyze first page (20 customers)
  console.log(`\n📱 FIRST PAGE (20 customers):\n`);

  const firstPage = topCustomers.slice(0, 20);
  const firstPagePhoneGroups: Record<string, any[]> = {};

  firstPage.forEach(customer => {
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

  console.log(`Total cards shown: ${firstPage.length}`);
  console.log(`Unique people: ${Object.keys(firstPagePhoneGroups).length}`);
  console.log(`Duplicate pairs: ${firstPageDuplicates.length}`);
  console.log(`Duplicate rate: ${((firstPageDuplicates.length / Object.keys(firstPagePhoneGroups).length) * 100).toFixed(1)}%\n`);

  firstPageDuplicates.forEach(([phone, records], idx) => {
    console.log(`${idx + 1}. ${records[0].first_name} ${records[0].last_name} (${records.length} records)`);
    records.forEach((rec, i) => {
      console.log(`   [${i + 1}] ${rec.email || 'N/A'} | Points: ${rec.loyalty_points || 0} | ID: ${rec.id.substring(0, 8)}...`);
    });
    console.log('');
  });

  // Show pattern analysis
  console.log(`\n🔬 PATTERN ANALYSIS:\n`);

  let phoneLocalCount = 0;
  let alpineLocalCount = 0;
  let realEmailCount = 0;

  duplicatePhones.forEach(([_, records]) => {
    const hasPhoneLocal = records.some(r => r.email?.includes('@phone.local'));
    const hasAlpineLocal = records.some(r => r.email?.includes('@alpine.local'));
    const hasRealEmail = records.some(r => r.email && !r.email.includes('@phone.local') && !r.email.includes('@alpine.local'));

    if (hasPhoneLocal) phoneLocalCount++;
    if (hasAlpineLocal) alpineLocalCount++;
    if (hasRealEmail) realEmailCount++;
  });

  console.log(`Duplicates with @phone.local: ${phoneLocalCount} (${((phoneLocalCount / duplicatePhones.length) * 100).toFixed(1)}%)`);
  console.log(`Duplicates with @alpine.local: ${alpineLocalCount} (${((alpineLocalCount / duplicatePhones.length) * 100).toFixed(1)}%)`);
  console.log(`Duplicates with real email: ${realEmailCount} (${((realEmailCount / duplicatePhones.length) * 100).toFixed(1)}%)`);
}

analyzeTopCustomers().catch(console.error);
