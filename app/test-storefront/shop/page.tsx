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

  // Fetch ALL pricing tiers at once (much faster)
  const { data: allPricingConfigs } = await supabase
    .from('vendor_pricing_configs')
    .select(`
      id,
      product_id,
      pricing_values,
      display_unit,
      blueprint:pricing_tier_blueprints (
        id,
        name,
        slug,
        price_breaks
      )
    `)
    .in('product_id', productIds)
    .eq('is_active', true);

  const pricingMap: { [key: string]: any[] } = {};
  (allPricingConfigs || []).forEach((pricingConfig: any) => {
    if (pricingConfig.blueprint?.price_breaks) {
      const tiers: any[] = [];
      const pricingValues = pricingConfig.pricing_values || {};
      
      pricingConfig.blueprint.price_breaks.forEach((tier: any) => {
        const breakId = tier.break_id;
        const tierData = pricingValues[breakId];
        
        if (tierData && tierData.enabled && tierData.price) {
          tiers.push({
            weight: tier.label || breakId,
            label: tier.label,
            qty: tier.qty || 1,
            price: parseFloat(tierData.price),
            tier_name: tier.label || breakId,
            break_id: breakId,
            blueprint_name: pricingConfig.blueprint.name,
            sort_order: tier.sort_order || 0
          });
        }
      });
      
      tiers.sort((a, b) => a.sort_order - b.sort_order);
      pricingMap[pricingConfig.product_id] = tiers;
    }
  });

  console.log('📊 Pricing configs loaded:', (allPricingConfigs || []).length);
  console.log('📦 Products with pricing:', Object.keys(pricingMap).length);

  // Create product fields map
  const productFieldsMap: { [key: string]: any } = {};
  (allProducts || []).forEach((p: any) => {
    const blueprintFields = p.blueprint_fields || {};
    productFieldsMap[p.id] = { 
      fields: blueprintFields,
      pricingTiers: pricingMap[p.id] || []
    };
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
