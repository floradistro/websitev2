import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';
import { addCustomDomain, removeDomainFromProject } from '@/lib/deployment/vercel';
import dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

/**
 * POST /api/vendor/website/verify-domain
 * Verify domain DNS configuration and add to Vercel
 *
 * Checks:
 * 1. TXT record with verification token
 * 2. A record pointing to Vercel
 * 3. CNAME record for www subdomain
 *
 * Once verified, automatically adds domain to vendor's Vercel project
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Domain verification requested');

    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get domain record
    const { data: domainRecord, error: domainError } = await supabase
      .from('vendor_domains')
      .select('*, vendors!inner(vercel_project_id)')
      .eq('domain', domain)
      .eq('vendor_id', vendorId)
      .single();

    if (domainError || !domainRecord) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    if (domainRecord.verified) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Domain already verified',
        domain,
      });
    }

    console.log(`🔍 Verifying DNS for ${domain}...`);

    const verificationResults: any = {
      txtRecord: false,
      aRecord: false,
      cnameRecord: false,
    };

    // Check TXT record for verification token
    try {
      const txtRecords = await resolveTxt(`_whale-verify.${domain}`);
      const flatRecords = txtRecords.flat();
      console.log('📋 TXT records found:', flatRecords);

      if (flatRecords.includes(domainRecord.verification_token)) {
        console.log('✅ Verification TXT record found');
        verificationResults.txtRecord = true;
      }
    } catch (error: any) {
      console.log('❌ TXT record not found:', error.message);
    }

    // Check A record (points to Vercel)
    try {
      const aRecords = await resolve4(domain);
      console.log('📋 A records found:', aRecords);

      // Vercel's IP
      if (aRecords.includes('76.76.21.21')) {
        console.log('✅ A record points to Vercel');
        verificationResults.aRecord = true;
      }
    } catch (error: any) {
      console.log('❌ A record not found:', error.message);
    }

    // Check CNAME record for www subdomain (optional but recommended)
    try {
      const cnameRecords = await resolveCname(`www.${domain}`);
      console.log('📋 CNAME records found:', cnameRecords);

      if (cnameRecords.some(r => r.includes('vercel-dns.com'))) {
        console.log('✅ CNAME record points to Vercel');
        verificationResults.cnameRecord = true;
      }
    } catch (error: any) {
      console.log('⚠️  CNAME record not found (optional):', error.message);
      // CNAME is optional, don't fail verification
      verificationResults.cnameRecord = true;
    }

    // Check if all required records are present
    const isFullyConfigured =
      verificationResults.txtRecord &&
      verificationResults.aRecord &&
      verificationResults.cnameRecord;

    if (!isFullyConfigured) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'DNS records not fully configured yet',
        domain,
        checks: verificationResults,
        missing: {
          txtRecord: !verificationResults.txtRecord ? 'Add TXT record for _whale-verify' : null,
          aRecord: !verificationResults.aRecord ? 'Add A record pointing to 76.76.21.21' : null,
          cnameRecord: !verificationResults.cnameRecord ? 'Add CNAME record for www' : null,
        },
      });
    }

    console.log('✅ All DNS records verified!');

    // Add domain to Vercel project
    const vercelProjectId = domainRecord.vendors.vercel_project_id;

    if (!vercelProjectId) {
      return NextResponse.json(
        { error: 'No Vercel project found' },
        { status: 400 }
      );
    }

    // Get platform project ID to handle conflicts
    const { data: platformConfig } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'platform_vercel_project_id')
      .single();

    const platformProjectId = platformConfig?.value || process.env.VERCEL_PROJECT_ID;

    try {
      console.log(`🔧 Adding ${domain} to Vercel project ${vercelProjectId}...`);

      // Try to add the domain
      await addCustomDomain(vercelProjectId, domain);
      console.log('✅ Domain added to Vercel');
    } catch (vercelError: any) {
      // Check if domain already exists on another project
      if (vercelError.message.includes('already in use') || vercelError.message.includes('domain_already_in_use')) {
        console.log('⚠️  Domain is on another project, attempting to transfer...');

        // If we know the platform project ID, remove from there first
        if (platformProjectId) {
          try {
            console.log(`🔄 Removing ${domain} from platform project...`);
            await removeDomainFromProject(platformProjectId, domain);

            // Small delay for Vercel to process
            await new Promise(resolve => setTimeout(resolve, 500));

            // Try adding again
            await addCustomDomain(vercelProjectId, domain);
            console.log('✅ Domain successfully transferred!');
          } catch (transferError: any) {
            console.error('❌ Failed to transfer domain:', transferError.message);
            throw new Error('Domain is in use by another project and could not be transferred automatically. Please contact support.');
          }
        } else {
          throw new Error('Domain is already in use by another project. Please remove it manually or contact support.');
        }
      } else if (!vercelError.message.includes('already exists')) {
        console.error('⚠️  Vercel domain error:', vercelError.message);
        throw vercelError;
      }
    }

    // Also add www subdomain
    try {
      await addCustomDomain(vercelProjectId, `www.${domain}`);
      console.log('✅ WWW subdomain added');
    } catch (wwwError: any) {
      if (wwwError.message.includes('already in use') && platformProjectId) {
        try {
          console.log(`🔄 Removing www.${domain} from platform project...`);
          await removeDomainFromProject(platformProjectId, `www.${domain}`);
          await new Promise(resolve => setTimeout(resolve, 500));
          await addCustomDomain(vercelProjectId, `www.${domain}`);
          console.log('✅ WWW subdomain successfully transferred!');
        } catch (wwwTransferError) {
          console.error('⚠️  Could not transfer www subdomain:', wwwTransferError);
          // Continue anyway - main domain is more important
        }
      }
    }

    // Update domain record
    await supabase
      .from('vendor_domains')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        dns_configured: true,
        ssl_status: 'pending', // Vercel will provision SSL
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', domainRecord.id);

    // Update vendor deployment URL
    await supabase
      .from('vendors')
      .update({
        vercel_deployment_url: `https://${domain}`,
      })
      .eq('id', vendorId);

    return NextResponse.json({
      success: true,
      verified: true,
      message: `🎉 Domain verified! Your site will be live at ${domain} in ~60 seconds.`,
      domain,
      sslStatus: 'provisioning',
      nextSteps: [
        'Vercel is provisioning your SSL certificate',
        'This usually takes 30-60 seconds',
        `Visit https://${domain} to see your site!`,
      ],
    });
  } catch (error: any) {
    console.error('Error verifying domain:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to verify domain',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
