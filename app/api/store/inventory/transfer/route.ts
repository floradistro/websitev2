import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { validateNumber, round2 } from "@/lib/utils/precision";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Use requireVendor to get vendor_id from authenticated session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;

    const body = await request.json();
    const { productId, fromLocationId, toLocationId, quantity, reason } = body;

    // VALIDATION: Comprehensive input validation
    if (!productId || !fromLocationId || !toLocationId || !quantity) {
      return NextResponse.json(
        {
          error: "Missing required fields: productId, fromLocationId, toLocationId, quantity",
        },
        { status: 400 },
      );
    }

    if (fromLocationId === toLocationId) {
      return NextResponse.json(
        {
          error: "Cannot transfer to the same location",
        },
        { status: 400 },
      );
    }

    // PRECISION FIX: Validate and round quantity to 2 decimal places
    const validation = validateNumber(quantity, {
      min: 0.01,
      max: 999999,
      allowNegative: false,
      allowZero: false,
      label: 'Transfer quantity'
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
        },
        { status: 400 },
      );
    }

    const transferQty = round2(validation.value!);

    const supabase = getServiceSupabase();

    // =====================================================
    // ATOMIC TRANSFER VIA RPC FUNCTION
    // =====================================================
    // Uses atomic_inventory_transfer() PostgreSQL function with:
    // - Row-level locking (FOR UPDATE NOWAIT)
    // - Automatic transaction management
    // - Automatic rollback on failure
    // - Precision decimal calculations
    // - Stock movement audit trail
    // - Product stock_quantity update
    // =====================================================

    const { data: result, error: rpcError } = await supabase.rpc(
      'atomic_inventory_transfer',
      {
        p_vendor_id: vendorId,
        p_product_id: productId,
        p_from_location_id: fromLocationId,
        p_to_location_id: toLocationId,
        p_quantity: transferQty,
        p_reason: reason || null,
      }
    );

    if (rpcError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Atomic transfer RPC error:", rpcError);
      }

      // Parse error messages for better UX
      const errorMessage = rpcError.message || "Failed to transfer inventory";

      // Handle specific error cases
      if (errorMessage.includes('Insufficient stock')) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage.includes('not found or not authorized')) {
        return NextResponse.json({ error: errorMessage }, { status: 403 });
      }
      if (errorMessage.includes('Transfer already in progress')) {
        return NextResponse.json(
          {
            error: "This transfer is already in progress. Please wait and try again.",
            retry: true,
          },
          { status: 409 } // Conflict
        );
      }
      if (errorMessage.includes('same location')) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      // Generic error
      return NextResponse.json(
        {
          error: errorMessage,
          details: process.env.NODE_ENV === "development" ? rpcError : undefined,
        },
        { status: 500 }
      );
    }

    // RPC function returns JSON result with all transfer details
    return NextResponse.json(result);
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Transfer error:", err);
    }
    if (process.env.NODE_ENV === "development") {
      logger.error("Error stack:", err.stack);
    }
    return NextResponse.json(
      {
        error: err.message || "Failed to transfer inventory",
        details: String(error),
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}
