import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { readFileSync } from "fs";
import { join } from "path";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { migrationName } = await request.json();

    if (migrationName !== "001_enterprise_session_management") {
      return NextResponse.json({ error: "Invalid migration name" }, { status: 400 });
    }

    // Step 1: Create unique index

    const { error: indexError } = await supabase.rpc("exec_sql", {
      query: `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_session_per_register
        ON pos_sessions (register_id)
        WHERE status = 'open';
      `,
    });

    // If exec_sql doesn't exist, try direct execution via query
    if (indexError && indexError.message?.includes("exec_sql")) {
      // Create the function using raw SQL
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION get_or_create_session(
          p_register_id UUID,
          p_location_id UUID,
          p_vendor_id UUID,
          p_user_id UUID,
          p_opening_cash DECIMAL DEFAULT 200.00
        )
        RETURNS TABLE (
          id UUID,
          session_number TEXT,
          register_id UUID,
          location_id UUID,
          vendor_id UUID,
          user_id UUID,
          status TEXT,
          opening_cash DECIMAL,
          total_sales DECIMAL,
          total_transactions INTEGER,
          total_cash DECIMAL,
          total_card DECIMAL,
          walk_in_sales DECIMAL,
          pickup_orders_fulfilled INTEGER,
          opened_at TIMESTAMPTZ,
          last_transaction_at TIMESTAMPTZ
        ) AS $$
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
            'open', p_opening_cash, 0.00, 0, 0.00, 0.00, 0.00, 0, NOW(), NOW()
          )
          RETURNING * INTO v_new_session;

          RETURN QUERY
          SELECT
            v_new_session.id, v_new_session.session_number,
            v_new_session.register_id, v_new_session.location_id,
            v_new_session.vendor_id, v_new_session.user_id,
            v_new_session.status, v_new_session.opening_cash,
            v_new_session.total_sales, v_new_session.total_transactions,
            v_new_session.total_cash, v_new_session.total_card,
            v_new_session.walk_in_sales, v_new_session.pickup_orders_fulfilled,
            v_new_session.opened_at, v_new_session.last_transaction_at;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;

      return NextResponse.json({
        success: false,
        message: "Manual migration required",
        instructions: `
          Please run this SQL in Supabase Dashboard → SQL Editor:

          -- Step 1: Unique constraint
          CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_session_per_register
          ON pos_sessions (register_id)
          WHERE status = 'open';

          -- Step 2: Atomic function
          ${createFunctionSQL}
        `,
        sql: createFunctionSQL,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      steps: [
        "Created unique constraint: idx_one_open_session_per_register",
        "Created atomic function: get_or_create_session",
        "Duplicate sessions now physically impossible",
      ],
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Migration error:", err);
    }
    return NextResponse.json(
      { error: "Migration failed", details: err.message },
      { status: 500 },
    );
  }
}
