import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Refresh user data endpoint
 * Uses existing auth token from HTTP-only cookie
 * Does NOT require password - just refreshes permissions/data
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token from HTTP-only cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();

    // Verify token and get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(authToken);

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get user record with all permissions
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
      .eq('email', authUser.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const vendor = Array.isArray(user.vendors) ? user.vendors[0] : user.vendors;

    // Load app permissions
    let accessibleApps: string[] = [];
    if (user.role !== 'vendor_admin') {
      const { data: permissions } = await supabase
        .from('user_app_permissions')
        .select('app_key')
        .eq('user_id', user.id)
        .eq('can_access', true);

      accessibleApps = permissions?.map(p => p.app_key) || [];
    }

    // Load accessible locations
    let locations: any[] = [];
    if (user.role === 'employee' || user.role === 'manager') {
      const { data: employeeLocations } = await supabase
        .from('employee_locations')
        .select(`
          location_id,
          is_primary,
          locations (
            id,
            name,
            address
          )
        `)
        .eq('user_id', user.id)
        .eq('can_access', true);

      locations = employeeLocations?.map((el: any) => ({
        id: el.locations.id,
        name: el.locations.name,
        address: el.locations.address,
        is_primary: el.is_primary
      })) || [];
    } else if (user.role === 'vendor_admin') {
      const { data: allLocations } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('vendor_id', user.vendor_id);

      locations = allLocations?.map(l => ({
        id: l.id,
        name: l.name,
        address: l.address,
        is_primary: false
      })) || [];
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        vendor_id: user.vendor_id,
        employee_code: user.employee_code,
        vendor: vendor ? {
          id: vendor.id,
          store_name: vendor.store_name,
          slug: vendor.slug,
          logo_url: vendor.logo_url,
          vendor_type: vendor.vendor_type || 'standard',
          wholesale_enabled: vendor.wholesale_enabled || false,
          pos_enabled: vendor.pos_enabled || false
        } : null
      },
      apps: accessibleApps,
      locations: locations
    });

  } catch (error: any) {
    console.error('Auth refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh user data' },
      { status: 500 }
    );
  }
}
