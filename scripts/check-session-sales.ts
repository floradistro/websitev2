import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSessionSales() {
  // Get session
  const { data: session } = await supabase
    .from("pos_sessions")
    .select("*")
    .eq("session_number", "S-20251114-176450")
    .single();

  if (!session) {
    console.log("❌ Session not found");
    return;
  }

  console.log("\n📊 Session Info:");
  console.log("  Number:", session.session_number);
  console.log("  Opened:", new Date(session.opened_at).toLocaleString());
  console.log("  Total Sales:", `$${session.total_sales.toFixed(2)}`);
  console.log("  Status:", session.status);

  // Check orders after session opened
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, total_amount, created_at, metadata")
    .eq("vendor_id", "cd2e1122-d511-4edb-be5d-98ef274b4baf")
    .gte("created_at", session.opened_at)
    .order("created_at", { ascending: false });

  console.log("\n📦 Orders After Session Opened:");
  let totalSales = 0;
  let posCount = 0;

  orders?.forEach((o) => {
    const isPOS = o.metadata?.pos_sale;
    if (isPOS) {
      totalSales += o.total_amount;
      posCount++;
    }
    console.log(
      `  ${isPOS ? "✅ POS" : "❌ Online"} ${o.order_number}: $${o.total_amount.toFixed(2)} at ${new Date(o.created_at).toLocaleString()}`
    );
  });

  console.log(`\n💰 Expected Session Total: $${totalSales.toFixed(2)} (${posCount} POS sales)`);
  console.log(`📊 Actual Session Total: $${session.total_sales.toFixed(2)}`);
  console.log(
    `${totalSales === session.total_sales ? "✅" : "❌"} ${totalSales === session.total_sales ? "Match!" : `Difference: $${(totalSales - session.total_sales).toFixed(2)}`}`
  );
}

checkSessionSales().catch(console.error);
