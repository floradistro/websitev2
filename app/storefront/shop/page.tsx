import { getVendorFromHeaders, getVendorProducts } from '@/lib/storefront/get-vendor';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { notFound } from 'next/navigation';

export default async function StorefrontShopPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const allProducts = await getVendorProducts(vendorId);

  const products = allProducts.map((p: any) => {
    const imageUrl = p.images && p.images.length > 0 ? p.images[0] : (p.featured_image_storage || null);
    
    return {
      id: p.id,
      uuid: p.id,
      name: p.name,
      description: p.description,
      images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
      price: p.retail_price || 0,
      retail_price: p.retail_price || 0,
      category: p.category || 'Product',
      status: p.status,
      slug: p.slug || p.id,
      meta_data: p.meta_data || {},
      blueprint_fields: Array.isArray(p.blueprint_fields) ? p.blueprint_fields : [],
      stock_status: p.stock_status || 'in_stock',
      stock_quantity: p.stock_quantity || 0,
      total_stock: p.stock_quantity || 0,
      type: 'simple',
    };
  });

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

        <ProductGrid products={products} />
      </div>
    </div>
  );
}

