import { getCategories, getLocations } from "@/lib/wordpress";
import { getCachedBulkProducts } from "@/lib/api-cache";
import HomeClient from "@/components/HomeClient";

// ISR - Revalidate every 5 minutes for better performance
export const revalidate = 300;

export default async function Home() {
  // OPTIMIZED: Use bulk endpoint - returns products with inventory & fields in ONE call
  const timeout = (ms: number) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  
  const [categories, locations, bulkData] = await Promise.all([
    Promise.race([getCategories({ per_page: 10, hide_empty: true }), timeout(5000)]).catch(() => []),
    Promise.race([getLocations(), timeout(5000)]).catch(() => []),
    Promise.race([getCachedBulkProducts({ per_page: 12, orderby: 'popularity' }), timeout(8000)]).catch(() => ({ data: [] })),
  ]);

  // Extract products from bulk response - inventory already included!
  const bulkProducts = bulkData?.data || [];
  
  // Map bulk products to consistent format
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
      id: parseInt(cat.id),
      name: cat.name,
      slug: cat.slug
    })),
    meta_data: bp.meta_data || [],
    blueprint_fields: bp.blueprint_fields || [],
    stock_status: bp.total_stock > 0 ? 'instock' : 'outofstock',
    total_stock: bp.total_stock,
    inventory: bp.inventory || [],
  }));

  // Helper function to check if product has stock
  const hasStockAnywhere = (product: any): boolean => {
    return product.total_stock > 0 || (product.inventory && product.inventory.some((inv: any) => {
      const qty = parseFloat(inv.stock || inv.quantity || 0);
      return qty > 0;
    }));
  };

  // Filter to only in-stock products
  const inStockProducts = allProducts.filter((product: any) => hasStockAnywhere(product));

  // Create inventory map from products (inventory already in each product)
  const inventoryMap: { [key: number]: any[] } = {};
  allProducts.forEach((product: any) => {
    inventoryMap[product.id] = product.inventory || [];
  });

  // Extract fields from product metadata (already included in bulk response)
  const productFieldsMap: { [key: number]: any } = {};
  
  bulkProducts.forEach((product: any) => {
    const blueprintFields = product.blueprint_fields || [];
    
    // Filter and sort fields
    const sortedFields = blueprintFields
      .filter((field: any) => 
        field.field_type !== 'blueprint' && !field.field_name.includes('blueprint')
      )
      .sort((a: any, b: any) => a.field_name.localeCompare(b.field_name));
    
    // Convert to object
    const fields: { [key: string]: string } = {};
    sortedFields.forEach((field: any) => {
      fields[field.field_name] = field.field_value || '';
    });
    
    // Extract pricing tiers from meta_data (already in bulk response)
    const metaData = product.meta_data || [];
    const pricingTiersMeta = metaData.find((m: any) => m.key === '_product_price_tiers');
    const pricingTiers = pricingTiersMeta?.value || [];
    
    productFieldsMap[product.id] = { fields, pricingTiers };
  });

  return (
    <HomeClient
      products={inStockProducts}
      categories={categories}
      locations={locations}
      inventoryMap={inventoryMap}
      productFieldsMap={productFieldsMap}
    />
  );
}
