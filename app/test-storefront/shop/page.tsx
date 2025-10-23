import { getServiceSupabase } from '@/lib/supabase/client';
import { StorefrontShopClient } from '@/components/storefront/StorefrontShopClient';
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

  // Get all Flora Distro products with full data
  const { data: allProducts } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false});

  // Get all locations for this vendor
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('is_active', true);

  // Get all inventory for these products
  const productIds = (allProducts || []).map((p: any) => p.id);
  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .in('product_id', productIds);

  // Create inventory map
  const inventoryMap: { [key: string]: any[] } = {};
  (inventory || []).forEach((inv: any) => {
    if (!inventoryMap[inv.product_id]) {
      inventoryMap[inv.product_id] = [];
    }
    inventoryMap[inv.product_id].push(inv);
  });

  // Fetch pricing tiers using the existing pricing API (handles vendor-level pricing)
  const pricingMap: { [key: string]: any[] } = {};
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Batch fetch pricing in chunks of 20 to avoid timeout
  const chunkSize = 20;
  for (let i = 0; i < productIds.length; i += chunkSize) {
    const chunk = productIds.slice(i, i + chunkSize);
    
    await Promise.all(
      chunk.map(async (productId) => {
        try {
          const response = await fetch(`${baseUrl}/api/supabase/products/${productId}/pricing`, {
            next: { revalidate: 300 } // Cache for 5 minutes
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.pricingTiers && data.pricingTiers.length > 0) {
              pricingMap[productId] = data.pricingTiers;
            }
          }
        } catch (error) {
          // Silently fail for products without pricing
        }
      })
    );
  }

  console.log('📦 Products with pricing:', Object.keys(pricingMap).length, '/', productIds.length);
  
  // Log sample pricing to verify
  const firstProductWithPricing = Object.keys(pricingMap)[0];
  if (firstProductWithPricing) {
    console.log('Sample pricing for', firstProductWithPricing, ':', pricingMap[firstProductWithPricing]);
  }

  // Create product fields map
  const productFieldsMap: { [key: string]: any } = {};
  (allProducts || []).forEach((p: any) => {
    const blueprintFields = p.blueprint_fields || {};
    const pricing = pricingMap[p.id] || [];
    productFieldsMap[p.id] = { 
      fields: blueprintFields,
      pricingTiers: pricing
    };
    
    // Log products that have pricing
    if (pricing.length > 0) {
      console.log('✅ Product with pricing:', p.name, '- tiers:', pricing.length);
    }
  });

  const products = (allProducts || []).map((p: any) => {
    const imageUrl = p.images && p.images.length > 0 ? p.images[0] : (p.featured_image_storage || null);
    
    return {
      id: p.id,
      uuid: p.id,
      name: p.name,
      description: p.description,
      images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
      price: p.retail_price || 0,
      regular_price: p.retail_price || 0,
      sale_price: p.sale_price,
      categories: p.category ? [{ name: p.category }] : [],
      meta_data: p.meta_data || {},
      blueprint_fields: Array.isArray(p.blueprint_fields) ? p.blueprint_fields : [],
      stock_status: p.stock_status || 'in_stock',
      stock_quantity: p.stock_quantity || 0,
      total_stock: p.stock_quantity || 0,
      type: 'simple',
      slug: p.slug || p.id,
      date_created: p.created_at,
      total_sales: 0,
    };
  });

  return (
    <StorefrontShopClient 
      products={products}
      locations={locations || []}
      inventoryMap={inventoryMap}
      productFieldsMap={productFieldsMap}
    />
  );
}
