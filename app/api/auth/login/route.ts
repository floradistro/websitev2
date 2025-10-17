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

    // Authenticate using WooCommerce API with HTTP Basic Auth
    // WordPress username/password is verified by WooCommerce
    try {
      const customersResponse = await axios.get(
        `${baseUrl}/wp-json/wc/v3/customers`,
        {
          params: {
            email: email,
          },
          auth: {
            username: email,
            password: password
          },
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (customersResponse.data && customersResponse.data.length > 0) {
        const customer = customersResponse.data[0];
        
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
      }
    } catch (authError: any) {
      // If HTTP Basic Auth fails (401), credentials are wrong
      if (authError.response?.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Invalid email or password'
        }, { status: 401 });
      }
      throw authError;
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid email or password'
    }, { status: 401 });

  } catch (error: any) {
    console.error('Login error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Login failed. Please check your credentials.'
    }, { status: 401 });
  }
}

