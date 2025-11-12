import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateDataQualityReport() {
  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  console.log("📊 GENERATING DATA QUALITY REPORT\n");
  console.log("=".repeat(80) + "\n");

  let report = "";
  const addToReport = (text: string) => {
    console.log(text);
    report += text + "\n";
  };

  addToReport("================================================================================");
  addToReport("                     CUSTOMER DATA QUALITY REPORT");
  addToReport("================================================================================");
  addToReport(`Generated: ${new Date().toLocaleString()}`);
  addToReport(`Vendor ID: ${vendorId}`);
  addToReport("");

  // Fetch all customers
  let allCustomers: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log("Loading customer data...\n");

  while (hasMore) {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("vendor_id", vendorId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allCustomers = [...allCustomers, ...data];
      page++;
      if (data.length < pageSize) hasMore = false;
    }
  }

  // ==================== 1. COMPLETENESS ====================

  addToReport("================================================================================");
  addToReport("1. DATA COMPLETENESS");
  addToReport("================================================================================");
  addToReport("");

  const totalCustomers = allCustomers.length;

  let withFirstName = 0;
  let withLastName = 0;
  let withEmail = 0;
  let withPhone = 0;
  let withRealEmail = 0;
  let withPlaceholderEmail = 0;
  let withLoyaltyPoints = 0;
  let withTotalSpent = 0;
  let withTotalOrders = 0;

  allCustomers.forEach(c => {
    if (c.first_name && c.first_name.trim() !== "") withFirstName++;
    if (c.last_name && c.last_name.trim() !== "") withLastName++;
    if (c.email && c.email.trim() !== "") withEmail++;
    if (c.phone && c.phone.trim() !== "") withPhone++;
    if (c.email && !c.email.includes("@phone.local") && !c.email.includes("@alpine.local")) withRealEmail++;
    if (c.email && (c.email.includes("@phone.local") || c.email.includes("@alpine.local"))) withPlaceholderEmail++;
    if (c.loyalty_points && c.loyalty_points > 0) withLoyaltyPoints++;
    if (c.total_spent && c.total_spent > 0) withTotalSpent++;
    if (c.total_orders && c.total_orders > 0) withTotalOrders++;
  });

  addToReport(`Total Customers: ${totalCustomers}`);
  addToReport("");
  addToReport("Field Completeness:");
  addToReport(`  First Name:        ${withFirstName.toLocaleString().padStart(6)} / ${totalCustomers.toLocaleString()} (${((withFirstName/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  Last Name:         ${withLastName.toLocaleString().padStart(6)} / ${totalCustomers.toLocaleString()} (${((withLastName/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  Email:             ${withEmail.toLocaleString().padStart(6)} / ${totalCustomers.toLocaleString()} (${((withEmail/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  Phone:             ${withPhone.toLocaleString().padStart(6)} / ${totalCustomers.toLocaleString()} (${((withPhone/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  Real Email:        ${withRealEmail.toLocaleString().padStart(6)} / ${totalCustomers.toLocaleString()} (${((withRealEmail/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  Placeholder Email: ${withPlaceholderEmail.toLocaleString().padStart(6)} / ${totalCustomers.toLocaleString()} (${((withPlaceholderEmail/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  Loyalty Points:    ${withLoyaltyPoints.toLocaleString().padStart(6)} / ${totalCustomers.toLocaleString()} (${((withLoyaltyPoints/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  Total Spent:       ${withTotalSpent.toLocaleString().padStart(6)} / ${totalCustomers.toLocaleString()} (${((withTotalSpent/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  Total Orders:      ${withTotalOrders.toLocaleString().padStart(6)} / ${totalCustomers.toLocaleString()} (${((withTotalOrders/totalCustomers)*100).toFixed(1)}%)`);
  addToReport("");

  const missingFirstName = totalCustomers - withFirstName;
  const missingLastName = totalCustomers - withLastName;
  const missingEmail = totalCustomers - withEmail;
  const missingPhone = totalCustomers - withPhone;

  if (missingFirstName > 0 || missingLastName > 0) {
    addToReport("⚠️  Missing Critical Fields:");
    if (missingFirstName > 0) addToReport(`     ${missingFirstName} customers missing first name`);
    if (missingLastName > 0) addToReport(`     ${missingLastName} customers missing last name`);
    addToReport("");
  }

  // ==================== 2. UNIQUENESS ====================

  addToReport("================================================================================");
  addToReport("2. DATA UNIQUENESS");
  addToReport("================================================================================");
  addToReport("");

  const phoneMap = new Map<string, number>();
  const emailMap = new Map<string, number>();

  allCustomers.forEach(c => {
    if (c.phone) {
      const normalized = c.phone.replace(/\D/g, "");
      if (normalized.length >= 10) {
        phoneMap.set(normalized, (phoneMap.get(normalized) || 0) + 1);
      }
    }
    if (c.email && !c.email.includes("@phone.local") && !c.email.includes("@alpine.local")) {
      emailMap.set(c.email.toLowerCase(), (emailMap.get(c.email.toLowerCase()) || 0) + 1);
    }
  });

  const duplicatePhones = Array.from(phoneMap.entries()).filter(([_, count]) => count > 1);
  const duplicateEmails = Array.from(emailMap.entries()).filter(([_, count]) => count > 1);

  addToReport(`Unique Phone Numbers: ${phoneMap.size.toLocaleString()}`);
  addToReport(`Unique Emails: ${emailMap.size.toLocaleString()}`);
  addToReport("");

  if (duplicatePhones.length === 0) {
    addToReport("✅ No duplicate phone numbers found");
  } else {
    addToReport(`❌ ${duplicatePhones.length} duplicate phone numbers found:`);
    duplicatePhones.slice(0, 5).forEach(([phone, count]) => {
      addToReport(`     ${phone}: ${count} occurrences`);
    });
  }
  addToReport("");

  if (duplicateEmails.length === 0) {
    addToReport("✅ No duplicate email addresses found");
  } else {
    addToReport(`⚠️  ${duplicateEmails.length} duplicate email addresses found:`);
    duplicateEmails.slice(0, 5).forEach(([email, count]) => {
      addToReport(`     ${email}: ${count} occurrences`);
    });
  }
  addToReport("");

  // ==================== 3. CONSISTENCY ====================

  addToReport("================================================================================");
  addToReport("3. DATA CONSISTENCY");
  addToReport("================================================================================");
  addToReport("");

  let formattedPhones = 0;
  let unformattedPhones = 0;
  let invalidPhones = 0;
  let invalidEmails = 0;

  const phoneFormats = new Map<string, number>();

  allCustomers.forEach(c => {
    if (c.phone) {
      // Check phone format
      if (c.phone.match(/^\(\d{3}\) \d{3}-\d{4}$/)) {
        formattedPhones++;
        phoneFormats.set("(###) ###-####", (phoneFormats.get("(###) ###-####") || 0) + 1);
      } else if (c.phone.match(/^\d{10}$/)) {
        unformattedPhones++;
        phoneFormats.set("##########", (phoneFormats.get("##########") || 0) + 1);
      } else if (c.phone.match(/^\+?\d{1,3}[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/)) {
        unformattedPhones++;
        phoneFormats.set("Various formats", (phoneFormats.get("Various formats") || 0) + 1);
      } else {
        invalidPhones++;
      }
    }

    // Check email format
    if (c.email && !c.email.includes("@phone.local") && !c.email.includes("@alpine.local")) {
      if (!c.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        invalidEmails++;
      }
    }
  });

  addToReport("Phone Number Formats:");
  phoneFormats.forEach((count, format) => {
    addToReport(`  ${format}: ${count.toLocaleString()} (${((count/(formattedPhones+unformattedPhones))*100).toFixed(1)}%)`);
  });
  if (invalidPhones > 0) {
    addToReport(`  ⚠️  Invalid format: ${invalidPhones.toLocaleString()}`);
  }
  addToReport("");

  if (invalidEmails > 0) {
    addToReport(`⚠️  Invalid email formats: ${invalidEmails}`);
    addToReport("");
  }

  // ==================== 4. ACCURACY ====================

  addToReport("================================================================================");
  addToReport("4. DATA ACCURACY");
  addToReport("================================================================================");
  addToReport("");

  let negativePoints = 0;
  let negativeTotalSpent = 0;
  let ordersWithoutSpent = 0;
  let spentWithoutOrders = 0;

  allCustomers.forEach(c => {
    if (c.loyalty_points < 0) negativePoints++;
    if (c.total_spent < 0) negativeTotalSpent++;
    if (c.total_orders > 0 && (!c.total_spent || c.total_spent === 0)) ordersWithoutSpent++;
    if (c.total_spent > 0 && (!c.total_orders || c.total_orders === 0)) spentWithoutOrders++;
  });

  if (negativePoints === 0 && negativeTotalSpent === 0 && ordersWithoutSpent === 0 && spentWithoutOrders === 0) {
    addToReport("✅ No data accuracy issues found");
  } else {
    if (negativePoints > 0) addToReport(`⚠️  ${negativePoints} customers with negative loyalty points`);
    if (negativeTotalSpent > 0) addToReport(`⚠️  ${negativeTotalSpent} customers with negative total spent`);
    if (ordersWithoutSpent > 0) addToReport(`⚠️  ${ordersWithoutSpent} customers with orders but no spending`);
    if (spentWithoutOrders > 0) addToReport(`⚠️  ${spentWithoutOrders} customers with spending but no orders`);
  }
  addToReport("");

  // ==================== 5. TIMELINESS ====================

  addToReport("================================================================================");
  addToReport("5. DATA TIMELINESS");
  addToReport("================================================================================");
  addToReport("");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  let newCustomers = 0;
  let recentCustomers = 0;
  let staleCustomers = 0;

  allCustomers.forEach(c => {
    const createdAt = new Date(c.created_at);
    if (createdAt > thirtyDaysAgo) {
      newCustomers++;
    } else if (createdAt > ninetyDaysAgo) {
      recentCustomers++;
    } else {
      staleCustomers++;
    }
  });

  addToReport(`Customers by Age:`);
  addToReport(`  Last 30 days:  ${newCustomers.toLocaleString().padStart(6)} (${((newCustomers/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  30-90 days:    ${recentCustomers.toLocaleString().padStart(6)} (${((recentCustomers/totalCustomers)*100).toFixed(1)}%)`);
  addToReport(`  90+ days:      ${staleCustomers.toLocaleString().padStart(6)} (${((staleCustomers/totalCustomers)*100).toFixed(1)}%)`);
  addToReport("");

  // ==================== 6. LOYALTY DATA ====================

  addToReport("================================================================================");
  addToReport("6. LOYALTY DATA QUALITY");
  addToReport("================================================================================");
  addToReport("");

  const loyaltyTiers = new Map<string, number>();
  let totalPoints = 0;
  let totalSpent = 0;
  let maxPoints = 0;
  let maxSpent = 0;

  allCustomers.forEach(c => {
    const tier = c.loyalty_tier || "none";
    loyaltyTiers.set(tier, (loyaltyTiers.get(tier) || 0) + 1);

    totalPoints += c.loyalty_points || 0;
    totalSpent += c.total_spent || 0;

    if (c.loyalty_points > maxPoints) maxPoints = c.loyalty_points;
    if (c.total_spent > maxSpent) maxSpent = c.total_spent;
  });

  const avgPoints = totalPoints / totalCustomers;
  const avgSpent = totalSpent / totalCustomers;

  addToReport(`Loyalty Statistics:`);
  addToReport(`  Total Loyalty Points:   ${totalPoints.toLocaleString()}`);
  addToReport(`  Average Points:         ${avgPoints.toFixed(1)}`);
  addToReport(`  Max Points:             ${maxPoints.toLocaleString()}`);
  addToReport(`  Total Spent:            $${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
  addToReport(`  Average Spent:          $${avgSpent.toFixed(2)}`);
  addToReport(`  Max Spent:              $${maxSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
  addToReport("");

  addToReport(`Loyalty Tiers:`);
  Array.from(loyaltyTiers.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([tier, count]) => {
      addToReport(`  ${tier.padEnd(15)}: ${count.toLocaleString().padStart(6)} (${((count/totalCustomers)*100).toFixed(1)}%)`);
    });
  addToReport("");

  // ==================== 7. OVERALL SCORE ====================

  addToReport("================================================================================");
  addToReport("7. OVERALL DATA QUALITY SCORE");
  addToReport("================================================================================");
  addToReport("");

  let score = 100;
  const issues: string[] = [];

  // Completeness penalties
  if (withFirstName / totalCustomers < 0.95) {
    score -= 5;
    issues.push("Missing first names");
  }
  if (withLastName / totalCustomers < 0.95) {
    score -= 5;
    issues.push("Missing last names");
  }
  if (withRealEmail / totalCustomers < 0.50) {
    score -= 10;
    issues.push("Low real email rate");
  }

  // Uniqueness penalties
  if (duplicatePhones.length > 0) {
    score -= 20;
    issues.push("Duplicate phone numbers");
  }
  if (duplicateEmails.length > 10) {
    score -= 10;
    issues.push("Multiple duplicate emails");
  }

  // Consistency penalties
  if (unformattedPhones / (formattedPhones + unformattedPhones) > 0.2) {
    score -= 5;
    issues.push("Inconsistent phone formatting");
  }

  // Accuracy penalties
  if (negativePoints > 0 || negativeTotalSpent > 0) {
    score -= 10;
    issues.push("Data accuracy issues");
  }

  let grade = "A+";
  if (score < 95) grade = "A";
  if (score < 90) grade = "B+";
  if (score < 85) grade = "B";
  if (score < 80) grade = "C+";
  if (score < 75) grade = "C";
  if (score < 70) grade = "D";
  if (score < 60) grade = "F";

  addToReport(`Data Quality Score: ${score}/100 (Grade: ${grade})`);
  addToReport("");

  if (issues.length === 0) {
    addToReport("✅ Excellent data quality!");
  } else {
    addToReport("Issues Identified:");
    issues.forEach(issue => addToReport(`  ⚠️  ${issue}`));
  }
  addToReport("");

  // ==================== 8. RECOMMENDATIONS ====================

  addToReport("================================================================================");
  addToReport("8. RECOMMENDATIONS");
  addToReport("================================================================================");
  addToReport("");

  const recommendations: string[] = [];

  if (duplicatePhones.length > 0) {
    recommendations.push("• CRITICAL: Run deduplication script to merge duplicate phone numbers");
  }
  if (withPlaceholderEmail > totalCustomers * 0.3) {
    recommendations.push("• Encourage customers to provide real email addresses for better communication");
  }
  if (withLastName / totalCustomers < 0.95) {
    recommendations.push("• Update customer records to include missing last names");
  }
  if (unformattedPhones / (formattedPhones + unformattedPhones) > 0.2) {
    recommendations.push("• Standardize phone number format across all records");
  }
  if (spentWithoutOrders > 0) {
    recommendations.push("• Review and update order counts for customers with spending data");
  }

  if (recommendations.length === 0) {
    addToReport("✅ No recommendations - data quality is excellent!");
  } else {
    addToReport("Action Items:");
    recommendations.forEach(rec => addToReport(rec));
  }
  addToReport("");

  addToReport("================================================================================");
  addToReport("                           END OF REPORT");
  addToReport("================================================================================");

  // Save report
  const reportPath = path.join(process.cwd(), "data-quality-report.txt");
  fs.writeFileSync(reportPath, report);

  console.log(`\n\n📄 Report saved to: ${reportPath}\n`);
}

generateDataQualityReport().catch(console.error);
