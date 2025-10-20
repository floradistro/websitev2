import { getCategories, getLocations, getAllVendors } from "@/lib/wordpress";
import { getCachedBulkProducts } from "@/lib/api-cache";
import ProductsClient from "@/components/ProductsClient";
import type { Metadata } from "next";
import { Suspense } from "react";

// Aggressive ISR - Revalidate every 5 minutes for better performance
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop All Products | Flora Distro",
  description: "Browse our full selection of premium cannabis products. Shop flower, concentrates, edibles, vapes, and beverages. 120+ products with volume pricing and fast shipping.",
  openGraph: {
    title: "Shop All Products | Flora Distro",
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
  
  // Fetch data in parallel - use cached version of bulk products
  const [categories, locations, bulkData, allVendors] = await Promise.all([
    Promise.race([getCategories({ per_page: 100 }), timeout(5000)]).catch(() => []),
    Promise.race([getLocations(), timeout(5000)]).catch(() => []),
    Promise.race([getCachedBulkProducts({ per_page: 200 }), timeout(10000)]).catch(() => ({ data: [] })),
    Promise.race([getAllVendors(), timeout(5000)]).catch(() => []),
  ]);

  // Extract products from bulk response - inventory already included!
  const bulkProducts = bulkData?.data || [];
  
  // OPTIMIZED: Map bulk products with minimal processing
  const allProducts = bulkProducts.map((bp: any) => {
    const hasStock = bp.total_stock > 0;
    return {
      id: parseInt(bp.id),
      name: bp.name,
      slug: bp.name?.toLowerCase().replace(/\s+/g, '-'),
      type: bp.type,
      status: bp.status,
      price: bp.regular_price,
      regular_price: bp.regular_price,
      sale_price: bp.sale_price,
      images: bp.image ? [{ src: bp.image, id: 0, name: bp.name }] : [],
      categories: (bp.categories || []).map((cat: any) => ({
        id: parseInt(cat.id),
        name: cat.name,
        slug: cat.slug
      })),
      meta_data: bp.meta_data || [],
      blueprint_fields: bp.blueprint_fields || [],
      stock_status: hasStock ? 'instock' : 'outofstock',
      total_stock: bp.total_stock,
      inventory: bp.inventory || [],
    };
  });

  // OPTIMIZED: Filter using pre-computed stock status
  const inStockProducts = allProducts.filter((product: any) => product.total_stock > 0);

  // OPTIMIZED: Process fields, pricing, and inventory in a single pass
  const productFieldsMap: { [key: number]: any } = {};
  const inventoryMap: { [key: number]: any[] } = {};
  
  bulkProducts.forEach((product: any) => {
    const productId = parseInt(product.id);
    
    // Extract pricing tiers from meta_data
    const metaData = product.meta_data || [];
    const pricingTiersMeta = metaData.find((m: any) => m.key === '_product_price_tiers');
    const pricingTiers = pricingTiersMeta?.value || [];
    
    // Process blueprint fields efficiently
    const blueprintFields = product.blueprint_fields || [];
    const fields: { [key: string]: string } = {};
    
    blueprintFields.forEach((field: any) => {
      if (field.field_type !== 'blueprint' && !field.field_name.includes('blueprint')) {
        fields[field.field_name] = field.field_value || '';
      }
    });
    
    productFieldsMap[productId] = { fields, pricingTiers };
    inventoryMap[productId] = product.inventory || [];
  });

  // Separate vendor products from Flora products
  const vendorProductsList = inStockProducts.filter((p: any) => {
    const productId = parseInt(p.id);
    // Vendor products typically have IDs >= 41790
    return productId >= 41790;
  });
  
  const floraProducts = inStockProducts.filter((p: any) => {
    const productId = parseInt(p.id);
    return productId < 41790;
  });
  
  // Map vendors from API to correct format
  const vendorsList = Array.isArray(allVendors) ? allVendors.map((v: any) => ({
    id: v.id,
    name: v.store_name,
    slug: v.slug,
    logo: v.logo_url || '/logoprint.png'
  })) : [];

  return (
    <ProductsClient 
      categories={categories}
      locations={locations}
      initialProducts={floraProducts}
      inventoryMap={inventoryMap}
      initialCategory={categorySlug}
      productFieldsMap={productFieldsMap}
      vendorProducts={vendorProductsList}
      vendors={vendorsList}
    />
  );
}
