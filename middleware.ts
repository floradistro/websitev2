import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Force rebuild for Vercel deployment v2
  
  // Extract domain (remove port for localhost)
  const domain = hostname.split(':')[0];
  
  // Determine if this is the main Yacht Club/WhaleTools domain
  const isYachtClubDomain = domain.includes('yachtclub.vip') || 
                           domain.includes('whaletools.dev') ||
                           domain === 'localhost' || 
                           domain.startsWith('localhost:');
  
  // OPTIMIZATION: Early exit for main domain homepage - no DB lookup needed
  if (isYachtClubDomain && pathname === '/') {
    const response = NextResponse.next();
    response.headers.set('x-tenant-type', 'whaletools');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
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
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/pos') ||
    pathname.startsWith('/tv-display') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/test-storefront') ||
    pathname.includes('.') ||
    // These routes are ONLY excluded for main Yacht Club domain
    (isYachtClubDomain && (
      pathname.startsWith('/products') ||
      pathname.startsWith('/shop') ||
      pathname.startsWith('/cart') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/about') ||
      pathname.startsWith('/contact') ||
      pathname.startsWith('/faq') ||
      pathname.startsWith('/privacy') ||
      pathname.startsWith('/terms') ||
      pathname.startsWith('/shipping') ||
      pathname.startsWith('/returns') ||
      pathname.startsWith('/cookies')
    ))
  ) {
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }

  // Check if this is a custom vendor domain
  console.log('[Middleware] Checking domain:', { hostname, domain, isYachtClubDomain });
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up vendor by custom domain
    const { data: domainRecord, error: domainError } = await supabase
      .from('vendor_domains')
      .select('vendor_id, is_active, verified')
      .eq('domain', domain)
      .eq('verified', true)
      .eq('is_active', true)
      .single();
    
    console.log('[Middleware] Domain lookup result:', { domainRecord, domainError: domainError?.message });

    if (domainRecord && !domainError) {
      // Get vendor to check if coming soon mode is active
      const { data: vendor } = await supabase
        .from('vendors')
        .select('coming_soon')
        .eq('id', domainRecord.vendor_id)
        .single();
      
      console.log('[Middleware] Custom domain vendor:', {
        vendorId: domainRecord.vendor_id,
        comingSoon: vendor?.coming_soon,
      });
        
      // Check if coming soon mode is active - rewrite to storefront to show coming soon page
      if (vendor?.coming_soon) {
        // Allow preview mode to bypass
        const isPreview = request.nextUrl.searchParams.get('preview') === 'true';
        console.log('[Middleware] Coming soon mode active, preview:', isPreview);
        if (!isPreview) {
          // Rewrite to /storefront so the coming soon page is rendered
          const url = request.nextUrl.clone();
          if (!pathname.startsWith('/storefront')) {
            url.pathname = `/storefront${pathname}`;
          }
          const response = NextResponse.rewrite(url);
          response.headers.set('x-vendor-id', domainRecord.vendor_id);
          response.headers.set('x-coming-soon', 'true');
          response.headers.set('x-tenant-type', 'vendor');
          response.headers.set('x-is-custom-domain', 'true');
          response.headers.set('X-Frame-Options', 'SAMEORIGIN');
          response.headers.set('X-Content-Type-Options', 'nosniff');
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          console.log('[Middleware] Rewriting to storefront with coming soon header');
          return response;
        }
      }
      
      // Custom domain found - rewrite to /storefront AND inject tenant context
      
      const url = request.nextUrl.clone();
      // Only prepend /storefront if not already there
      if (!pathname.startsWith('/storefront')) {
        url.pathname = `/storefront${pathname}`;
      }
      
      const response = NextResponse.rewrite(url);
      response.headers.set('x-vendor-id', domainRecord.vendor_id);
      response.headers.set('x-tenant-type', 'vendor');
      response.headers.set('x-is-custom-domain', 'true');
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      return response;
    }
    
    console.log('[Middleware] No custom domain found for:', domain);

    // Check if this is a subdomain storefront (vendor-slug.yachtclub.com)
    const subdomain = domain.split('.')[0];
    if (domain.includes('.') && !domain.startsWith('www') && !isYachtClubDomain) {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id, status, coming_soon')
        .eq('slug', subdomain)
        .eq('status', 'active')
        .single();

      if (vendor && !vendorError) {
        console.log('[Middleware] Subdomain vendor:', {
          subdomain,
          vendorId: vendor.id,
          comingSoon: vendor.coming_soon,
        });
        // Check if coming soon mode is active - block entire site
        if (vendor.coming_soon) {
          const isPreview = request.nextUrl.searchParams.get('preview') === 'true';
          console.log('[Middleware] Coming soon mode active, preview:', isPreview);
          if (!isPreview) {
            const response = NextResponse.next();
            response.headers.set('x-vendor-id', vendor.id);
            response.headers.set('x-coming-soon', 'true');
            console.log('[Middleware] Setting x-coming-soon header for subdomain');
            return response;
          }
        }
        
        // Subdomain storefront found - redirect to /storefront
        if (!pathname.startsWith('/storefront')) {
          const url = request.nextUrl.clone();
          url.pathname = `/storefront${pathname}`;
          const redirect = NextResponse.redirect(url);
          redirect.headers.set('x-vendor-id', vendor.id);
          redirect.headers.set('x-is-subdomain', 'true');
          return redirect;
        }
        
        // Already on /storefront, just pass vendor ID
        const response = NextResponse.next();
        response.headers.set('x-vendor-id', vendor.id);
        response.headers.set('x-is-subdomain', 'true');
        response.headers.set('X-Frame-Options', 'SAMEORIGIN');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        return response;
      }
    }
  } catch (error) {
    // Silent fail - continue to default routing
  }

  // VENDOR PARAM: Check for ?vendor param on /storefront (fallback for testing/preview)
  if (pathname.startsWith('/storefront')) {
    const vendorSlug = request.nextUrl.searchParams.get('vendor');
    
    if (vendorSlug) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, status, coming_soon')
          .eq('slug', vendorSlug)
          .eq('status', 'active')
          .single();
          
        if (vendor) {
          console.log('[Middleware] Vendor param:', {
            vendorSlug,
            vendorId: vendor.id,
            comingSoon: vendor.coming_soon,
          });
          // Check if coming soon mode is active - block entire site
          if (vendor.coming_soon) {
            const isPreview = request.nextUrl.searchParams.get('preview') === 'true';
            console.log('[Middleware] Coming soon mode active, preview:', isPreview);
            if (!isPreview) {
              const response = NextResponse.next();
              response.headers.set('x-vendor-id', vendor.id);
              response.headers.set('x-coming-soon', 'true');
              console.log('[Middleware] Setting x-coming-soon header for vendor param');
              return response;
            }
          }
          
          const response = NextResponse.next();
          response.headers.set('x-vendor-id', vendor.id);
          response.headers.set('x-tenant-type', 'vendor');
          response.headers.set('X-Frame-Options', 'SAMEORIGIN');
          response.headers.set('X-Content-Type-Options', 'nosniff');
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          return response;
        }
      } catch (error) {
        // Silent fail
      }
    }
    
    // No vendor param on storefront path = blank template mode
    const response = NextResponse.next();
    response.headers.set('x-tenant-type', 'template-preview');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // WhaleTools platform landing page (root domain only)
  if (isYachtClubDomain && pathname === '/') {
    const response = NextResponse.next();
    response.headers.set('x-tenant-type', 'whaletools');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }
  
  // Default: Continue to main Yacht Club marketplace
  const response = NextResponse.next();
  response.headers.set('x-tenant-type', 'marketplace');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
