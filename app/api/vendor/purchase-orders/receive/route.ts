import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
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

    // Verify ownership
    const { data: po, error: verifyError } = await supabase
      .from("purchase_orders")
      .select("*, location:location_id(id)")
      .eq("id", po_id)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (verifyError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching purchase order:", verifyError);
      }
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    if (!po) {
      return NextResponse.json(
        { success: false, error: "Purchase order not found or access denied" },
        { status: 404 },
      );
    }

    // Process each item
    for (const item of items) {
      const { po_item_id, quantity_received, condition, quality_notes, notes } = item;

      if (!po_item_id || !quantity_received || quantity_received <= 0) {
        continue;
      }

      // Get PO item details
      const { data: poItem, error: itemError } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("id", po_item_id)
        .maybeSingle();

      if (itemError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Error fetching PO item:", itemError);
        }
        continue;
      }

      if (!poItem) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ PO item not found:", po_item_id);
        }
        continue;
      }

      // Find or create inventory record
      let { data: inventory, error: invError } = await supabase
        .from("inventory")
        .select("id, quantity, unit_cost, average_cost")
        .eq("product_id", poItem.product_id)
        .eq("location_id", po.location_id)
        .eq("vendor_id", vendorId)
        .maybeSingle();

      let inventoryId: string;

      if (invError || !inventory) {
        // Create new inventory record
        const { data: newInv, error: createError } = await supabase
          .from("inventory")
          .insert({
            product_id: poItem.product_id,
            location_id: po.location_id,
            vendor_id: vendorId,
            quantity: quantity_received,
            unit_cost: poItem.unit_cost,
            average_cost: poItem.unit_cost,
          })
          .select("id")
          .maybeSingle();

        if (createError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error creating inventory:", createError);
          }
          continue;
        }

        if (!newInv) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Inventory creation returned null");
          }
          continue;
        }

        inventoryId = newInv.id;
      } else {
        // Update existing inventory with weighted average cost
        const currentQty = parseFloat(inventory.quantity) || 0;
        const currentAvgCost = parseFloat(inventory.average_cost) || 0;
        const newQty = currentQty + parseFloat(quantity_received);
        const newAvgCost =
          (currentQty * currentAvgCost +
            parseFloat(quantity_received) * parseFloat(poItem.unit_cost)) /
          newQty;

        const { error: updateError } = await supabase
          .from("inventory")
          .update({
            quantity: newQty,
            unit_cost: poItem.unit_cost,
            average_cost: newAvgCost,
          })
          .eq("id", inventory.id);

        if (updateError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error updating inventory:", updateError);
          }
          continue;
        }

        inventoryId = inventory.id;
      }

      // Create receiving record
      const { error: receiveError } = await supabase.from("purchase_order_receives").insert({
        purchase_order_id: po_id,
        po_item_id: po_item_id,
        quantity_received: quantity_received,
        condition: condition || "good",
        quality_notes,
        notes,
        inventory_id: inventoryId,
      });

      if (receiveError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error creating receive record:", receiveError);
        }
        continue;
      }

      // Create stock movement record
      await supabase.from("stock_movements").insert({
        inventory_id: inventoryId,
        movement_type: "purchase",
        quantity: quantity_received,
        from_location_id: null,
        to_location_id: po.location_id,
        reference_type: "purchase_order",
        reference_id: po_id,
        notes: `Received from PO ${po.po_number || po_id}`,
        vendor_id: vendorId,
      });

      // Note: PO item status and quantities are automatically updated by the
      // update_item_receive_status trigger on purchase_order_receives table.
      // PO status is automatically updated by the update_po_receiving_status
      // trigger on purchase_order_items table.
    }

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
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching updated PO:", fetchError);
      }
      // Don't fail here - items were received successfully
    }

    return NextResponse.json({
      success: true,
      purchase_order: updatedPO,
      message: "Items received successfully",
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in receive items API:", error);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
