import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const registerId = searchParams.get('registerId');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing locationId parameter' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('pos_sessions')
      .select(`
        id,
        session_number,
        status,
        opening_cash,
        total_sales,
        total_transactions,
        total_cash,
        total_card,
        walk_in_sales,
        pickup_orders_fulfilled,
        opened_at,
        last_transaction_at
      `)
      .eq('location_id', locationId)
      .eq('status', 'open');

    // Filter by register if provided
    if (registerId) {
      query = query.eq('register_id', registerId);
    }

    const { data: session, error } = await query
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active session:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error: any) {
    console.error('Error in active session endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

