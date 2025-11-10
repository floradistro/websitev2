import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { isStockAvailable } from "@/lib/unit-conversion";
import { AlpineIQClient } from "@/lib/marketing/alpineiq-client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Get base URL for internal API calls
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

// ============================================================================
// ALPINE IQ SYNC HELPER
// ============================================================================
/**
 * Sync order to Alpine IQ for loyalty points (async, non-blocking)
 */
async function syncOrderToAlpineIQ(orderId: string, customerId: string) {
  const supabase = getServiceSupabase();

  // Get customer info
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (!customer) {
    throw new Error("Customer not found");
  }

  // Get order with items and product details
  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products (
          name,
          sku,
          category,
          brand,
          cannabis_type,
          thc_percentage
        )
      )
    `,
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    throw new Error("Order not found");
  }

  // Format items for Alpine IQ
  const items = (order.order_items || []).map((item: any) => ({
    sku: item.products?.sku || item.product_id || "UNKNOWN",
    size: item.quantity_display || `${item.quantity}`,
    category: item.products?.category || "MISC",
    brand: item.products?.brand || "",
    name: item.products?.name || item.product_name || "Product",
    species: item.products?.cannabis_type || "",
    price: parseFloat(item.unit_price || 0),
    discount: 0,
    quantity: parseInt(item.quantity || 1),
    customAttributes: item.products?.thc_percentage
      ? [
          {
            key: "THC",
            value: `${item.products.thc_percentage}%`,
          },
        ]
      : [],
  }));

  // Get location
  const { data: location } = await supabase
    .from("locations")
    .select("name")
    .eq("id", order.location_id)
    .single();

  // Format transaction date for Alpine IQ
  const transactionDate =
    new Date(order.created_at || order.order_date).toISOString().replace("T", " ").split(".")[0] +
    " +0000";

  // Initialize Alpine IQ client
  const alpine = new AlpineIQClient({
    apiKey:
      process.env.ALPINE_API_KEY || "U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw",
    userId: process.env.ALPINE_USER_ID || "3999",
  });

  // Push to Alpine IQ
  await alpine.createSale({
    member: {
      email: customer.email,
      mobilePhone: customer.phone || undefined,
      firstName: customer.first_name || undefined,
      lastName: customer.last_name || undefined,
    },
    visit: {
      pos_id: order.id,
      pos_user: customer.email,
      pos_type: order.order_type === "delivery" ? "online" : "in-store",
      transaction_date: transactionDate,
      location: location?.name || "Main Store",
      visit_details_attributes: items,
      transaction_total: parseFloat(order.total_amount),
      send_notification: false,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customer");
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "20";
    const status = searchParams.get("status");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 },
      );
    }

    // Build query params
    const params = new URLSearchParams({
      customer_id: customerId,
      page,
      per_page: perPage,
    });

    if (status) {
      params.append("status", status);
    }

    // Fetch orders from Supabase
    const response = await fetch(`${getBaseUrl()}/api/supabase/orders?${params}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to fetch orders");
    }

    // Format orders data
    const orders = data.orders.map((order: any) => ({
      id: order.id,
      number: order.order_number,
      status: order.status,
      total: order.total_amount.toString(),
      currency: order.currency || "USD",
      date_created: order.order_date,
      date_modified: order.updated_at,
      date_completed: order.completed_date,
      billing: order.billing_address,
      shipping: order.shipping_address,
      line_items: order.order_items.map((item: any) => ({
        id: item.id,
        name: item.product_name,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.line_total,
        image: item.product_image ? { src: item.product_image } : null,
        meta_data: item.meta_data || {},
        order_type: item.order_type || "delivery",
        tier_name: item.tier_name,
        pickup_location: item.pickup_location_name,
      })),
      shipping_lines: [],
      payment_method: order.payment_method,
      payment_method_title: order.payment_method_title,
      customer_note: order.customer_note,
    }));

    return NextResponse.json({
      success: true,
      orders,
      pagination: data.pagination,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Orders API error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        orders: [],
        error: err.message,
      },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new order
 * Handles inventory deduction in GRAMS
 */
export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();

  try {
    const body = await request.json();
    const {
      customer_id,
      line_items,
      billing_address,
      shipping_address,
      payment_method,
      payment_method_title,
      customer_note,
      order_type = "delivery",
    } = body;

    // ============================================================================
    // STEP 1: Validate all line items have stock (in grams)
    // ============================================================================
    for (const item of line_items) {
      const quantity_grams = item.quantity_grams || item.quantity; // Fallback to quantity if no grams specified

      if (!quantity_grams || quantity_grams <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid quantity for ${item.name}`,
          },
          { status: 400 },
        );
      }

      // Fetch current stock
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, name, stock_quantity, sku")
        .eq("id", item.product_id)
        .single();

      if (productError || !product) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Product not found:", item.product_id);
        }
        return NextResponse.json(
          {
            success: false,
            error: `Product not found: ${item.name}`,
          },
          { status: 404 },
        );
      }

      // Check if sufficient stock (in grams)
      const availableStock = product.stock_quantity || 0;

      if (!isStockAvailable(availableStock, quantity_grams)) {
        if (process.env.NODE_ENV === "development") {
          logger.error(
            `❌ Insufficient stock for ${product.name}. Need: ${quantity_grams}g, Have: ${availableStock}g`,
          );
        }
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${product.name}. Only ${availableStock}g available.`,
          },
          { status: 400 },
        );
      }
    }

    // ============================================================================
    // STEP 2: Calculate order total
    // ============================================================================
    const total_amount = line_items.reduce((sum: number, item: any) => {
      return sum + item.price * item.quantity;
    }, 0);

    // ============================================================================
    // STEP 3: Create order record
    // ============================================================================
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id,
        order_number: orderNumber,
        status: "pending",
        total_amount,
        currency: "USD",
        payment_method,
        payment_method_title: payment_method_title || payment_method,
        billing_address,
        shipping_address,
        customer_note,
        order_type,
        order_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Failed to create order:", orderError);
      }
      throw new Error("Failed to create order");
    }

    // ============================================================================
    // STEP 4: Create order items & Deduct inventory (in GRAMS)
    // ============================================================================
    const orderItems = [];

    for (const item of line_items) {
      const quantity_grams = item.quantity_grams || item.quantity;
      const quantity_display = item.quantity_display || `${item.quantity}`;

      // Create order item
      const { data: orderItem, error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.name,
          product_image: item.image,
          quantity: item.quantity,
          quantity_grams, // ← CRITICAL: Store grams for tracking
          quantity_display, // ← CRITICAL: Store display for receipt
          unit_price: item.price,
          line_total: item.price * item.quantity,
          tier_name: item.tierName || "Standard",
          order_type: item.orderType || order_type,
          pickup_location_id: item.locationId,
          pickup_location_name: item.locationName,
          meta_data: {
            quantity_grams,
            quantity_display,
            original_tier: item.tierName,
          },
        })
        .select()
        .single();

      if (itemError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Failed to create order item:", itemError);
        }
        throw new Error(`Failed to create order item for ${item.name}`);
      }

      orderItems.push(orderItem);

      // ============================================================================
      // DEDUCT FROM INVENTORY (in GRAMS)
      // ============================================================================

      // First get current stock
      const { data: currentProduct, error: fetchError } = await supabase
        .from("products")
        .select("stock_quantity, name")
        .eq("id", item.product_id)
        .single();

      if (fetchError || !currentProduct) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Failed to fetch product:", fetchError);
        }
        throw new Error(`Failed to fetch product ${item.name}`);
      }

      // Calculate new stock
      const currentStock = parseFloat(currentProduct.stock_quantity || "0");
      const newStock = Math.max(0, currentStock - quantity_grams);

      // Update stock
      const { data: updatedProduct, error: stockError } = await supabase
        .from("products")
        .update({
          stock_quantity: newStock,
        })
        .eq("id", item.product_id)
        .select("stock_quantity, name")
        .single();

      if (stockError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Failed to update inventory:", stockError);
        }
        throw new Error(`Failed to update inventory for ${item.name}`);
      }

      // If using multi-location inventory, also update inventory_items table
      if (item.locationId) {
        // First get current inventory
        const { data: currentInventory } = await supabase
          .from("inventory_items")
          .select("quantity")
          .eq("product_id", item.product_id)
          .eq("location_id", item.locationId)
          .single();

        if (currentInventory) {
          const currentInvQty = parseFloat(currentInventory.quantity || "0");
          const newInvQty = Math.max(0, currentInvQty - quantity_grams);

          const { error: locationStockError } = await supabase
            .from("inventory_items")
            .update({
              quantity: newInvQty,
            })
            .eq("product_id", item.product_id)
            .eq("location_id", item.locationId);

          if (locationStockError) {
            if (process.env.NODE_ENV === "development") {
              logger.warn("⚠️ Location inventory update failed:", locationStockError);
            }
            // Don't fail the order, just log it
          } else {
          }
        }
      }
    }

    // ============================================================================
    // STEP 5: Sync to Alpine IQ (async, non-blocking)
    // ============================================================================
    // Push order to Alpine IQ for loyalty points (don't await - let it run in background)
    syncOrderToAlpineIQ(order.id, customer_id).catch((error) => {
      logger.error("⚠️ Alpine IQ sync failed (order still created):", err.message);
    });

    // ============================================================================
    // STEP 6: Return complete order
    // ============================================================================

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        number: order.order_number,
        status: order.status,
        total: order.total_amount.toString(),
        currency: order.currency,
        date_created: order.order_date,
        line_items: orderItems.map((item: any) => ({
          id: item.id,
          name: item.product_name,
          product_id: item.product_id,
          quantity: item.quantity,
          quantity_grams: item.quantity_grams, // ← Included in response
          quantity_display: item.quantity_display, // ← Included in response
          price: item.unit_price,
          total: item.line_total,
          tier_name: item.tier_name,
        })),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Order creation error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to create order",
      },
      { status: 500 },
    );
  }
}
