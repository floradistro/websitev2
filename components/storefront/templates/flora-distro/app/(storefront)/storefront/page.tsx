import { headers } from 'next/headers';
import Link from 'next/link';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { getServiceSupabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import { getVendorSectionsWithInit } from '@/lib/storefront/init-vendor-content';
import { ComponentBasedPageRenderer } from '@/components/storefront/templates/flora-distro/components/storefront/ComponentBasedPageRenderer';

export const dynamic = 'force-dynamic';

export default async function StorefrontHomePage({ searchParams }: { searchParams: Promise<{ vendor?: string; preview?: string; editor?: string }> }) {
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
      <div className="bg-black min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-light text-white mb-4 tracking-[-0.03em]">Vendor Storefront Template</h1>
            <p className="text-xl text-neutral-400 font-light">Select a vendor to preview their storefront</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors?.map((vendor) => (
              <Link
                key={vendor.slug}
                href={`/storefront?vendor=${vendor.slug}`}
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
                      <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">
                        {vendor.store_tagline}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Regular vendor storefront
  const params = await searchParams;
  const isPreview = params.preview === 'true' || params.editor === 'true';
  
  const vendorId = await getVendorFromHeaders();
  
  if (!vendorId) {
    notFound();
  }

  // Get vendor data
  const vendor = await getVendorStorefront(vendorId);
  
  if (!vendor) {
    notFound();
  }

  // Get sections
  const sections = await getVendorSectionsWithInit(vendor.id, vendor.store_name || vendor.slug, 'home');
  const supabase = getServiceSupabase();
  const sectionIds = sections.map((s: any) => s.id);
  
  // Get component instances from database
  const { data: dbComponentInstances } = await supabase
    .from('vendor_component_instances')
    .select('*')
    .eq('vendor_id', vendor.id)
    .in('section_id', sectionIds)
    .order('position_order');

  // Use database instances
  const componentInstances = dbComponentInstances || [];

  // Component Registry rendering
  return (
    <ComponentBasedPageRenderer
      vendor={vendor}
      pageType="home"
      sections={sections}
      componentInstances={componentInstances}
      isPreview={isPreview}
    />
  );
}
