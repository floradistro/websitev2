import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin users with roles
const ADMIN_USERS = [
  {
    username: 'admin',
    password: 'floyddeservedit',
    role: 'admin' as const,
    name: 'Super Admin'
  },
  {
    username: 'readonly',
    password: 'viewonly2024',
    role: 'readonly' as const,
    name: 'Read Only'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Find matching user
    const user = ADMIN_USERS.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate session token with role
    const sessionToken = Buffer.from(
      JSON.stringify({
        username: user.username,
        name: user.name,
        role: user.role,
        timestamp: Date.now()
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        username: user.username,
        name: user.name,
        role: user.role
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
