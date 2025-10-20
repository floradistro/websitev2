import { getBestSellingProducts, getCategories, getLocations, getAllInventory } from "@/lib/wordpress";
import HomeClient from "@/components/HomeClient";

// Force dynamic - always fetch fresh data (no caching for vendor inventory)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  // Optimized: Fetch only necessary data in parallel with error handling
  let products: any[] = [];
  let categories: any[] = [];
  let locations: any[] = [];
  
  try {
    [products, categories, locations] = await Promise.all([
      getBestSellingProducts({ per_page: 12 }).catch(e => { console.error('Products error:', e); return []; }),
      getCategories({ per_page: 10, hide_empty: true }).catch(e => { console.error('Categories error:', e); return []; }),
      getLocations().catch(e => { console.error('Locations error:', e); return []; }),
    ]);
  } catch (error) {
    console.error('Data fetching error:', error);
  }

  // Get inventory only for the products we're displaying (not all products)
  const productIds = products.map((p: any) => p.id);
  let allInventory: any[] = [];
  
  try {
    allInventory = await getAllInventory();
  } catch (error) {
    console.error('Inventory error:', error);
  }
  
  // Filter inventory to only products on homepage
  const relevantInventory = allInventory.filter((inv: any) => 
    productIds.includes(parseInt(inv.product_id))
  );

  // Create inventory map from filtered inventory data
  const inventoryMap: { [key: number]: any[] } = {};
  
  relevantInventory.forEach((inv: any) => {
    const productId = parseInt(inv.product_id);
    if (!inventoryMap[productId]) {
      inventoryMap[productId] = [];
    }
    inventoryMap[productId].push(inv);
  });

  // Helper function to check if product has stock at ANY location
  const hasStockAnywhere = (productId: number): boolean => {
    const inventory = inventoryMap[productId] || [];
    return inventory.some((inv: any) => {
      const qty = parseFloat(inv.stock_quantity || inv.quantity || inv.stock || 0);
      const status = inv.status?.toLowerCase();
      return qty > 0 || status === 'instock' || status === 'in_stock';
    });
  };

  // Filter products to only show those with stock at any location
  const inStockProducts = products.filter((product: any) => hasStockAnywhere(product.id));

  // Extract fields from product metadata (only for in-stock products)
  const productFieldsMap: { [key: number]: any } = {};
  
  products.forEach((product: any) => {
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
    
    // Extract pricing tiers from meta_data
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
