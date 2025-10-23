import { getVendorFromHeaders, getVendorProducts, getVendorLocations } from '@/lib/storefront/get-vendor';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { notFound } from 'next/navigation';

export default async function StorefrontShopPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  // Fetch products with pricing tiers and inventory (unified data structure)
  const [products, locations] = await Promise.all([
    getVendorProducts(vendorId),
    getVendorLocations()
  ]);

  // Products now come pre-formatted from getVendorProducts with:
  // - fields (from blueprint_fields)
  // - pricingTiers (from vendor_pricing_configs)
  // - inventory (with location data)
  // - proper stock calculation

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

