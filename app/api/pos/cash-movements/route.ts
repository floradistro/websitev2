import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

// GET /api/pos/cash-movements - Get cash movements for a session
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Get all cash movements for session
    const { data: movements, error } = await supabase
      .from("pos_cash_movements")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching cash movements:", error);
      }
      return NextResponse.json(
        { error: "Failed to fetch cash movements" },
        { status: 500 },
      );
    }

    // Calculate summary
    const summary = {
      opening: 0,
      sales: 0,
      refunds: 0,
      no_sales: 0,
      paid_in: 0,
      paid_out: 0,
      current_balance: 0,
      movement_count: movements?.length || 0,
    };

    movements?.forEach((m: any) => {
      switch (m.movement_type) {
        case "opening":
          summary.opening = parseFloat(m.amount);
          break;
        case "sale":
          summary.sales += parseFloat(m.amount);
          break;
        case "refund":
          summary.refunds += parseFloat(m.amount);
          break;
        case "no_sale":
          summary.no_sales += 1;
          break;
        case "paid_in":
          summary.paid_in += parseFloat(m.amount);
          break;
        case "paid_out":
          summary.paid_out += Math.abs(parseFloat(m.amount));
          break;
      }
      summary.current_balance = parseFloat(m.running_balance || 0);
    });

    return NextResponse.json({
      movements: movements || [],
      summary,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in GET /api/pos/cash-movements:", error);
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/pos/cash-movements - Create new cash movement
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const {
      sessionId,
      registerId,
      userId,
      locationId,
      movementType,
      amount,
      reason,
      notes,
    } = body;
    // SECURITY: vendorId from JWT, request param ignored (Phase 4)

    // Validate required fields
    if (
      !sessionId ||
      !userId ||
      !locationId ||
      !movementType ||
      amount === undefined ||
      !reason
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sessionId, userId, locationId, movementType, amount, reason",
        },
        { status: 400 },
      );
    }

    // Validate movement type
    const validTypes = ["no_sale", "paid_in", "paid_out", "refund"];
    if (!validTypes.includes(movementType)) {
      return NextResponse.json(
        {
          error: `Invalid movement type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Create cash movement
    const { data: movement, error } = await supabase
      .from("pos_cash_movements")
      .insert({
        session_id: sessionId,
        register_id: registerId || null,
        user_id: userId,
        location_id: locationId,
        vendor_id: vendorId,
        movement_type: movementType,
        amount: parseFloat(amount),
        reason,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating cash movement:", error);
      }
      return NextResponse.json(
        { error: "Failed to create cash movement" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      movement,
      message: `Cash movement recorded: ${reason}`,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in POST /api/pos/cash-movements:", error);
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
