import { getServiceSupabase } from '@/lib/supabase/client';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { notFound } from 'next/navigation';

export default async function TestShopPage() {
  const supabase = getServiceSupabase();
  
  // Get Flora Distro vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, store_name')
    .eq('slug', 'flora-distro')
    .single();

  if (!vendor) {
    notFound();
  }

  // Get all Flora Distro products
  const { data: allProducts } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const products = (allProducts || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    images: p.images || (p.featured_image_storage ? [p.featured_image_storage] : []),
    retail_price: p.retail_price || 0,
    category: p.category || 'Product',
    status: p.status,
    slug: p.slug || p.id,
  }));

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

