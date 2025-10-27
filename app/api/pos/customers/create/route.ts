import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { vendorId, firstName, lastName, phone, email } = body;

    if (!vendorId || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorId, firstName, lastName' },
        { status: 400 }
      );
    }

    // Generate customer number
    const { count } = await supabase
      .from('vendor_customers')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    const customerNumber = `FLORA-${String((count || 0) + 1).padStart(4, '0')}`;

    // Create customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        display_name: `${firstName} ${lastName.charAt(0)}.`,
        role: 'customer',
        is_active: true,
      })
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer:', customerError);
      return NextResponse.json(
        { error: customerError.message },
        { status: 500 }
      );
    }

    // Link to vendor
    const { data: vendorCustomer, error: vcError } = await supabase
      .from('vendor_customers')
      .insert({
        vendor_id: vendorId,
        customer_id: customer.id,
        vendor_customer_number: customerNumber,
        loyalty_points: 0,
        loyalty_tier: 'bronze',
        total_orders: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (vcError) {
      console.error('Error linking customer to vendor:', vcError);
      return NextResponse.json(
        { error: vcError.message },
        { status: 500 }
      );
    }

    // Return formatted customer
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        display_name: customer.display_name,
        loyalty_points: 0,
        loyalty_tier: 'bronze',
        vendor_customer_number: customerNumber,
        total_orders: 0,
        total_spent: 0,
      },
    });
  } catch (error: any) {
    console.error('Error in create customer endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

