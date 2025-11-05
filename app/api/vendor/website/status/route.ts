import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    // Verify vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get vendor info
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('github_username, github_repo_name, github_repo_url')
      .eq('id', vendorId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      hasGithub: !!vendor.github_username,
      githubUsername: vendor.github_username,
      hasRepo: !!vendor.github_repo_name,
      repoName: vendor.github_repo_name,
      repoUrl: vendor.github_repo_url,
    });
  } catch (error) {
    console.error('Error fetching website status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
