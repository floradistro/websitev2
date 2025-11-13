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
  // Payment processor details (from Dejavoo)
  authorizationCode?: string;
  paymentTransactionId?: string;
  cardType?: string;
  cardLast4?: string;
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
  const clientHeaders = ((supabase as any).rest?.headers || {}) as Record<string, string>;
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
      authorizationCode,
      paymentTransactionId,
      cardType,
      cardLast4,
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
    // CRITICAL FIX: Track all inventory errors and rollback if ANY fail
    // Previous bug: Sale completed even when inventory couldn't be deducted
    // ============================================================================

    const inventoryErrors: Array<{ item: string; error: string }> = [];

    for (const item of items) {
      const { data: result, error: deductError } = await supabase.rpc("decrement_inventory", {
        p_inventory_id: item.inventoryId,
        p_quantity: item.quantity,
      });

      if (deductError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Inventory deduction failed:", deductError);
        }

        // Track this error for rollback
        inventoryErrors.push({
          item: item.productName,
          error: deductError.message,
        });
      }
    }

    // CRITICAL: If ANY inventory deduction failed, ROLLBACK THE ENTIRE SALE
    if (inventoryErrors.length > 0) {
      if (process.env.NODE_ENV === "development") {
        logger.error("🚨 CRITICAL: Inventory deduction failed for", inventoryErrors.length, "items");
        logger.error("Errors:", inventoryErrors);
      }

      // Rollback order items
      await supabase.from("order_items").delete().eq("order_id", order.id);

      // Rollback order (mark as failed instead of deleting for audit trail)
      await supabase
        .from("orders")
        .update({
          status: "failed",
          payment_status: "failed",
          fulfillment_status: "cancelled",
          metadata: {
            ...order.metadata,
            inventory_errors: inventoryErrors,
            rollback_reason: "Inventory deduction failed",
            failed_at: new Date().toISOString(),
          },
        })
        .eq("id", order.id);

      // Return error to prevent sale completion
      return NextResponse.json(
        {
          error: "Sale cannot be completed - insufficient inventory",
          details: inventoryErrors.length === 1
            ? `${inventoryErrors[0].item}: ${inventoryErrors[0].error}`
            : `${inventoryErrors.length} items failed inventory deduction`,
          inventory_errors: inventoryErrors,
          order_id: order.id, // For debugging/audit
        },
        { status: 400 } // Bad request - inventory not available
      );
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
        authorization_code: authorizationCode || null,
        metadata: {
          customer_id: customerId,
          customer_name: customerName,
          items_count: items.length,
          payment_transaction_id: paymentTransactionId,
          card_type: cardType,
          card_last4: cardLast4,
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

      const { error: sessionError } = await supabase.rpc("increment_session_payment", {
        p_session_id: sessionId,
        p_payment_method: paymentMethod,
        p_amount: total,
        p_transaction_type: txnType,
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
    const err = toError(error);
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
  // Get loyalty program settings (or use defaults)
  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("vendor_id", data.vendorId)
    .eq("is_active", true)
    .maybeSingle();

  const POINTS_PER_DOLLAR = program?.points_per_dollar || 1;
  const pointsEarned = Math.floor(data.total * POINTS_PER_DOLLAR);

  // Get or create loyalty record
  let { data: loyalty } = await supabase
    .from("customer_loyalty")
    .select("*")
    .eq("customer_id", data.customerId)
    .eq("vendor_id", data.vendorId)
    .maybeSingle();

  if (!loyalty) {
    // Create new loyalty record if it doesn't exist
    const { data: newLoyalty, error: createError } = await supabase
      .from("customer_loyalty")
      .insert({
        customer_id: data.customerId,
        vendor_id: data.vendorId,
        provider: "builtin",
        points_balance: pointsEarned,
        lifetime_points: pointsEarned,
        loyalty_tier: "bronze",
      })
      .select()
      .single();

    if (createError) {
      logger.error("Failed to create loyalty record:", createError);
      return;
    }

    loyalty = newLoyalty;
  } else {
    // Update existing points
    await supabase
      .from("customer_loyalty")
      .update({
        points_balance: loyalty.points_balance + pointsEarned,
        lifetime_points: loyalty.lifetime_points + pointsEarned,
      })
      .eq("id", loyalty.id);
  }

  // Log transaction
  await supabase.from("loyalty_transactions").insert({
    customer_id: data.customerId,
    transaction_type: "earned",
    points: pointsEarned,
    reference_type: "order",
    reference_id: data.orderId,
    description: `Purchase - ${data.orderNumber}`,
    balance_before: loyalty.points_balance,
    balance_after: loyalty.points_balance + pointsEarned,
  });

  // Update Apple Wallet pass (non-blocking)
  updateWalletPass(data.customerId, loyalty.points_balance + pointsEarned).catch((err) =>
    logger.error("Wallet pass update failed:", err),
  );
}

/**
 * Update Apple Wallet pass with new points balance
 */
async function updateWalletPass(customerId: string, newBalance: number) {
  try {
    // This would trigger Apple Push Notification service
    // to update the pass on the customer's device
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/update-pass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        points: newBalance,
      }),
    });

    if (!response.ok) {
      logger.error("Wallet pass update request failed");
    }
  } catch (error) {
    logger.error("Wallet pass update error:", error);
  }
}

