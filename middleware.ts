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
  // - Test storefront route
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/test-storefront') ||
    pathname.includes('.') ||
    domain.includes('localhost') ||
    domain.includes('127.0.0.1')
  ) {
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
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
