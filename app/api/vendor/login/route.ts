import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    // Try Flora Matrix vendor login first
    try {
      const floraResponse = await axios.post(
        `${baseUrl}/wp-json/flora-vendors/v1/auth/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (floraResponse.data && floraResponse.data.success) {
        return NextResponse.json(floraResponse.data);
      }
    } catch (floraError) {
      console.log('Flora Matrix login failed, trying WordPress auth...');
    }

    // Fallback: WordPress JWT/Basic Authentication
    try {
      const ck = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
      const cs = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
      
      // Get user by email
      const userResponse = await axios.get(
        `${baseUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&consumer_key=${ck}&consumer_secret=${cs}`
      );

      if (userResponse.data && userResponse.data.length > 0) {
        const user = userResponse.data[0];
        
        // Check if user has vendor metadata
        const isVendor = user.meta_data?.some((meta: any) => 
          meta.key === 'wcfm_vendor_active' || 
          meta.key === '_wcfm_vendor' ||
          meta.key === 'store_name'
        );

        if (!isVendor) {
          return NextResponse.json({
            success: false,
            error: 'This account is not registered as a vendor'
          }, { status: 403 });
        }

        const storeName = user.meta_data?.find((m: any) => m.key === 'store_name');

        // Create basic auth token (base64 encoded email:password)
        const authToken = Buffer.from(`${email}:${password}`).toString('base64');

        return NextResponse.json({
          success: true,
          token: authToken,
          vendor: {
            id: user.id,
            user_id: user.id,
            store_name: storeName?.value || user.first_name || 'Vendor',
            slug: (storeName?.value || user.first_name || 'vendor').toLowerCase().replace(/\s+/g, '-'),
            email: user.email
          }
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });

    } catch (error: any) {
      console.error('WordPress auth error:', error.response?.data || error.message);
      
      return NextResponse.json({
        success: false,
        error: 'Login failed. Please check your credentials.'
      }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Vendor login error:', error.message);
    
    return NextResponse.json({
      success: false,
      error: 'Login failed. Please try again.'
    }, { status: 500 });
  }
}
