import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getCustomer() {
  const { data, error } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, loyalty_tier, loyalty_points")
    .eq("vendor_id", "cd2e1122-d511-4edb-be5d-98ef274b4baf")
    .limit(3);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Customers:", JSON.stringify(data, null, 2));
  }
}

getCustomer();
