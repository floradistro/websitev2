import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";

/**
 * BULK INVENTORY OPERATIONS
 * Steve Jobs approved: Simple, powerful, atomic
 *
 * Operations:
 * - zero_out: Set selected items to 0
 * - audit: Set exact quantities
 * - transfer: Move between locations
 */

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;
    const body = await request.json();
    const { operation, items } = body;

    // Validate
    if (!operation || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing operation or items" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Handle different operations
    switch (operation) {
      case "zero_out":
        return await handleZeroOut(supabase, vendorId, items);

      case "audit":
        return await handleAudit(supabase, vendorId, items);

      case "transfer":
        return await handleTransfer(supabase, vendorId, items, body.toLocationId);

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

  } catch (error) {
    const err = toError(error);
    logger.error("❌ Bulk operation error:", err);
    return NextResponse.json(
      { error: err.message || "Bulk operation failed" },
      { status: 500 }
    );
  }
}

/**
 * ZERO OUT - Set all selected items to 0
 * Use case: End of day audit, damaged inventory, etc.
 */
async function handleZeroOut(supabase: any, vendorId: string, items: any[]) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const item of items) {
    try {
      const { inventoryId, productId, locationId, currentQuantity } = item;

      if (currentQuantity === 0) {
        results.success++;
        continue; // Already at 0
      }

      // Update inventory to 0
      const { data: updated, error: updateError } = await supabase
        .from("inventory")
        .update({
          quantity: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", inventoryId)
        .eq("vendor_id", vendorId)
        .select()
        .single();

      if (updateError) {
        results.failed++;
        results.errors.push(`${item.productName}: ${updateError.message}`);
        continue;
      }

      // Create transaction record
      await supabase
        .from("inventory_transactions")
        .insert({
          vendor_id: vendorId,
          location_id: locationId,
          product_id: productId,
          inventory_id: inventoryId,
          transaction_type: "zero_out",
          quantity_before: currentQuantity,
          quantity_change: -currentQuantity,
          quantity_after: 0,
          reason: "Bulk zero-out operation",
          reference_type: "bulk_operation",
          performed_by_name: "Vendor User",
        });

      // Update product stock status
      await updateProductStockTotal(supabase, productId);

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${item.productName}: ${toError(error).message}`);
    }
  }

  return NextResponse.json({
    success: true,
    results,
  });
}

/**
 * AUDIT - Set exact quantities (inventory count correction)
 */
async function handleAudit(supabase: any, vendorId: string, items: any[]) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const item of items) {
    try {
      const { inventoryId, productId, locationId, currentQuantity, newQuantity } = item;

      if (!newQuantity && newQuantity !== 0) {
        results.failed++;
        results.errors.push(`${item.productName}: Missing newQuantity`);
        continue;
      }

      const change = newQuantity - currentQuantity;

      // Update inventory
      const { data: updated, error: updateError } = await supabase
        .from("inventory")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", inventoryId)
        .eq("vendor_id", vendorId)
        .select()
        .single();

      if (updateError) {
        results.failed++;
        results.errors.push(`${item.productName}: ${updateError.message}`);
        continue;
      }

      // Create transaction record
      await supabase
        .from("inventory_transactions")
        .insert({
          vendor_id: vendorId,
          location_id: locationId,
          product_id: productId,
          inventory_id: inventoryId,
          transaction_type: "audit",
          quantity_before: currentQuantity,
          quantity_change: change,
          quantity_after: newQuantity,
          reason: `Bulk audit - adjusted by ${change > 0 ? '+' : ''}${change}g`,
          reference_type: "bulk_operation",
          performed_by_name: "Vendor User",
        });

      // Update product stock status
      await updateProductStockTotal(supabase, productId);

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${item.productName}: ${toError(error).message}`);
    }
  }

  return NextResponse.json({
    success: true,
    results,
  });
}

/**
 * TRANSFER - Move inventory between locations
 */
async function handleTransfer(supabase: any, vendorId: string, items: any[], toLocationId: string) {
  if (!toLocationId) {
    return NextResponse.json(
      { error: "Missing toLocationId for transfer operation" },
      { status: 400 }
    );
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const item of items) {
    try {
      const { inventoryId, productId, locationId: fromLocationId, transferQuantity } = item;

      if (!transferQuantity || transferQuantity <= 0) {
        results.failed++;
        results.errors.push(`${item.productName}: Invalid transfer quantity`);
        continue;
      }

      // Get current inventory
      const { data: fromInv } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("id", inventoryId)
        .single();

      if (!fromInv || fromInv.quantity < transferQuantity) {
        results.failed++;
        results.errors.push(`${item.productName}: Insufficient quantity`);
        continue;
      }

      // Reduce from source location
      const newFromQty = fromInv.quantity - transferQuantity;
      await supabase
        .from("inventory")
        .update({ quantity: newFromQty })
        .eq("id", inventoryId);

      // Add to destination location (or create if doesn't exist)
      const { data: toInv } = await supabase
        .from("inventory")
        .select("*")
        .eq("product_id", productId)
        .eq("location_id", toLocationId)
        .single();

      if (toInv) {
        // Update existing
        await supabase
          .from("inventory")
          .update({ quantity: toInv.quantity + transferQuantity })
          .eq("id", toInv.id);
      } else {
        // Create new
        await supabase
          .from("inventory")
          .insert({
            product_id: productId,
            location_id: toLocationId,
            vendor_id: vendorId,
            quantity: transferQuantity,
            low_stock_threshold: 10,
          });
      }

      // Create transaction records (one for out, one for in)
      await supabase
        .from("inventory_transactions")
        .insert([
          {
            vendor_id: vendorId,
            location_id: fromLocationId,
            product_id: productId,
            inventory_id: inventoryId,
            transaction_type: "transfer_out",
            quantity_before: fromInv.quantity,
            quantity_change: -transferQuantity,
            quantity_after: newFromQty,
            reason: `Transfer to destination location`,
            reference_type: "bulk_operation",
            performed_by_name: "Vendor User",
          },
          {
            vendor_id: vendorId,
            location_id: toLocationId,
            product_id: productId,
            inventory_id: toInv?.id,
            transaction_type: "transfer_in",
            quantity_before: toInv?.quantity || 0,
            quantity_change: transferQuantity,
            quantity_after: (toInv?.quantity || 0) + transferQuantity,
            reason: `Transfer from source location`,
            reference_type: "bulk_operation",
            performed_by_name: "Vendor User",
          },
        ]);

      // Update product stock total
      await updateProductStockTotal(supabase, productId);

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${item.productName}: ${toError(error).message}`);
    }
  }

  return NextResponse.json({
    success: true,
    results,
  });
}

/**
 * Helper: Update product's total stock across all locations
 */
async function updateProductStockTotal(supabase: any, productId: string) {
  const { data: allInventory } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("product_id", productId);

  const totalStock = allInventory?.reduce(
    (sum: number, inv: any) => sum + parseFloat(inv.quantity || 0),
    0
  ) || 0;

  await supabase
    .from("products")
    .update({
      stock_quantity: totalStock,
      stock_status: totalStock > 0 ? "instock" : "outofstock",
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
}
