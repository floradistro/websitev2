import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Vendor login endpoint - Simplified version
 * Just checks if vendor exists by email
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
    
    // Try Supabase auth first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If Supabase auth fails, just check if vendor exists (fallback for existing vendors)
    if (authError) {
      console.log('Supabase auth failed, checking vendor directly:', email);
      
      // Check if vendor exists in database
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();
      
      if (vendorError || !vendor) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      
      // Vendor exists, allow login (temporary until all vendors have Supabase auth)
      console.log('✅ Vendor found (no auth account):', vendor.store_name);
      
      return NextResponse.json({
        success: true,
        vendor: {
          id: vendor.id,
          store_name: vendor.store_name,
          slug: vendor.slug,
          email: vendor.email,
          vendor_type: vendor.vendor_type || 'standard',
          wholesale_enabled: vendor.wholesale_enabled || false,
          logo_url: vendor.logo_url,
          pos_enabled: vendor.pos_enabled || false
        },
        message: 'Logged in without Supabase auth (legacy mode)'
      });
    }
    
    // Supabase auth successful, get vendor data
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', email)
      .single();
    
    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor account not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Vendor login successful (with auth):', vendor.store_name);
    
    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        store_name: vendor.store_name,
        slug: vendor.slug,
        email: vendor.email,
        vendor_type: vendor.vendor_type || 'standard',
        wholesale_enabled: vendor.wholesale_enabled || false,
        logo_url: vendor.logo_url,
        pos_enabled: vendor.pos_enabled || false
      },
      session: authData.session.access_token
    });
    
  } catch (error: any) {
    console.error('Vendor login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

