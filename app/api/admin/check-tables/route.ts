import { getServiceSupabase } from "@/lib/supabase/client";
import { NextResponse } from "next/server";
import { toError } from "@/lib/errors";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    // Check if wholesale tables exist by trying to query them
    const tables = [
      "suppliers",
      "wholesale_customers",
      "purchase_orders",
      "purchase_order_items",
      "purchase_order_payments",
      "inventory_reservations",
    ];

    const results: any = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").limit(0);

        results[table] = error ? { exists: false, error: err.message } : { exists: true };
      } catch (err: any) {
        results[table] = { exists: false, error: err.message };
      }
    }

    return NextResponse.json({
      success: true,
      tables: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 },
    );
  }
}
