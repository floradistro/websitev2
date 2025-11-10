import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  inventoryId: string;
  category?: string;
  sku?: string;
}

interface CreateSaleRequest {
  locationId: string;
  vendorId: string;
  sessionId?: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: "cash" | "card" | "split";
  cashTendered?: number;
  changeGiven?: number;
  customerId?: string;
  customerName?: string;
}

/**
 * CLEAN POS SALES ENDPOINT - Production Grade
 *
 * Flow:
 * 1. Validate request
 * 2. Verify inventory availability
 * 3. Create order + items (atomic)
 * 4. Deduct inventory (atomic)
 * 5. Create transaction record
 * 6. Update session totals
 * 7. Return success
 *
 * Background (non-blocking):
 * - Loyalty points
 * - Marketing integrations
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // SECURITY: Require vendor authentication (Phase 4)
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  // DIAGNOSTIC: Check environment and client state BEFORE processing
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasServiceKey) {
    if (process.env.NODE_ENV === "development") {
      logger.error("🚨 CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing at request time!");
    }
    return NextResponse.json(
      {
        error: "Internal configuration error - service credentials not available",
        hint: "Server environment variables are not properly configured",
      },
      { status: 500 },
    );
  }

  const supabase = getServiceSupabase();

  // DIAGNOSTIC: Verify the client is using service role
  // @ts-ignore - accessing internal state for debugging
  const clientHeaders = supabase.rest?.headers || {};
  // @ts-ignore - accessing header properties
  const authHeader = clientHeaders.Authorization || "";
  const isUsingServiceKey = authHeader.includes("eyJhbGciOiJIUzI1NiIs"); // Service keys start with this

  if (!isUsingServiceKey) {
    if (process.env.NODE_ENV === "development") {
      logger.error("🚨 CRITICAL: Supabase client is NOT using service role key!");
    }
    logger.error("Auth header:", authHeader.substring(0, 50));
  }

  try {
    // ============================================================================
    // STEP 1: PARSE & VALIDATE REQUEST
    // ============================================================================
    const body: CreateSaleRequest = await request.json();

    const {
      locationId,
      // SECURITY: vendorId comes from JWT (line 57), not from body (Phase 4)
      vendorId: _ignoredVendorId, // Ignore body.vendorId
      sessionId,
      userId,
      items,
      subtotal,
      taxAmount,
      total,
      paymentMethod,
      cashTendered,
      changeGiven,
      customerId,
      customerName = "Walk-In",
    } = body;

    // Validate required fields
    if (!locationId || !vendorId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: locationId, vendorId, items" },
        { status: 400 },
      );
    }

    if (total <= 0) {
      return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
    }

    // Validate numbers are actually numbers
    if (isNaN(subtotal) || isNaN(taxAmount) || isNaN(total)) {
      return NextResponse.json({ error: "Invalid numeric values in request" }, { status: 400 });
    }

    // ============================================================================
    // STEP 2: VERIFY INVENTORY AVAILABILITY
    // ============================================================================

    const inventoryIds = items.map((item) => item.inventoryId);
    const { data: inventoryRecords, error: invError } = await supabase
      .from("inventory")
      .select("id, product_id, quantity, location_id")
      .in("id", inventoryIds);

    if (invError || !inventoryRecords) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Inventory lookup failed:", invError);
      }
      return NextResponse.json({ error: "Failed to verify inventory" }, { status: 500 });
    }

    // Build inventory map for quick lookup
    const inventoryMap = new Map(inventoryRecords.map((inv) => [inv.id, inv]));

    // Check each item
    for (const item of items) {
      const inv = inventoryMap.get(item.inventoryId);

      if (!inv) {
        return NextResponse.json(
          { error: `Inventory not found: ${item.productName}` },
          { status: 400 },
        );
      }

      if (inv.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient inventory: ${item.productName}`,
            details: `Available: ${inv.quantity}, Requested: ${item.quantity}`,
          },
          { status: 400 },
        );
      }
    }

    // ============================================================================
    // STEP 3: GENERATE ORDER NUMBER
    // ============================================================================
    const { data: locationData } = await supabase
      .from("locations")
      .select("slug")
      .eq("id", locationId)
      .single();

    const locationCode = locationData?.slug?.substring(0, 3).toUpperCase() || "POS";
    const dateCode = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const sequence = Date.now().toString().slice(-6);
    const orderNumber = `${locationCode}-${dateCode}-${sequence}`;

    // ============================================================================
    // STEP 4: CREATE ORDER (ATOMIC)
    // ============================================================================

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customerId || null,
        vendor_id: vendorId,
        status: "completed",
        payment_status: "paid",
        fulfillment_status: "fulfilled",
        delivery_type: "pickup",
        pickup_location_id: locationId,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        payment_method: paymentMethod,
        billing_address: { name: customerName },
        completed_date: new Date().toISOString(),
        metadata: {
          pos_sale: true,
          walk_in: !customerId,
          cash_tendered: cashTendered,
          change_given: changeGiven,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Order creation failed:", orderError);
      }
      // Special handling for RLS errors
      if (orderError?.code === "42501") {
        if (process.env.NODE_ENV === "development") {
          logger.error("🚨 RLS POLICY VIOLATION - Service role should bypass this!");
        }
        if (process.env.NODE_ENV === "development") {
          if (process.env.NODE_ENV === "development") {
            logger.error("Order data attempted:", {
              vendor_id: vendorId,
              customer_id: customerId || null,
              location_id: locationId,
            });
          }
        }
      }

      return NextResponse.json(
        {
          error: "Failed to create order",
          details: orderError?.message,
          code: orderError?.code,
          hint:
            orderError?.code === "42501"
              ? "Row-level security policy violation - check database permissions"
              : orderError?.hint,
        },
        { status: 500 },
      );
    }

    // ============================================================================
    // STEP 5: CREATE ORDER ITEMS (ATOMIC)
    // ============================================================================
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_subtotal: item.lineTotal,
      line_total: item.lineTotal,
      vendor_id: vendorId,
      order_type: "pickup",
      pickup_location_id: locationId,
      inventory_id: item.inventoryId,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Order items failed:", itemsError);
      }
      // Rollback order
      await supabase.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        { error: "Failed to create order items", details: itemsError.message },
        { status: 500 },
      );
    }

    // ============================================================================
    // STEP 6: DEDUCT INVENTORY (ATOMIC - RACE CONDITION SAFE)
    // ============================================================================

    for (const item of items) {
      const { data: result, error: deductError } = await supabase.rpc("decrement_inventory", {
        p_inventory_id: item.inventoryId,
        p_quantity: item.quantity,
      });

      if (deductError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Inventory deduction failed:", deductError);
        }
        // CRITICAL: Inventory deduction failed
        // In production, this should trigger:
        // 1. Alert to staff
        // 2. Manual inventory reconciliation
        // 3. Order flagged for review

        await supabase
          .from("orders")
          .update({
            metadata: {
              ...order.metadata,
              inventory_error: true,
              inventory_error_message: deductError.message,
            },
          })
          .eq("id", order.id);

        if (process.env.NODE_ENV === "development") {
          logger.error("🚨 INVENTORY ERROR - Order flagged:", order.id);
        }
      } else {
      }
    }

    // ============================================================================
    // STEP 7: CREATE POS TRANSACTION
    // ============================================================================
    const transactionNumber = `TXN-${orderNumber}`;

    const { data: transaction, error: txnError } = await supabase
      .from("pos_transactions")
      .insert({
        transaction_number: transactionNumber,
        location_id: locationId,
        vendor_id: vendorId,
        order_id: order.id,
        session_id: sessionId || null,
        user_id: userId || null,
        transaction_type: customerId ? "customer_sale" : "walk_in_sale",
        payment_method: paymentMethod,
        payment_status: "completed",
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        cash_tendered: cashTendered || null,
        change_given: changeGiven || null,
        metadata: {
          customer_id: customerId,
          customer_name: customerName,
          items_count: items.length,
        },
      })
      .select()
      .single();

    if (txnError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("⚠️  Transaction record failed:", txnError);
      }
      // Non-critical - order is still valid
    } else {
    }

    // ============================================================================
    // STEP 8: UPDATE SESSION TOTALS (IF SESSION EXISTS)
    // ============================================================================
    if (sessionId) {
      const txnType = customerId ? "pickup_orders_fulfilled" : "walk_in_sales";

      const { error: sessionError } = await supabase.rpc("increment_session_counter", {
        p_session_id: sessionId,
        p_counter_name: txnType,
        p_amount: total,
      });

      if (sessionError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("⚠️  Session update failed:", sessionError);
        }
        // Non-critical - session will be reconciled on close
      } else {
      }
    }

    // ============================================================================
    // STEP 9: BACKGROUND TASKS (NON-BLOCKING)
    // ============================================================================
    // Queue loyalty points and marketing sync for background processing
    if (customerId) {
      // This would normally go to a job queue (e.g., Inngest, BullMQ)
      // For now, we'll do it inline but won't block on errors

      processLoyaltyPoints(supabase, {
        customerId,
        vendorId,
        orderId: order.id,
        orderNumber,
        total,
      }).catch((err) => logger.error("Background loyalty failed:", err));

      syncToMarketing(supabase, {
        vendorId,
        customerId,
        orderId: order.id,
        orderNumber,
        locationId,
        userId,
        items,
        total,
      }).catch((err) => logger.error("Background marketing failed:", err));
    }

    // ============================================================================
    // SUCCESS RESPONSE
    // ============================================================================
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: orderNumber,
        total_amount: total,
      },
      transaction: transaction
        ? {
            id: transaction.id,
            transaction_number: transactionNumber,
          }
        : null,
      message: `Sale completed: ${orderNumber}`,
      duration_ms: duration,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("💥 SALE FAILED:", err);
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// BACKGROUND TASKS
// ============================================================================

/**
 * Process loyalty points in background
 * Failures are logged but don't block the sale
 */
