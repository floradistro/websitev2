import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { LoginSchema, validateData } from '@/lib/validation/schemas';
import { createAuthCookie } from '@/lib/auth/middleware';

/**
 * UNIFIED LOGIN - One clean auth flow
 * No legacy code, no fallbacks, just simple authentication
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Get CORS headers with proper origin (not wildcard when using credentials)
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  
  try {
    const body = await request.json();
    
    console.log('🔐 LOGIN ATTEMPT:', {
      email: body.email,
      hasPassword: !!body.password
    });

    // Validate input
    const validation = validateData(LoginSchema, body);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400, headers: corsHeaders }
      );
    }

    const { email, password } = validation.data;
    const supabase = getServiceSupabase();

    // Step 1: Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.session) {
      console.error('❌ Auth failed:', authError?.message);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    console.log('✅ Supabase auth successful for:', email);

    // Step 2: Get user record from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        vendors (
          id,
          store_name,
          slug,
          logo_url,
          vendor_type,
          wholesale_enabled,
          pos_enabled
        )
      `)
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('❌ User not found in users table:', userError);
      return NextResponse.json(
        { success: false, error: 'User account not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('✅ User found:', { id: user.id, role: user.role, vendor_id: user.vendor_id });

    // Step 3: Get vendor details
    const vendor = Array.isArray(user.vendors) ? user.vendors[0] : user.vendors;

    if (!vendor) {
      console.error('❌ No vendor linked to user');
      return NextResponse.json(
        { success: false, error: 'No vendor account linked' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Step 4: Get user's locations
    const { data: userLocations } = await supabase
      .from('user_locations')
      .select('location_id')
      .eq('user_id', user.id);

    const locationIds = userLocations?.map(ul => ul.location_id) || [];

    let locations: any[] = [];
    if (locationIds.length > 0) {
      const { data: locs } = await supabase
        .from('locations')
        .select('id, name, address_line1, city, state')
        .in('id', locationIds);
      
      locations = locs?.map(l => ({
        id: l.id,
        name: l.name,
        address: `${l.address_line1 || ''} ${l.city || ''}, ${l.state || ''}`.trim(),
        is_primary: false
      })) || [];
    }

    // Step 5: Get accessible apps (based on role)
    const { data: appAssignments } = await supabase
      .from('user_apps')
      .select('app_key')
      .eq('user_id', user.id);

    const accessibleApps = appAssignments?.map(a => a.app_key) || [];

    console.log('✅ Login complete:', {
      user: user.email,
      vendor: vendor.store_name,
      locations: locations.length,
      apps: accessibleApps.length
    });

    // Step 6: Create response with auth cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        role: user.role,
        vendor_id: user.vendor_id,
        employee_code: user.employee_id,
        vendor: {
          id: vendor.id,
          store_name: vendor.store_name,
          slug: vendor.slug,
          logo_url: vendor.logo_url,
          vendor_type: vendor.vendor_type || 'standard',
          wholesale_enabled: vendor.wholesale_enabled || false,
          pos_enabled: vendor.pos_enabled || false
        }
      },
      apps: accessibleApps,
      locations: locations
    }, { headers: corsHeaders });

    // Set HTTP-only cookie with auth token
    const cookie = createAuthCookie(authData.session.access_token);
    response.cookies.set(cookie.name, cookie.value, cookie.options);

    return response;

  } catch (error: any) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
