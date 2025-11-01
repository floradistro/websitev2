import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { vendorId, firstName, middleName, lastName, phone, email, dateOfBirth, address, city, state, postalCode } = body;

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
    const customerData: any = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      display_name: middleName
        ? `${firstName} ${middleName.charAt(0)}. ${lastName.charAt(0)}.`
        : `${firstName} ${lastName.charAt(0)}.`,
      role: 'customer',
      is_active: true,
    };

    // Add date of birth if provided
    if (dateOfBirth) customerData.date_of_birth = dateOfBirth;

    // Build billing address from ID scan data if provided
    if (address || city || state || postalCode) {
      const fullName = middleName
        ? `${firstName} ${middleName} ${lastName}`
        : `${firstName} ${lastName}`;

      customerData.billing_address = {
        first_name: firstName,
        last_name: lastName,
        company: "",
        address_1: address || "",
        address_2: middleName ? `Middle Name: ${middleName}` : "",
        city: city || "",
        state: state || "",
        postcode: postalCode || "",
        country: "US",
        email: email,
        phone: phone || ""
      };
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert(customerData)
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

