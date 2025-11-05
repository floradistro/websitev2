import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';
import { createRepositoryFromTemplate } from '@/lib/deployment/github';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Create website repository endpoint called');

    // Verify vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      console.log('❌ Auth failed - returning error response');
      return authResult;
    }
    const { vendorId } = authResult;
    console.log('✅ Auth success - vendorId:', vendorId);

    const supabase = getServiceSupabase();

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('store_name, slug, github_access_token, github_username')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      console.error('Vendor not found:', vendorError);
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (!vendor.github_access_token || !vendor.github_username) {
      console.error('GitHub not connected for vendor');
      return NextResponse.json(
        { error: 'Please connect your GitHub account first' },
        { status: 400 }
      );
    }

    // Create repository in vendor's GitHub account
    const repoName = `${vendor.slug}-storefront`;
    const description = `${vendor.store_name} - Cannabis Storefront`;
    console.log('Creating repo:', repoName);

    const repo = await createRepositoryFromTemplate({
      vendorAccessToken: vendor.github_access_token,
      vendorUsername: vendor.github_username,
      name: repoName,
      description,
      isPrivate: false, // Public so they can deploy to Vercel
    });

    // Update vendor record with repo info
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        github_repo_name: repoName,
        github_repo_url: repo.html_url,
        github_repo_full_name: repo.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId);

    if (updateError) {
      console.error('Error updating vendor with repo info:', updateError);
    }

    return NextResponse.json({
      success: true,
      repo: {
        name: repo.name,
        url: repo.html_url,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch,
      },
    });
  } catch (error: any) {
    console.error('Error creating website repo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create repository' },
      { status: 500 }
    );
  }
}
