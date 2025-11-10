import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/fix-session-function
 * Fixes the get_or_create_session function type mismatch
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // The SQL to fix the function
    const sql = `
DROP FUNCTION IF EXISTS get_or_create_session(uuid, uuid, uuid, uuid, numeric);

CREATE OR REPLACE FUNCTION get_or_create_session(
  p_register_id uuid,
  p_location_id uuid,
  p_vendor_id uuid,
  p_user_id uuid,
  p_opening_cash numeric DEFAULT 200.00
)
RETURNS TABLE(
  id uuid,
  session_number text,
  register_id uuid,
  location_id uuid,
  vendor_id uuid,
  user_id uuid,
  status text,
  opening_cash numeric,
  total_sales numeric,
  total_transactions integer,
  total_cash numeric,
  total_card numeric,
  walk_in_sales integer,
  pickup_orders_fulfilled integer,
  opened_at timestamp with time zone,
  last_transaction_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_existing_session RECORD;
  v_new_session RECORD;
  v_session_number TEXT;
BEGIN
  PERFORM * FROM pos_registers
  WHERE pos_registers.id = p_register_id
  FOR UPDATE;

  SELECT * INTO v_existing_session
  FROM pos_sessions
  WHERE pos_sessions.register_id = p_register_id
    AND pos_sessions.status = 'open'
  LIMIT 1;

  IF v_existing_session.id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      v_existing_session.id,
      v_existing_session.session_number,
      v_existing_session.register_id,
      v_existing_session.location_id,
      v_existing_session.vendor_id,
      v_existing_session.user_id,
      v_existing_session.status,
      v_existing_session.opening_cash,
      v_existing_session.total_sales,
      v_existing_session.total_transactions,
      v_existing_session.total_cash,
      v_existing_session.total_card,
      v_existing_session.walk_in_sales,
      v_existing_session.pickup_orders_fulfilled,
      v_existing_session.opened_at,
      v_existing_session.last_transaction_at;
    RETURN;
  END IF;

  v_session_number := 'S-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');

  INSERT INTO pos_sessions (
    register_id, location_id, vendor_id, user_id, session_number,
    status, opening_cash, total_sales, total_transactions,
    total_cash, total_card, walk_in_sales, pickup_orders_fulfilled,
    opened_at, last_transaction_at
  ) VALUES (
    p_register_id, p_location_id, p_vendor_id, p_user_id, v_session_number,
    'open', p_opening_cash, 0.00, 0, 0.00, 0.00, 0, 0, NOW(), NOW()
  )
  RETURNING * INTO v_new_session;

  RETURN QUERY
  SELECT
    v_new_session.id,
    v_new_session.session_number,
    v_new_session.register_id,
    v_new_session.location_id,
    v_new_session.vendor_id,
    v_new_session.user_id,
    v_new_session.status,
    v_new_session.opening_cash,
    v_new_session.total_sales,
    v_new_session.total_transactions,
    v_new_session.total_cash,
    v_new_session.total_card,
    v_new_session.walk_in_sales,
    v_new_session.pickup_orders_fulfilled,
    v_new_session.opened_at,
    v_new_session.last_transaction_at;
END;
$function$;
    `;

    // Execute the SQL using rpc
    const { data, error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      // If exec_sql doesn't exist, log the SQL for manual execution
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
      message: "get_or_create_session function fixed successfully",
      details: "walk_in_sales type changed from numeric to integer",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Error fixing function:", err);
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
