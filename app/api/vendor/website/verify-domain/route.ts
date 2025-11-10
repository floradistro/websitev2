import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { addCustomDomain, removeDomainFromProject } from "@/lib/deployment/vercel";
import dns from "dns";
import { promisify } from "util";

import { logger } from "@/lib/logger";
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
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get domain record
    const { data: domainRecord, error: domainError } = await supabase
      .from("vendor_domains")
      .select("*, vendors!inner(vercel_project_id)")
      .eq("domain", domain)
      .eq("vendor_id", vendorId)
      .single();

    if (domainError || !domainRecord) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (domainRecord.verified) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: "Domain already verified",
        domain,
      });
    }

    const verificationResults: any = {
      txtRecord: false,
      aRecord: false,
      cnameRecord: false,
    };

    // Check TXT record for verification token
    try {
      const txtRecords = await resolveTxt(`_whale-verify.${domain}`);
      const flatRecords = txtRecords.flat();

      if (flatRecords.includes(domainRecord.verification_token)) {
        verificationResults.txtRecord = true;
      }
    } catch (error: any) {}

    // Check A record (points to Vercel)
    try {
      const aRecords = await resolve4(domain);

      // Vercel's IP
      if (aRecords.includes("76.76.21.21")) {
        verificationResults.aRecord = true;
      }
    } catch (error: any) {}

    // Check CNAME record for www subdomain (optional but recommended)
    try {
      const cnameRecords = await resolveCname(`www.${domain}`);

      if (cnameRecords.some((r) => r.includes("vercel-dns.com"))) {
        verificationResults.cnameRecord = true;
      }
    } catch (error: any) {
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
        message: "DNS records not fully configured yet",
        domain,
        checks: verificationResults,
        missing: {
          txtRecord: !verificationResults.txtRecord ? "Add TXT record for _whale-verify" : null,
          aRecord: !verificationResults.aRecord ? "Add A record pointing to 76.76.21.21" : null,
          cnameRecord: !verificationResults.cnameRecord ? "Add CNAME record for www" : null,
        },
      });
    }

    // Add domain to Vercel project
    const vercelProjectId = domainRecord.vendors.vercel_project_id;

    if (!vercelProjectId) {
      return NextResponse.json({ error: "No Vercel project found" }, { status: 400 });
    }

    // Get platform project ID to handle conflicts
    const { data: platformConfig } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "platform_vercel_project_id")
      .single();

    const platformProjectId = platformConfig?.value || process.env.VERCEL_PROJECT_ID;

    try {
      // Try to add the domain
      await addCustomDomain(vercelProjectId, domain);
    } catch (vercelError: any) {
      // Check if domain already exists on another project
      if (
        vercelError.message.includes("already in use") ||
        vercelError.message.includes("domain_already_in_use")
      ) {
        // If we know the platform project ID, remove from there first
        if (platformProjectId) {
          try {
            await removeDomainFromProject(platformProjectId, domain);

            // Small delay for Vercel to process
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Try adding again
            await addCustomDomain(vercelProjectId, domain);
          } catch (transferError: any) {
            if (process.env.NODE_ENV === "development") {
              logger.error("❌ Failed to transfer domain:", transferError.message);
            }
            throw new Error(
              "Domain is in use by another project and could not be transferred automatically. Please contact support.",
            );
          }
        } else {
          throw new Error(
            "Domain is already in use by another project. Please remove it manually or contact support.",
          );
        }
      } else if (!vercelError.message.includes("already exists")) {
        if (process.env.NODE_ENV === "development") {
          logger.error("⚠️  Vercel domain error:", vercelError.message);
        }
        throw vercelError;
      }
    }

    // Also add www subdomain
    try {
      await addCustomDomain(vercelProjectId, `www.${domain}`);
    } catch (wwwError: any) {
      if (wwwError.message.includes("already in use") && platformProjectId) {
        try {
          await removeDomainFromProject(platformProjectId, `www.${domain}`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          await addCustomDomain(vercelProjectId, `www.${domain}`);
        } catch (wwwTransferError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("⚠️  Could not transfer www subdomain:", wwwTransferError);
          }
          // Continue anyway - main domain is more important
        }
      }
    }

    // Update domain record
    await supabase
      .from("vendor_domains")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        dns_configured: true,
        ssl_status: "pending", // Vercel will provision SSL
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", domainRecord.id);

    // Update vendor deployment URL
    await supabase
      .from("vendors")
      .update({
        vercel_deployment_url: `https://${domain}`,
      })
      .eq("id", vendorId);

    return NextResponse.json({
      success: true,
      verified: true,
      message: `🎉 Domain verified! Your site will be live at ${domain} in ~60 seconds.`,
      domain,
      sslStatus: "provisioning",
      nextSteps: [
        "Vercel is provisioning your SSL certificate",
        "This usually takes 30-60 seconds",
        `Visit https://${domain} to see your site!`,
      ],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error verifying domain:", error);
    }
    return NextResponse.json(
      {
        error: error.message || "Failed to verify domain",
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}
