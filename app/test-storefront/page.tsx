import { getServiceSupabase } from '@/lib/supabase/client';
import { StorefrontHomeClient } from '@/components/storefront/StorefrontHomeClient';
import { notFound } from 'next/navigation';

// Disable main layout for this route
export const dynamic = 'force-dynamic';

export default async function TestStorefrontPage() {
  const supabase = getServiceSupabase();
  
  // Get Flora Distro vendor
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select(`
      id,
      store_name,
      slug,
      logo_url,
      banner_url,
      store_description,
      store_tagline,
      brand_colors,
      custom_font,
      custom_css,
      social_links,
      business_hours,
      return_policy,
      shipping_policy
    `)
    .eq('slug', 'flora-distro')
    .single();

  if (error || !vendor) {
    notFound();
  }

  // Get Flora Distro products
  const { data: allProducts } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const products = (allProducts || []).map((p: any) => {
    const imageUrl = p.images && p.images.length > 0 ? p.images[0] : (p.featured_image_storage || null);
    
    return {
      id: p.id,
      uuid: p.id,
      name: p.name,
      slug: p.slug || p.id,
      type: p.type || 'simple',
      status: p.status,
      price: p.retail_price || 0,
      regular_price: p.retail_price || 0,
      sale_price: p.sale_price,
      images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
      categories: p.category ? [{ name: p.category }] : [],
      meta_data: {},
      blueprint_fields: [],
      stock_status: 'in_stock',
      stock_quantity: 100,
      total_stock: 100,
      inventory: [],
    };
  });

  return (
    <StorefrontHomeClient 
      vendor={vendor}
      products={products}
      inventoryMap={{}}
      productFieldsMap={{}}
    />
  );
}

