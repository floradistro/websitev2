import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { AlpineIQClient } from '@/lib/marketing/alpineiq-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Get or create Alpine IQ client for vendor
 */
async function getAlpineIQClient(supabase: any, vendorId: string): Promise<AlpineIQClient | null> {
  try {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('marketing_provider, marketing_config')
      .eq('id', vendorId)
      .single();

    if (vendor?.marketing_provider === 'alpineiq' && vendor?.marketing_config) {
      const config = vendor.marketing_config;
      if (config.api_key && config.user_id) {
        return new AlpineIQClient({
          apiKey: config.api_key,
          userId: config.user_id,
          agencyId: config.agency_id
        });
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get AlpineIQ client:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();

  try {
    const body = await request.json();
    const { transactionId, reason } = body;

    console.log('🚫 Void Transaction Request:', { transactionId, reason });

    if (!transactionId || !reason) {
      return NextResponse.json(
        { error: 'Missing transactionId or reason' },
        { status: 400 }
      );
    }

    // ============================================================================
    // STEP 1: GET ORIGINAL TRANSACTION
    // ============================================================================
    const { data: transaction, error: txError } = await supabase
      .from('pos_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      console.error('❌ Transaction not found:', transactionId);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.payment_status === 'voided') {
      return NextResponse.json(
        { error: 'Transaction already voided' },
        { status: 400 }
      );
    }

    console.log('✅ Transaction found:', {
      id: transaction.id,
      order_id: transaction.order_id,
      total: transaction.total_amount
    });

    // ============================================================================
    // STEP 2: VALIDATE CAN VOID (SAME DAY ONLY)
    // ============================================================================
    const transactionDate = new Date(transaction.created_at);
    const today = new Date();
    const isToday = transactionDate.toDateString() === today.toDateString();

    if (!isToday) {
      console.error('❌ Transaction not from today, cannot void');
      return NextResponse.json(
        { error: 'Transactions can only be voided on the same day. Use refund instead.' },
        { status: 400 }
      );
    }

    console.log('✅ Transaction is from today, can void');

    // ============================================================================
    // STEP 3: GET ORDER AND CUSTOMER DATA
    // ============================================================================
    let order: any = null;
    let customer: any = null;
    let pointsToReverse = 0;

    if (transaction.order_id) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', transaction.order_id)
        .single();

      order = orderData;

      if (order && order.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', order.customer_id)
          .single();

        customer = customerData;

        // Find original loyalty transaction for this order
        const { data: loyaltyTx } = await supabase
          .from('loyalty_transactions')
          .select('points')
          .eq('order_id', transaction.order_id)
          .eq('type', 'earned')
          .single();

        if (loyaltyTx) {
          pointsToReverse = loyaltyTx.points;
        }

        console.log('👤 Customer found:', {
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`,
          pointsToReverse
        });
      }
    }

    // ============================================================================
    // STEP 4: UPDATE TRANSACTION STATUS TO VOIDED
    // ============================================================================
    console.log('📝 Step 1: Voiding transaction...');

    const { error: updateError } = await supabase
      .from('pos_transactions')
      .update({
        payment_status: 'voided',
        notes: reason,
        voided_at: new Date().toISOString(),
        voided_by: transaction.user_id,
        metadata: {
          ...transaction.metadata,
          void_reason: reason,
          voided_at: new Date().toISOString()
        }
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('❌ Error updating transaction:', updateError);
      throw updateError;
    }

    console.log('✅ Transaction voided');

    // ============================================================================
    // STEP 5: VOID ORDER
    // ============================================================================
    if (order) {
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          metadata: {
            ...order.metadata,
            void_reason: reason,
            voided_at: new Date().toISOString()
          }
        })
        .eq('id', order.id);

      console.log('✅ Order voided');
    }

    // ============================================================================
    // STEP 6: RESTOCK INVENTORY
    // ============================================================================
    console.log('📦 Step 2: Restocking inventory...');

    if (transaction.order_id) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, inventory_id')
        .eq('order_id', transaction.order_id);

      if (orderItems) {
        for (const item of orderItems) {
          // Add back to inventory directly
          if (item.inventory_id) {
            await supabase
              .from('inventory')
              .update({
                quantity: supabase.raw(`quantity + ${item.quantity}`)
              })
              .eq('id', item.inventory_id);

            console.log(`  ✅ Restocked ${item.quantity} units`);
          }
        }
        console.log(`✅ Inventory restocked: ${orderItems.length} items`);
      }
    }

    // ============================================================================
    // STEP 7: REVERSE LOYALTY POINTS (CRITICAL FIX)
    // ============================================================================
    if (customer && pointsToReverse > 0) {
      console.log(`🎁 Step 3: Reversing ${pointsToReverse} loyalty points...`);

      // Get current loyalty record
      const { data: loyalty } = await supabase
        .from('customer_loyalty')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('vendor_id', transaction.vendor_id)
        .eq('provider', 'builtin')
        .single();

      if (loyalty) {
        const newPoints = Math.max(0, loyalty.points - pointsToReverse);
        const newLifetimePoints = Math.max(0, loyalty.lifetime_points - pointsToReverse);

        // Recalculate tier (might downgrade)
        const LOYALTY_TIERS = [
          { name: 'Bronze', min_points: 0 },
          { name: 'Silver', min_points: 500 },
          { name: 'Gold', min_points: 1000 },
          { name: 'Platinum', min_points: 2500 }
        ];

        const tier = LOYALTY_TIERS
          .slice()
          .reverse()
          .find(t => newLifetimePoints >= t.min_points) || LOYALTY_TIERS[0];

        const level = LOYALTY_TIERS.indexOf(LOYALTY_TIERS.find(t => t.name === tier.name)!) + 1;

        // Update loyalty record
        await supabase
          .from('customer_loyalty')
          .update({
            points: newPoints,
            lifetime_points: newLifetimePoints,
            tier_name: tier.name,
            tier_level: level
          })
          .eq('id', loyalty.id);

        // Log reversal transaction
        await supabase
          .from('loyalty_transactions')
          .insert({
            customer_id: customer.id,
            vendor_id: transaction.vendor_id,
            type: 'reversed',
            points: -pointsToReverse,
            order_id: transaction.order_id,
            description: `Points reversed due to void - ${transaction.transaction_number}`,
            metadata: {
              void_reason: reason,
              original_transaction_id: transaction.id
            }
          });

        console.log(`✅ Reversed ${pointsToReverse} points`, {
          oldPoints: loyalty.points,
          newPoints,
          oldTier: loyalty.tier_name,
          newTier: tier.name
        });

        if (tier.name !== loyalty.tier_name) {
          console.log(`⬇️  TIER DOWNGRADE: ${loyalty.tier_name} → ${tier.name}`);

          // Log tier change
          await supabase
            .from('loyalty_transactions')
            .insert({
              customer_id: customer.id,
              vendor_id: transaction.vendor_id,
              type: 'tier_change',
              points: 0,
              description: `Tier downgraded from ${loyalty.tier_name} to ${tier.name} due to void`,
              metadata: {
                old_tier: loyalty.tier_name,
                new_tier: tier.name,
                lifetime_points: newLifetimePoints,
                reason: 'void'
              }
            });
        }
      }
    }

    // ============================================================================
    // STEP 8: SYNC VOID TO ALPINE IQ
    // ============================================================================
    let alpineIQSynced = false;

    if (customer && order) {
      console.log('🔄 Step 4: Syncing void to Alpine IQ...');

      try {
        const alpineClient = await getAlpineIQClient(supabase, transaction.vendor_id);

        if (alpineClient) {
          // Get loyalty record for Alpine IQ contact ID
          const { data: loyalty } = await supabase
            .from('customer_loyalty')
            .select('alpineiq_customer_id')
            .eq('customer_id', customer.id)
            .eq('vendor_id', transaction.vendor_id)
            .single();

          if (loyalty?.alpineiq_customer_id && pointsToReverse > 0) {
            // Reverse points in Alpine IQ
            await alpineClient.adjustLoyaltyPoints({
              contactId: loyalty.alpineiq_customer_id,
              points: -pointsToReverse,
              note: `Points reversed - Order ${order.order_number} voided: ${reason}`,
              orderId: order.order_number
            });

            alpineIQSynced = true;
            console.log('✅ Alpine IQ sync successful');
          }
        }
      } catch (error: any) {
        console.error('⚠️  Alpine IQ sync failed (continuing anyway):', error);

        // Queue for retry
        await supabase
          .from('alpine_iq_sync_queue')
          .insert({
            vendor_id: transaction.vendor_id,
            type: 'void',
            data: {
              order_id: transaction.order_id,
              order_number: order?.order_number,
              customer_id: customer.id,
              points_to_reverse: pointsToReverse,
              reason
            },
            status: 'pending',
            retry_count: 0,
            error_message: error.message
          })
          .then(() => console.log('📝 Void queued for Alpine IQ retry'))
          .catch(() => {});
      }
    }

    // ============================================================================
    // STEP 9: UPDATE SESSION TOTALS
    // ============================================================================
    if (transaction.session_id) {
      // Decrement session total
      await supabase
        .from('pos_sessions')
        .update({
          total_sales: supabase.raw(`total_sales - ${transaction.total_amount}`),
          voided_count: supabase.raw('voided_count + 1')
        })
        .eq('id', transaction.session_id);

      console.log('✅ Session totals updated');
    }

    // ============================================================================
    // FINAL RESPONSE
    // ============================================================================
    console.log('✅ Void completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Transaction voided successfully',
      pointsReversed: pointsToReverse,
      alpineIQSynced
    });
  } catch (error: any) {
    console.error('💥 Error voiding transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
