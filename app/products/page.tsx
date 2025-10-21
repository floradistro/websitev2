import { getCategories, getLocations, getProducts, getVendors } from "@/lib/supabase-api";
import ProductsClient from "@/components/ProductsClient";
import type { Metadata } from "next";
import { Suspense } from "react";

// CRITICAL: Use dynamic rendering for instant vendor suspension
export const dynamic = 'force-dynamic';
export const revalidate = 0; // No caching - always fresh data

export const metadata: Metadata = {
  title: "Shop All Products | Yacht Club",
  description: "Browse our full selection of premium cannabis products. Shop flower, concentrates, edibles, vapes, and beverages. 120+ products with volume pricing and fast shipping.",
  openGraph: {
    title: "Shop All Products | Yacht Club",
    description: "120+ premium cannabis products. Volume pricing, fast shipping, always fresh.",
    type: "website",
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categorySlug } = await searchParams;
  
  // OPTIMIZED: Use BULK endpoint with parallel fetching
  const timeout = (ms: number) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error('API Timeout')), ms)
  );
  
  // Fetch data in parallel from Supabase
  const [categories, locations, productsData, allVendors] = await Promise.all([
    Promise.race([getCategories(), timeout(5000)]).catch(() => []),
    Promise.race([getLocations(), timeout(5000)]).catch(() => []),
    Promise.race([getProducts({ per_page: 200 }), timeout(10000)]).catch(() => ({ products: [] })),
    Promise.race([getVendors(), timeout(5000)]).catch(() => []),
  ]);

  // Extract products from Supabase response
  const bulkProducts = productsData?.products || [];
  
  // Map Supabase products - ONLY Supabase Storage images
  const allProducts = bulkProducts.map((p: any) => {
    // ONLY use Supabase Storage (WordPress URLs removed!)
    const imageUrl = p.featured_image_storage || 
                     (p.image_gallery_storage && p.image_gallery_storage[0]);
    
    return {
      id: p.wordpress_id || p.id,
      uuid: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      status: p.status,
      price: p.price,
      regular_price: p.regular_price,
      sale_price: p.sale_price,
      images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
      categories: p.product_categories?.map((pc: any) => pc.category) || [],
      meta_data: p.meta_data || {},
      blueprint_fields: p.blueprint_fields || [],
      stock_status: p.stock_status || 'instock',
      total_stock: p.stock_quantity || 0,
      inventory: [],
    };
  });

  console.log('🔵 Total products from API:', bulkProducts.length);
  console.log('🔵 Products with stock_quantity:', bulkProducts.filter((p: any) => p.stock_quantity > 0).length);
  console.log('🔵 Vendor products raw:', bulkProducts.filter((p: any) => p.vendor_id).map((p: any) => ({
    name: p.name,
    vendor_id: p.vendor_id,
    stock_quantity: p.stock_quantity
  })));

  // OPTIMIZED: Filter using pre-computed stock status
  const inStockProducts = allProducts.filter((product: any) => product.total_stock > 0);
  
  console.log('✅ In-stock products:', inStockProducts.length);

  // OPTIMIZED: Process fields, pricing, and inventory in a single pass
  const productFieldsMap: { [key: number]: any } = {};
  const inventoryMap: { [key: number]: any[] } = {};
  
  bulkProducts.forEach((product: any) => {
    const productId = product.wordpress_id || product.id;
    
    // Extract pricing tiers from meta_data (JSONB object in Supabase)
    const metaData = product.meta_data || {};
    const pricingTiers = metaData.pricing_tiers || metaData._product_price_tiers || [];
    
    // Process blueprint fields efficiently (JSONB array in Supabase)
    const blueprintFields = product.blueprint_fields || [];
    const fields: { [key: string]: string } = {};
    
    blueprintFields.forEach((field: any) => {
      if (field && field.field_name && field.field_type !== 'blueprint' && !field.field_name.includes('blueprint')) {
        fields[field.field_name] = field.field_value || '';
      }
    });
    
    productFieldsMap[productId] = { fields, pricingTiers };
    inventoryMap[productId] = product.inventory || [];
  });

  // Separate vendor products from house products by vendor_id and add vendor slug
  const vendorProductsList = inStockProducts.filter((p: any) => {
    const fullProduct = bulkProducts.find((bp: any) => (bp.wordpress_id || bp.id) === p.id);
    return fullProduct?.vendor_id !== null && fullProduct?.vendor_id !== undefined;
  }).map((p: any) => {
    const fullProduct = bulkProducts.find((bp: any) => (bp.wordpress_id || bp.id) === p.id);
    const vendor = allVendors?.find((v: any) => v.id === fullProduct?.vendor_id);
    
    console.log(`Mapping vendor product ${p.name}:`, {
      productId: p.id,
      fullProductVendorId: fullProduct?.vendor_id,
      foundVendor: vendor?.store_name,
      vendorSlug: vendor?.slug
    });
    
    return {
      ...p,
      vendorId: fullProduct?.vendor_id,
      vendorSlug: vendor?.slug || ''
    };
  });
  
  const houseProducts = inStockProducts.filter((p: any) => {
    const fullProduct = bulkProducts.find((bp: any) => (bp.wordpress_id || bp.id) === p.id);
    return !fullProduct?.vendor_id;
  });
  
  console.log('✅ House products:', houseProducts.length);
  console.log('✅ Vendor products:', vendorProductsList.length);
  console.log('🔵 Vendor products with slugs:', vendorProductsList.map(p => ({ 
    name: p.name, 
    vendorSlug: p.vendorSlug,
    vendorId: p.vendorId,
    stock: p.total_stock 
  })));
  
  // Map vendors from API to correct format and filter out suspended vendors
  const vendorsList = Array.isArray(allVendors) 
    ? allVendors
        .filter((v: any) => v.status === 'active') // Only active vendors
        .map((v: any) => ({
          id: v.id,
          name: v.store_name,
          slug: v.slug,
          logo: v.logo_url || '/yacht-club-logo.png'
        })) 
    : [];
  
  console.log('✅ Active vendors for filter:', vendorsList.length);

  return (
    <ProductsClient 
      categories={categories}
      locations={locations}
      initialProducts={houseProducts}
      inventoryMap={inventoryMap}
      initialCategory={categorySlug}
      productFieldsMap={productFieldsMap}
      vendorProducts={vendorProductsList}
      vendors={vendorsList}
    />
  );
}
