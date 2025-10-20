import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const ck = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const cs = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
const authParams = `consumer_key=${ck}&consumer_secret=${cs}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, store_name, email, username, password } = body;
    
    // If user_id is provided, activate existing user as vendor
    if (user_id) {
      try {
        await axios.put(
          `${baseUrl}/wp-json/wc/v3/customers/${user_id}`,
          {
            meta_data: [
              { key: 'store_name', value: store_name || 'Vendor Store' },
              { key: '_wcfm_vendor', value: 'yes' },
              { key: '_wcfm_vendor_status', value: 'approved' },
              { key: 'wcfm_vendor_active', value: '1' },
              { key: 'wc_product_vendors_admin_vendor', value: '1' },
              { key: 'wcpv_product_vendors', value: '1' }
            ]
          },
          {
            auth: {
              username: ck,
              password: cs
            }
          }
        );

        await axios.get(`${baseUrl}/clear-opcache.php`).catch(() => {});

        return NextResponse.json({
          success: true,
          message: 'Vendor activated',
          user_id
        });

      } catch (error: any) {
        console.error('Activate vendor error:', error.response?.data);
        return NextResponse.json({
          success: false,
          error: error.response?.data?.message || 'Failed to activate vendor',
          details: error.response?.data
        }, { status: error.response?.status || 500 });
      }
    }
    
    // Otherwise, create a new vendor account
    if (!store_name || !email || !username || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'store_name, email, username, and password are required' 
      }, { status: 400 });
    }

    try {
      // Create WordPress user with vendor role
      const createUserResponse = await axios.post(
        `${baseUrl}/wp-json/wp/v2/users?${authParams}`,
        {
          username: username,
          email: email,
          password: password,
          roles: ['vendor'],
          name: store_name,
          meta: {
            store_name: store_name,
            _wcfm_vendor: 'yes',
            _wcfm_vendor_status: 'approved',
            wcfm_vendor_active: '1',
            wc_product_vendors_admin_vendor: '1',
            wcpv_product_vendors: '1'
          }
        }
      );

      const newUserId = createUserResponse.data.id;

      // Also update via WooCommerce API for consistency
      await axios.put(
        `${baseUrl}/wp-json/wc/v3/customers/${newUserId}`,
        {
          meta_data: [
            { key: 'store_name', value: store_name },
            { key: '_wcfm_vendor', value: 'yes' },
            { key: '_wcfm_vendor_status', value: 'approved' },
            { key: 'wcfm_vendor_active', value: '1' },
            { key: 'wc_product_vendors_admin_vendor', value: '1' },
            { key: 'wcpv_product_vendors', value: '1' }
          ]
        },
        {
          auth: {
            username: ck,
            password: cs
          }
        }
      );

      await axios.get(`${baseUrl}/clear-opcache.php`).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Vendor created successfully',
        user_id: newUserId,
        username: username,
        email: email,
        store_name: store_name
      });

    } catch (error: any) {
      console.error('Create vendor error:', error.response?.data);
      return NextResponse.json({
        success: false,
        message: error.response?.data?.message || 'Failed to create vendor',
        details: error.response?.data
      }, { status: error.response?.status || 500 });
    }
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}

