import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Live Dashboard Stats API
 * Real-time metrics for vendor dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { vendorId, user } = authResult;
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId"); // Optional: filter by location for employees

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Execute all queries in parallel for maximum speed
    const [
      sessionsResult,
      todayOrdersResult,
      tvDisplaysResult,
      locationsResult,
      lowStockResult,
      pendingOrdersResult,
    ] = await Promise.all([
      // Active POS sessions (logged in staff)
      supabase
        .from("pos_sessions")
        .select(`
          id,
          user_id,
          location_id,
          session_number,
          opened_at,
          total_sales,
          locations:location_id(name)
        `)
        .eq("vendor_id", vendorId)
        .eq("status", "open")
        .order("opened_at", { ascending: false }),

      // Today's orders
      supabase
        .from("orders")
        .select(`
          id,
          total,
          created_at,
          order_items!inner(vendor_id)
        `)
        .eq("order_items.vendor_id", vendorId)
        .gte("created_at", startOfDay.toISOString()),

      // Active TV displays
      supabase
        .from("tv_display_devices")
        .select("id, device_name, location_id, last_heartbeat")
        .eq("vendor_id", vendorId)
        .eq("status", "active")
        .gte("last_heartbeat", new Date(Date.now() - 5 * 60 * 1000).toISOString()), // Active in last 5 mins

      // Locations count
      supabase
        .from("locations")
        .select("id, name, city")
        .eq("vendor_id", vendorId)
        .eq("is_active", true),

      // Low stock items
      supabase
        .from("inventory")
        .select("id, product_id, quantity, low_stock_threshold")
        .eq("vendor_id", vendorId)
        .lt("quantity", 10)
        .limit(10),

      // Pending/processing orders
      supabase
        .from("orders")
        .select(`
          id,
          status,
          order_items!inner(vendor_id)
        `)
        .eq("order_items.vendor_id", vendorId)
        .in("status", ["pending", "processing", "confirmed"]),
    ]);

    const sessions = sessionsResult.data || [];
    const orders = todayOrdersResult.data || [];
    const tvDisplays = tvDisplaysResult.data || [];
    const locations = locationsResult.data || [];
    const lowStockItems = lowStockResult.data || [];
    const pendingOrders = pendingOrdersResult.data || [];

    // Filter by location if employee
    const filteredSessions = locationId
      ? sessions.filter((s) => s.location_id === locationId)
      : sessions;

    const filteredTVs = locationId
      ? tvDisplays.filter((tv) => tv.location_id === locationId)
      : tvDisplays;

    // Calculate today's sales
    const todaySales = orders.reduce((sum, order) => {
      return sum + parseFloat(order.total?.toString() || "0");
    }, 0);

    // Calculate session sales
    const sessionSales = filteredSessions.reduce((sum, session) => {
      return sum + parseFloat(session.total_sales?.toString() || "0");
    }, 0);

    // Group sessions by location
    const sessionsByLocation = filteredSessions.reduce((acc: any, session) => {
      const locName = (session.locations as any)?.name || "Unknown";
      if (!acc[locName]) {
        acc[locName] = [];
      }
      acc[locName].push(session);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      stats: {
        todaySales: todaySales,
        sessionSales: sessionSales,
        activeStaff: filteredSessions.length,
        activeTVs: filteredTVs.length,
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        locationsCount: locations.length,
        lowStockCount: lowStockItems.length,
      },
      details: {
        sessions: filteredSessions.map((s) => ({
          id: s.id,
          sessionNumber: s.session_number,
          locationName: (s.locations as any)?.name || "Unknown",
          openedAt: s.opened_at,
          sales: parseFloat(s.total_sales?.toString() || "0"),
        })),
        sessionsByLocation,
        tvDisplays: filteredTVs.map((tv) => ({
          id: tv.id,
          name: tv.device_name,
          locationId: tv.location_id,
          lastHeartbeat: tv.last_heartbeat,
        })),
        locations: locations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          city: loc.city,
        })),
        lowStockItems: lowStockItems.map((item) => ({
          id: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          threshold: item.low_stock_threshold,
        })),
      },
    });
  } catch (error) {
    console.error("Live stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch live stats" },
      { status: 500 },
    );
  }
}

