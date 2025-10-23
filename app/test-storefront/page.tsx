import { getServiceSupabase } from '@/lib/supabase/client';
import { getVendorProducts, getVendorLocations } from '@/lib/storefront/get-vendor';
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

  // Use unified data fetching (includes pricing tiers, inventory, fields)
  const [allProducts, locations] = await Promise.all([
    getVendorProducts(vendor.id, 12), // Limit to 12 featured products
    getVendorLocations()
  ]);

  // Products come pre-formatted with fields, pricingTiers, inventory
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

  // Build inventory map and product fields map for StorefrontHomeClient
  const inventoryMap: { [key: string]: any[] } = {};
  const productFieldsMap: { [key: string]: any } = {};
  
  products.forEach((p: any) => {
    inventoryMap[p.id] = p.inventory;
    productFieldsMap[p.id] = { fields: p.fields };
  });

  return (
    <StorefrontHomeClient 
      vendor={vendor}
      products={products}
      inventoryMap={inventoryMap}
      productFieldsMap={productFieldsMap}
      locations={locations}
    />
  );
}

