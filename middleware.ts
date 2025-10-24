import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Extract domain (remove port for localhost)
  const domain = hostname.split(':')[0];
  
  // Skip middleware for:
  // - Static assets
  // - API routes
  // - Admin routes
  // - Vendor portal routes
  // - Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/test-storefront') ||
    pathname.includes('.')
  ) {
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Disable caching in development
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
    
    return response;
  }

  // LOCAL TESTING: Check if accessing /storefront on localhost with ?vendor param
  if ((domain.includes('localhost') || domain.includes('127.0.0.1')) && pathname.startsWith('/storefront')) {
    const vendorSlug = request.nextUrl.searchParams.get('vendor') || 'flora-distro'; // Default to flora-distro for local testing
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, status')
        .eq('slug', vendorSlug)
        .eq('status', 'active')
        .single();
        
      if (vendor) {
        const response = NextResponse.next();
        response.headers.set('x-vendor-id', vendor.id);
        response.headers.set('x-is-local-test', 'true');
        console.log(`🧪 Local storefront test - Vendor: ${vendorSlug} (${vendor.id})`);
        return response;
      }
    } catch (error) {
      console.error('Local vendor lookup error:', error);
    }
  }
  
  // Check if this is a custom vendor domain
  try {
    console.log('🔍 Middleware - Checking domain:', domain);
    
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

    console.log('📊 Domain lookup result:', { domainRecord, domainError });

    if (domainRecord && !domainError) {
      // Custom domain found - inject vendor ID and rewrite to storefront
      console.log('✅ Custom domain detected! Vendor ID:', domainRecord.vendor_id);
      console.log('🔀 Rewriting to:', `/storefront${pathname}`);
      
      const url = request.nextUrl.clone();
      url.pathname = `/storefront${pathname}`;
      
      const response = NextResponse.rewrite(url);
      response.headers.set('x-vendor-id', domainRecord.vendor_id);
      response.headers.set('x-is-custom-domain', 'true');
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      return response;
    } else {
      console.log('❌ No custom domain match found');
    }

    // Check if this is a subdomain storefront (vendor-slug.yachtclub.com)
    const subdomain = domain.split('.')[0];
    if (domain.includes('.') && !domain.startsWith('www')) {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id, status')
        .eq('slug', subdomain)
        .eq('status', 'active')
        .single();

      if (vendor && !vendorError) {
        // Subdomain storefront found
        const url = request.nextUrl.clone();
        url.pathname = `/storefront${pathname}`;
        
        const response = NextResponse.rewrite(url);
        response.headers.set('x-vendor-id', vendor.id);
        response.headers.set('x-is-subdomain', 'true');
        response.headers.set('X-Frame-Options', 'SAMEORIGIN');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        return response;
      }
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }

  // Default: Continue to main site
  const response = NextResponse.next();
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
