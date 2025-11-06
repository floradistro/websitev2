import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';
import { createVercelProject, addCustomDomain } from '@/lib/deployment/vercel';

/**
 * POST /api/vendor/website/create-vercel-project
 * Creates a separate Vercel project for the vendor's storefront
 *
 * Steve Jobs Architecture:
 * - One vendor = One Vercel project = One deployment
 * - Complete isolation - vendor code never touches platform code
 * - Scales infinitely - 10 vendors or 10,000, same simple model
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Creating separate Vercel project for vendor');

    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    console.log(`🔍 Looking up vendor with ID: ${vendorId}`);

    // Get vendor data
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, slug, store_name, github_username, github_repo_name, vercel_project_id, vercel_deployment_url')
      .eq('id', vendorId)
      .single();

    console.log('📊 Vendor query result:', { vendor, vendorError });

    // Get vendor's primary domain
    const { data: domainData } = await supabase
      .from('vendor_domains')
      .select('domain, verified, is_primary')
      .eq('vendor_id', vendorId)
      .eq('is_primary', true)
      .eq('is_active', true)
      .single();

    console.log('🌐 Vendor domain:', domainData);

    if (vendorError || !vendor) {
      console.error('❌ Vendor not found:', vendorError);
      return NextResponse.json(
        { error: 'Vendor not found', details: vendorError?.message },
        { status: 404 }
      );
    }

    console.log('📋 GitHub config:', { username: vendor.github_username, repo: vendor.github_repo_name });

    if (!vendor.github_username || !vendor.github_repo_name) {
      console.error('❌ GitHub repository not configured');
      return NextResponse.json(
        { error: 'GitHub repository not configured. Please create your storefront repository first.' },
        { status: 400 }
      );
    }

    // Check if project already exists
    if (vendor?.vercel_project_id) {
      console.error('❌ Vercel project already exists:', vendor.vercel_project_id);
      return NextResponse.json(
        {
          error: 'Vercel project already exists for this vendor',
          project: {
            id: vendor.vercel_project_id,
            url: vendor.vercel_deployment_url
          }
        },
        { status: 400 }
      );
    }

    // Create Vercel project
    console.log(`📦 Creating Vercel project for ${vendor.slug}`);

    const projectName = `${vendor.slug}-storefront`;
    const gitRepo = `${vendor.github_username}/${vendor.github_repo_name}`;

    // Environment variables for the vendor's project
    const environmentVariables = {
      // Platform API connection
      NEXT_PUBLIC_PLATFORM_API_URL: process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:3000',
      NEXT_PUBLIC_VENDOR_ID: vendor.id,
      NEXT_PUBLIC_VENDOR_SLUG: vendor.slug,

      // Supabase connection (read-only for vendor data)
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    };

    const vercelProject = await createVercelProject({
      name: projectName,
      gitRepo,
      environmentVariables,
      framework: 'nextjs',
    });

    console.log(`✅ Created Vercel project: ${vercelProject.projectName}`);
    console.log(`🌐 Deployment URL: ${vercelProject.deploymentUrl}`);

    // Add custom domain if configured
    let customDomainAdded = false;
    let customDomain = null;
    if (domainData?.domain) {
      try {
        console.log(`🔧 Adding custom domain: ${domainData.domain}`);
        await addCustomDomain(vercelProject.projectId, domainData.domain);
        customDomainAdded = true;
        customDomain = domainData.domain;
        console.log(`✅ Custom domain configured: ${domainData.domain}`);
      } catch (domainError: any) {
        console.error('⚠️  Failed to add custom domain (non-fatal):', domainError.message);
        // Don't fail the entire operation if domain addition fails
      }
    }

    // Update vendor record
    await supabase
      .from('vendors')
      .update({
        vercel_project_id: vercelProject.projectId,
        vercel_deployment_url: vercelProject.deploymentUrl,
        deployment_status: 'ready',
        last_deployment_at: new Date().toISOString(),
      })
      .eq('id', vendorId);

    const nextSteps = [
      'Your storefront is deploying now',
      customDomainAdded
        ? `Your custom domain ${customDomain} has been configured`
        : `Visit ${vercelProject.deploymentUrl} to see your site`,
      'Push to your GitHub repo to trigger new deployments',
      customDomainAdded
        ? `Once deployed, visit ${customDomain} to see your live site`
        : 'Add a custom domain in your vendor settings',
    ];

    return NextResponse.json({
      success: true,
      message: customDomainAdded
        ? `Site deployed to ${customDomain}`
        : 'Vercel project created successfully',
      project: {
        id: vercelProject.projectId,
        name: vercelProject.projectName,
        url: vercelProject.deploymentUrl,
      },
      customDomain: customDomainAdded ? customDomain : null,
      customDomainAdded,
      nextSteps,
    });
  } catch (error: any) {
    console.error('❌ Error creating Vercel project:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to create Vercel project',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
