import { getCategories, getLocations, getProducts } from "@/lib/supabase-api";
import HomeClient from "@/components/HomeClient";

// ISR - Revalidate every 5 minutes for better performance
export const revalidate = 300;

export default async function Home() {
  // OPTIMIZED: Use bulk endpoint - returns products with inventory & fields in ONE call
  const timeout = (ms: number) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  
  const [categories, locations, productsData] = await Promise.all([
    Promise.race([getCategories(), timeout(5000)]).catch(() => []),
    Promise.race([getLocations(), timeout(5000)]).catch(() => []),
    Promise.race([getProducts({ per_page: 12, orderby: 'date_created', order: 'desc' }), timeout(8000)]).catch(() => ({ products: [] })),
  ]);

  // Extract products from response
  const bulkProducts = productsData?.products || [];
  
  // Products from Supabase - use ONLY Supabase Storage images
  const allProducts = bulkProducts.map((p: any) => {
    // Use Supabase Storage URLs
    const imageUrl = p.featured_image_storage || 
                     (p.image_gallery_storage && p.image_gallery_storage[0]);
    
    return {
      id: p.id,
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
      stock_status: p.stock_status || 'in_stock',
      total_stock: p.stock_quantity || 0,
      inventory: [],
    };
  });

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
    const productId = product.id;
    const blueprintFields = product.blueprint_fields || [];
    
    // Filter and sort fields (handle Supabase JSONB array structure)
    const sortedFields = blueprintFields
      .filter((field: any) => 
        field && field.field_name && field.field_type !== 'blueprint' && !field.field_name.includes('blueprint')
      )
      .sort((a: any, b: any) => a.field_name?.localeCompare(b.field_name || '') || 0);
    
    // Convert to object
    const fields: { [key: string]: string } = {};
    sortedFields.forEach((field: any) => {
      fields[field.field_name] = field.field_value || '';
    });
    
    // Extract pricing tiers from meta_data (JSONB object in Supabase)
    const metaData = product.meta_data || {};
    const pricingTiers = metaData._product_price_tiers || [];
    
    productFieldsMap[productId] = { fields, pricingTiers };
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
