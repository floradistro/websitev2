import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Get admin payouts from real database
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Fetch real payout data from database
    // For now, return empty array since payouts table might not exist yet
    // In production, this would fetch from a 'payouts' table
    
    const { data: payouts, error } = await supabase
      .from('payouts')
      .select(`
        id,
        vendor_id,
        amount,
        status,
        period_start,
        period_end,
        created_at,
        vendor:vendors(store_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    // If table doesn't exist, return empty
    if (error) {
      console.log('Payouts table not found, returning empty:', error.message);
      return NextResponse.json({
        success: true,
        payouts: []
      });
    }

    // Map to frontend format
    const mappedPayouts = (payouts || []).map((p: any) => ({
      id: p.id,
      vendor: p.vendor?.store_name || 'Unknown Vendor',
      amount: parseFloat(p.amount || '0'),
      status: p.status || 'pending',
      period: `${new Date(p.period_start).toLocaleDateString()} - ${new Date(p.period_end).toLocaleDateString()}`,
      date: p.created_at
    }));

    return NextResponse.json({
      success: true,
      payouts: mappedPayouts
    });

  } catch (error: any) {
    console.error('Payouts API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

