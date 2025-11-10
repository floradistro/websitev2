import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

/**
 * POST /api/vendor/website/setup-domain
 * Zero-friction domain setup
 *
 * Steve Jobs Experience:
 * 1. Vendor enters domain (e.g., "floradistro.com")
 * 2. We show them exact DNS records to add
 * 3. We auto-verify every 5 seconds
 * 4. When verified, we auto-add to Vercel
 * 5. Done!
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
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 },
      );
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Get vendor's Vercel project
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, slug, vercel_project_id, vercel_deployment_url")
      .eq("id", vendorId)
      .single();

    if (!vendor?.vercel_project_id) {
      return NextResponse.json(
        {
          error: "No Vercel project found",
          message: "Create your storefront first, then add a custom domain",
        },
        { status: 400 },
      );
    }

    // Check if domain already exists
    const { data: existing } = await supabase
      .from("vendor_domains")
      .select("*")
      .eq("domain", domain)
      .single();

    if (existing && existing.vendor_id !== vendorId) {
      return NextResponse.json(
        { error: "Domain already in use by another vendor" },
        { status: 400 },
      );
    }

    // Generate verification token
    const verificationToken = `whale-verify-${Math.random().toString(36).substring(2, 15)}`;

    // Insert or update domain record
    const { data: domainData, error: domainError } = await supabase
      .from("vendor_domains")
      .upsert({
        vendor_id: vendorId,
        domain,
        verification_token: verificationToken,
        verified: false,
        dns_configured: false,
        is_primary: true,
        is_active: true,
      })
      .select()
      .single();

    if (domainError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving domain:", domainError);
      }
      return NextResponse.json(
        { error: "Failed to save domain" },
        { status: 500 },
      );
    }

    // Return DNS instructions
    return NextResponse.json({
      success: true,
      domain,
      vercelProjectUrl: vendor.vercel_deployment_url,

      // DNS Records they need to add
      dnsRecords: [
        {
          type: "A",
          name: "@",
          value: "76.76.21.21", // Vercel's IP
          ttl: 3600,
        },
        {
          type: "CNAME",
          name: "www",
          value: "cname.vercel-dns.com",
          ttl: 3600,
        },
      ],

      // Verification TXT record (to prove they own the domain)
      verificationRecord: {
        type: "TXT",
        name: "_whale-verify",
        value: verificationToken,
        ttl: 3600,
      },

      // Simple instructions for non-technical users
      instructions: {
        step1: `Go to your domain registrar (GoDaddy, Namecheap, etc.)`,
        step2: `Find the DNS settings for ${domain}`,
        step3: `Add the 3 DNS records shown above`,
        step4: `Come back here - we'll auto-verify every 5 seconds`,
        step5: `Once verified, your site will be live at ${domain}!`,
      },

      // Link to specific registrar guides
      guides: {
        godaddy: "https://www.godaddy.com/help/manage-dns-records-680",
        namecheap:
          "https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/",
        cloudflare:
          "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/",
      },

      // Next steps
      nextSteps: [
        "Add the DNS records at your domain registrar",
        "Wait 1-5 minutes for DNS propagation",
        "We'll automatically verify and configure your domain",
        "Your site will be live!",
      ],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error setting up domain:", error);
    }
    return NextResponse.json(
      {
        error: error.message || "Failed to setup domain",
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/vendor/website/setup-domain
 * Check domain verification status
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get vendor's domains
    const { data: domains } = await supabase
      .from("vendor_domains")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      domains: domains || [],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error getting domains:", error);
    }
    return NextResponse.json(
      {
        error: error.message || "Failed to get domains",
      },
      { status: 500 },
    );
  }
}
