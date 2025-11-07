import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { LoginSchema, validateData } from '@/lib/validation/schemas';
import { createAuthCookie } from '@/lib/auth/middleware';

/**
 * Unified login endpoint for vendor admins and employees
 * Supports role-based access control (RBAC)
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

    // Validate input
    const validation = validateData(LoginSchema, body);
    if (!validation.success) {
      console.error('❌ Login validation failed:', {
        error: validation.error,
        receivedBody: body
      });
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400, headers: corsHeaders }
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
      console.log('🔍 Supabase auth failed, checking for legacy vendor:', email);
      
      // Fallback: Check if vendor exists (for legacy vendors without auth accounts)
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();

      console.log('📊 Legacy vendor lookup result:', { 
        found: !!vendor, 
        vendorId: vendor?.id,
        storeName: vendor?.store_name,
        error: vendorError?.message 
      });

      if (vendorError || !vendor) {
        console.error('❌ Legacy vendor not found:', vendorError);
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401, headers: corsHeaders }
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
        // SCHEMA FIX: Use first_name/last_name instead of name, employee_id instead of employee_code
        const { data: newUser, error: createError} = await supabase
          .from('users')
          .insert({
            vendor_id: vendor.id,
            email: vendor.email,
            first_name: vendor.store_name,
            last_name: '',
            role: 'vendor_owner', // SCHEMA FIX: Database uses vendor_owner, not vendor_admin
            status: 'active',
            login_enabled: true
          })
          .select()
          .single();

        if (createError || !newUser) {
          console.error('Failed to create vendor admin user:', createError);
          return NextResponse.json(
            { success: false, error: 'Failed to create user account' },
            { status: 500, headers: corsHeaders }
          );
        }

        userId = newUser.id;
      }

      // Load all vendor locations (CRITICAL FIX: was returning empty array)
      console.log('🔍 Loading locations for vendor_admin (legacy mode), vendor_id:', vendor.id);
      const { data: allLocations, error: locError } = await supabase
        .from('locations')
        .select('id, name, address_line1, city, state')
        .eq('vendor_id', vendor.id);

      console.log('📍 Locations query result (legacy mode):', { count: allLocations?.length, error: locError });

      const locations = allLocations?.map(l => ({
        id: l.id,
        name: l.name,
        address: `${l.address_line1 || ''} ${l.city || ''}, ${l.state || ''}`.trim(),
        is_primary: false
      })) || [];

      console.log('✅ Mapped locations (legacy mode):', locations.length);
      console.log('📍 Returning locations:', JSON.stringify(locations, null, 2));

      // CRITICAL FIX: Legacy vendors don't have Supabase auth - create it now
      // Use the password they just provided to create their auth account
      const { data: newAuthData, error: createAuthError } = await supabase.auth.admin.createUser({
        email: vendor.email,
        password: password, // Use the password they just entered
        email_confirm: true,
        user_metadata: {
          vendor_id: vendor.id,
          role: 'vendor_owner',
          legacy_migration: true,
          migrated_at: new Date().toISOString()
        }
      });

      if (createAuthError) {
        // If user already exists but password was wrong, try signing in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: vendor.email,
          password: password
        });

        if (signInError || !signInData.session) {
          console.error('Legacy vendor auth failed:', createAuthError, signInError);
          return NextResponse.json({
            success: false,
            error: 'Authentication failed. Please contact support to activate your account.'
          }, { status: 401, headers: corsHeaders });
        }

        // Sign in successful - use this session
        const response = NextResponse.json({
          success: true,
          user: {
            id: userId,
            email: vendor.email,
            name: vendor.store_name,
            role: 'vendor_owner',
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
          apps: [],
          locations: locations,
          message: 'Logged in as vendor admin (legacy - existing auth)'
        }, { headers: corsHeaders });

        const cookie = createAuthCookie(signInData.session.access_token);
        response.cookies.set(cookie.name, cookie.value, cookie.options);
        console.log('✅ Auth cookie set for legacy vendor (existing auth)');
        return response;
      }

      // Auth user created successfully - now sign them in to get a session
      const { data: newSessionData, error: newSessionError } = await supabase.auth.signInWithPassword({
        email: vendor.email,
        password: password
      });

      if (newSessionError || !newSessionData.session) {
        console.error('Failed to create session for new auth user:', newSessionError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create session. Please try logging in again.'
        }, { status: 500, headers: corsHeaders });
      }

      // Return success with auth token cookie
      const response = NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: vendor.email,
          name: vendor.store_name,
          role: 'vendor_owner',
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
        apps: [],
        locations: locations,
        message: 'Logged in as vendor admin (migrated from legacy with new auth)'
      }, { headers: corsHeaders });

      const cookie = createAuthCookie(newSessionData.session.access_token);
      response.cookies.set(cookie.name, cookie.value, cookie.options);
      console.log('✅ Auth cookie set for newly migrated legacy vendor');

      return response;
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
      if (user.role !== 'vendor_owner' && user.role !== 'vendor_manager') {
        const { data: permissions } = await supabase
          .from('user_app_permissions')
          .select('app_key')
          .eq('user_id', user.id)
          .eq('can_access', true);

        accessibleApps = permissions?.map(p => p.app_key) || [];
      }

      // Load accessible locations (only for employees)
      let locations: any[] = [];
      if (user.role === 'pos_staff' || user.role === 'inventory_staff' || user.role === 'location_manager') {
        // CRITICAL FIX: Table is user_locations, not employee_locations
        // CRITICAL FIX: locations table doesn't have 'address' column - use address_line1, city, state
        console.log('🔍 Loading locations for employee, user_id:', user.id);
        const { data: userLocations, error: locError } = await supabase
          .from('user_locations')
          .select(`
            location_id,
            locations (
              id,
              name,
              address_line1,
              city,
              state
            )
          `)
          .eq('user_id', user.id);

        console.log('📍 User locations query result:', { count: userLocations?.length, error: locError, data: userLocations });

        locations = userLocations?.map((ul: any) => ({
          id: ul.locations.id,
          name: ul.locations.name,
          address: `${ul.locations.address_line1 || ''} ${ul.locations.city || ''}, ${ul.locations.state || ''}`.trim(),
          is_primary: false
        })) || [];

        console.log('✅ Mapped employee locations:', locations.length, locations);
      } else if (user.role === 'vendor_owner' || user.role === 'vendor_manager') {
        // Vendor owners/managers have access to all their vendor's locations
        console.log('🔍 Loading locations for vendor owner/manager, vendor_id:', user.vendor_id);
        const { data: allLocations, error: locError } = await supabase
          .from('locations')
          .select('id, name, address_line1, city, state')
          .eq('vendor_id', user.vendor_id);

        console.log('📍 Locations query result:', { count: allLocations?.length, error: locError });

        locations = allLocations?.map(l => ({
          id: l.id,
          name: l.name,
          address: `${l.address_line1 || ''} ${l.city || ''}, ${l.state || ''}`.trim(),
          is_primary: false
        })) || [];

        console.log('✅ Mapped locations:', locations.length);
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

      // CRITICAL DEBUG: Log what we're about to return
      console.log('📤 FINAL RESPONSE DATA:', {
        success: true,
        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        role: user.role,
        locationsCount: locations.length,
        locationsData: locations,
        appsCount: accessibleApps.length
      });

      // Create response with HTTP-only cookie (secure)
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email, // SCHEMA FIX: Combine first/last names
          role: user.role,
          vendor_id: user.vendor_id,
          employee_code: user.employee_id, // SCHEMA FIX: Use employee_id from DB
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
      }, { headers: corsHeaders });

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
      // SCHEMA FIX: Use first_name/last_name instead of name
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          vendor_id: vendor.id,
          email: vendor.email,
          first_name: vendor.store_name,
          last_name: '',
          role: 'vendor_owner', // SCHEMA FIX: Database uses vendor_owner, not vendor_admin
          status: 'active',
          login_enabled: true
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Failed to create vendor admin user:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user account' },
          { status: 500, headers: corsHeaders }
        );
      }

      // Load all vendor locations
      const { data: allLocations } = await supabase
        .from('locations')
        .select('id, name, address_line1, city, state')
        .eq('vendor_id', vendor.id);

      const locations = allLocations?.map(l => ({
        id: l.id,
        name: l.name,
        address: `${l.address_line1 || ''} ${l.city || ''}, ${l.state || ''}`.trim(),
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
          name: vendor.store_name, // For new users, first_name is set to store_name
          role: 'vendor_owner', // SCHEMA FIX: Use vendor_owner to match enum
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
      }, { headers: corsHeaders });

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
      { status: 500, headers: corsHeaders }
    );
  }
}
