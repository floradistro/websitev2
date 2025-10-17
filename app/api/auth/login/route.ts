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

    // Step 1: Find customer by email
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

    // Step 2: Verify password using custom WordPress endpoint
    // This calls the flora-auth-endpoint.php plugin on WordPress
    const authResponse = await axios.post(
      `${baseUrl}/wp-json/flora-auth/v1/login`,
      {
        email,
        password
      }
    );

    if (!authResponse.data || !authResponse.data.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });
    }
    
    // Return authenticated user data from WordPress
    return NextResponse.json({
      success: true,
      user: authResponse.data.user,
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

