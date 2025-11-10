import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { AlpineIQClient } from "@/lib/marketing/alpineiq-client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Get or create Alpine IQ client for vendor
 */
async function getAlpineIQClient(supabase: any, vendorId: string): Promise<AlpineIQClient | null> {
  try {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("marketing_provider, marketing_config")
      .eq("id", vendorId)
      .single();

    if (vendor?.marketing_provider === "alpineiq" && vendor?.marketing_config) {
      const config = vendor.marketing_config;
      if (config.api_key && config.user_id) {
        return new AlpineIQClient({
          apiKey: config.api_key,
          userId: config.user_id,
          agencyId: config.agency_id,
        });
      }
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Failed to get AlpineIQ client:", err);
    }
    return null;
  }
}

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
    // STEP 4: UPDATE TRANSACTION STATUS TO VOIDED
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
    // STEP 5: VOID ORDER
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
    // STEP 6: RESTOCK INVENTORY
    // ============================================================================

    if (transaction.order_id) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, inventory_id")
        .eq("order_id", transaction.order_id);

      if (orderItems) {
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
              if (process.env.NODE_ENV === "development") {
                logger.error(
                  `⚠️  Failed to restock ${item.product_name || item.product_id}:`,
                  incrementError,
                );
              }
            } else {
            }
          }
        }
      }
    }

    // ============================================================================
    // STEP 7: REVERSE LOYALTY POINTS (CRITICAL FIX)
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
    // STEP 8: SYNC VOID TO ALPINE IQ
    // ============================================================================
    let alpineIQSynced = false;

    if (customer && order) {
      try {
        const alpineClient = await getAlpineIQClient(supabase, transaction.vendor_id);

        if (alpineClient) {
          // Get loyalty record for Alpine IQ contact ID
          const { data: loyalty } = await supabase
            .from("customer_loyalty")
            .select("alpineiq_customer_id")
            .eq("customer_id", customer.id)
            .eq("vendor_id", transaction.vendor_id)
            .single();

          if (loyalty?.alpineiq_customer_id && pointsToReverse > 0) {
            // Reverse points in Alpine IQ
            await alpineClient.adjustLoyaltyPoints({
              contactId: loyalty.alpineiq_customer_id,
              points: -pointsToReverse,
              note: `Points reversed - Order ${order.order_number} voided: ${reason}`,
              orderId: order.order_number,
            });

            alpineIQSynced = true;
          }
        }
      } catch (error) {
        logger.error("⚠️  Alpine IQ sync failed (continuing anyway):", err);

        // Queue for retry
        try {
          await supabase.from("alpine_iq_sync_queue").insert({
            vendor_id: transaction.vendor_id,
            type: "void",
            data: {
              order_id: transaction.order_id,
              order_number: order?.order_number,
              customer_id: customer.id,
              points_to_reverse: pointsToReverse,
              reason,
            },
            status: "pending",
            retry_count: 0,
            error_message: err.message,
          });
        } catch (queueError) {
          // Ignore queue errors - don't fail the void
          if (process.env.NODE_ENV === "development") {
            logger.error("Failed to queue void for retry:", queueError);
          }
        }
      }
    }

    // ============================================================================
    // STEP 9: UPDATE SESSION TOTALS
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
          logger.error("⚠️  Failed to update session totals:", sessionError);
        }
      } else {
      }
    }

    // ============================================================================
    // FINAL RESPONSE
    // ============================================================================

    return NextResponse.json({
      success: true,
      message: "Transaction voided successfully",
      pointsReversed: pointsToReverse,
      alpineIQSynced,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("💥 Error voiding transaction:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
