import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // SECURITY: Require vendor authentication (Phase 4)
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  const supabase = getServiceSupabase();

  try {
    const body = await request.json();
    const { transactionId, reason } = body;

    if (!transactionId || !reason) {
      return NextResponse.json({ error: "Missing transactionId or reason" }, { status: 400 });
    }

    // ============================================================================
    // STEP 1: GET ORIGINAL TRANSACTION
    // ============================================================================
    const { data: transaction, error: txError } = await supabase
      .from("pos_transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (txError || !transaction) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Transaction not found:", transactionId);
      }
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.payment_status === "voided") {
      return NextResponse.json({ error: "Transaction already voided" }, { status: 400 });
    }

    // ============================================================================
    // STEP 2: VALIDATE CAN VOID (SAME DAY ONLY)
    // ============================================================================
    const transactionDate = new Date(transaction.created_at);
    const today = new Date();
    const isToday = transactionDate.toDateString() === today.toDateString();

    if (!isToday) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Transaction not from today, cannot void");
      }
      return NextResponse.json(
        {
          error: "Transactions can only be voided on the same day. Use refund instead.",
        },
        { status: 400 },
      );
    }

    // ============================================================================
    // STEP 3: GET ORDER AND CUSTOMER DATA
    // ============================================================================
    let order: any = null;
    let customer: any = null;
    let pointsToReverse = 0;

    if (transaction.order_id) {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", transaction.order_id)
        .single();

      order = orderData;

      if (order && order.customer_id) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("*")
          .eq("id", order.customer_id)
          .single();

        customer = customerData;

        // Find original loyalty transaction for this order
        const { data: loyaltyTx } = await supabase
          .from("loyalty_transactions")
          .select("points")
          .eq("order_id", transaction.order_id)
          .eq("type", "earned")
          .single();

        if (loyaltyTx) {
          pointsToReverse = loyaltyTx.points;
        }
      }
    }

    // ============================================================================
    // STEP 4: PRE-VALIDATE INVENTORY CAN BE RESTORED
    // ============================================================================
    // CRITICAL: Verify all inventory records exist BEFORE marking as voided
    // This prevents the void-but-inventory-not-restored inconsistency

    let orderItems: any[] = [];
    const inventoryErrors: Array<{ item: string; error: string }> = [];

    if (transaction.order_id) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, inventory_id")
        .eq("order_id", transaction.order_id);

      orderItems = items || [];

      // Verify each inventory record exists
      for (const item of orderItems) {
        if (item.inventory_id) {
          const { data: inv, error: invError } = await supabase
            .from("inventory")
            .select("id")
            .eq("id", item.inventory_id)
            .single();

          if (invError || !inv) {
            inventoryErrors.push({
              item: item.product_name || item.product_id,
              error: `Inventory record not found: ${item.inventory_id}`,
            });
          }
        }
      }
    }

    // BLOCK void if inventory validation failed
    if (inventoryErrors.length > 0) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Cannot void - inventory records missing:", inventoryErrors);
      }
      return NextResponse.json(
        {
          error: "Cannot void transaction - inventory records missing",
          inventory_errors: inventoryErrors,
        },
        { status: 400 },
      );
    }

    // ============================================================================
    // STEP 5: UPDATE TRANSACTION STATUS TO VOIDED
    // ============================================================================

    const { error: updateError } = await supabase
      .from("pos_transactions")
      .update({
        payment_status: "voided",
        notes: reason,
        voided_at: new Date().toISOString(),
        voided_by: transaction.user_id,
        metadata: {
          ...transaction.metadata,
          void_reason: reason,
          voided_at: new Date().toISOString(),
        },
      })
      .eq("id", transactionId);

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error updating transaction:", updateError);
      }
      throw updateError;
    }

    // ============================================================================
    // STEP 6: VOID ORDER
    // ============================================================================
    if (order) {
      await supabase
        .from("orders")
        .update({
          status: "cancelled",
          payment_status: "refunded",
          metadata: {
            ...order.metadata,
            void_reason: reason,
            voided_at: new Date().toISOString(),
          },
        })
        .eq("id", order.id);
    }

    // ============================================================================
    // STEP 7: RESTOCK INVENTORY (WITH ROLLBACK ON FAILURE)
    // ============================================================================

    if (orderItems.length > 0) {
      const restoreErrors: Array<{ item: string; error: string }> = [];

      for (const item of orderItems) {
        // Add back to inventory using atomic increment
        if (item.inventory_id) {
          const { data: result, error: incrementError } = await supabase.rpc(
            "increment_inventory",
            {
              p_inventory_id: item.inventory_id,
              p_quantity: item.quantity,
            },
          );

          if (incrementError) {
            restoreErrors.push({
              item: item.product_name || item.product_id,
              error: incrementError.message,
            });
          }
        }
      }

      // CRITICAL: If ANY inventory restoration failed, un-void the transaction
      if (restoreErrors.length > 0) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Inventory restoration failed, rolling back void:", restoreErrors);
        }

        // Rollback: Un-void the transaction
        await supabase
          .from("pos_transactions")
          .update({
            payment_status: transaction.payment_status, // Restore original status
            notes: `Void failed - inventory restoration error: ${restoreErrors.map((e) => e.error).join(", ")}`,
            metadata: {
              ...transaction.metadata,
              void_attempted_at: new Date().toISOString(),
              void_failed_reason: "inventory_restoration_failed",
              void_errors: restoreErrors,
            },
          })
          .eq("id", transactionId);

        // Rollback: Un-void the order
        if (order) {
          await supabase
            .from("orders")
            .update({
              status: order.status, // Restore original status
              payment_status: order.payment_status,
            })
            .eq("id", order.id);
        }

        return NextResponse.json(
          {
            error: "Failed to restore inventory - void rolled back",
            inventory_errors: restoreErrors,
          },
          { status: 500 },
        );
      }
    }

    // ============================================================================
    // STEP 8: REVERSE LOYALTY POINTS
    // ============================================================================
    if (customer && pointsToReverse > 0) {
      // Get current loyalty record
      const { data: loyalty } = await supabase
        .from("customer_loyalty")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("vendor_id", transaction.vendor_id)
        .eq("provider", "builtin")
        .single();

      if (loyalty) {
        const newPoints = Math.max(0, loyalty.points - pointsToReverse);
        const newLifetimePoints = Math.max(0, loyalty.lifetime_points - pointsToReverse);

        // Recalculate tier (might downgrade)
        const LOYALTY_TIERS = [
          { name: "Bronze", min_points: 0 },
          { name: "Silver", min_points: 500 },
          { name: "Gold", min_points: 1000 },
          { name: "Platinum", min_points: 2500 },
        ];

        const tier =
          LOYALTY_TIERS.slice()
            .reverse()
            .find((t) => newLifetimePoints >= t.min_points) || LOYALTY_TIERS[0];

        const level = LOYALTY_TIERS.indexOf(LOYALTY_TIERS.find((t) => t.name === tier.name)!) + 1;

        // Update loyalty record
        await supabase
          .from("customer_loyalty")
          .update({
            points: newPoints,
            lifetime_points: newLifetimePoints,
            tier_name: tier.name,
            tier_level: level,
          })
          .eq("id", loyalty.id);

        // Log reversal transaction
        await supabase.from("loyalty_transactions").insert({
          customer_id: customer.id,
          vendor_id: transaction.vendor_id,
          type: "reversed",
          points: -pointsToReverse,
          order_id: transaction.order_id,
          description: `Points reversed due to void - ${transaction.transaction_number}`,
          metadata: {
            void_reason: reason,
            original_transaction_id: transaction.id,
          },
        });

        if (tier.name !== loyalty.tier_name) {
          // Log tier change
          await supabase.from("loyalty_transactions").insert({
            customer_id: customer.id,
            vendor_id: transaction.vendor_id,
            type: "tier_change",
            points: 0,
            description: `Tier downgraded from ${loyalty.tier_name} to ${tier.name} due to void`,
            metadata: {
              old_tier: loyalty.tier_name,
              new_tier: tier.name,
              lifetime_points: newLifetimePoints,
              reason: "void",
            },
          });
        }
      }
    }

    // ============================================================================
    // STEP 9: UPDATE SESSION TOTALS (WITH ROLLBACK ON FAILURE)
    // ============================================================================
    if (transaction.session_id) {
      // Decrement session total using atomic RPC function
      const { data: sessionResult, error: sessionError } = await supabase.rpc(
        "update_session_on_void",
        {
          p_session_id: transaction.session_id,
          p_amount_to_subtract: transaction.total_amount,
        },
      );

      if (sessionError) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ Failed to update session totals, rolling back void:", sessionError);
        }

        // Rollback: Restore inventory (decrement back)
        for (const item of orderItems) {
          if (item.inventory_id) {
            await supabase.rpc("decrement_inventory", {
              p_inventory_id: item.inventory_id,
              p_quantity: item.quantity,
            });
          }
        }

        // Rollback: Un-void the transaction
        await supabase
          .from("pos_transactions")
          .update({
            payment_status: transaction.payment_status,
            notes: `Void failed - session update error: ${sessionError.message}`,
            metadata: {
              ...transaction.metadata,
              void_attempted_at: new Date().toISOString(),
              void_failed_reason: "session_update_failed",
            },
          })
          .eq("id", transactionId);

        // Rollback: Un-void the order
        if (order) {
          await supabase
            .from("orders")
            .update({
              status: order.status,
              payment_status: order.payment_status,
            })
            .eq("id", order.id);
        }

        return NextResponse.json(
          {
            error: "Failed to update session totals - void rolled back",
            session_error: sessionError.message,
          },
          { status: 500 },
        );
      }
    }

    // ============================================================================
    // FINAL RESPONSE
    // ============================================================================

    return NextResponse.json({
      success: true,
      message: "Transaction voided successfully",
      pointsReversed: pointsToReverse,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("💥 Error voiding transaction:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
