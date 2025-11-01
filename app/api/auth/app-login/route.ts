import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { LoginSchema, validateData } from '@/lib/validation/schemas';
import { createAuthCookie } from '@/lib/auth/middleware';

/**
 * Unified login endpoint for vendor admins and employees
 * Supports role-based access control (RBAC)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateData(LoginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const supabase = getServiceSupabase();

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      // Fallback: Check if vendor exists (for legacy vendors without auth accounts)
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

      // Vendor exists - create/update user record with vendor_admin role
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('email', email)
        .single();

      let userId = user?.id;

      if (!user) {
        // Create user record for vendor admin
        const { data: newUser, error: createError} = await supabase
          .from('users')
          .insert({
            vendor_id: vendor.id,
            email: vendor.email,
            name: vendor.store_name,
            role: 'vendor_admin'
          })
          .select()
          .single();

        if (createError || !newUser) {
          console.error('Failed to create vendor admin user:', createError);
          return NextResponse.json(
            { success: false, error: 'Failed to create user account' },
            { status: 500 }
          );
        }

        userId = newUser.id;
      }

      // Return vendor admin data (legacy mode)
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: vendor.email,
          name: vendor.store_name,
          role: 'vendor_admin',
          vendor_id: vendor.id,
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
        apps: [], // Vendor admins have access to all apps
        locations: [],
        message: 'Logged in as vendor admin (legacy mode)'
      });
    }

    // Supabase auth successful - determine if vendor or employee
    const authUserId = authData.user.id;

    // First, check if this is a user record (employee or vendor admin)
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

    if (user) {
      // User exists - load their permissions and locations
      const vendor = Array.isArray(user.vendors) ? user.vendors[0] : user.vendors;

      // Load app permissions (only for non-admin roles)
      let accessibleApps: string[] = [];
      if (user.role !== 'vendor_admin') {
        const { data: permissions } = await supabase
          .from('user_app_permissions')
          .select('app_key')
          .eq('user_id', user.id)
          .eq('can_access', true);

        accessibleApps = permissions?.map(p => p.app_key) || [];
      }

      // Load accessible locations (only for employees)
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
        // Vendor admins have access to all their vendor's locations
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

      // Log activity (fire-and-forget, silent fail if RPC doesn't exist)
      supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: 'login',
        p_metadata: {
          login_method: 'password',
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      });

      // Create response with HTTP-only cookie (secure)
      const response = NextResponse.json({
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
        // NOTE: Session token no longer in JSON - now in HTTP-only cookie
      });

      // Set HTTP-only cookie with auth token
      const cookie = createAuthCookie(authData.session.access_token);
      response.cookies.set(cookie.name, cookie.value, cookie.options);

      return response;
    }

    // No user record found - check if vendor and create vendor_admin user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', email)
      .single();

    if (vendor) {
      // Create user record for vendor with vendor_admin role
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          vendor_id: vendor.id,
          email: vendor.email,
          name: vendor.store_name,
          role: 'vendor_admin'
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Failed to create vendor admin user:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      // Load all vendor locations
      const { data: allLocations } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('vendor_id', vendor.id);

      const locations = allLocations?.map(l => ({
        id: l.id,
        name: l.name,
        address: l.address,
        is_primary: false
      })) || [];

      // Log activity (fire-and-forget, silent fail if RPC doesn't exist)
      supabase.rpc('log_user_activity', {
        p_user_id: newUser.id,
        p_activity_type: 'login',
        p_metadata: {
          login_method: 'password',
          first_login: true,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      });

      // Create response with HTTP-only cookie (secure)
      const response = NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          email: vendor.email,
          name: vendor.store_name,
          role: 'vendor_admin',
          vendor_id: vendor.id,
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
        apps: [], // Vendor admins have access to all apps
        locations: locations
        // NOTE: Session token no longer in JSON - now in HTTP-only cookie
      });

      // Set HTTP-only cookie with auth token
      const cookie = createAuthCookie(authData.session.access_token);
      response.cookies.set(cookie.name, cookie.value, cookie.options);

      return response;
    }

    // No vendor or user found
    return NextResponse.json(
      { success: false, error: 'Account not found' },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('App login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
