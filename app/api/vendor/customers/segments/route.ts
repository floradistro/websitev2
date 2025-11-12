import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/vendor/customers/segments - Get customer counts for all segments
export async function GET(request: NextRequest) {
  const vendorId = request.headers.get("x-vendor-id");

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
  }

  // Force no caching in development
  const noCacheHeaders = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
  };

  try {
    const supabase = await createClient();

    console.log("🔥 [v4] Fetching segments for vendor:", vendorId);

    // Supabase JS client has a hardcoded 1000 row limit
    // We need to fetch in batches until we get all customers
    let allCustomers: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("customers")
        .select("id, email, loyalty_points, loyalty_tier, created_at, metadata")
        .eq("vendor_id", vendorId)
        .range(from, to);

      if (error) {
        console.error("Error fetching customers page", page, error);
        return NextResponse.json(
          { error: "Failed to fetch customers", details: error },
          { status: 500, headers: noCacheHeaders }
        );
      }

      if (data && data.length > 0) {
        allCustomers = allCustomers.concat(data);
        console.log(`📦 Fetched page ${page + 1}: ${data.length} customers (total so far: ${allCustomers.length})`);

        // If we got less than pageSize, we've reached the end
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    const customersError = null; // Reset error since we handle it in the loop

    if (customersError) {
      console.error("Error fetching customers:", customersError);
      return NextResponse.json(
        { error: "Failed to fetch customers", details: customersError },
        { status: 500, headers: noCacheHeaders }
      );
    }

    const customers = allCustomers || [];
    console.log("Fetched customers:", customers.length);

    // Get order data for segmentation
    const { data: orders } = await supabase
      .from("orders")
      .select("customer_id, total, created_at")
      .eq("vendor_id", vendorId)
      .in("status", ["completed", "processing"]);

    // Calculate segments
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Build customer order map
    const customerOrders = new Map<string, any[]>();
    orders?.forEach((order) => {
      if (!customerOrders.has(order.customer_id)) {
        customerOrders.set(order.customer_id, []);
      }
      customerOrders.get(order.customer_id)?.push(order);
    });

    // Calculate lifetime spend per customer
    const customerLifetimeSpend = new Map<string, number>();
    customerOrders.forEach((orders, customerId) => {
      const total = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      customerLifetimeSpend.set(customerId, total);
    });

    // Segment counts
    const segments = {
      all: customers.length,
      loyalty: customers.filter((c) => c.loyalty_points > 0 || c.loyalty_tier).length,
      vip: customers.filter((c) => {
        const tier = c.loyalty_tier?.toLowerCase();
        return tier === "gold" || tier === "platinum";
      }).length,
      recent: customers.filter((c) => {
        const orders = customerOrders.get(c.id) || [];
        return orders.some((o) => new Date(o.created_at) >= thirtyDaysAgo);
      }).length,
      inactive: customers.filter((c) => {
        const orders = customerOrders.get(c.id) || [];
        if (orders.length === 0) return false;
        const lastOrder = orders.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        return new Date(lastOrder.created_at) < ninetyDaysAgo;
      }).length,
      highValue: customers.filter((c) => {
        const spend = customerLifetimeSpend.get(c.id) || 0;
        return spend >= 500;
      }).length,
    };

    return NextResponse.json(
      {
        segments,
        totalWithEmail: customers.length,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("Error calculating segments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: noCacheHeaders });
  }
}
