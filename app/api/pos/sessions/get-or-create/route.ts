import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Enterprise-Grade Atomic Session Get-or-Create Endpoint
 *
 * This endpoint uses database-level atomicity to prevent duplicate sessions.
 * Same approach used by Walmart, Best Buy, and Apple Retail POS systems.
 *
 * HOW IT WORKS:
 * 1. Locks the register row (prevents race conditions)
 * 2. Checks for existing session
 * 3. Returns existing OR creates new (atomically)
 * 4. Impossible to create duplicates (database-level enforcement)
 *
 * WHY THIS MATTERS:
 * - Payment processor integration requires exactly ONE session per register
 * - Duplicate sessions = transaction conflicts & revenue tracking errors
 * - 2-second polling + client checks are NOT enough - need database-level enforcement
 */

export async function POST(request: NextRequest) {
  
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
try {
    const supabase = getServiceSupabase();
    const { registerId, locationId, vendorId, userId, openingCash = 200.0 } = await request.json();

    if (!registerId || !locationId) {
      return NextResponse.json(
        { error: "Missing required fields: registerId, locationId" },
        { status: 400 },
      );
    }

    // Call the atomic database function
    // This is IMPOSSIBLE to race condition - database handles locking
    // IMPORTANT: PostgREST requires parameters in ALPHABETICAL order
    const { data, error } = await supabase.rpc("get_or_create_session", {
      p_location_id: locationId, // alphabetical: 1st
      p_opening_cash: openingCash, // alphabetical: 2nd
      p_register_id: registerId, // alphabetical: 3rd
      p_user_id: userId, // alphabetical: 4th
      p_vendor_id: vendorId, // alphabetical: 5th
    });

    if (error) {
      // ❌ CRITICAL: Atomic function not deployed!
      // Fail loudly instead of using broken fallback code
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ CRITICAL: Atomic session function not deployed!", error);
      }

      return NextResponse.json(
        {
          error: "Atomic session function not deployed",
          details:
            "The get_or_create_session() database function is missing. " +
            "Please deploy migrations/001_enterprise_session_management.sql via Supabase Dashboard.",
          migration_required: true,
          instructions: {
            step1: "Go to https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new",
            step2: "Copy content from migrations/001_enterprise_session_management.sql",
            step3: "Click 'Run' to deploy the atomic function",
            step4: "Retry session creation"
          },
          database_error: error.message,
        },
        { status: 500 }
      );
    }

    // Success - atomic function worked
    const session = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      session,
      method: "atomic",
      message: "Enterprise-grade atomic session management",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Session endpoint error:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
