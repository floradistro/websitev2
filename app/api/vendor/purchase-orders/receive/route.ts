import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";

/**
 * Receive purchase order items (atomic transaction via database function)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const body = await request.json();
    const { po_id, items } = body;

    if (!po_id || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "PO ID and items are required",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    logger.info("Receiving PO items:", {
      po_id,
      vendor_id: vendorId,
      item_count: items.length,
    });

    // Call the atomic database function
    // This ensures all items are processed in a single transaction
    const { data: result, error: rpcError } = await supabase.rpc("receive_purchase_order_items", {
      p_po_id: po_id,
      p_items: items,
      p_vendor_id: vendorId,
    });

    if (rpcError) {
      logger.error("❌ RPC error receiving items:", rpcError);
      return NextResponse.json(
        { success: false, error: rpcError.message || "Failed to receive items" },
        { status: 500 },
      );
    }

    if (!result || !result.success) {
      logger.error("❌ Receive function returned error:", result);
      return NextResponse.json(
        {
          success: false,
          error: result?.error || "Failed to receive items",
          details: result?.results,
        },
        { status: 500 },
      );
    }

    // Log summary
    logger.info("✅ Receive processing summary:", {
      successful: result.successful_items,
      failed: result.failed_items,
      results: result.results,
    });

    // Get updated PO
    const { data: updatedPO, error: fetchError } = await supabase
      .from("purchase_orders")
      .select(
        `
        *,
        location:location_id(id, name),
        items:purchase_order_items(*)
      `,
      )
      .eq("id", po_id)
      .maybeSingle();

    if (fetchError) {
      logger.error("❌ Error fetching updated PO:", fetchError);
    }

    return NextResponse.json({
      success: true,
      purchase_order: updatedPO,
      message:
        result.failed_items > 0
          ? `Received ${result.successful_items} items, ${result.failed_items} failed`
          : "Items received successfully",
      processing_results: result.results,
    });
  } catch (error) {
    const err = toError(error);
    logger.error("Error in receive items API:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
