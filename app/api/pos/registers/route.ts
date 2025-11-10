import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/pos/registers - Get registers for a location
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ error: "locationId is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get all registers for location WITH payment processor info
    const { data: registers, error } = await supabase
      .from("pos_registers")
      .select(
        `
        *,
        payment_processor:payment_processors(
          id,
          processor_name,
          processor_type,
          is_active
        )
      `,
      )
      .eq("location_id", locationId)
      .eq("status", "active")
      .order("register_number");

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching registers:", error);
      }
      logger.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to fetch registers", details: error.message },
        { status: 500 },
      );
    }

    // Fetch active sessions for these registers
    const registerIds = registers.map((r) => r.id);
    const { data: sessions } = await supabase
      .from("pos_sessions")
      .select(
        `
        id,
        register_id,
        session_number,
        total_sales,
        opened_at,
        user_id,
        users(first_name, last_name)
      `,
      )
      .in("register_id", registerIds)
      .eq("status", "open");

    // Map sessions to registers
    const sessionsMap = new Map();
    (sessions || []).forEach((session) => {
      sessionsMap.set(session.register_id, session);
    });

    // Format the response to include session data properly
    const formattedRegisters = registers.map((reg) => {
      const session = sessionsMap.get(reg.id);

      return {
        ...reg,
        current_session: session
          ? {
              id: session.id,
              session_number: session.session_number,
              total_sales: session.total_sales || 0,
              started_at: session.opened_at,
              user_name: session.users
                ? `${session.users.first_name} ${session.users.last_name}`
                : undefined,
            }
          : undefined,
      };
    });

    return NextResponse.json({ registers: formattedRegisters });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in GET /api/pos/registers:", error);
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/pos/registers - Create new register
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { locationId, registerName, deviceName, deviceId } = body;
    // SECURITY: vendorId from JWT, request param ignored (Phase 4)

    if (!locationId || !registerName) {
      return NextResponse.json(
        { error: "locationId and registerName are required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Generate register number
    const { data: registerNumber } = await supabase
      .rpc("generate_register_number", { p_location_id: locationId })
      .single();

    // Create register
    const { data: register, error } = await supabase
      .from("pos_registers")
      .insert({
        location_id: locationId,
        vendor_id: vendorId,
        register_number: registerNumber,
        register_name: registerName,
        device_name: deviceName || "Unnamed Device",
        device_id: deviceId,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating register:", error);
      }
      return NextResponse.json({ error: "Failed to create register" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      register,
      message: `Register ${registerNumber} created successfully`,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in POST /api/pos/registers:", error);
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
