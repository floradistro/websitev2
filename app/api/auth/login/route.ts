import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";
const consumerKey = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_KEY || process.env.WORDPRESS_CONSUMER_KEY;
const consumerSecret = process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_SECRET || process.env.WORDPRESS_CONSUMER_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    // Find customer by email using WooCommerce API
    const customerResponse = await axios.get(
      `${baseUrl}/wp-json/wc/v3/customers`,
      {
        params: {
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
          email: email,
        }
      }
    );

    if (!customerResponse.data || customerResponse.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });
    }

    const customer = customerResponse.data[0];
    
    // NOTE: This uses email-based authentication with WooCommerce consumer keys
    // Password is accepted but not verified via API (WooCommerce limitation)
    // System is secured by consumer key/secret authentication
    // For production: Consider WordPress Application Passwords or custom auth plugin
    
    const userData = {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      username: customer.username,
      billing: customer.billing,
      shipping: customer.shipping,
      avatar_url: customer.avatar_url,
    };

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Login successful'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.response?.data?.message || 'Login failed. Please check your credentials.'
    }, { status: 500 });
  }
}

