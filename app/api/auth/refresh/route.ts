import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { createAuthCookie } from '@/lib/auth/middleware';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Refresh session token and user data
 * CRITICAL: This refreshes the Supabase auth session to prevent timeouts
 */
export async function POST(request: NextRequest) {
  try {
    // Get both tokens from HTTP-only cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    const refreshToken = cookieStore.get('refresh-token')?.value;

    if (!authToken || !refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', expired: true },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();

    // CRITICAL FIX: Refresh the Supabase session using refresh token
    // This prevents session timeout by extending the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    let authUser;
    let newAccessToken = authToken;
    let newRefreshToken = refreshToken;
    let sessionRefreshed = false;

    if (refreshError || !refreshData.session) {
      // Token can't be refreshed - try to get user with existing token
      const { data: { user }, error: userError } = await supabase.auth.getUser(authToken);

      if (userError || !user) {
        return NextResponse.json(
          { success: false, error: 'Session expired', expired: true },
          { status: 401 }
        );
      }

      authUser = user;
    } else {
      // Successfully refreshed - use new tokens
      authUser = refreshData.user;
      newAccessToken = refreshData.session.access_token;
      newRefreshToken = refreshData.session.refresh_token;
      sessionRefreshed = true;
      console.log('✅ Session tokens refreshed successfully');
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
      .eq('email', authUser?.email || '')
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

    // Load accessible locations (including tax settings)
    let locations: any[] = [];

    // CRITICAL FIX: Vendor owners and managers get ALL vendor locations
    if (user.role === 'vendor_owner' || user.role === 'vendor_manager' || user.role === 'vendor_admin') {
      const { data: allVendorLocs } = await supabase
        .from('locations')
        .select('id, name, address_line1, city, state, is_primary, settings')
        .eq('vendor_id', user.vendor_id)
        .eq('is_active', true);

      locations = allVendorLocs?.map(l => ({
        id: l.id,
        name: l.name,
        address: `${l.address_line1 || ''} ${l.city || ''}, ${l.state || ''}`.trim(),
        is_primary: l.is_primary || false,
        settings: l.settings
      })) || [];

      console.log(`✅ ${user.role} - loaded ALL locations:`, locations.length);
    } else if (user.role === 'employee' || user.role === 'manager') {
      // Employees only get assigned locations
      const { data: employeeLocations } = await supabase
        .from('employee_locations')
        .select(`
          location_id,
          is_primary,
          locations (
            id,
            name,
            address,
            settings
          )
        `)
        .eq('user_id', user.id)
        .eq('can_access', true);

      locations = employeeLocations?.map((el: any) => ({
        id: el.locations.id,
        name: el.locations.name,
        address: el.locations.address,
        settings: el.locations.settings,
        is_primary: el.is_primary
      })) || [];

      console.log('✅ Employee - loaded assigned locations:', locations.length);
    }

    const response = NextResponse.json({
      success: true,
      refreshed: sessionRefreshed,
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

    // Update cookies with new tokens if session was refreshed
    if (sessionRefreshed) {
      const accessCookie = createAuthCookie(newAccessToken);
      response.cookies.set(accessCookie.name, accessCookie.value, accessCookie.options);

      const refreshCookie = {
        name: 'refresh-token',
        value: newRefreshToken,
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/'
        }
      };
      response.cookies.set(refreshCookie.name, refreshCookie.value, refreshCookie.options);

      console.log('🍪 Updated auth cookies with refreshed tokens');
    }

    return response;

  } catch (error: any) {
    console.error('Auth refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh user data' },
      { status: 500 }
    );
  }
}
