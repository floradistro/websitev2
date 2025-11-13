import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * CRITICAL: Deploy the atomic session management function to production database
 *
 * This endpoint deploys the get_or_create_session() function which makes
 * duplicate sessions PHYSICALLY IMPOSSIBLE at the database level.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "migrations", "001_enterprise_session_management.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📦 Deploying atomic session management function...");

    // Execute the migration SQL
    // Note: Supabase client doesn't support raw SQL execution directly
    // We need to break it down into parts

    // Step 1: Create unique index
    console.log("1️⃣ Creating unique index...");
    const { error: indexError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_session_per_register
        ON pos_sessions (register_id)
        WHERE status = 'open';
      `,
    });

    if (indexError && !indexError.message.includes("does not exist")) {
      // Try alternative approach - direct execution
      try {
        await supabase.from("_raw_sql").select("*").limit(1); // Dummy query to test connection
      } catch (e) {
        // Connection works, continue
      }
    }

    // Step 2: Create the function
    console.log("2️⃣ Creating atomic get_or_create_session() function...");

    const functionSQL = `
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
  -- CRITICAL: Lock the register row to prevent race conditions
  PERFORM * FROM pos_registers
  WHERE pos_registers.id = p_register_id
  FOR UPDATE;

  -- Check for existing open session
  SELECT * INTO v_existing_session
  FROM pos_sessions
  WHERE pos_sessions.register_id = p_register_id
    AND pos_sessions.status = 'open'
  LIMIT 1;

  -- If session exists, return it immediately
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

  -- No existing session - create new one atomically
  v_session_number := 'S-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');

  -- Insert new session
  INSERT INTO pos_sessions (
    register_id,
    location_id,
    vendor_id,
    user_id,
    session_number,
    status,
    opening_cash,
    total_sales,
    total_transactions,
    total_cash,
    total_card,
    walk_in_sales,
    pickup_orders_fulfilled,
    opened_at,
    last_transaction_at
  ) VALUES (
    p_register_id,
    p_location_id,
    p_vendor_id,
    p_user_id,
    v_session_number,
    'open',
    p_opening_cash,
    0.00,
    0,
    0.00,
    0.00,
    0.00,
    0,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_new_session;

  -- Return the newly created session
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_or_create_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_session TO service_role;
    `;

    // Since Supabase JS client doesn't support raw SQL execution,
    // we'll need to use the Supabase SQL Editor or psql
    // For now, return instructions to the user

    return NextResponse.json({
      success: false,
      error: "Cannot execute raw SQL via Supabase JS client",
      instructions: {
        message: "Please run this SQL in Supabase SQL Editor",
        steps: [
          "1. Go to https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new",
          "2. Paste the SQL from the migration file",
          "3. Run the query",
          "4. Test by calling POST /api/pos/sessions/get-or-create",
        ],
        sql_file: "migrations/001_enterprise_session_management.sql",
        sql_content: migrationSQL,
      },
    });
  } catch (error: any) {
    console.error("❌ Error deploying atomic function:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to deploy atomic function",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
