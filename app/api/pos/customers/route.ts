import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Missing vendorId parameter' },
        { status: 400 }
      );
    }

    // Fetch vendor customers with customer details
    const { data, error } = await supabase
      .from('vendor_customers')
      .select(`
        id,
        vendor_customer_number,
        loyalty_points,
        loyalty_tier,
        total_orders,
        total_spent,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          display_name
        )
      `)
      .eq('vendor_id', vendorId)
      .order('last_purchase_date', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform data
    const customers = (data || [])
      .filter((vc: any) => vc.customers) // Filter out null customers
      .map((vc: any) => ({
        id: vc.customers.id,
        first_name: vc.customers.first_name || '',
        last_name: vc.customers.last_name || '',
        email: vc.customers.email,
        phone: vc.customers.phone,
        display_name: vc.customers.display_name,
        loyalty_points: vc.loyalty_points || 0,
        loyalty_tier: vc.loyalty_tier || 'bronze',
        vendor_customer_number: vc.vendor_customer_number,
        total_orders: vc.total_orders || 0,
        total_spent: vc.total_spent || 0,
      }));

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('Error in customers endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

