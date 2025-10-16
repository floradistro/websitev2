import { getAllProducts, getCategories, getLocations, getAllInventory, getPricingRules } from "@/lib/wordpress";
import ProductsClient from "@/components/ProductsClient";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categorySlug } = await searchParams;
  
  // Fetch all data in parallel using bulk endpoints - single API call for inventory
  const [categories, locations, allProducts, allInventory, pricingRules] = await Promise.all([
    getCategories({ per_page: 100 }),
    getLocations(),
    getAllProducts(),
    getAllInventory(),
    getPricingRules(),
  ]);

  // Create inventory map from bulk inventory data
  const inventoryMap: { [key: number]: any[] } = {};
  
  allInventory.forEach((inv: any) => {
    const productId = parseInt(inv.product_id);
    if (!inventoryMap[productId]) {
      inventoryMap[productId] = [];
    }
    inventoryMap[productId].push(inv);
  });

  // Extract fields from product metadata
  const productFieldsMap: { [key: number]: any } = {};
  
  allProducts.forEach((product: any) => {
    const metaData = product.meta_data || [];
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
      initialProducts={allProducts}
      inventoryMap={inventoryMap}
      initialCategory={categorySlug}
      pricingRules={pricingRules}
      productFieldsMap={productFieldsMap}
    />
  );
}
