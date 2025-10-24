import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, vendorId } = body;

    if (!email || !password || !firstName || !lastName || !vendorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use admin client to create auth user
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Use service role to create customer profile
    const supabase = getServiceSupabase();
    
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        auth_user_id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`.trim(),
      })
      .select('id')
      .single();

    if (customerError || !customer) {
      console.error('Error creating customer:', customerError);
      return NextResponse.json(
        { error: 'Failed to create customer profile' },
        { status: 500 }
      );
    }

    // Create vendor-customer relationship
    const { error: vendorCustomerError } = await supabase
      .from('vendor_customers')
      .insert({
        vendor_id: vendorId,
        customer_id: customer.id,
      });

    if (vendorCustomerError) {
      console.error('Error creating vendor relationship:', vendorCustomerError);
      // Don't fail - customer is created, relationship can be added later
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId: authData.user.id,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

