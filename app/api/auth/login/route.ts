import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Customer login endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // 2. Get customer record from Supabase
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();
    
    if (customerError || !customer) {
      console.error('Customer not found:', customerError);
      return NextResponse.json(
        { success: false, error: 'Customer account not found' },
        { status: 404 }
      );
    }
    
    // 3. Return user data
    const user = {
      id: customer.id, // UUID string from Supabase
      email: customer.email,
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      username: customer.username || email.split('@')[0],
      billing: customer.billing_address || {},
      shipping: customer.shipping_address || {},
      avatar_url: customer.avatar_url || null,
      isWholesaleApproved: customer.is_wholesale_approved || false
    };
    
    console.log('✅ Login successful for:', email, 'ID:', customer.id);
    
    return NextResponse.json({
      success: true,
      user,
      session: authData.session.access_token // Include session token
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

