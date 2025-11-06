import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Website status endpoint called');
    console.log('📋 Request headers:', {
      authorization: request.headers.get('authorization'),
      cookie: request.headers.get('cookie'),
    });

    // Verify vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      console.log('❌ Auth failed - returning error response');
      // Return unauthorized error (client will need to ensure user is logged in)
      return authResult;
    }
    const { vendorId } = authResult;
    console.log('✅ Auth success - vendorId:', vendorId);

    const supabase = getServiceSupabase();

    // Get vendor info
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('github_username, github_repo_name, github_repo_url, deployment_status, last_deployment_at, vercel_deployment_url, vercel_project_id')
      .eq('id', vendorId)
      .single();

    if (error) {
      console.error('Error fetching vendor from database:', error);
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check for custom domains
    const { data: domains } = await supabase
      .from('vendor_domains')
      .select('domain, verified, is_primary')
      .eq('vendor_id', vendorId)
      .eq('verified', true)
      .eq('is_active', true);

    const primaryDomain = domains?.find(d => d.is_primary) || domains?.[0];

    return NextResponse.json({
      hasGithub: !!vendor?.github_username,
      githubUsername: vendor?.github_username,
      hasRepo: !!vendor?.github_repo_name,
      repoName: vendor?.github_repo_name,
      repoUrl: vendor?.github_repo_url,
      deploymentStatus: vendor?.deployment_status,
      lastDeploymentAt: vendor?.last_deployment_at,
      deploymentUrl: vendor?.vercel_deployment_url,
      vercelProjectId: vendor?.vercel_project_id,
      hasCustomDomain: !!primaryDomain,
      customDomain: primaryDomain?.domain,
    });
  } catch (error) {
    console.error('Error fetching website status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