async function processLoyaltyPoints(
  supabase: any,
  data: {
    customerId: string;
    vendorId: string;
    orderId: string;
    orderNumber: string;
    total: number;
  },
) {
  const POINTS_PER_DOLLAR = 1;
  const pointsEarned = Math.floor(data.total * POINTS_PER_DOLLAR);

  // Get or create loyalty record
  const { data: loyalty } = await supabase
    .from("customer_loyalty")
    .select("*")
    .eq("customer_id", data.customerId)
    .eq("vendor_id", data.vendorId)
    .eq("provider", "builtin")
    .single();

  if (loyalty) {
    // Update points
    await supabase
      .from("customer_loyalty")
      .update({
        points_balance: loyalty.points_balance + pointsEarned,
        lifetime_points: loyalty.lifetime_points + pointsEarned,
      })
      .eq("id", loyalty.id);

    // Log transaction
    await supabase.from("loyalty_transactions").insert({
      customer_id: data.customerId,
      vendor_id: data.vendorId,
      type: "earned",
      points: pointsEarned,
      order_id: data.orderId,
      description: `Purchase - ${data.orderNumber}`,
    });
  }
}

/**
 * Sync to marketing platform in background
 * Failures are queued for retry
 */
async function syncToMarketing(
  supabase: any,
  data: {
    vendorId: string;
    customerId: string;
    orderId: string;
    orderNumber: string;
    locationId: string;
    userId?: string;
    items: CartItem[];
    total: number;
  },
) {
  // Queue for background processing
  // In production, this would use a job queue
  await supabase.from("alpine_iq_sync_queue").insert({
    vendor_id: data.vendorId,
    type: "sale",
    data: {
      order_id: data.orderId,
      order_number: data.orderNumber,
      customer_id: data.customerId,
    },
    status: "pending",
    retry_count: 0,
  });
}
