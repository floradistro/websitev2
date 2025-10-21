import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const search = searchParams.get('search');
    const loyaltyTier = searchParams.get('loyalty_tier');
    const activeOnly = searchParams.get('active') === 'true';
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const offset = (page - 1) * perPage;
    
    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });
    
    // Search
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    
    // Loyalty tier
    if (loyaltyTier) {
      query = query.eq('loyalty_tier', loyaltyTier);
    }
    
    // Active only
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    // Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      customers: data || [],
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage)
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      email,
      first_name,
      last_name,
      username,
      phone,
      billing_address,
      shipping_address,
      password, // For creating auth user
      marketing_opt_in = false
    } = body;
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    let authUserId = null;
    
    // Create Supabase auth user if password provided
    if (password) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          phone
        }
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        return NextResponse.json({ error: authError.message }, { status: 500 });
      }
      
      authUserId = authData.user.id;
    }
    
    // Create customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        email,
        first_name,
        last_name,
        username: username || email.split('@')[0],
        phone,
        auth_user_id: authUserId,
        billing_address: billing_address || undefined,
        shipping_address: shipping_address || undefined,
        marketing_opt_in,
        is_active: true,
        email_verified: authUserId ? true : false
      })
      .select()
      .single();
    
    if (customerError) {
      console.error('Error creating customer:', customerError);
      
      // Rollback auth user if customer creation failed
      if (authUserId) {
        await supabase.auth.admin.deleteUser(authUserId);
      }
      
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }
    
    // Log activity
    await supabase
      .from('customer_activity')
      .insert({
        customer_id: customer.id,
        activity_type: 'register',
        description: 'Customer registered'
      });
    
    return NextResponse.json({
      success: true,
      customer
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

