import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { sessionId, closingCash, closingNotes } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from("pos_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "closed") {
      // Already closed - return success with existing data
      return NextResponse.json({
        success: true,
        message: "Session already closed",
        summary: {
          session_number: session.session_number,
          total_sales: session.total_sales,
          total_transactions: session.total_transactions,
          status: "closed",
        },
      });
    }

    // Calculate expected cash
    const expectedCash = session.opening_cash + session.total_cash;
    const cashDifference = closingCash - expectedCash;

    // Close session
    const { error: updateError } = await supabase
      .from("pos_sessions")
      .update({
        status: "closed",
        closing_cash: closingCash,
        expected_cash: expectedCash,
        cash_difference: cashDifference,
        closed_at: new Date().toISOString(),
        closing_notes: closingNotes,
      })
      .eq("id", sessionId);

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error closing session:", updateError);
      }
      return NextResponse.json(
        { error: "Failed to close session", details: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      summary: {
        session_number: session.session_number,
        total_sales: session.total_sales,
        total_transactions: session.total_transactions,
        walk_in_sales: session.walk_in_sales,
        pickup_orders_fulfilled: session.pickup_orders_fulfilled,
        opening_cash: session.opening_cash,
        closing_cash: closingCash,
        expected_cash: expectedCash,
        cash_difference: cashDifference,
        status:
          cashDifference === 0
            ? "balanced"
            : cashDifference > 0
              ? "over"
              : "short",
      },
      message: `Session ${session.session_number} closed successfully`,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in close session endpoint:", error);
    }
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
