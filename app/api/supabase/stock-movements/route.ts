import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const inventoryId = searchParams.get("inventory_id");
    const movementType = searchParams.get("movement_type");
    const limit = parseInt(searchParams.get("limit") || "100");

    const supabase = getServiceSupabase();

    let query = supabase.from("stock_movements").select(`
        *,
        inventory:inventory(id, product_id, location:locations(name)),
        from_location:from_location_id(name),
        to_location:to_location_id(name)
      `);

    // Filter by vendor's inventory (vendor authentication required)
    const { data: vendorInventory } = await supabase
      .from("inventory")
      .select("id")
      .eq("vendor_id", vendorId);

    const inventoryIds = vendorInventory?.map((inv) => inv.id) || [];
    if (inventoryIds.length > 0) {
      query = query.in("inventory_id", inventoryIds);
    } else {
      // No inventory = no movements
      return NextResponse.json({ success: true, movements: [] });
    }

    // Filter by product
    if (productId) {
      query = query.eq("product_id", parseInt(productId));
    }

    // Filter by inventory
    if (inventoryId) {
      query = query.eq("inventory_id", inventoryId);
    }

    // Filter by movement type
    if (movementType) {
      query = query.eq("movement_type", movementType);
    }

    const { data, error } = await query.order("movement_date", { ascending: false }).limit(limit);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching stock movements:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      movements: data || [],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const {
      inventory_id,
      product_id,
      movement_type,
      quantity,
      from_location_id,
      to_location_id,
      cost_per_unit,
      reference_type,
      reference_id,
      reason,
      notes,
    } = body;

    if (!inventory_id || !product_id || !movement_type || quantity === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields: inventory_id, product_id, movement_type, quantity",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Get current inventory
    const { data: inventory } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", inventory_id)
      .single();

    const currentQty = inventory?.quantity || 0;
    const qtyChange = parseFloat(quantity);

    // Calculate new quantity based on movement type
    let newQty = currentQty;
    if (["purchase", "return", "found", "adjustment"].includes(movement_type)) {
      newQty = currentQty + qtyChange;
    } else if (["sale", "damage", "loss", "pos_sale", "online_order"].includes(movement_type)) {
      newQty = currentQty - qtyChange;
    }

    // Create movement
    const { data: movement, error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        inventory_id,
        product_id: parseInt(product_id),
        movement_type,
        quantity: qtyChange,
        quantity_before: currentQty,
        quantity_after: newQty,
        from_location_id,
        to_location_id,
        cost_per_unit: cost_per_unit ? parseFloat(cost_per_unit) : null,
        total_cost: cost_per_unit ? parseFloat(cost_per_unit) * qtyChange : null,
        reference_type,
        reference_id,
        reason,
        notes,
      })
      .select()
      .single();

    if (movementError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating stock movement:", movementError);
      }
      return NextResponse.json({ error: movementError.message }, { status: 500 });
    }

    // Update inventory quantity
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", inventory_id);

    return NextResponse.json({
      success: true,
      movement,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
