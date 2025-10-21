import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Extract domain (remove port if present)
  const domain = hostname.split(':')[0];
  
  // List of your platform domains (update these with your actual domains)
  const platformDomains = [
    'localhost',
    'yachtclub.vercel.app',
    'floradistro.com',
    'www.floradistro.com',
    'vercel.app'
  ];
  
  // Check if this is a platform domain
  const isPlatformDomain = platformDomains.some(platformDomain => 
    domain === platformDomain || domain.endsWith('.' + platformDomain)
  );
  
  // If it's a platform domain, proceed normally
  if (isPlatformDomain) {
    return NextResponse.next();
  }
  
  // This is a custom domain - look up which vendor it belongs to
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials not configured for middleware');
      return NextResponse.next();
    }
    
    // Look up domain in database
    const response = await fetch(`${supabaseUrl}/rest/v1/vendor_domains?domain=eq.${domain}&verified=eq.true&is_active=eq.true&select=vendor_id,vendor:vendors(slug)`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to lookup domain:', domain);
      return NextResponse.next();
    }
    
    const domains = await response.json();
    
    if (domains && domains.length > 0 && domains[0].vendor) {
      const vendorSlug = domains[0].vendor.slug;
      
      console.log(`✅ Custom domain ${domain} → vendor ${vendorSlug}`);
      
      // Rewrite to vendor storefront
      const url = request.nextUrl.clone();
      url.pathname = `/vendors/${vendorSlug}${pathname === '/' ? '' : pathname}`;
      
      return NextResponse.rewrite(url);
    }
    
    // Domain not found or not verified
    console.log(`⚠️ Custom domain ${domain} not found or not verified`);
    return NextResponse.next();
    
  } catch (error) {
    console.error('❌ Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

