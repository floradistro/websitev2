import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();
    const { locationId, userId, openingCash = 0, registerId } = await request.json();
    // SECURITY: vendorId from JWT, request param ignored (Phase 4)

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    // Check if there's already an open session for THIS REGISTER (not location-wide)
    if (registerId) {
      const { data: existing } = await supabase
        .from("pos_sessions")
        .select("id, session_number")
        .eq("register_id", registerId)
        .eq("status", "open")
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          {
            error: "Session already open for this register",
            session: existing,
          },
          { status: 409 },
        );
      }
    }

    // Get location details
    const { data: location } = await supabase
      .from("locations")
      .select("vendor_id, slug")
      .eq("id", locationId)
      .single();

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Generate session number with timestamp for uniqueness
    const locationCode = location.slug.substring(0, 3).toUpperCase();
    const dateCode = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp for uniqueness

    // Get next sequence for today
    const { data: todaySessions } = await supabase
      .from("pos_sessions")
      .select("session_number")
      .eq("location_id", locationId)
      .gte("opened_at", new Date().toISOString().split("T")[0])
      .order("opened_at", { ascending: false });

    const sequence = (todaySessions?.length || 0) + 1;
    const sessionNumber = `POS-${locationCode}-${dateCode}-${sequence.toString().padStart(3, "0")}-${timestamp}`;

    // Get a user_id (test mode: use any staff member if userId not provided)
    let finalUserId = userId;
    if (!userId) {
      const { data: anyUser } = await supabase
        .from("users")
        .select("id")
        .eq("vendor_id", location.vendor_id)
        .limit(1)
        .maybeSingle();

      finalUserId = anyUser?.id;
    }

    if (!finalUserId) {
      return NextResponse.json(
        { error: "No valid user found. Create a POS staff member first." },
        { status: 400 },
      );
    }

    // Create session with retry logic for session_number collisions
    let session: any = null;
    let sessionError: any = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !session) {
      // Regenerate session number on retry (including new timestamp for uniqueness)
      let currentSessionNumber = sessionNumber;
      if (retryCount > 0) {
        // Re-query to get updated count
        const { data: updatedSessions } = await supabase
          .from("pos_sessions")
          .select("session_number")
          .eq("location_id", locationId)
          .gte("opened_at", new Date().toISOString().split("T")[0])
          .order("opened_at", { ascending: false });

        const updatedSequence = (updatedSessions?.length || 0) + 1;
        const newTimestamp = Date.now().toString().slice(-6);
        currentSessionNumber = `POS-${locationCode}-${dateCode}-${updatedSequence.toString().padStart(3, "0")}-${newTimestamp}`;
        logger.info(`Retry ${retryCount}: Regenerated session number: ${currentSessionNumber}`);
      }

      const result = await supabase
        .from("pos_sessions")
        .insert({
          location_id: locationId,
          vendor_id: vendorId,
          user_id: finalUserId,
          register_id: registerId || null,
          session_number: currentSessionNumber,
          status: "open",
          opening_cash: openingCash,
          total_sales: 0,
          total_transactions: 0,
          metadata: {
            opened_via: "pos_register",
            opened_at_timestamp: Date.now(),
            test_mode: !userId,
            register_id: registerId || null,
          },
        })
        .select()
        .single();

      session = result.data;
      sessionError = result.error;

      // If we get a duplicate session_number error, retry
      if (
        sessionError?.code === "23505" &&
        sessionError?.message?.includes("pos_sessions_session_number_key")
      ) {
        retryCount++;
        logger.info(`Session number collision detected, retrying... (attempt ${retryCount}/${maxRetries})`);
        // Add small random delay to reduce collision probability
        await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
        continue;
      }

      // Any other error or success, break the loop
      break;
    }

    if (sessionError) {
      // Check if we exhausted retries on session_number collision
      if (
        retryCount >= maxRetries &&
        sessionError.code === "23505" &&
        sessionError.message?.includes("pos_sessions_session_number_key")
      ) {
        logger.error("❌ Failed to create session after max retries (session number collision)");
        return NextResponse.json(
          {
            error: "Failed to create session due to concurrent requests",
            details: "Please try again in a moment",
          },
          { status: 409 },
        );
      }

      // Check if it's a unique constraint violation on register (error code 23505)
      if (sessionError.code === "23505" && sessionError.message?.includes("idx_one_open_session_per_register")) {
        logger.info("Session already open for this register - returning 409");
        return NextResponse.json(
          {
            error: "Session already open for this register",
            details: "Please close the existing session before opening a new one, or join the existing session.",
          },
          { status: 409 },
        );
      }

      logger.error("❌ Error creating POS session:", {
        error: sessionError,
        message: sessionError.message,
        code: sessionError.code,
        details: sessionError.details,
        hint: sessionError.hint,
        locationId,
        vendorId,
        userId: finalUserId,
        registerId,
        sessionNumber,
        retryCount,
      });
      return NextResponse.json(
        { error: "Failed to create session", details: sessionError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      session,
      message: `Session ${sessionNumber} opened successfully`,
    });
  } catch (error) {
    const err = toError(error);
    logger.error("❌ Error in open session endpoint:", {
      error: err,
      message: err.message,
      stack: err.stack,
    });
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
