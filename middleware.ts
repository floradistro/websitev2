import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { generateRequestId } from "@/lib/api-logger";
import {
  getCachedDomain,
  setCachedDomain,
  getCachedSubdomain,
  setCachedSubdomain,
} from "@/lib/middleware-cache";

/**
 * Apply request ID and timing headers to response
 */
function applyRequestHeaders(
  response: NextResponse,
  requestId: string,
  startTime: number
): NextResponse {
  response.headers.set("X-Request-ID", requestId);
  const duration = Date.now() - startTime;
  response.headers.set("X-Response-Time", `${duration.toFixed(2)}ms`);
  return response;
}

/**
 * Apply comprehensive security headers to response
 */
function applySecurityHeaders(response: NextResponse, hostname: string): NextResponse {
  const isDevelopment = hostname.includes("localhost") || hostname.includes("127.0.0.1");

  // Basic Security Headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // HSTS (HTTP Strict Transport Security) - Only in production
  if (!isDevelopment) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    // Allow scripts from self, inline (for Next.js), and eval (for Monaco editor)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app",
    // Allow styles from self and inline
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Allow images from multiple sources
    "img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com https://*.cloudinary.com https://*.google.com https://*.googleusercontent.com",
    // Allow fonts
    "font-src 'self' data: https://fonts.gstatic.com",
    // Allow connections to API endpoints and services
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com https://api.authorize.net https://apitest.authorize.net https://sentry.io https://*.sentry.io https://vercel.live wss://vercel.live",
    // Allow frames from payment processors and Vercel Live
    "frame-src 'self' https://accept.authorize.net https://test.authorize.net https://vercel.live",
    // Allow workers for barcode scanning
    "worker-src 'self' blob:",
    // Block all object embeds
    "object-src 'none'",
    // Only allow form submissions to self
    "form-action 'self'",
    // Block old browsers from MIME-sniffing
    "base-uri 'self'",
  ];

  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self)",
  );

  return response;
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = generateRequestId();

  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Force rebuild for Vercel deployment v2

  // Extract domain (remove port for localhost)
  const domain = hostname.split(":")[0];

  // Determine if this is the main WhaleTools domain
  const isWhaletoolsDomain =
    domain.includes("whaletools.dev") ||
    domain === "localhost" ||
    domain.startsWith("localhost:");

  // OPTIMIZATION: Early exit for main domain homepage - no DB lookup needed
  if (isWhaletoolsDomain && pathname === "/") {
    const response = NextResponse.next();
    response.headers.set("x-tenant-type", "whaletools");
    applyRequestHeaders(response, requestId, startTime);
    return applySecurityHeaders(response, hostname);
  }

  // Skip middleware for:
  // - Static assets
  // - API routes
  // - Admin routes
  // - Vendor portal routes
  // - POS routes
  // - TV Display routes
  // - Main Yacht Club pages (ONLY for yacht club domain, not vendor domains)
  // - Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/tv-display") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/test-storefront") ||
    pathname.includes(".") ||
    // These routes are ONLY excluded for main Yacht Club domain
    (isWhaletoolsDomain &&
      (pathname.startsWith("/products") ||
        pathname.startsWith("/shop") ||
        pathname.startsWith("/cart") ||
        pathname.startsWith("/checkout") ||
        pathname.startsWith("/about") ||
        pathname.startsWith("/contact") ||
        pathname.startsWith("/faq") ||
        pathname.startsWith("/privacy") ||
        pathname.startsWith("/terms") ||
        pathname.startsWith("/shipping") ||
        pathname.startsWith("/returns") ||
        pathname.startsWith("/cookies")))
  ) {
    const response = NextResponse.next();
    applyRequestHeaders(response, requestId, startTime);
    return applySecurityHeaders(response, hostname);
  }

  // Check if this is a custom vendor domain
  try {
    const supabase = getServiceSupabase();

    // OPTIMIZATION: Check cache first
    let domainRecord = getCachedDomain(domain);

    if (!domainRecord) {
      // Cache miss - query database
      // OPTIMIZATION: Join vendor table to get coming_soon in ONE query
      const { data, error: domainError } = await supabase
        .from("vendor_domains")
        .select("vendor_id, is_active, verified, vendors!inner(coming_soon)")
        .eq("domain", domain)
        .eq("verified", true)
        .eq("is_active", true)
        .single();

      if (data && !domainError) {
        // Extract coming_soon from joined vendor data
        const vendorData = data.vendors as any;
        domainRecord = {
          vendor_id: data.vendor_id,
          is_active: data.is_active,
          verified: data.verified,
          coming_soon: vendorData?.coming_soon || false,
          timestamp: Date.now(),
        };

        // Cache for future requests
        setCachedDomain(domain, domainRecord);
      }
    }

    if (domainRecord) {
      const vendor = { coming_soon: domainRecord.coming_soon };

      // Check if coming soon mode is active - rewrite to storefront to show coming soon page
      if (vendor?.coming_soon) {
        // Allow preview mode to bypass
        const isPreview = request.nextUrl.searchParams.get("preview") === "true";
        if (!isPreview) {
          // Rewrite to /storefront so the coming soon page is rendered
          const url = request.nextUrl.clone();
          if (!pathname.startsWith("/storefront")) {
            url.pathname = `/storefront${pathname}`;
          }
          const response = NextResponse.rewrite(url);
          response.headers.set("x-vendor-id", domainRecord.vendor_id);
          response.headers.set("x-coming-soon", "true");
          response.headers.set("x-tenant-type", "vendor");
          response.headers.set("x-is-custom-domain", "true");
          applyRequestHeaders(response, requestId, startTime);
          return applySecurityHeaders(response, hostname);
        }
      }

      // Custom domain found - rewrite to /storefront AND inject tenant context

      const url = request.nextUrl.clone();
      // Only prepend /storefront if not already there
      if (!pathname.startsWith("/storefront")) {
        url.pathname = `/storefront${pathname}`;
      }

      const response = NextResponse.rewrite(url);
      response.headers.set("x-vendor-id", domainRecord.vendor_id);
      response.headers.set("x-tenant-type", "vendor");
      response.headers.set("x-is-custom-domain", "true");
      applyRequestHeaders(response, requestId, startTime);
      return applySecurityHeaders(response, hostname);
    }

    // Check if this is a subdomain storefront (vendor-slug.yachtclub.com)
    const subdomain = domain.split(".")[0];
    if (domain.includes(".") && !domain.startsWith("www") && !isWhaletoolsDomain) {
      // OPTIMIZATION: Check cache first
      let vendor = getCachedSubdomain(subdomain);

      if (!vendor) {
        // Cache miss - query database
        const { data, error: vendorError } = await supabase
          .from("vendors")
          .select("id, status, coming_soon")
          .eq("slug", subdomain)
          .eq("status", "active")
          .single();

        if (data && !vendorError) {
          vendor = {
            ...data,
            timestamp: Date.now(),
          };
          // Cache for future requests
          setCachedSubdomain(subdomain, vendor);
        }
      }

      if (vendor) {
        // Check if coming soon mode is active - block entire site
        if (vendor.coming_soon) {
          const isPreview = request.nextUrl.searchParams.get("preview") === "true";
          if (!isPreview) {
            const response = NextResponse.next();
            response.headers.set("x-vendor-id", vendor.id);
            response.headers.set("x-coming-soon", "true");
            applyRequestHeaders(response, requestId, startTime);
            return response;
          }
        }

        // Subdomain storefront found - redirect to /storefront
        if (!pathname.startsWith("/storefront")) {
          const url = request.nextUrl.clone();
          url.pathname = `/storefront${pathname}`;
          const redirect = NextResponse.redirect(url);
          redirect.headers.set("x-vendor-id", vendor.id);
          redirect.headers.set("x-is-subdomain", "true");
          applyRequestHeaders(redirect, requestId, startTime);
          return redirect;
        }

        // Already on /storefront, just pass vendor ID
        const response = NextResponse.next();
        response.headers.set("x-vendor-id", vendor.id);
        response.headers.set("x-is-subdomain", "true");
        applyRequestHeaders(response, requestId, startTime);
        return applySecurityHeaders(response, hostname);
      }
    }
  } catch (error) {
    // Silent fail - continue to default routing
  }

  // VENDOR PARAM: Check for ?vendor param on /storefront (fallback for testing/preview)
  if (pathname.startsWith("/storefront")) {
    const vendorSlug = request.nextUrl.searchParams.get("vendor");

    if (vendorSlug) {
      try {
        const supabase = getServiceSupabase();

        const { data: vendor } = await supabase
          .from("vendors")
          .select("id, status, coming_soon")
          .eq("slug", vendorSlug)
          .eq("status", "active")
          .single();

        if (vendor) {
          // Check if coming soon mode is active - block entire site
          if (vendor.coming_soon) {
            const isPreview = request.nextUrl.searchParams.get("preview") === "true";
            if (!isPreview) {
              const response = NextResponse.next();
              response.headers.set("x-vendor-id", vendor.id);
              response.headers.set("x-coming-soon", "true");
              applyRequestHeaders(response, requestId, startTime);
              return response;
            }
          }

          const response = NextResponse.next();
          response.headers.set("x-vendor-id", vendor.id);
          response.headers.set("x-tenant-type", "vendor");
          applyRequestHeaders(response, requestId, startTime);
          return applySecurityHeaders(response, hostname);
        }
      } catch (error) {
        // Silent fail
      }
    }

    // No vendor param on storefront path = blank template mode
    const response = NextResponse.next();
    response.headers.set("x-tenant-type", "template-preview");
    applyRequestHeaders(response, requestId, startTime);
    return applySecurityHeaders(response, hostname);
  }

  // WhaleTools platform landing page (root domain only)
  if (isWhaletoolsDomain && pathname === "/") {
    const response = NextResponse.next();
    response.headers.set("x-tenant-type", "whaletools");
    applyRequestHeaders(response, requestId, startTime);
    return applySecurityHeaders(response, hostname);
  }

  // Default: Continue to main Yacht Club marketplace
  const response = NextResponse.next();
  response.headers.set("x-tenant-type", "marketplace");
  applyRequestHeaders(response, requestId, startTime);
  return applySecurityHeaders(response, hostname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
