import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";
const ck = process.env.WORDPRESS_CONSUMER_KEY || "";
const cs = process.env.WORDPRESS_CONSUMER_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const { store_name, email, username, password } = await request.json();

    if (!store_name || !email || !username || !password) {
      return NextResponse.json({
        success: false,
        message: 'store_name, email, username, and password are required'
      }, { status: 400 });
    }

    const slug = store_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const supabase = getServiceSupabase();

    // 1. Create WordPress customer (for order history, legacy compatibility)
    let wordpressUserId = null;
    
    try {
      const wpResponse = await axios.post(
        `${baseUrl}/wp-json/wc/v3/customers`,
        {
          email,
          username,
          first_name: store_name,
          last_name: '',
          billing: {
            email,
            first_name: store_name,
            last_name: ''
          },
          meta_data: [
            { key: 'store_name', value: store_name },
            { key: 'wcfm_vendor_active', value: '1' },
            { key: 'wc_product_vendors_admin_vendor', value: '1' }
          ]
        },
        { auth: { username: ck, password: cs } }
      );
      wordpressUserId = wpResponse.data.id;
    } catch (wpError: any) {
      console.error('   ⚠️ WordPress user creation failed:', wpError.response?.data?.message);
      // Continue anyway - vendor can still work without WordPress user
    }

    // 2. Create vendor in Supabase
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        email,
        store_name,
        slug,
        wordpress_user_id: wordpressUserId,
        status: 'active'
      })
      .select()
      .single();

    if (vendorError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create vendor in database',
        error: vendorError.message
      }, { status: 500 });
    }

    // 3. Create Supabase auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        vendor_id: vendor.id,
        store_name,
        wordpress_user_id: wordpressUserId
      }
    });

    if (authError) {
      // Rollback vendor creation if auth fails
      await supabase.from('vendors').delete().eq('id', vendor.id);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to create auth user',
        error: authError.message
      }, { status: 500 });
    }

    // 4. Create default warehouse location for vendor
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        name: `${store_name} Warehouse`,
        slug: `${slug}-warehouse`,
        type: 'vendor',
        vendor_id: vendor.id,
        city: '',
        state: '',
        is_active: true,
        is_default: true
      })
      .select()
      .single();
    
    if (locationError) {
      console.error('⚠️ Failed to create vendor location:', locationError);
      // Don't fail - vendor can create location later
    } else {
      console.log('✅ Created default warehouse:', location.name);
    }

    // 5. Clear WordPress cache
    if (wordpressUserId) {
      await axios.get(`${baseUrl}/clear-opcache.php`).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor created successfully!',
      vendor: {
        id: vendor.id,
        email: vendor.email,
        store_name: vendor.store_name,
        slug: vendor.slug,
        wordpress_user_id: wordpressUserId,
        status: vendor.status
      },
      auth_user_id: authUser.user?.id,
      location_id: location?.id,
      login_note: `Vendor can login at /vendor/login with email: ${email}`
    });

  } catch (error: any) {
    console.error('Create vendor error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to create vendor',
      error: error.toString()
    }, { status: 500 });
  }
}

