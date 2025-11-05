import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  console.log('🔍 GitHub OAuth callback received:', { code: code?.substring(0, 10) + '...', state });

  if (!code || !state) {
    console.error('❌ Missing code or state parameter');
    return NextResponse.redirect(new URL('/vendor/website?error=missing_params', request.url));
  }

  try {
    console.log('📤 Exchanging code for access token...');
    console.log('Using CLIENT_ID:', process.env.GITHUB_CLIENT_ID);
    console.log('Has CLIENT_SECRET:', !!process.env.GITHUB_CLIENT_SECRET);

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('📥 Token response:', { ...tokenData, access_token: tokenData.access_token ? 'present' : 'missing' });

    if (tokenData.error) {
      console.error('❌ GitHub OAuth error:', tokenData);
      return NextResponse.redirect(new URL('/vendor/website?error=github_auth_failed', request.url));
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('❌ No access token received');
      return NextResponse.redirect(new URL('/vendor/website?error=no_token', request.url));
    }

    console.log('📤 Fetching GitHub user info...');
    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();
    console.log('📥 GitHub user:', { login: githubUser.login, id: githubUser.id });

    // Store in database (encrypted)
    const supabase = getServiceSupabase();

    // Get vendor ID from state
    const vendorId = state;
    console.log('💾 Saving to database for vendor:', vendorId);

    const { error } = await supabase
      .from('vendors')
      .update({
        github_access_token: accessToken, // Should be encrypted in production
        github_username: githubUser.login,
        github_user_id: githubUser.id.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId);

    if (error) {
      console.error('❌ Database update error:', error);
      return NextResponse.redirect(new URL('/vendor/website?error=db_update_failed', request.url));
    }

    console.log('✅ GitHub connection saved successfully!');
    return NextResponse.redirect(new URL('/vendor/website?success=github_connected', request.url));
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(new URL('/vendor/website?error=unknown', request.url));
  }
}
