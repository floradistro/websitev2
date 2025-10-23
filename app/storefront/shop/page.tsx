import { getVendorFromHeaders, getVendorProducts } from '@/lib/storefront/get-vendor';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { notFound } from 'next/navigation';

export default async function StorefrontShopPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const products = await getVendorProducts(vendorId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Shop All Products</h1>
        <p className="text-gray-600 text-lg">
          Browse our complete collection of premium cannabis products
        </p>
      </div>

      {/* TODO: Add filters and search */}
      
      <ProductGrid products={products} />
    </div>
  );
}

