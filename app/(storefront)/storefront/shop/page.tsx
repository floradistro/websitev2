import { headers } from 'next/headers';
import Link from 'next/link';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { getServiceSupabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import { getVendorSectionsWithInit } from '@/lib/storefront/init-vendor-content';
import { ComponentBasedPageRenderer } from '@/components/storefront/ComponentBasedPageRenderer';

export default async function StorefrontShopPage({ searchParams }: { searchParams: Promise<{ vendor?: string; preview?: string }> }) {
  // Check if template preview mode (no vendor)
  const headersList = await headers();
  const tenantType = headersList.get('x-tenant-type');
  
  // If blank template preview, show vendor list
  if (tenantType === 'template-preview') {
    const supabase = getServiceSupabase();
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, store_name, slug, logo_url, store_tagline')
      .eq('status', 'active')
      .order('store_name', { ascending: true });
    
    return (
      <div className="min-h-screen relative overflow-hidden">
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
  
  // Regular shop page with Component Registry
  const params = await searchParams;
  const isPreview = params.preview === 'true';
  
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  // Get sections for shop page
  const sections = await getVendorSectionsWithInit(vendor.id, vendor.store_name || vendor.slug, 'shop');
  const supabase = getServiceSupabase();
  const sectionIds = sections.map((s: any) => s.id);
  
  // Get component instances
  const { data: componentInstances } = await supabase
    .from('vendor_component_instances')
    .select('*')
    .eq('vendor_id', vendor.id)
    .in('section_id', sectionIds)
    .order('position_order');

  // Component Registry rendering
  return (
    <ComponentBasedPageRenderer
      vendor={vendor}
      pageType="shop"
      sections={sections}
      componentInstances={componentInstances || []}
      isPreview={isPreview}
    />
  );
}
