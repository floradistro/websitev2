import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeDuplicates() {
  console.log("🔍 Analyzing customer duplicates...\n");

  // Get all customers
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching customers:", error);
    return;
  }

  console.log(`📊 Total customers: ${customers.length}\n`);

  // Group by phone number
  const phoneGroups = new Map<string, any[]>();
  const emailGroups = new Map<string, any[]>();

  customers.forEach((customer) => {
    if (customer.phone) {
      const existing = phoneGroups.get(customer.phone) || [];
      phoneGroups.set(customer.phone, [...existing, customer]);
    }
    if (customer.email) {
      const existing = emailGroups.get(customer.email) || [];
      emailGroups.set(customer.email, [...existing, customer]);
    }
  });

  // Find duplicates by phone
  const phoneDuplicates = Array.from(phoneGroups.entries())
    .filter(([_, customers]) => customers.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  // Find duplicates by email
  const emailDuplicates = Array.from(emailGroups.entries())
    .filter(([_, customers]) => customers.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`📞 Duplicate phone numbers: ${phoneDuplicates.length}`);
  console.log(`📧 Duplicate emails: ${emailDuplicates.length}\n`);

  // Show top 10 phone duplicates with details
  console.log("🔴 TOP 10 PHONE DUPLICATES:\n");
  phoneDuplicates.slice(0, 10).forEach(([phone, dupes], idx) => {
    console.log(`${idx + 1}. Phone: ${phone} (${dupes.length} duplicates)`);
    dupes.forEach((cust, i) => {
      const hasEmail = cust.email ? "✓" : "✗";
      const hasName = (cust.first_name || cust.last_name) ? "✓" : "✗";
      const points = cust.loyalty_points || 0;
      const tier = cust.loyalty_tier || "none";
      console.log(
        `   [${i + 1}] ID: ${cust.id.substring(0, 8)}... | Email: ${hasEmail} | Name: ${hasName} | Points: ${points} | Tier: ${tier} | Created: ${new Date(cust.created_at).toLocaleDateString()}`
      );
      if (cust.email) console.log(`       Email: ${cust.email}`);
      if (cust.first_name || cust.last_name)
        console.log(`       Name: ${cust.first_name} ${cust.last_name}`);
    });
    console.log("");
  });

  // Analyze what data differs between duplicates
  console.log("📋 DATA COMPLETENESS ANALYSIS:\n");
  let totalDuplicates = 0;
  let withDifferentEmails = 0;
  let withDifferentNames = 0;
  let withDifferentPoints = 0;
  let withDifferentTiers = 0;

  phoneDuplicates.forEach(([phone, dupes]) => {
    totalDuplicates += dupes.length;
    const emails = [...new Set(dupes.map((d) => d.email).filter(Boolean))];
    const names = [
      ...new Set(
        dupes
          .map((d) => `${d.first_name || ""} ${d.last_name || ""}`.trim())
          .filter(Boolean)
      ),
    ];
    const points = [...new Set(dupes.map((d) => d.loyalty_points || 0))];
    const tiers = [...new Set(dupes.map((d) => d.loyalty_tier || "none"))];

    if (emails.length > 1) withDifferentEmails++;
    if (names.length > 1) withDifferentNames++;
    if (points.length > 1) withDifferentPoints++;
    if (tiers.length > 1) withDifferentTiers++;
  });

  console.log(`Total duplicate records: ${totalDuplicates}`);
  console.log(`Duplicates with conflicting emails: ${withDifferentEmails}`);
  console.log(`Duplicates with conflicting names: ${withDifferentNames}`);
  console.log(`Duplicates with conflicting points: ${withDifferentPoints}`);
  console.log(`Duplicates with conflicting tiers: ${withDifferentTiers}\n`);

  // Sample a few duplicates to show data differences
  console.log("🔬 SAMPLE DUPLICATE WITH DATA DIFFERENCES:\n");
  const sampleDupe = phoneDuplicates.find(
    ([_, dupes]) =>
      new Set(dupes.map((d) => d.email).filter(Boolean)).size > 1 ||
      new Set(dupes.map((d) => d.loyalty_points)).size > 1
  );

  if (sampleDupe) {
    const [phone, dupes] = sampleDupe;
    console.log(`Phone: ${phone}`);
    dupes.forEach((cust, i) => {
      console.log(`\n  Record ${i + 1}:`);
      console.log(`    ID: ${cust.id}`);
      console.log(`    Email: ${cust.email || "MISSING"}`);
      console.log(
        `    Name: ${cust.first_name || ""} ${cust.last_name || ""} ${!cust.first_name && !cust.last_name ? "MISSING" : ""}`
      );
      console.log(`    Points: ${cust.loyalty_points || 0}`);
      console.log(`    Tier: ${cust.loyalty_tier || "none"}`);
      console.log(`    Created: ${cust.created_at}`);
      console.log(`    Last Visit: ${cust.last_visit_date || "never"}`);
    });
  }
}

analyzeDuplicates().catch(console.error);
