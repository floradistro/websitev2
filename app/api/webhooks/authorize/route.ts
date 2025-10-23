import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signatureHeader = request.headers.get('x-anet-signature');
    
    // Validate webhook signature
    const signatureKey = process.env.AUTHORIZENET_SIGNATURE_KEY;
    
    if (!signatureKey) {
      console.error('Signature key not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Validate signature
    if (signatureHeader) {
      const signature = signatureHeader.split('=')[1];
      const payload = JSON.stringify(body);
      const hash = crypto
        .createHmac('sha512', signatureKey)
        .update(payload)
        .digest('hex')
        .toUpperCase();

      if (hash !== signature.toUpperCase()) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const supabase = getServiceSupabase();
    const eventType = body.eventType;
    const payload = body.payload;

    console.log('Authorize.net webhook received:', eventType);

    // Handle different webhook events
    switch (eventType) {
      
      // ============================================================
      // PAYMENT SUCCESS
      // ============================================================
      case 'net.authorize.payment.authcapture.created':
      case 'net.authorize.payment.authorization.created': {
        const transactionId = payload.id;
        
        // Find order by transaction ID
        const { data: order, error: findError } = await supabase
          .from('orders')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();

        if (order) {
          // Update order status
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'processing',
              paid_date: new Date().toISOString()
            })
            .eq('id', order.id);

          // Add status history
          await supabase
            .from('order_status_history')
            .insert({
              order_id: order.id,
              from_status: order.status,
              to_status: 'processing',
              note: 'Payment confirmed via webhook'
            });

          console.log(`Order ${order.order_number} marked as paid`);
        }
        break;
      }

      // ============================================================
      // REFUND
      // ============================================================
      case 'net.authorize.payment.refund.created': {
        const transactionId = payload.authorizationAmount;
        const refundAmount = parseFloat(payload.amount) || 0;

        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();

        if (order) {
          const isFullRefund = refundAmount >= order.total_amount;

          // Update order
          await supabase
            .from('orders')
            .update({
              payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
              refund_amount: refundAmount,
              status: isFullRefund ? 'refunded' : order.status
            })
            .eq('id', order.id);

          // Create refund record
          await supabase
            .from('order_refunds')
            .insert({
              order_id: order.id,
              amount: refundAmount,
              reason: 'Refund processed via Authorize.net',
              refund_method: 'authorize_net',
              status: 'completed'
            });

          // Add to status history
          await supabase
            .from('order_status_history')
            .insert({
              order_id: order.id,
              from_status: order.status,
              to_status: isFullRefund ? 'refunded' : order.status,
              note: `Refund processed: $${refundAmount}`
            });

          // Update customer stats
          await supabase.rpc('update_customer_stats', {
            p_customer_id: order.customer_id
          });

          console.log(`Order ${order.order_number} refunded: $${refundAmount}`);
        }
        break;
      }

      // ============================================================
      // VOID
      // ============================================================
      case 'net.authorize.payment.void.created': {
        const transactionId = payload.id;

        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();

        if (order) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'cancelled'
            })
            .eq('id', order.id);

          await supabase
            .from('order_status_history')
            .insert({
              order_id: order.id,
              from_status: order.status,
              to_status: 'cancelled',
              note: 'Payment voided'
            });

          console.log(`Order ${order.order_number} voided`);
        }
        break;
      }

      // ============================================================
      // CHARGEBACK / DISPUTE
      // ============================================================
      case 'net.authorize.customer.dispute.created':
      case 'net.authorize.customer.dispute.updated': {
        const transactionId = payload.transactionId;
        const disputeStatus = payload.caseStatus;

        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();

        if (order) {
          // Update order to disputed
          await supabase
            .from('orders')
            .update({
              payment_status: 'disputed',
              status: 'on-hold',
              metadata: {
                ...order.metadata,
                dispute: {
                  status: disputeStatus,
                  date: new Date().toISOString(),
                  reason: payload.reasonCode || 'Unknown'
                }
              }
            })
            .eq('id', order.id);

          await supabase
            .from('order_notes')
            .insert({
              order_id: order.id,
              note: `⚠️ DISPUTE FILED: ${disputeStatus} - Reason: ${payload.reasonCode || 'Unknown'}`,
              note_type: 'system',
              is_customer_visible: false
            });

          await supabase
            .from('order_status_history')
            .insert({
              order_id: order.id,
              from_status: order.status,
              to_status: 'on-hold',
              note: `Chargeback/dispute filed: ${disputeStatus}`
            });

          console.log(`⚠️ DISPUTE: Order ${order.order_number} - ${disputeStatus}`);
        }
        break;
      }

      // ============================================================
      // PAYMENT DECLINED
      // ============================================================
      case 'net.authorize.payment.authorization.declined':
      case 'net.authorize.payment.fraud.declined': {
        const transactionId = payload.id;
        const declineReason = payload.responseCode || 'Unknown';

        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();

        if (order) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'failed'
            })
            .eq('id', order.id);

          await supabase
            .from('order_notes')
            .insert({
              order_id: order.id,
              note: `Payment declined: ${declineReason}`,
              note_type: 'system',
              is_customer_visible: false
            });

          console.log(`Payment declined for order ${order.order_number}`);
        }
        break;
      }

      // ============================================================
      // FRAUD DETECTION
      // ============================================================
      case 'net.authorize.payment.fraud.held': {
        const transactionId = payload.id;

        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();

        if (order) {
          await supabase
            .from('orders')
            .update({
              status: 'on-hold',
              metadata: {
                ...order.metadata,
                fraud_hold: {
                  date: new Date().toISOString(),
                  reason: 'Flagged by fraud detection'
                }
              }
            })
            .eq('id', order.id);

          await supabase
            .from('order_notes')
            .insert({
              order_id: order.id,
              note: '⚠️ FRAUD ALERT: Payment held for review',
              note_type: 'system',
              is_customer_visible: false
            });

          console.log(`⚠️ FRAUD HOLD: Order ${order.order_number}`);
        }
        break;
      }

      // ============================================================
      // SUBSCRIPTION EVENTS (if you add recurring billing later)
      // ============================================================
      case 'net.authorize.customer.subscription.created':
      case 'net.authorize.customer.subscription.updated':
      case 'net.authorize.customer.subscription.cancelled':
      case 'net.authorize.customer.subscription.expiring':
      case 'net.authorize.customer.subscription.suspended': {
        // Log for future subscription implementation
        console.log('Subscription event received:', eventType, payload);
        break;
      }

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed',
      eventType 
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Allow Authorize.net to POST without CSRF
export const runtime = 'nodejs';


