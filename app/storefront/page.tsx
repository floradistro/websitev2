import { getVendorFromHeaders, getVendorStorefront, getVendorProducts } from '@/lib/storefront/get-vendor';
import { StorefrontHero } from '@/components/storefront/StorefrontHero';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { notFound } from 'next/navigation';

export default async function StorefrontHomePage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);
  const products = await getVendorProducts(vendorId, 12);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="storefront-home">
      {/* Hero Section */}
      <StorefrontHero vendor={vendor} />

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {vendor.store_description || `Discover our curated selection of premium cannabis products`}
          </p>
        </div>

        <ProductGrid products={products} />

        {products.length > 0 && (
          <div className="text-center mt-12">
            <a 
              href="/shop" 
              className="btn-primary inline-block"
            >
              View All Products
            </a>
          </div>
        )}
      </section>

      {/* About Section */}
      {vendor.store_description && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">About {vendor.store_name}</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              {vendor.store_description}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

