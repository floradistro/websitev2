import { getCategories, getProductPricingV3 } from "@/lib/wordpress";
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

  // Fetch pricing tiers for all products in parallel (bulk API doesn't include them)
  const pricingPromises = inStockProducts.map((product: any) => 
    getProductPricingV3(product.id)
      .then(pricing => ({ productId: product.id, tiers: pricing?.quantity_tiers || [] }))
      .catch(() => ({ productId: product.id, tiers: [] }))
  );
  
  const pricingResults = await Promise.all(pricingPromises);
  const pricingMap: { [key: number]: any[] } = {};
  pricingResults.forEach(result => {
    pricingMap[result.productId] = result.tiers;
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
    
    // Get pricing tiers from pricing map
    const pricingTiers = pricingMap[product.id] || [];
    
    productFieldsMap[product.id] = { fields, pricingTiers };
  });

  // Add mock inventory for Yacht Club products FIRST
  const yachtClubInventory: { [key: number]: any[] } = {
    50001: [{ product_id: '50001', location_id: '1', quantity: 156.75, stock_quantity: 156.75, status: 'instock' }],
    50002: [{ product_id: '50002', location_id: '1', quantity: 203.5, stock_quantity: 203.5, status: 'instock' }],
    50005: [{ product_id: '50005', location_id: '1', quantity: 98.5, stock_quantity: 98.5, status: 'instock' }],
    50004: [{ product_id: '50004', location_id: '1', quantity: 145.0, stock_quantity: 145.0, status: 'instock' }],
  };

  // Merge Yacht Club inventory into main inventory map
  Object.keys(yachtClubInventory).forEach(productId => {
    inventoryMap[parseInt(productId)] = yachtClubInventory[parseInt(productId)];
  });

  // Mock Yacht Club vendor products with fields
  const yachtClubProducts = [
    { 
      id: 50001, 
      name: 'OG Kush', 
      price: '15.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 15.99 },
          { weight: '3.5g', qty: 3.5, price: 44.99 },
          { weight: '7g', qty: 7, price: 79.99 },
          { weight: '28g', qty: 28, price: 279.99 }
        ]},
        { key: '_field_strain_type', value: 'Hybrid' },
        { key: '_field_terpenes', value: 'β-Caryophyllene, Limonene, Myrcene' },
        { key: '_field_effects', value: 'Relaxed, Happy, Euphoric, Uplifted' },
        { key: '_field_lineage', value: 'Chemdawg × Lemon Thai × Pakistani Kush' }
      ],
      vendorId: 1,
      vendorSlug: 'yacht-club',
      stock_status: 'instock'
    },
    { 
      id: 50002, 
      name: 'Blue Dream', 
      price: '14.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 14.99 },
          { weight: '3.5g', qty: 3.5, price: 39.99 },
          { weight: '7g', qty: 7, price: 69.99 },
          { weight: '28g', qty: 28, price: 249.99 }
        ]},
        { key: '_field_strain_type', value: 'Hybrid' },
        { key: '_field_terpenes', value: 'Myrcene, Pinene, Caryophyllene' },
        { key: '_field_effects', value: 'Creative, Uplifted, Relaxed, Focused' },
        { key: '_field_lineage', value: 'Blueberry × Haze' }
      ],
      vendorId: 1,
      vendorSlug: 'yacht-club',
      stock_status: 'instock'
    },
    { 
      id: 50005, 
      name: 'Gelato', 
      price: '18.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 18.99 },
          { weight: '3.5g', qty: 3.5, price: 54.99 },
          { weight: '7g', qty: 7, price: 99.99 },
          { weight: '28g', qty: 28, price: 349.99 }
        ]},
        { key: '_field_strain_type', value: 'Hybrid' },
        { key: '_field_terpenes', value: 'Limonene, Caryophyllene, Humulene' },
        { key: '_field_effects', value: 'Relaxed, Happy, Euphoric, Uplifted' },
        { key: '_field_lineage', value: 'Sunset Sherbet × Thin Mint Cookies' }
      ],
      vendorId: 1,
      vendorSlug: 'yacht-club',
      stock_status: 'instock'
    },
    { 
      id: 50004, 
      name: 'Girl Scout Cookies', 
      price: '17.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 17.99 },
          { weight: '3.5g', qty: 3.5, price: 49.99 },
          { weight: '7g', qty: 7, price: 89.99 },
          { weight: '28g', qty: 28, price: 319.99 }
        ]},
        { key: '_field_strain_type', value: 'Hybrid' },
        { key: '_field_terpenes', value: 'Caryophyllene, Limonene, Humulene' },
        { key: '_field_effects', value: 'Euphoric, Happy, Relaxed, Creative' },
        { key: '_field_lineage', value: 'OG Kush × Durban Poison' }
      ],
      vendorId: 1,
      vendorSlug: 'yacht-club',
      stock_status: 'instock'
    },
  ];

  // Process Yacht Club products fields
  yachtClubProducts.forEach((product: any) => {
    // Extract fields from meta_data
    const fields: any = {};
    product.meta_data.forEach((meta: any) => {
      if (meta.key.startsWith('_field_')) {
        const fieldName = meta.key.replace('_field_', '');
        fields[fieldName] = meta.value;
      }
    });
    
    const pricingTiers = product.meta_data.find((m: any) => m.key === '_product_price_tiers')?.value || [];
    productFieldsMap[product.id] = { fields, pricingTiers };
  });

  // Mock vendors data
  const vendors = [
    {
      id: 1,
      name: 'Yacht Club',
      slug: 'yacht-club',
      logo: '/yachtclub.png',
    }
  ];

  return (
    <ProductsClient 
      categories={categories}
      locations={locations}
      initialProducts={inStockProducts}
      inventoryMap={inventoryMap}
      initialCategory={categorySlug}
      productFieldsMap={productFieldsMap}
      vendorProducts={yachtClubProducts}
      vendors={vendors}
    />
  );
}
