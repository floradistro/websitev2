import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/test-complete-sale
 * Tests the complete sales flow end-to-end
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Get Flora Distro vendor
    const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

    // Get a location
    const { data: locations } = await supabase
      .from("locations")
      .select("id, name")
      .eq("vendor_id", vendorId)
      .limit(1);

    if (!locations || locations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No locations found for vendor",
        },
        { status: 404 },
      );
    }

    const location = locations[0];

    // Try to get an active session (optional)
    const { data: sessions } = await supabase
      .from("pos_sessions")
      .select("id, session_number, walk_in_sales, total_sales")
      .eq("location_id", location.id)
      .eq("status", "open")
      .limit(1);

    const session = sessions && sessions.length > 0 ? sessions[0] : null;
    const beforeWalkIn = session ? session.walk_in_sales : null;
    const beforeTotal = session ? parseFloat(session.total_sales) : null;

    // Get a product with inventory
    const { data: products } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        regular_price,
        inventory!inner(id, quantity, location_id)
      `,
      )
      .eq("vendor_id", vendorId)
      .eq("inventory.location_id", location.id)
      .gt("inventory.quantity", 0)
      .limit(1);

    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No products with inventory found",
        },
        { status: 404 },
      );
    }

    const product = products[0];
    const inventory = Array.isArray(product.inventory)
      ? product.inventory[0]
      : product.inventory;

    if (session) {
    } else {
    }

    // Create a test sale
    const subtotal = parseFloat(product.regular_price);
    const taxAmount = subtotal * 0.08; // 8% tax
    const total = subtotal + taxAmount;

    const saleData = {
      locationId: location.id,
      vendorId: vendorId,
      sessionId: session?.id || undefined,
      items: [
        {
          productId: product.id,
          productName: product.name,
          unitPrice: subtotal,
          quantity: 1,
          lineTotal: subtotal,
          inventoryId: inventory.id,
        },
      ],
      subtotal,
      taxAmount,
      total,
      paymentMethod: "cash" as const,
      cashTendered: Math.ceil(total),
      changeGiven: Math.ceil(total) - total,
      customerName: "TEST SALE - AUTO CLEANUP",
    };

    // Call the sales endpoint
    const saleResponse = await fetch(
      "http://localhost:3000/api/pos/sales/create",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      },
    );

    const saleResult = await saleResponse.json();

    if (!saleResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Sale creation failed",
          details: saleResult,
        },
        { status: 500 },
      );
    }

    // Verify session was updated (if we have a session)
    let afterWalkIn = null;
    let afterTotal = null;
    let sessionUpdated = false;

    if (session) {
      const { data: updatedSession } = await supabase
        .from("pos_sessions")
        .select("walk_in_sales, total_sales")
        .eq("id", session.id)
        .single();

      if (updatedSession) {
        afterWalkIn = updatedSession.walk_in_sales;
        afterTotal = parseFloat(updatedSession.total_sales);

        sessionUpdated =
          afterWalkIn === beforeWalkIn + 1 &&
          beforeTotal !== null &&
          Math.abs(afterTotal - (beforeTotal + total)) < 0.01;
      }
    }

    // Clean up - delete test order
    await supabase
      .from("order_items")
      .delete()
      .eq("order_id", saleResult.order.id);

    await supabase.from("orders").delete().eq("id", saleResult.order.id);

    if (saleResult.transaction?.id) {
      await supabase
        .from("pos_transactions")
        .delete()
        .eq("id", saleResult.transaction.id);
    }

    // Restore session counters (if we have a session)
    if (session) {
      await supabase
        .from("pos_sessions")
        .update({
          walk_in_sales: beforeWalkIn,
          total_sales: beforeTotal,
        })
        .eq("id", session.id);
    }

    return NextResponse.json({
      success: true,
      message: session
        ? sessionUpdated
          ? "✅ Complete sales flow is working perfectly!"
          : "⚠️ Sale created but session counters may not have updated"
        : "✅ Sales endpoint is working (no session to test)",
      test: {
        product: product.name,
        sale: {
          order_number: saleResult.order.order_number,
          total: `$${total.toFixed(2)}`,
          duration_ms: saleResult.duration_ms,
        },
        session: session
          ? {
              session_number: session.session_number,
              before: {
                walk_in_sales: beforeWalkIn,
                total_sales: beforeTotal,
              },
              after: {
                walk_in_sales: afterWalkIn,
                total_sales: afterTotal,
              },
              updated_correctly: sessionUpdated,
            }
          : null,
        cleanup:
          "Test order deleted" + (session ? ", session counters restored" : ""),
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Test failed:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}
