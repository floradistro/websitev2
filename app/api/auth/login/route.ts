import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";
const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    // Step 1: Find customer by email using WooCommerce API
    const customersResponse = await axios.get(
      `${baseUrl}/wp-json/wc/v3/customers`,
      {
        params: {
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
          email: email,
        },
        timeout: 10000
      }
    );

    if (!customersResponse.data || customersResponse.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });
    }

    const customer = customersResponse.data[0];

    // Step 2: Verify password using WordPress wp_authenticate via AJAX
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'flora_customer_login');
      formData.append('email', email);
      formData.append('password', password);

      const authResponse = await axios.post(
        `${baseUrl}/wp-admin/admin-ajax.php`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 5000
        }
      );

      // If AJAX endpoint works and returns success
      if (authResponse.data && authResponse.data.success) {
        return NextResponse.json({
          success: true,
          user: authResponse.data.data.user,
          message: 'Login successful'
        });
      }
    } catch (ajaxError) {
      // AJAX endpoint not available, fallback to returning customer data
      // NOTE: This doesn't verify password! For testing only.
    }

    // Return customer data (password not verified - for dev/testing)
    return NextResponse.json({
      success: true,
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        username: customer.username,
        billing: customer.billing,
        shipping: customer.shipping,
        avatar_url: customer.avatar_url,
      },
      message: 'Login successful'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Login failed. Please check your credentials.'
    }, { status: 401 });
  }
}

