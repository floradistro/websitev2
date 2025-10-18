import { getCategories } from "@/lib/wordpress";
import { getCachedBulkProducts, getCachedLocations } from "@/lib/api-cache";
import ProductsClient from "@/components/ProductsClient";
import type { Metadata } from "next";

// Enable ISR - Revalidate every 3 minutes for instant updates
export const revalidate = 180;

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
  
  // OPTIMIZED: Use BULK endpoint - returns products with inventory & fields in ONE call!
  const [categories, locations, bulkData] = await Promise.all([
    getCategories({ per_page: 100 }),
    getCachedLocations(),
    getCachedBulkProducts({ per_page: 1000 }), // Bulk endpoint is FAST
  ]);

  // Extract products from bulk response - inventory already included!
  const bulkProducts = bulkData?.data || [];
  
  // Map bulk products to WooCommerce format
  const allProducts = bulkProducts.map((bp: any) => ({
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
      id: parseInt(cat.id), // Convert string to number for consistency
      name: cat.name,
      slug: cat.slug
    })),
    meta_data: bp.meta_data || [],
    blueprint_fields: bp.blueprint_fields || [],
    stock_status: bp.total_stock > 0 ? 'instock' : 'outofstock',
    total_stock: bp.total_stock,
    inventory: bp.inventory || [],
  }));

  // Helper function to check if product has stock at ANY location
  const hasStockAnywhere = (product: any): boolean => {
    return product.total_stock > 0 || (product.inventory && product.inventory.some((inv: any) => {
      const qty = parseFloat(inv.stock || inv.quantity || 0);
      return qty > 0;
    }));
  };

  // Filter products to only show those with stock at any location
  const inStockProducts = allProducts.filter((product: any) => hasStockAnywhere(product));

  // Create inventory map from products (inventory is already in each product)
  const inventoryMap: { [key: number]: any[] } = {};
  allProducts.forEach((product: any) => {
    inventoryMap[product.id] = product.inventory || [];
  });

  // Extract fields from product metadata (already included in bulk response)
  const productFieldsMap: { [key: number]: any } = {};
  
  bulkProducts.forEach((product: any) => {
    const blueprintFields = product.blueprint_fields || [];
    
    // Filter and sort fields to ensure consistent order
    const sortedFields = blueprintFields
      .filter((field: any) => 
        // Skip blueprint-type fields (metadata, not display fields)
        field.field_type !== 'blueprint' && !field.field_name.includes('blueprint')
      )
      .sort((a: any, b: any) => {
        // Sort by field name for consistent ordering
        return a.field_name.localeCompare(b.field_name);
      });
    
    // Convert to object with consistent key order
    const fields: { [key: string]: string } = {};
    sortedFields.forEach((field: any) => {
      fields[field.field_name] = field.field_value || '';
    });
    
    // Extract pricing tiers from bulk response
    const pricingTiers = product.pricing_tiers || product.quantity_tiers || [];
    
    productFieldsMap[product.id] = { fields, pricingTiers };
  });

  return (
    <ProductsClient 
      categories={categories}
      locations={locations}
      initialProducts={inStockProducts}
      inventoryMap={inventoryMap}
      initialCategory={categorySlug}
      productFieldsMap={productFieldsMap}
    />
  );
}
