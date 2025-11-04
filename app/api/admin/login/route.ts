import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'floyddeservedit';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate a simple session token (you can make this more secure if needed)
    const sessionToken = Buffer.from(
      JSON.stringify({
        username: ADMIN_USERNAME,
        role: 'admin',
        timestamp: Date.now()
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        username: ADMIN_USERNAME,
        role: 'admin'
      }
    });

  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
