import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { transactionId, reason } = body;

    if (!transactionId || !reason) {
      return NextResponse.json(
        { error: 'Missing transactionId or reason' },
        { status: 400 }
      );
    }

    // Get original transaction
    const { data: transaction, error: txError } = await supabase
      .from('pos_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if transaction is from today
    const transactionDate = new Date(transaction.created_at);
    const today = new Date();
    const isToday = transactionDate.toDateString() === today.toDateString();

    if (!isToday) {
      return NextResponse.json(
        { error: 'Transactions can only be voided on the same day. Use refund instead.' },
        { status: 400 }
      );
    }

    // Update transaction status to voided
    const { error: updateError } = await supabase
      .from('pos_transactions')
      .update({
        payment_status: 'voided',
        notes: reason,
      })
      .eq('id', transactionId);

    if (updateError) {
      throw updateError;
    }

    // Restock inventory
    if (transaction.order_id) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', transaction.order_id);

      if (orderItems) {
        for (const item of orderItems) {
          // Add back to inventory
          await supabase.rpc('increment_inventory', {
            p_product_id: item.product_id,
            p_location_id: transaction.location_id,
            p_quantity: item.quantity,
          });
        }
      }
    }

    // Update session totals
    if (transaction.session_id) {
      await supabase.rpc('update_session_for_void', {
        p_session_id: transaction.session_id,
        p_amount: transaction.total_amount,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction voided successfully',
    });
  } catch (error: any) {
    console.error('Error voiding transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

