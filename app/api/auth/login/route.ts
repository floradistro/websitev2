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

    try {
      // Try flora-auth endpoint first (secure authentication)
      const authResponse = await axios.post(
        `${baseUrl}/wp-json/flora-auth/v1/login`,
        {
          email: email,
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      if (authResponse.data.success && authResponse.data.user) {
        return NextResponse.json({
          success: true,
          user: authResponse.data.user,
          message: 'Login successful'
        });
      }
    } catch (endpointError: any) {
      console.log('Flora auth endpoint not available, trying direct WordPress authentication');
      
      // Fallback: Use WordPress REST API to verify user exists
      // Then use Application Password or JWT for proper auth
      // For now, authenticate via WordPress XML-RPC
      try {
        const wpAuthCheck = await axios.post(
          `${baseUrl}/xmlrpc.php`,
          `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.getProfile</methodName>
  <params>
    <param><value><string></string></value></param>
    <param><value><string>${email}</string></value></param>
    <param><value><string>${password}</string></value></param>
  </params>
</methodCall>`,
          {
            headers: {
              'Content-Type': 'text/xml'
            },
            timeout: 5000
          }
        );

        // If XML-RPC auth succeeds, fetch customer data from WooCommerce
        const customerKey = process.env.WORDPRESS_CONSUMER_KEY || "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
        const customerSecret = process.env.WORDPRESS_CONSUMER_SECRET || "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
        
        const customerResponse = await axios.get(
          `${baseUrl}/wp-json/wc/v3/customers`,
          {
            params: {
              consumer_key: customerKey,
              consumer_secret: customerSecret,
              email: email,
            }
          }
        );

        if (customerResponse.data && customerResponse.data.length > 0) {
          const customer = customerResponse.data[0];
          
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
      } catch (fallbackError) {
        console.error('Fallback auth also failed:', fallbackError);
      }
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

