import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/run-session-migration
 * Creates the increment_session_counter function
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const sql = `
CREATE OR REPLACE FUNCTION increment_session_counter(
  p_session_id uuid,
  p_counter_name text,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the session based on counter type
  IF p_counter_name = 'walk_in_sales' THEN
    UPDATE pos_sessions
    SET
      walk_in_sales = walk_in_sales + 1,
      total_sales = total_sales + p_amount
    WHERE id = p_session_id;

  ELSIF p_counter_name = 'pickup_orders_fulfilled' THEN
    UPDATE pos_sessions
    SET
      pickup_orders_fulfilled = pickup_orders_fulfilled + 1,
      total_sales = total_sales + p_amount
    WHERE id = p_session_id;

  ELSIF p_counter_name = 'delivery_orders_dispatched' THEN
    UPDATE pos_sessions
    SET
      delivery_orders_dispatched = delivery_orders_dispatched + 1,
      total_sales = total_sales + p_amount
    WHERE id = p_session_id;

  ELSE
    RAISE EXCEPTION 'Invalid counter name: %', p_counter_name;
  END IF;
END;
$function$;

COMMENT ON FUNCTION increment_session_counter IS
  'Atomically increment session transaction counters and total sales. Used by POS sales endpoint.';
    `;

    // Execute the SQL using rpc
    const { data, error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Could not execute via RPC:", error);
      }
      return NextResponse.json(
        {
          success: false,
          error: "Could not execute SQL via RPC",
          message: "Please execute the SQL manually in Supabase Dashboard",
          sql: sql,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "increment_session_counter function created successfully",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Error creating function:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        details: String(error),
      },
      { status: 500 },
    );
  }
}
