import { getProducts, getCategories, getLocations, getAllInventory } from "@/lib/wordpress";
import ProductsClient from "@/components/ProductsClient";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categorySlug } = await searchParams;
  
  // Fetch all data in parallel using bulk endpoints - single API call for inventory
  const [categories, locations, allProducts, allInventory] = await Promise.all([
    getCategories({ per_page: 10 }),
    getLocations(),
    getProducts({ per_page: 99 }),
    getAllInventory(),
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

  return (
    <ProductsClient 
      categories={categories}
      locations={locations}
      initialProducts={allProducts}
      inventoryMap={inventoryMap}
      initialCategory={categorySlug}
    />
  );
}
