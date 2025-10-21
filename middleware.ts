import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add aggressive caching headers for static content
  const pathname = request.nextUrl.pathname;

  // API routes - short cache with stale-while-revalidate
  if (pathname.startsWith('/api/')) {
    // Bulk endpoints - longer cache
    if (pathname.startsWith('/api/bulk/') || pathname.startsWith('/api/prefetch')) {
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=120'
      );
    }
    // Regular API - shorter cache
    else if (pathname.startsWith('/api/supabase/')) {
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=30'
      );
    }
    // Health and status checks - no cache
    else if (pathname.includes('/health') || pathname.includes('/status')) {
      response.headers.set('Cache-Control', 'no-store, no-cache');
    }
    // Auth and sensitive - no cache
    else if (pathname.includes('/auth') || pathname.includes('/login') || pathname.includes('/admin')) {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    }
  }

  // Static assets - aggressive caching
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/images/') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/image|favicon.ico).*)',
  ],
};
