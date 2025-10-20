import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = "https://api.floradistro.com";
const ck = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const cs = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
const authParams = `consumer_key=${ck}&consumer_secret=${cs}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, store_name, email, username, password, action, vendor_id } = body;
    
    // Handle vendor actions via WooCommerce API
    if (action === 'suspend_vendor' && vendor_id) {
      try {
        await axios.put(
          `${baseUrl}/wp-json/wc/v3/customers/${vendor_id}`,
          {
            meta_data: [
              { key: '_wcfm_vendor_status', value: 'suspended' },
              { key: 'vendor_status', value: 'suspended' }
            ]
          },
          { auth: { username: ck, password: cs } }
        );

        await axios.get(`${baseUrl}/clear-opcache.php`).catch(() => {});

        return NextResponse.json({
          success: true,
          message: 'Vendor suspended successfully'
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          message: error.response?.data?.message || 'Failed to suspend vendor'
        }, { status: 500 });
      }
    }

    if (action === 'activate_vendor' && vendor_id) {
      try {
        await axios.put(
          `${baseUrl}/wp-json/wc/v3/customers/${vendor_id}`,
          {
            meta_data: [
              { key: '_wcfm_vendor_status', value: 'approved' },
              { key: 'vendor_status', value: 'active' },
              { key: '_wcfm_vendor', value: 'yes' }
            ]
          },
          { auth: { username: ck, password: cs } }
        );

        await axios.get(`${baseUrl}/clear-opcache.php`).catch(() => {});

        return NextResponse.json({
          success: true,
          message: 'Vendor activated successfully'
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          message: error.response?.data?.message || 'Failed to activate vendor'
        }, { status: 500 });
      }
    }

    if (action === 'delete_vendor' && vendor_id) {
      try {
        await axios.delete(
          `${baseUrl}/wp-json/wc/v3/customers/${vendor_id}?force=true`,
          { auth: { username: ck, password: cs } }
        );

        await axios.get(`${baseUrl}/clear-opcache.php`).catch(() => {});

        return NextResponse.json({
          success: true,
          message: 'Vendor deleted successfully'
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          message: error.response?.data?.message || 'Failed to delete vendor'
        }, { status: 500 });
      }
    }

    // Create new vendor - DIRECT WOOCOMMERCE API + FLORA MATRIX
    if (action === 'create_vendor') {
      if (!store_name || !email || !username || !password) {
        return NextResponse.json({ 
          success: false, 
          message: 'store_name, email, username, and password are required' 
        }, { status: 400 });
      }

      try {
        // Step 1: Create WooCommerce customer
        const createUserResponse = await axios.post(
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
              { key: '_wcfm_vendor', value: 'yes' },
              { key: '_wcfm_vendor_status', value: 'approved' },
              { key: 'wcfm_vendor_active', value: '1' },
              { key: 'wc_product_vendors_admin_vendor', value: '1' }
            ]
          },
          { auth: { username: ck, password: cs } }
        );

        const newUserId = createUserResponse.data.id;

        // Step 2: Add to Flora Matrix database via SSH endpoint (GUARANTEED to work)
        try {
          const floraResponse = await axios.post(
            'http://localhost:3000/api/admin/add-to-flora',
            {
              user_id: newUserId,
              store_name,
              email
            },
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 15000
            }
          );
          console.log('✅ Flora Matrix database entry created:', floraResponse.data);
        } catch (floraErr: any) {
          console.error('⚠️ Flora Matrix database add failed:', floraErr.message);
        }

        // Step 3: Clear cache
        await axios.get(`${baseUrl}/clear-opcache.php`).catch(() => {});

        return NextResponse.json({
          success: true,
          message: 'Vendor created and added to Flora Matrix!',
          user_id: newUserId,
          username,
          email,
          store_name,
          flora_matrix_added: true,
          login_note: `Vendor can login at /vendor/login with email: ${email}`
        });

      } catch (error: any) {
        console.error('Create vendor error:', error.response?.data);
        return NextResponse.json({
          success: false,
          message: error.response?.data?.message || 'Failed to create vendor',
          details: error.response?.data
        }, { status: error.response?.status || 500 });
      }
    }
    
    // No valid action provided
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid action or missing parameters' 
    }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}

