import { getServiceSupabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// GET /api/vendor/purchase-orders - List all purchase orders for vendor
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    // SECURITY: vendorId from JWT, query param ignored (Phase 4)
    const poType = searchParams.get("po_type"); // 'inbound' or 'outbound'
    const status = searchParams.get("status"); // draft, sent, confirmed, etc.

    let query = supabase
      .from("purchase_orders")
      .select(
        `
        *,
        supplier:suppliers!supplier_id(
          id,
          external_name
        ),
        wholesale_customer:wholesale_customers!wholesale_customer_id(
          id,
          external_company_name
        ),
        location:locations!purchase_orders_location_id_fkey(
          id,
          name
        ),
        items:purchase_order_items!purchase_order_items_purchase_order_id_fkey(
          *,
          product:products!purchase_order_items_product_id_fkey(id, name, sku)
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    // Filter by PO type
    if (poType) {
      query = query.eq("po_type", poType);
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    const { data: purchaseOrders, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching purchase orders:", err);
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: purchaseOrders || [],
      count: purchaseOrders?.length || 0,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in GET /api/vendor/purchase-orders:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/vendor/purchase-orders - Create or manage purchase orders
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();
    const body = await request.json();
    const { action, vendor_id, ...poData } = body;

    // SECURITY: vendorId from JWT, query param ignored (Phase 4)

    if (!action) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ PO Creation failed: missing action parameter", {
          body,
        });
      }
      return NextResponse.json({ success: false, error: "action is required" }, { status: 400 });
    }

    switch (action) {
      case "create": {
        const { po_type, items, ...orderData } = poData;

        if (!po_type || (po_type !== "inbound" && po_type !== "outbound")) {
          return NextResponse.json(
            {
              success: false,
              error: 'po_type must be "inbound" or "outbound"',
            },
            { status: 400 },
          );
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "items array is required and must not be empty",
            },
            { status: 400 },
          );
        }

        // Validate each item
        for (const item of items) {
          if (item.is_new_product && (!item.product_name || item.product_name.trim() === "")) {
            return NextResponse.json(
              {
                success: false,
                error: "Product name is required for new products",
              },
              { status: 400 },
            );
          }
          const qty = parseFloat(item.quantity);
          const price = parseFloat(item.unit_price);

          if (!qty || isNaN(qty) || qty <= 0) {
            return NextResponse.json(
              { success: false, error: "Quantity must be greater than 0" },
              { status: 400 },
            );
          }
          if (price === undefined || isNaN(price) || price < 0) {
            return NextResponse.json(
              { success: false, error: "Valid unit price is required" },
              { status: 400 },
            );
          }
        }

        // Validate PO type requirements
        if (po_type === "inbound" && !orderData.supplier_id) {
          return NextResponse.json(
            {
              success: false,
              error: "supplier_id is required for inbound POs",
            },
            { status: 400 },
          );
        }

        if (po_type === "outbound" && !orderData.wholesale_customer_id) {
          return NextResponse.json(
            {
              success: false,
              error: "wholesale_customer_id is required for outbound POs",
            },
            { status: 400 },
          );
        }

        // Calculate totals from items (parse all numeric values)
        const subtotal = items.reduce(
          (sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.unit_price),
          0,
        );
        const tax = parseFloat(orderData.tax) || subtotal * (parseFloat(orderData.tax_rate) || 0);
        const shipping = parseFloat(orderData.shipping_cost) || 0;
        const total = subtotal + tax + shipping;

        // Generate PO number using database function
        const { data: poNumberData, error: poNumberError } = await supabase.rpc(
          "generate_po_number",
          {
            v_vendor_id: vendorId,
            po_type: po_type,
          },
        );

        if (poNumberError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error generating PO number:", poNumberError);
          }
          return NextResponse.json(
            { success: false, error: "Failed to generate PO number" },
            { status: 500 },
          );
        }

        const po_number = poNumberData;

        // Create PO with generated number - auto-set to 'ordered' status
        const { data: newPO, error: poError } = await supabase
          .from("purchase_orders")
          .insert({
            vendor_id: vendorId,
            po_type,
            po_number,
            supplier_id: orderData.supplier_id || null,
            wholesale_customer_id: orderData.wholesale_customer_id || null,
            location_id: orderData.location_id || null,
            status: "ordered", // Auto-set to ordered (supplier will be notified in future)
            subtotal,
            tax,
            shipping,
            total,
            payment_terms: orderData.payment_terms || null,
            expected_delivery_date: orderData.expected_delivery_date || null,
            internal_notes: orderData.internal_notes || null,
          })
          .select()
          .maybeSingle();

        if (poError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error creating purchase order:", poError);
          }
          return NextResponse.json({ success: false, error: poError.message }, { status: 500 });
        }

        if (!newPO) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Purchase order creation returned null");
          }
          return NextResponse.json(
            { success: false, error: "Failed to create purchase order" },
            { status: 500 },
          );
        }

        // Create PO items - handle both existing and new products
        const itemsToInsert = [];

        for (const item of items) {
          let productId = item.product_id;

          // If this is a new product, create it first
          if (item.is_new_product && !productId) {
            // Generate unique slug for product
            const baseSlug = (item.product_name || "product")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            const slug = `${baseSlug}-${Date.now()}`;

            const unitPrice = parseFloat(item.unit_price);
            const { data: newProduct, error: productError } = await supabase
              .from("products")
              .insert({
                vendor_id: vendorId,
                name: item.product_name,
                slug,
                sku: item.sku || `AUTO-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                cost_price: unitPrice,
                regular_price: unitPrice * 2, // Default 100% markup
                status: "draft", // Use draft status for now (po_only requires migration)
                description: `Product added from PO ${newPO.po_number || newPO.id}`,
                short_description: item.category ? `Category: ${item.category}` : null,
                meta_data: {
                  created_from_po: true,
                  po_id: newPO.id,
                  po_number: newPO.po_number,
                  supplier_sku: item.supplier_sku,
                  original_category: item.category,
                  workflow_status: "pending_receipt", // Custom workflow tracking
                },
              })
              .select()
              .maybeSingle();

            if (productError) {
              if (process.env.NODE_ENV === "development") {
                logger.error("❌ Error creating new product:", productError);
              }
              throw new Error(
                `Failed to create product ${item.product_name}: ${productError.message || JSON.stringify(productError)}`,
              );
            }

            if (!newProduct) {
              if (process.env.NODE_ENV === "development") {
                logger.error("❌ Product creation returned null for:", item.product_name);
              }
              throw new Error(`Failed to create product ${item.product_name}: No data returned`);
            }

            productId = newProduct.id;
          }

          itemsToInsert.push({
            purchase_order_id: newPO.id,
            product_id: productId,
            variant_id: item.variant_id || null,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
            line_total: parseFloat(item.quantity) * parseFloat(item.unit_price),
            notes: item.is_new_product
              ? `New product from supplier. Supplier SKU: ${item.supplier_sku || "N/A"}`
              : null,
          });
        }

        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(itemsToInsert);

        if (itemsError) {
          // Rollback PO creation
          await supabase.from("purchase_orders").delete().eq("id", newPO.id);
          if (process.env.NODE_ENV === "development") {
            logger.error("Error creating purchase order items:", itemsError);
          }
          return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 });
        }

        // For outbound POs, create inventory reservations
        if (po_type === "outbound" && orderData.location_id) {
          const reservations = items.map((item) => ({
            product_id: item.product_id,
            location_id: orderData.location_id,
            reservation_type: "purchase_order",
            reference_id: newPO.id,
            quantity: item.quantity,
            status: "active",
          }));

          const { error: reservationError } = await supabase
            .from("inventory_reservations")
            .insert(reservations);

          if (reservationError) {
            if (process.env.NODE_ENV === "development") {
              logger.error("Error creating inventory reservations:", reservationError);
            }
            // Don't fail the entire PO, just log the error
          }
        }

        // Fetch the complete PO with items
        const { data: completePO, error: fetchError } = await supabase
          .from("purchase_orders")
          .select(
            `
            *,
            items:purchase_order_items(
              *,
              product:product_id(id, name, sku)
            )
          `,
          )
          .eq("id", newPO.id)
          .maybeSingle();

        if (fetchError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error fetching complete PO:", fetchError);
          }
          // Don't fail here - we already created the PO successfully
        }

        // Count new products
        const newProductCount = items.filter((i) => i.is_new_product).length;

        return NextResponse.json({
          success: true,
          data: completePO,
          new_products_created: newProductCount,
          message:
            newProductCount > 0
              ? `${po_type === "inbound" ? "Inbound" : "Outbound"} PO created successfully with ${newProductCount} new product(s)`
              : `${po_type === "inbound" ? "Inbound" : "Outbound"} PO created successfully`,
        });
      }

      case "update_status": {
        const { id, status } = poData;

        if (!id || !status) {
          return NextResponse.json(
            { success: false, error: "id and status are required" },
            { status: 400 },
          );
        }

        const validStatuses = [
          "draft",
          "sent",
          "confirmed",
          "in_transit",
          "received",
          "fulfilled",
          "shipped",
          "delivered",
          "cancelled",
        ];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            },
            { status: 400 },
          );
        }

        const { data: updatedPO, error } = await supabase
          .from("purchase_orders")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("vendor_id", vendorId)
          .select()
          .maybeSingle();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error updating purchase order status:", err);
          }
          return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        }

        if (!updatedPO) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ PO update affected 0 rows - PO may have been deleted");
          }
          return NextResponse.json(
            {
              success: false,
              error: "Purchase order not found or was deleted. Please refresh the page.",
            },
            { status: 404 },
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedPO,
          message: "Purchase order status updated successfully",
        });
      }

      case "add_payment": {
        const { purchase_order_id, amount, payment_method, reference_number, notes } = poData;

        if (!purchase_order_id || !amount) {
          return NextResponse.json(
            {
              success: false,
              error: "purchase_order_id and amount are required",
            },
            { status: 400 },
          );
        }

        // Verify the PO exists and belongs to this vendor
        const { data: po, error: poError } = await supabase
          .from("purchase_orders")
          .select("id, total")
          .eq("id", purchase_order_id)
          .eq("vendor_id", vendorId)
          .maybeSingle();

        if (poError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error fetching purchase order:", poError);
          }
          return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
        }

        if (!po) {
          return NextResponse.json(
            {
              success: false,
              error: "Purchase order not found or access denied",
            },
            { status: 404 },
          );
        }

        const { data: newPayment, error } = await supabase
          .from("purchase_order_payments")
          .insert({
            purchase_order_id,
            amount,
            payment_method: payment_method || "other",
            reference_number: reference_number || null,
            notes: notes || null,
          })
          .select()
          .maybeSingle();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error adding payment:", err);
          }
          return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        }

        if (!newPayment) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Payment creation returned null");
          }
          return NextResponse.json(
            { success: false, error: "Failed to create payment record" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          data: newPayment,
          message: "Payment recorded successfully",
        });
      }

      case "receive": {
        const { id, items } = poData;

        if (!id) {
          return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
        }

        // Get the PO with items
        const { data: po, error: poError } = await supabase
          .from("purchase_orders")
          .select(
            `
            *,
            items:purchase_order_items(*)
          `,
          )
          .eq("id", id)
          .eq("vendor_id", vendorId)
          .eq("po_type", "inbound")
          .maybeSingle();

        if (poError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error fetching inbound PO:", poError);
          }
          return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
        }

        if (!po) {
          return NextResponse.json(
            {
              success: false,
              error: "Inbound purchase order not found or access denied",
            },
            { status: 404 },
          );
        }

        // Update inventory quantities for received items
        // This assumes location_id is provided in the request
        if (!poData.location_id) {
          return NextResponse.json(
            {
              success: false,
              error: "location_id is required for receiving items",
            },
            { status: 400 },
          );
        }

        for (const item of po.items) {
          const quantityReceived =
            items?.find((i: any) => i.item_id === item.id)?.quantity_received || item.quantity;

          // Update or insert inventory record
          const { data: existingInventory } = await supabase
            .from("inventory")
            .select("*")
            .eq("product_id", item.product_id)
            .eq("location_id", poData.location_id)
            .maybeSingle();

          if (existingInventory) {
            await supabase
              .from("inventory")
              .update({
                quantity: existingInventory.quantity + quantityReceived,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingInventory.id);
          } else {
            await supabase.from("inventory").insert({
              product_id: item.product_id,
              variant_id: item.variant_id,
              location_id: poData.location_id,
              vendor_id: vendorId,
              quantity: quantityReceived,
            });
          }

          // Update PO item with received quantity
          await supabase
            .from("purchase_order_items")
            .update({
              quantity_received: quantityReceived,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);
        }

        // Update PO status to received
        const { data: updatedPO, error: updateError } = await supabase
          .from("purchase_orders")
          .update({
            status: "received",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .maybeSingle();

        if (updateError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error updating PO status:", updateError);
          }
          return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        if (!updatedPO) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ PO update affected 0 rows - PO may have been deleted");
          }
          return NextResponse.json(
            {
              success: false,
              error: "Purchase order not found or was deleted. Please refresh the page.",
            },
            { status: 404 },
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedPO,
          message: "Purchase order received and inventory updated",
        });
      }

      case "fulfill": {
        const { id } = poData;

        if (!id) {
          return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
        }

        // Get the PO with items and reservations
        const { data: po, error: poError } = await supabase
          .from("purchase_orders")
          .select(
            `
            *,
            items:purchase_order_items(*)
          `,
          )
          .eq("id", id)
          .eq("vendor_id", vendorId)
          .eq("po_type", "outbound")
          .maybeSingle();

        if (poError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error fetching outbound PO:", poError);
          }
          return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
        }

        if (!po) {
          return NextResponse.json(
            {
              success: false,
              error: "Outbound purchase order not found or access denied",
            },
            { status: 404 },
          );
        }

        if (!poData.location_id) {
          return NextResponse.json(
            {
              success: false,
              error: "location_id is required for fulfilling orders",
            },
            { status: 400 },
          );
        }

        // Deduct inventory for each item
        for (const item of po.items) {
          const { data: inventory, error: invError } = await supabase
            .from("inventory")
            .select("*")
            .eq("product_id", item.product_id)
            .eq("location_id", poData.location_id)
            .maybeSingle();

          if (invError) {
            if (process.env.NODE_ENV === "development") {
              logger.error("❌ Error fetching inventory:", invError);
            }
            return NextResponse.json(
              { success: false, error: "Error checking inventory" },
              { status: 500 },
            );
          }

          if (!inventory || inventory.quantity < item.quantity) {
            return NextResponse.json(
              {
                success: false,
                error: `Insufficient inventory for product ${item.product_id}`,
              },
              { status: 400 },
            );
          }

          await supabase
            .from("inventory")
            .update({
              quantity: inventory.quantity - item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", inventory.id);

          // Update PO item with fulfilled quantity
          await supabase
            .from("purchase_order_items")
            .update({
              quantity_fulfilled: item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);
        }

        // Release inventory reservations
        await supabase
          .from("inventory_reservations")
          .update({ status: "released" })
          .eq("reference_id", id)
          .eq("reservation_type", "purchase_order");

        // Update PO status to fulfilled
        const { data: updatedPO, error: updateError } = await supabase
          .from("purchase_orders")
          .update({
            status: "fulfilled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .maybeSingle();

        if (updateError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error updating PO status:", updateError);
          }
          return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        if (!updatedPO) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ PO update affected 0 rows - PO may have been deleted");
          }
          return NextResponse.json(
            {
              success: false,
              error: "Purchase order not found or was deleted. Please refresh the page.",
            },
            { status: 404 },
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedPO,
          message: "Purchase order fulfilled and inventory deducted",
        });
      }

      case "update_status": {
        const { po_id, status } = poData;

        if (!po_id) {
          return NextResponse.json({ success: false, error: "po_id is required" }, { status: 400 });
        }

        if (!status) {
          return NextResponse.json(
            { success: false, error: "status is required" },
            { status: 400 },
          );
        }

        const { data: updatedPO, error } = await supabase
          .from("purchase_orders")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", po_id)
          .eq("vendor_id", vendorId)
          .select()
          .maybeSingle();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error updating PO status:", err);
          }
          return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        }

        if (!updatedPO) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ PO update affected 0 rows - PO may have been deleted");
          }
          return NextResponse.json(
            {
              success: false,
              error: "Purchase order not found or was deleted. Please refresh the page.",
            },
            { status: 404 },
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedPO,
          message: `Purchase order status updated to ${status}`,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in POST /api/vendor/purchase-orders:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
