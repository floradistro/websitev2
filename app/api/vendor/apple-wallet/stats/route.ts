import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireVendor } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/apple-wallet/stats
 * Get Apple Wallet statistics for vendor
 */
export async function GET(request: NextRequest) {
  try {
    // Verify vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const vendorId = authResult.vendorId;

    // Get total passes count
    const { count: totalPasses } = await supabase
      .from("wallet_passes")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId);

    // Get active passes count
    const { count: activePasses } = await supabase
      .from("wallet_passes")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .eq("status", "active")
      .not("added_to_wallet_at", "is", null);

    // Get total devices count (sum of all devices across all passes)
    const { data: passesWithDevices } = await supabase
      .from("wallet_passes")
      .select("devices")
      .eq("vendor_id", vendorId)
      .eq("status", "active");

    const totalDevices =
      passesWithDevices?.reduce((sum, pass) => {
        return sum + (Array.isArray(pass.devices) ? pass.devices.length : 0);
      }, 0) || 0;

    // Get passes added today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: passesAddedToday } = await supabase
      .from("wallet_passes")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .gte("created_at", today.toISOString());

    // Get passes added this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: passesAddedThisWeek } = await supabase
      .from("wallet_passes")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .gte("created_at", weekAgo.toISOString());

    // Get passes added this month
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const { count: passesAddedThisMonth } = await supabase
      .from("wallet_passes")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .gte("created_at", monthAgo.toISOString());

    // Get recent passes with customer data
    const { data: recentPasses } = await supabase
      .from("wallet_passes")
      .select(
        `
        id,
        serial_number,
        status,
        devices,
        added_to_wallet_at,
        last_updated_at,
        created_at,
        customers (
          id,
          first_name,
          last_name,
          email,
          loyalty_points,
          loyalty_tier
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Format recent passes
    const formattedPasses =
      recentPasses?.map((pass: any) => ({
        id: pass.id,
        serial_number: pass.serial_number,
        status: pass.status,
        devices: pass.devices || [],
        added_to_wallet_at: pass.added_to_wallet_at,
        last_updated_at: pass.last_updated_at,
        created_at: pass.created_at,
        customer: pass.customers,
      })) || [];

    return NextResponse.json({
      success: true,
      stats: {
        total_passes: totalPasses || 0,
        active_passes: activePasses || 0,
        total_devices: totalDevices,
        passes_added_today: passesAddedToday || 0,
        passes_added_this_week: passesAddedThisWeek || 0,
        passes_added_this_month: passesAddedThisMonth || 0,
      },
      recent_passes: formattedPasses,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Wallet stats API error:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch wallet stats",
      },
      { status: 500 },
    );
  }
}
