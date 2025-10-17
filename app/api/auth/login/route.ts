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

    // Authenticate with WordPress using flora-auth endpoint
    const authResponse = await axios.post(
      `${baseUrl}/wp-json/flora-auth/v1/login`,
      {
        email: email,
        password: password
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!authResponse.data.success || !authResponse.data.user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: authResponse.data.user,
      message: 'Login successful'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.code === 'invalid_credentials' ? 'Invalid email or password' :
                        'Login failed. Please check your credentials.';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 401 });
  }
}

