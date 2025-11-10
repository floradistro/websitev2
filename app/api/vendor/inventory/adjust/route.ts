import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Use requireVendor to get vendor_id from authenticated session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;

    const body = await request.json();
    const { inventoryId, productId, adjustment, reason, locationId } = body;

    if (!productId || adjustment === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields: productId, adjustment",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    let inventory: any = null;
    let isNew = false;

    // Try to get existing inventory by ID first (if provided and valid)
    if (inventoryId) {
      const { data: existingInventory, error: inventoryError } = await supabase
        .from("inventory")
        .select("*")
        .eq("id", inventoryId)
        .eq("vendor_id", vendorId)
        .single();

      if (existingInventory) {
        inventory = existingInventory;
      } else {
      }
    }

    // If no inventory found, find or create one using productId (UUID)
    if (!inventory) {
      // Verify product exists
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, name, vendor_id")
        .eq("id", productId)
        .single();

      if (productError || !product) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Product not found:", productError);
        }
        return NextResponse.json(
          {
            error: "Product not found",
          },
          { status: 404 },
        );
      }

      // Get vendor's location (use provided locationId or vendor's primary location)
      let targetLocationId = locationId;

      if (!targetLocationId) {
        const { data: vendorLocation } = await supabase
          .from("locations")
          .select("id")
          .eq("vendor_id", vendorId)
          .eq("type", "vendor")
          .limit(1)
          .single();

        if (!vendorLocation) {
          return NextResponse.json(
            {
              error:
                "No vendor location found. Please contact support to set up your warehouse location.",
            },
            { status: 404 },
          );
        }

        targetLocationId = vendorLocation.id;
      }

      // Check if inventory already exists for this product at this location
      const { data: existingInv } = await supabase
        .from("inventory")
        .select("*")
        .eq("product_id", productId)
        .eq("location_id", targetLocationId)
        .single();

      if (existingInv) {
        inventory = existingInv;
      } else {
        // Create new inventory record
        const { data: newInventory, error: createError } = await supabase
          .from("inventory")
          .insert({
            product_id: productId,
            location_id: targetLocationId,
            vendor_id: vendorId,
            quantity: 0,
            low_stock_threshold: 10,
            notes: "Created via inventory manager",
          })
          .select()
          .single();

        if (createError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error creating inventory:", createError);
          }
          return NextResponse.json(
            { error: createError.message, details: createError },
            { status: 500 },
          );
        }

        inventory = newInventory;
        isNew = true;
      }
    }

    // Final check - if still no inventory, return error
    if (!inventory) {
      return NextResponse.json(
        {
          error: "Could not find or create inventory record",
        },
        { status: 404 },
      );
    }

    const currentQty = parseFloat(inventory.quantity || 0);
    const adjustmentAmount = parseFloat(adjustment);
    const newQty = currentQty + adjustmentAmount;

    // Use a small epsilon to handle floating point precision issues
    // e.g., 0.8 - 0.8 might be -0.0000000001 instead of exactly 0
    if (newQty < -0.001) {
      return NextResponse.json(
        {
          error: "Cannot reduce inventory below 0",
        },
        { status: 400 },
      );
    }

    // Clamp to 0 if we're within epsilon of 0 (handles floating point errors)
    const finalQty = newQty < 0 ? 0 : newQty;

    // Update inventory
    const { data: updated, error: updateError } = await supabase
      .from("inventory")
      .update({
        quantity: finalQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inventory.id)
      .select()
      .maybeSingle();

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error updating inventory:", updateError);
      }
      return NextResponse.json(
        { error: updateError.message, details: updateError },
        { status: 500 },
      );
    }

    if (!updated) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Inventory update affected 0 rows");
      }
      return NextResponse.json(
        {
          error: "Failed to update inventory - record may have been deleted or modified",
          inventory_id: inventory.id,
        },
        { status: 500 },
      );
    }

    // Sync product's stock_quantity with inventory total
    const { data: product, error: productFetchError } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", inventory.product_id)
      .maybeSingle();

    if (productFetchError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching product with ID:", inventory.product_id, productFetchError);
      }
    } else if (!product) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Product not found with ID:", inventory.product_id);
      }
    } else {
      // Get total stock across all locations for this product
      const { data: allInventory, error: invFetchError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("product_id", inventory.product_id);

      if (invFetchError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Error fetching all inventory:", invFetchError);
        }
      } else {
        const totalStock =
          allInventory?.reduce((sum, inv) => sum + parseFloat(inv.quantity || 0), 0) || 0;

        const { error: productUpdateError } = await supabase
          .from("products")
          .update({
            stock_quantity: totalStock,
            stock_status: totalStock > 0 ? "instock" : "outofstock",
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (productUpdateError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error updating product stock:", productUpdateError);
          }
        } else {
        }
      }
    }

    // Create stock movement record
    const movementType = adjustmentAmount > 0 ? "purchase" : "adjustment";

    await supabase
      .from("stock_movements")
      .insert({
        inventory_id: inventory.id,
        product_id: inventory.product_id,
        movement_type: movementType,
        quantity: Math.abs(adjustmentAmount),
        quantity_before: currentQty,
        quantity_after: finalQty,
        to_location_id: adjustmentAmount > 0 ? inventory.location_id : null,
        from_location_id: adjustmentAmount < 0 ? inventory.location_id : null,
        reason: reason || "Vendor inventory adjustment",
        metadata: { created_by: "vendor", vendor_id: vendorId },
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      inventory: updated,
      previous_quantity: currentQty,
      new_quantity: finalQty,
      was_created: isNew,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Inventory adjustment error:", err);
    }
    return NextResponse.json(
      {
        error: err.message || "Failed to adjust inventory",
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}
