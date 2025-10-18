import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, getAllInventory } from "@/lib/wordpress";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }

    // Get all products and inventory
    const [allProducts, allInventory] = await Promise.all([
      getAllProducts(),
      getAllInventory(),
    ]);

    // Create inventory map
    const inventoryMap: { [key: number]: any[] } = {};
    allInventory.forEach((inv: any) => {
      const productId = parseInt(inv.product_id);
      if (!inventoryMap[productId]) {
        inventoryMap[productId] = [];
      }
      inventoryMap[productId].push(inv);
    });

    // Helper to check if product has stock
    const hasStockAnywhere = (productId: number): boolean => {
      const inventory = inventoryMap[productId] || [];
      return inventory.some((inv: any) => {
        const qty = parseFloat(inv.stock_quantity || inv.quantity || inv.stock || 0);
        const status = inv.status?.toLowerCase();
        return qty > 0 || status === 'instock' || status === 'in_stock';
      });
    };

    const searchQuery = query.toLowerCase().trim();
    
    // Smart search - search across multiple fields including metadata
    // Also filter out products with no stock at any location
    const filteredProducts = allProducts.filter((product: any) => {
      // First check if product has stock anywhere
      if (!hasStockAnywhere(product.id)) {
        return false;
      }
      
      // Search in product name
      const nameMatch = product.name.toLowerCase().includes(searchQuery);
      
      // Search in categories
      const categoryMatch = product.categories?.some((cat: any) =>
        cat.name.toLowerCase().includes(searchQuery)
      );
      
      // Search in description
      const descriptionMatch = product.description
        ?.toLowerCase()
        .includes(searchQuery);
      
      // Search in metadata fields (strain, effects, terpenes, etc.)
      const metaData = product.meta_data || [];
      const metaMatch = metaData.some((meta: any) => {
        const key = meta.key?.toLowerCase() || '';
        const value = String(meta.value || '').toLowerCase();
        
        // Search in field values
        if (value.includes(searchQuery)) return true;
        
        // Search in field names (for terms like "sativa", "indica", "hybrid")
        if (key.includes(searchQuery)) return true;
        
        return false;
      });
      
      // Search in SKU
      const skuMatch = product.sku?.toLowerCase().includes(searchQuery);

      return nameMatch || categoryMatch || descriptionMatch || metaMatch || skuMatch;
    });

    // Sort by relevance (exact name matches first, then contains, then metadata)
    const sortedProducts = filteredProducts.sort((a: any, b: any) => {
      const aNameExact = a.name.toLowerCase() === searchQuery;
      const bNameExact = b.name.toLowerCase() === searchQuery;
      if (aNameExact && !bNameExact) return -1;
      if (!aNameExact && bNameExact) return 1;
      
      const aNameStarts = a.name.toLowerCase().startsWith(searchQuery);
      const bNameStarts = b.name.toLowerCase().startsWith(searchQuery);
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;
      
      return 0;
    });

    // Get pricing for each product from V3 native pricing tiers
    const results = sortedProducts.slice(0, 15).map((product: any) => {
      const metaData = product.meta_data || [];
      
      // Get pricing tiers from V3 native storage
      let priceDisplay = product.price || "0";
      const pricingTiersMeta = metaData.find((m: any) => m.key === '_product_price_tiers');
      
      if (pricingTiersMeta?.value && Array.isArray(pricingTiersMeta.value)) {
        const tiers = pricingTiersMeta.value;
        if (tiers.length > 0) {
          const prices = tiers.map((t: any) => 
            typeof t.price === "string" ? parseFloat(t.price) : t.price
          );
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          if (minPrice === maxPrice) {
            priceDisplay = `${minPrice}`;
          } else {
            priceDisplay = `${minPrice}-${maxPrice}`;
          }
        }
      }

      return {
        id: product.id,
        name: product.name,
        price: priceDisplay,
        images: product.images,
        categories: product.categories,
      };
    });

    return NextResponse.json({ products: results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}

