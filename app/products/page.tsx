import { getCategories } from "@/lib/wordpress";
import { getCachedBulkProducts, getCachedLocations, getCachedPricingRules } from "@/lib/api-cache";
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
  const [categories, locations, bulkData, pricingRules] = await Promise.all([
    getCategories({ per_page: 100 }),
    getCachedLocations(),
    getCachedBulkProducts({ per_page: 1000 }), // Bulk endpoint is FAST
    getCachedPricingRules(),
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
  
  inStockProducts.forEach((product: any) => {
    const metaData = product.meta_data || product.fields || [];
    const fields: { [key: string]: string } = {};
    
    // Extract common fields from metadata (only real fields)
    const fieldKeys = [
      'strain_type',
      'thca_%',
      'thca_percentage', 
      'thc_%',
      'thc_percentage',
      'lineage',
      'nose',
      'terpene',
      'terpenes',
      'effects',
      'effect',
      'mg_per_pack',
      'mg_per_piece',
      'ingredients',
      'type'
    ];
    
    metaData.forEach((meta: any) => {
      const key = meta.key?.toLowerCase();
      if (fieldKeys.some(fk => fk === key)) {
        fields[key] = meta.value;
      }
    });
    
    // Get blueprint name from metadata
    let blueprintName = null;
    const blueprintMeta = metaData.find((m: any) => 
      m.key && (m.key.includes('blueprint') || m.key === '_blueprint')
    );
    
    if (blueprintMeta) {
      blueprintName = blueprintMeta.value;
    }
    
    // If no direct blueprint, infer from category
    if (!blueprintName && product.categories && product.categories.length > 0) {
      const categoryName = product.categories[0].slug;
      if (categoryName.includes('flower') || categoryName.includes('pre-roll')) {
        blueprintName = 'flower_blueprint';
      } else if (categoryName.includes('concentrate')) {
        blueprintName = 'concentrate_blueprint';
      } else if (categoryName.includes('edible')) {
        blueprintName = 'edible_blueprint';
      } else if (categoryName.includes('vape')) {
        blueprintName = 'vape_blueprint';
      }
    }
    
    productFieldsMap[product.id] = { fields, blueprintName };
  });

  return (
    <ProductsClient 
      categories={categories}
      locations={locations}
      initialProducts={inStockProducts}
      inventoryMap={inventoryMap}
      initialCategory={categorySlug}
      pricingRules={pricingRules}
      productFieldsMap={productFieldsMap}
    />
  );
}
