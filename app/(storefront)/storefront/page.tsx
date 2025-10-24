import { headers } from 'next/headers';
import Link from 'next/link';
import { getVendorFromHeaders, getVendorStorefront, getVendorProducts, getVendorLocations, getVendorReviews } from '@/lib/storefront/get-vendor';
import { LiveEditingProvider } from '@/components/storefront/LiveEditingProvider';
import { StorefrontHomeWithLiveEdit } from '@/components/storefront/StorefrontHomeWithLiveEdit';
import { UniversalPageRenderer } from '@/components/storefront/UniversalPageRenderer';
import { getServiceSupabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import { getVendorSectionsWithInit } from '@/lib/storefront/init-vendor-content';

export default async function StorefrontHomePage({ searchParams }: { searchParams: Promise<{ vendor?: string; preview?: string }> }) {
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
                      <p className="text-sm text-neutral-400 font-light">{vendor.store_tagline}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-neutral-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                  Click to preview
                  <span className="text-white">→</span>
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-neutral-600 font-medium tracking-wide">
              Using same components as Yacht Club marketplace
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const [vendor, allProducts, locations, reviews] = await Promise.all([
    getVendorStorefront(vendorId),
    getVendorProducts(vendorId, 12), // Limit to 12 featured products for home page
    getVendorLocations(vendorId),
    getVendorReviews(vendorId, 6) // Fetch 6 recent reviews
  ]);

  if (!vendor) {
    notFound();
  }

  // Auto-initialize default content if vendor has none (Shopify-style)
  const homeSections = await getVendorSectionsWithInit(vendorId, vendor.store_name, 'home');

  // Products now come pre-formatted from getVendorProducts with:
  // - fields (from blueprint_fields)
  // - pricingTiers (from vendor_pricing_configs)
  // - inventory (with location data)
  // - proper stock calculation
  
  // Map to format expected by StorefrontHomeClient
  const products = allProducts.map((p: any) => {
    const imageUrl = p.featured_image_storage || (p.image_gallery_storage && p.image_gallery_storage[0]);
    
    return {
      id: p.id,
      uuid: p.id,
      name: p.name,
      slug: p.slug || p.id,
      price: p.price || 0,
      regular_price: p.regular_price || 0,
      sale_price: p.sale_price,
      images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
      categories: p.categories || [],
      stock_status: p.stock_status,
      stock_quantity: p.stock_quantity,
      total_stock: p.total_stock,
      inventory: p.inventory || [],
      fields: p.fields || {},
      pricingTiers: p.pricingTiers || [],
    };
  });

  // Build inventory map and product fields map
  const inventoryMap: { [key: string]: any[] } = {};
  const productFieldsMap: { [key: string]: any } = {};
  
  products.forEach((p: any) => {
    inventoryMap[p.id] = p.inventory;
    productFieldsMap[p.id] = { fields: p.fields };
  });

  // Check if in preview mode (live editor)
  const params = await searchParams;
  if (params.preview === 'true') {
    return (
      <LiveEditingProvider initialSections={homeSections} isPreviewMode={true}>
        <UniversalPageRenderer
          vendor={vendor}
          pageType="home"
          products={products}
          inventoryMap={inventoryMap}
          productFieldsMap={productFieldsMap}
          locations={locations}
          reviews={reviews}
        />
      </LiveEditingProvider>
    );
  }

  // Normal mode - if vendor has sections, use UniversalPageRenderer (content-driven)
  // If no sections (shouldn't happen now with auto-init), fallback to old component
  if (homeSections && homeSections.length > 0) {
    return (
      <LiveEditingProvider initialSections={homeSections} isPreviewMode={false}>
        <UniversalPageRenderer
          vendor={vendor}
          pageType="home"
          products={products}
          inventoryMap={inventoryMap}
          productFieldsMap={productFieldsMap}
          locations={locations}
          reviews={reviews}
        />
      </LiveEditingProvider>
    );
  }

  // Fallback to old hardcoded component (should rarely happen now)
  return (
    <LiveEditingProvider initialSections={[]} isPreviewMode={false}>
      <StorefrontHomeWithLiveEdit 
        vendor={vendor}
        products={products}
        inventoryMap={inventoryMap}
        productFieldsMap={productFieldsMap}
        locations={locations}
        reviews={reviews}
      />
    </LiveEditingProvider>
  );
}

