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

    // Call WordPress vendor auth endpoint server-side (no CORS issues)
    const response = await axios.post(
      `${baseUrl}/wp-json/flora-vendors/v1/auth/login`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.success) {
      return NextResponse.json(response.data);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Vendor login error:', error.response?.data || error.message);
    
    return NextResponse.json({
      success: false,
      error: error.response?.data?.message || 'Login failed. Please check your credentials.'
    }, { status: 401 });
  }
}
