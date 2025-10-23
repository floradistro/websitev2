import { getServiceSupabase } from '@/lib/supabase/client';
import { getVendorProducts, getVendorLocations } from '@/lib/storefront/get-vendor';
import { ProductGrid } from '@/components/storefront/ProductGrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TestShopPage() {
  const supabase = getServiceSupabase();
  
  // Get Flora Distro vendor ID
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('slug', 'flora-distro')
    .single();

  if (!vendor) {
    return <div>Vendor not found</div>;
  }

  // Use unified data fetching (includes pricing tiers, inventory, fields)
  const [products, locations] = await Promise.all([
    getVendorProducts(vendor.id),
    getVendorLocations()
  ]);

  // Products come pre-formatted from getVendorProducts with all data
  
  return (
    <div className="bg-[#2a2a2a] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 uppercase tracking-wider">Shop All Products</h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-purple-500/60 to-transparent mb-6"></div>
          <p className="text-white/60 text-lg font-light">
            Browse our complete collection of premium cannabis products
          </p>
        </div>

        <ProductGrid products={products} locations={locations} />
      </div>
    </div>
  );
}
