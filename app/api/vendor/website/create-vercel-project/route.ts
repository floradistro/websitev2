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

    // Get vendor data
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, slug, store_name, github_username, github_repo_name, custom_domain')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (!vendor.github_username || !vendor.github_repo_name) {
      return NextResponse.json(
        { error: 'GitHub repository not configured. Please create your storefront repository first.' },
        { status: 400 }
      );
    }

    // Check if project already exists
    const { data: existing } = await supabase
      .from('vendors')
      .select('vercel_project_id')
      .eq('id', vendorId)
      .single();

    if (existing?.vercel_project_id) {
      return NextResponse.json(
        { error: 'Vercel project already exists for this vendor' },
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
    let domainAdded = false;
    if (vendor.custom_domain) {
      try {
        console.log(`🔗 Adding custom domain: ${vendor.custom_domain}`);
        await addCustomDomain(vercelProject.projectId, vendor.custom_domain);
        domainAdded = true;
        console.log(`✅ Custom domain added`);
      } catch (domainError) {
        console.error('⚠️  Failed to add custom domain:', domainError);
        // Don't fail the whole operation if domain fails
      }
    }

    // Update vendor record
    await supabase
      .from('vendors')
      .update({
        vercel_project_id: vercelProject.projectId,
        vercel_project_name: vercelProject.projectName,
        vercel_deployment_url: vercelProject.deploymentUrl,
        deployment_status: 'ready',
        last_deployment_at: new Date().toISOString(),
      })
      .eq('id', vendorId);

    return NextResponse.json({
      success: true,
      message: 'Vercel project created successfully',
      project: {
        id: vercelProject.projectId,
        name: vercelProject.projectName,
        url: vercelProject.deploymentUrl,
      },
      customDomain: vendor.custom_domain,
      customDomainAdded: domainAdded,
      nextSteps: domainAdded
        ? [
            'Your storefront is deploying now',
            `Visit ${vercelProject.deploymentUrl} to see the deployment progress`,
            `Once deployed, your custom domain ${vendor.custom_domain} will be live`,
            'Push to your GitHub repo to trigger new deployments',
          ]
        : [
            'Your storefront is deploying now',
            `Visit ${vercelProject.deploymentUrl} to see your site`,
            'Add a custom domain in the Domains section',
            'Push to your GitHub repo to trigger new deployments',
          ],
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
