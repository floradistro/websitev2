import { headers } from 'next/headers';
import Link from 'next/link';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { StorefrontShopClient } from '@/components/storefront/StorefrontShopClient';
import { UniversalPageRenderer } from '@/components/storefront/UniversalPageRenderer';
import { getServiceSupabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';

export default async function StorefrontShopPage({ searchParams }: { searchParams: Promise<{ vendor?: string; preview?: string }> }) {
  // Check if template preview mode (no vendor)
  const headersList = await headers();
  const tenantType = headersList.get('x-tenant-type');
  
  // If blank template preview, show vendor list
  if (tenantType === 'template-preview') {
    // Fetch all active vendors
    const supabase = getServiceSupabase();
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, store_name, slug, logo_url, store_tagline')
      .eq('status', 'active')
      .order('store_name', { ascending: true });
    
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* UHD Gradient Background - iOS 26 */}
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_100%)]" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-0 sm:px-6 lg:px-10 py-16">
          <div className="text-center mb-16 px-6 sm:px-0">
            <h1 className="text-5xl md:text-6xl font-light text-white mb-4 tracking-[-0.03em]">Shop Template Preview</h1>
            <p className="text-xl text-neutral-400 font-light">Select a vendor to preview their shop</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors?.map((vendor) => (
              <Link
                key={vendor.slug}
                href={`/storefront/shop?vendor=${vendor.slug}`}
                className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 p-8 rounded-[32px] transition-all hover:shadow-2xl hover:shadow-white/5 hover:-translate-y-1 hover:bg-white/[0.08] group"
              >
                <div className="flex items-center gap-4 mb-4">
                  {vendor.logo_url && (
                    <img 
                      src={vendor.logo_url} 
                      alt={vendor.store_name} 
                      className="w-14 h-14 object-contain rounded-[20px]"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-neutral-200 tracking-tight">
                      {vendor.store_name}
                    </h3>
                    {vendor.store_tagline && (
                      <p className="text-sm text-neutral-400 font-light">{vendor.store_tagline}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-neutral-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                  View shop
                  <span className="text-white">→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  // Load shop configuration from database
  const { getVendorPageSections } = await import('@/lib/storefront/content-api');
  const shopSections = await getVendorPageSections(vendorId, 'shop');
  
  const shopConfigSection = shopSections.find(s => s.section_key === 'shop_config');

  // Check if in preview mode (live editor) - show sections + products
  const params = await searchParams;
  if (params.preview === 'true') {
    // Filter to visible sections only
    const visibleShopSections = shopSections.filter(s => 
      s.section_key !== 'shop_config' && s.is_enabled !== false
    );
    
    return (
      <>
        {/* Only render sections container if there are visible sections */}
        {visibleShopSections.length > 0 && (
          <div className="-mt-[44px]">
            <UniversalPageRenderer vendor={vendor} pageType="shop" />
          </div>
        )}
        
        {/* Shop products with editable config - starts right after header if no sections */}
        <StorefrontShopClient 
          key={JSON.stringify(shopConfigSection?.content_data)}
          vendorId={vendorId}
          config={shopConfigSection?.content_data}
        />
      </>
    );
  }

  // Use vendor's template_id for styling
  const templateId = vendor.template_id || 'default';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* UHD Gradient Background - iOS 26 (only for minimalist template) */}
      {templateId === 'minimalist' && (
        <>
          <div className="fixed inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_100%)]" />
          </div>
          
          {/* Scattered Color Orbs - Maximum Spacing */}
          <div className="fixed inset-0 pointer-events-none">
            {/* Red orbs */}
            <div className="absolute top-[3%] left-[2%] w-[80px] h-[80px] md:w-[280px] md:h-[280px] bg-red-500/[0.20] rounded-full blur-[25px] md:blur-[45px] animate-pulse" style={{ animationDuration: '9s' }} />
            <div className="absolute bottom-[3%] right-[2%] w-[75px] h-[75px] md:w-[260px] md:h-[260px] bg-red-500/[0.18] rounded-full blur-[24px] md:blur-[42px] animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
            
            {/* Blue orbs */}
            <div className="absolute top-[5%] right-[2%] w-[78px] h-[78px] md:w-[270px] md:h-[270px] bg-blue-500/[0.19] rounded-full blur-[25px] md:blur-[44px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
            <div className="absolute bottom-[5%] left-[2%] w-[72px] h-[72px] md:w-[250px] md:h-[250px] bg-blue-500/[0.17] rounded-full blur-[24px] md:blur-[43px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '5s' }} />
            
            {/* Yellow orbs */}
            <div className="absolute top-[35%] right-[75%] w-[85px] h-[85px] md:w-[290px] md:h-[290px] bg-yellow-500/[0.10] rounded-full blur-[26px] md:blur-[46px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
            <div className="absolute bottom-[35%] right-[15%] w-[76px] h-[76px] md:w-[265px] md:h-[265px] bg-yellow-500/[0.08] rounded-full blur-[25px] md:blur-[44px] animate-pulse" style={{ animationDuration: '13s', animationDelay: '4s' }} />
          </div>
        </>
      )}

      <StorefrontShopClient 
        vendorId={vendorId}
        config={shopConfigSection?.content_data}
      />
    </div>
  );
}

