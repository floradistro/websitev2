import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";
import { parseDateRange, parseFilters } from "@/lib/analytics/query-helpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/v2/sessions/summary
 * POS session summaries
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const dateRange = parseDateRange(searchParams);
    const filters = parseFilters(searchParams);

    // Get sessions
    let sessionsQuery = supabase
      .from("pos_sessions")
      .select(
        `
        id,
        session_number,
        status,
        user_id,
        opening_cash,
        closing_cash,
        expected_cash,
        cash_difference,
        total_sales,
        total_transactions,
        total_cash,
        total_card,
        total_refunds,
        opened_at,
        closed_at,
        location_id,
        locations(name)
      `,
      )
      .eq("vendor_id", vendorId)
      .gte("opened_at", dateRange.start_date)
      .lte("opened_at", dateRange.end_date)
      .order("opened_at", { ascending: false });

    if (filters.location_ids && filters.location_ids.length > 0) {
      sessionsQuery = sessionsQuery.in("location_id", filters.location_ids);
    }

    const { data: sessions, error } = await sessionsQuery;

    if (error) throw error;

    // Get unique user IDs to fetch user names
    const userIdsSet = new Set<string>();
    sessions?.forEach((s: any) => {
      if (s.user_id) userIdsSet.add(s.user_id);
    });
    const userIds = Array.from(userIdsSet);
    let userMap = new Map();

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .in("id", userIds);

      users?.forEach((u: any) => {
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || "Unknown";
        userMap.set(u.id, fullName);
      });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        metadata: {
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          total_records: 0,
        },
      });
    }

    // Format sessions
    const formattedSessions = sessions.map((session: any) => ({
      session_id: session.id,
      session_number: session.session_number,
      location_name: session.locations?.name || "Unknown",
      employee_name: session.user_id ? userMap.get(session.user_id) || "Unknown" : "Unknown",
      opened_at: session.opened_at,
      closed_at: session.closed_at,
      opening_cash: parseFloat(session.opening_cash || "0"),
      closing_cash: parseFloat(session.closing_cash || "0"),
      expected_cash: parseFloat(session.expected_cash || "0"),
      variance: parseFloat(session.cash_difference || "0"),
      total_sales: parseFloat(session.total_sales || "0"),
      total_transactions: session.total_transactions || 0,
      cash_sales: parseFloat(session.total_cash || "0"),
      card_sales: parseFloat(session.total_card || "0"),
      refunds: parseFloat(session.total_refunds || "0"),
      status: session.status,
    }));

    // Calculate summaries
    const summary = {
      total_sessions: formattedSessions.length,
      total_sales: formattedSessions.reduce((sum, s) => sum + s.total_sales, 0),
      total_transactions: formattedSessions.reduce((sum, s) => sum + s.total_transactions, 0),
      total_variance: formattedSessions.reduce((sum, s) => sum + s.variance, 0),
      sessions_with_variance: formattedSessions.filter((s) => Math.abs(s.variance) > 0).length,
    };

    return NextResponse.json({
      success: true,
      data: formattedSessions,
      metadata: {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        total_records: formattedSessions.length,
      },
      summary,
    });
  } catch (error: any) {
    logger.error("Session summary error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load session summaries" },
      { status: 500 },
    );
  }
}
