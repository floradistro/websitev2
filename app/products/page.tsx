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

  // Add mock inventory for ALL Yacht Club products FIRST
  const yachtClubInventory: { [key: number]: any[] } = {
    50001: [{ product_id: '50001', location_id: '1', quantity: 156.75, stock_quantity: 156.75, status: 'instock' }],
    50002: [{ product_id: '50002', location_id: '1', quantity: 203.5, stock_quantity: 203.5, status: 'instock' }],
    50003: [{ product_id: '50003', location_id: '1', quantity: 127.25, stock_quantity: 127.25, status: 'instock' }],
    50004: [{ product_id: '50004', location_id: '1', quantity: 145.0, stock_quantity: 145.0, status: 'instock' }],
    50005: [{ product_id: '50005', location_id: '1', quantity: 98.5, stock_quantity: 98.5, status: 'instock' }],
    50006: [{ product_id: '50006', location_id: '1', quantity: 76.25, stock_quantity: 76.25, status: 'instock' }],
    50007: [{ product_id: '50007', location_id: '1', quantity: 112.0, stock_quantity: 112.0, status: 'instock' }],
    50008: [{ product_id: '50008', location_id: '1', quantity: 89.75, stock_quantity: 89.75, status: 'instock' }],
    50009: [{ product_id: '50009', location_id: '1', quantity: 134.5, stock_quantity: 134.5, status: 'instock' }],
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
    { 
      id: 50003, 
      name: 'Sour Diesel', 
      price: '16.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 16.99 },
          { weight: '3.5g', qty: 3.5, price: 47.99 },
          { weight: '7g', qty: 7, price: 84.99 },
          { weight: '28g', qty: 28, price: 299.99 }
        ]},
        { key: '_field_strain_type', value: 'Sativa' },
        { key: '_field_terpenes', value: 'Caryophyllene, Limonene, Myrcene' },
        { key: '_field_effects', value: 'Energetic, Uplifted, Creative, Focused' },
        { key: '_field_lineage', value: 'Chemdawg 91 × Super Skunk' }
      ],
      vendorId: 1,
      vendorSlug: 'yacht-club',
      stock_status: 'instock'
    },
    { 
      id: 50006, 
      name: 'Sunset Sherbet', 
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
        { key: '_field_terpenes', value: 'Caryophyllene, Limonene, Linalool' },
        { key: '_field_effects', value: 'Relaxed, Happy, Euphoric, Sleepy' },
        { key: '_field_lineage', value: 'Pink Panties × Girl Scout Cookies' }
      ],
      vendorId: 1,
      vendorSlug: 'yacht-club',
      stock_status: 'instock'
    },
    { 
      id: 50007, 
      name: 'Purple Punch', 
      price: '16.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 16.99 },
          { weight: '3.5g', qty: 3.5, price: 46.99 },
          { weight: '7g', qty: 7, price: 82.99 },
          { weight: '28g', qty: 28, price: 289.99 }
        ]},
        { key: '_field_strain_type', value: 'Indica' },
        { key: '_field_terpenes', value: 'Caryophyllene, Pinene, Humulene' },
        { key: '_field_effects', value: 'Relaxed, Sleepy, Happy, Euphoric' },
        { key: '_field_lineage', value: 'Larry OG × Granddaddy Purple' }
      ],
      vendorId: 1,
      vendorSlug: 'yacht-club',
      stock_status: 'instock'
    },
    { 
      id: 50008, 
      name: 'Zkittlez', 
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
        { key: '_field_terpenes', value: 'Humulene, Caryophyllene, Limonene' },
        { key: '_field_effects', value: 'Happy, Relaxed, Euphoric, Uplifted' },
        { key: '_field_lineage', value: 'Grape Ape × Grapefruit' }
      ],
      vendorId: 1,
      vendorSlug: 'yacht-club',
      stock_status: 'instock'
    },
    { 
      id: 50009, 
      name: 'Wedding Cake', 
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
        { key: '_field_effects', value: 'Relaxed, Happy, Euphoric, Hungry' },
        { key: '_field_lineage', value: 'Cherry Pie × Girl Scout Cookies' }
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

  // Add CannaBoyz inventory
  const cannaBoyzInventory: { [key: number]: any[] } = {
    60001: [{ product_id: '60001', location_id: '1', quantity: 184.5, stock_quantity: 184.5, status: 'instock' }],
    60002: [{ product_id: '60002', location_id: '1', quantity: 142.75, stock_quantity: 142.75, status: 'instock' }],
    60003: [{ product_id: '60003', location_id: '1', quantity: 198.0, stock_quantity: 198.0, status: 'instock' }],
    60004: [{ product_id: '60004', location_id: '1', quantity: 167.25, stock_quantity: 167.25, status: 'instock' }],
    60005: [{ product_id: '60005', location_id: '1', quantity: 211.5, stock_quantity: 211.5, status: 'instock' }],
    60006: [{ product_id: '60006', location_id: '1', quantity: 123.75, stock_quantity: 123.75, status: 'instock' }],
  };

  // Merge CannaBoyz inventory
  Object.keys(cannaBoyzInventory).forEach(productId => {
    inventoryMap[parseInt(productId)] = cannaBoyzInventory[parseInt(productId)];
  });

  // CannaBoyz vendor products - Urban street style strains
  const cannaBoyzProducts = [
    { 
      id: 60001, 
      name: 'Gorilla Glue #4', 
      price: '16.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 16.99 },
          { weight: '3.5g', qty: 3.5, price: 47.99 },
          { weight: '7g', qty: 7, price: 84.99 },
          { weight: '28g', qty: 28, price: 299.99 }
        ]},
        { key: '_field_strain_type', value: 'Hybrid' },
        { key: '_field_terpenes', value: 'Caryophyllene, Myrcene, Limonene' },
        { key: '_field_effects', value: 'Relaxed, Euphoric, Happy, Uplifted' },
        { key: '_field_lineage', value: 'Chem\'s Sister × Sour Dubb × Chocolate Diesel' }
      ],
      vendorId: 2,
      vendorSlug: 'cannaboyz',
      stock_status: 'instock'
    },
    { 
      id: 60002, 
      name: 'White Widow', 
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
        { key: '_field_terpenes', value: 'Myrcene, Pinene, Caryophyllene' },
        { key: '_field_effects', value: 'Energetic, Euphoric, Creative, Happy' },
        { key: '_field_lineage', value: 'South Indian × Brazilian Landrace' }
      ],
      vendorId: 2,
      vendorSlug: 'cannaboyz',
      stock_status: 'instock'
    },
    { 
      id: 60003, 
      name: 'Northern Lights', 
      price: '14.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 14.99 },
          { weight: '3.5g', qty: 3.5, price: 41.99 },
          { weight: '7g', qty: 7, price: 74.99 },
          { weight: '28g', qty: 28, price: 259.99 }
        ]},
        { key: '_field_strain_type', value: 'Indica' },
        { key: '_field_terpenes', value: 'Myrcene, Caryophyllene, Pinene' },
        { key: '_field_effects', value: 'Relaxed, Sleepy, Happy, Euphoric' },
        { key: '_field_lineage', value: 'Afghani × Thai' }
      ],
      vendorId: 2,
      vendorSlug: 'cannaboyz',
      stock_status: 'instock'
    },
    { 
      id: 60004, 
      name: 'AK-47', 
      price: '16.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 16.99 },
          { weight: '3.5g', qty: 3.5, price: 47.99 },
          { weight: '7g', qty: 7, price: 84.99 },
          { weight: '28g', qty: 28, price: 299.99 }
        ]},
        { key: '_field_strain_type', value: 'Sativa' },
        { key: '_field_terpenes', value: 'Terpinolene, Caryophyllene, Myrcene' },
        { key: '_field_effects', value: 'Energetic, Creative, Uplifted, Happy' },
        { key: '_field_lineage', value: 'Colombian × Mexican × Thai × Afghani' }
      ],
      vendorId: 2,
      vendorSlug: 'cannaboyz',
      stock_status: 'instock'
    },
    { 
      id: 60005, 
      name: 'Granddaddy Purple', 
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
        { key: '_field_strain_type', value: 'Indica' },
        { key: '_field_terpenes', value: 'Myrcene, Caryophyllene, Pinene' },
        { key: '_field_effects', value: 'Relaxed, Sleepy, Euphoric, Happy' },
        { key: '_field_lineage', value: 'Big Bud × Purple Urkle' }
      ],
      vendorId: 2,
      vendorSlug: 'cannaboyz',
      stock_status: 'instock'
    },
    { 
      id: 60006, 
      name: 'Jack Herer', 
      price: '16.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 16.99 },
          { weight: '3.5g', qty: 3.5, price: 46.99 },
          { weight: '7g', qty: 7, price: 82.99 },
          { weight: '28g', qty: 28, price: 289.99 }
        ]},
        { key: '_field_strain_type', value: 'Sativa' },
        { key: '_field_terpenes', value: 'Terpinolene, Caryophyllene, Pinene' },
        { key: '_field_effects', value: 'Energetic, Creative, Uplifted, Focused' },
        { key: '_field_lineage', value: 'Haze × Northern Lights #5 × Shiva Skunk' }
      ],
      vendorId: 2,
      vendorSlug: 'cannaboyz',
      stock_status: 'instock'
    },
  ];

  // Process CannaBoyz products fields
  cannaBoyzProducts.forEach((product: any) => {
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
    },
    {
      id: 2,
      name: 'CannaBoyz',
      slug: 'cannaboyz',
      logo: '/CannaBoyz.png',
    }
  ];

  // Add Moonwater inventory
  const moonwaterInventory: { [key: number]: any[] } = {
    70001: [{ product_id: '70001', location_id: '1', quantity: 248.0, stock_quantity: 248.0, status: 'instock' }],
    70002: [{ product_id: '70002', location_id: '1', quantity: 196.0, stock_quantity: 196.0, status: 'instock' }],
    70003: [{ product_id: '70003', location_id: '1', quantity: 312.0, stock_quantity: 312.0, status: 'instock' }],
    70004: [{ product_id: '70004', location_id: '1', quantity: 284.0, stock_quantity: 284.0, status: 'instock' }],
  };

  Object.keys(moonwaterInventory).forEach(productId => {
    inventoryMap[parseInt(productId)] = moonwaterInventory[parseInt(productId)];
  });

  // Moonwater vendor products - THC beverages with bracket naming
  const moonwaterProducts = [
    { 
      id: 70001, 
      name: '[CITRUS BLEND]', 
      price: '8.99', 
      images: [], 
      categories: [{ id: 29, name: 'Beverages', slug: 'beverages' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1 can', qty: 1, price: 8.99 },
          { weight: '4-pack', qty: 4, price: 29.99 },
          { weight: '12-pack', qty: 12, price: 79.99 }
        ]},
        { key: '_field_thc_per_serving', value: '10mg' },
        { key: '_field_servings_per_package', value: '1' },
        { key: '_field_total_thc', value: '10mg' },
        { key: '_field_flavor', value: 'Citrus, Lemon, Lime' },
        { key: '_field_ingredients', value: 'Purified Water, THC Extract, Natural Flavors, Citric Acid' }
      ],
      vendorId: 3,
      vendorSlug: 'moonwater',
      stock_status: 'instock'
    },
    { 
      id: 70002, 
      name: '[BERRY FUSION]', 
      price: '8.99', 
      images: [], 
      categories: [{ id: 29, name: 'Beverages', slug: 'beverages' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1 can', qty: 1, price: 8.99 },
          { weight: '4-pack', qty: 4, price: 29.99 },
          { weight: '12-pack', qty: 12, price: 79.99 }
        ]},
        { key: '_field_thc_per_serving', value: '10mg' },
        { key: '_field_servings_per_package', value: '1' },
        { key: '_field_total_thc', value: '10mg' },
        { key: '_field_flavor', value: 'Mixed Berry, Blueberry, Raspberry' },
        { key: '_field_ingredients', value: 'Purified Water, THC Extract, Natural Flavors, Citric Acid' }
      ],
      vendorId: 3,
      vendorSlug: 'moonwater',
      stock_status: 'instock'
    },
    { 
      id: 70003, 
      name: '[TROPICAL WAVE]', 
      price: '8.99', 
      images: [], 
      categories: [{ id: 29, name: 'Beverages', slug: 'beverages' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1 can', qty: 1, price: 8.99 },
          { weight: '4-pack', qty: 4, price: 29.99 },
          { weight: '12-pack', qty: 12, price: 79.99 }
        ]},
        { key: '_field_thc_per_serving', value: '10mg' },
        { key: '_field_servings_per_package', value: '1' },
        { key: '_field_total_thc', value: '10mg' },
        { key: '_field_flavor', value: 'Pineapple, Mango, Coconut' },
        { key: '_field_ingredients', value: 'Purified Water, THC Extract, Natural Flavors, Citric Acid' }
      ],
      vendorId: 3,
      vendorSlug: 'moonwater',
      stock_status: 'instock'
    },
    { 
      id: 70004, 
      name: '[MINT REFRESH]', 
      price: '8.99', 
      images: [], 
      categories: [{ id: 29, name: 'Beverages', slug: 'beverages' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1 can', qty: 1, price: 8.99 },
          { weight: '4-pack', qty: 4, price: 29.99 },
          { weight: '12-pack', qty: 12, price: 79.99 }
        ]},
        { key: '_field_thc_per_serving', value: '10mg' },
        { key: '_field_servings_per_package', value: '1' },
        { key: '_field_total_thc', value: '10mg' },
        { key: '_field_flavor', value: 'Mint, Cucumber, Lime' },
        { key: '_field_ingredients', value: 'Purified Water, THC Extract, Natural Flavors, Citric Acid' }
      ],
      vendorId: 3,
      vendorSlug: 'moonwater',
      stock_status: 'instock'
    },
  ];

  moonwaterProducts.forEach((product: any) => {
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

  // Add Zarati inventory
  const zaratiInventory: { [key: number]: any[] } = {
    80001: [{ product_id: '80001', location_id: '1', quantity: 92.5, stock_quantity: 92.5, status: 'instock' }],
    80002: [{ product_id: '80002', location_id: '1', quantity: 78.25, stock_quantity: 78.25, status: 'instock' }],
    80003: [{ product_id: '80003', location_id: '1', quantity: 104.0, stock_quantity: 104.0, status: 'instock' }],
    80004: [{ product_id: '80004', location_id: '1', quantity: 88.75, stock_quantity: 88.75, status: 'instock' }],
    80005: [{ product_id: '80005', location_id: '1', quantity: 116.5, stock_quantity: 116.5, status: 'instock' }],
  };

  Object.keys(zaratiInventory).forEach(productId => {
    inventoryMap[parseInt(productId)] = zaratiInventory[parseInt(productId)];
  });

  // Zarati vendor products - Premium exotics
  const zaratiProducts = [
    { 
      id: 80001, 
      name: 'Runtz', 
      price: '19.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 19.99 },
          { weight: '3.5g', qty: 3.5, price: 59.99 },
          { weight: '7g', qty: 7, price: 109.99 },
          { weight: '28g', qty: 28, price: 389.99 }
        ]},
        { key: '_field_strain_type', value: 'Hybrid' },
        { key: '_field_terpenes', value: 'Caryophyllene, Limonene, Linalool' },
        { key: '_field_effects', value: 'Euphoric, Relaxed, Happy, Creative' },
        { key: '_field_lineage', value: 'Zkittlez × Gelato' }
      ],
      vendorId: 4,
      vendorSlug: 'zarati',
      stock_status: 'instock'
    },
    { 
      id: 80002, 
      name: 'Biscotti', 
      price: '18.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 18.99 },
          { weight: '3.5g', qty: 3.5, price: 54.99 },
          { weight: '7g', qty: 7, price: 99.99 },
          { weight: '28g', qty: 28, price: 359.99 }
        ]},
        { key: '_field_strain_type', value: 'Hybrid' },
        { key: '_field_terpenes', value: 'Caryophyllene, Limonene, Humulene' },
        { key: '_field_effects', value: 'Relaxed, Euphoric, Sleepy, Happy' },
        { key: '_field_lineage', value: 'Gelato #25 × Girl Scout Cookies × Gorilla Glue' }
      ],
      vendorId: 4,
      vendorSlug: 'zarati',
      stock_status: 'instock'
    },
    { 
      id: 80003, 
      name: 'Jealousy', 
      price: '20.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 20.99 },
          { weight: '3.5g', qty: 3.5, price: 64.99 },
          { weight: '7g', qty: 7, price: 119.99 },
          { weight: '28g', qty: 28, price: 429.99 }
        ]},
        { key: '_field_strain_type', value: 'Hybrid' },
        { key: '_field_terpenes', value: 'Caryophyllene, Limonene, Myrcene' },
        { key: '_field_effects', value: 'Euphoric, Uplifted, Relaxed, Creative' },
        { key: '_field_lineage', value: 'Sherbert Bx1 × Gelato #41' }
      ],
      vendorId: 4,
      vendorSlug: 'zarati',
      stock_status: 'instock'
    },
    { 
      id: 80004, 
      name: 'Cereal Milk', 
      price: '19.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 19.99 },
          { weight: '3.5g', qty: 3.5, price: 59.99 },
          { weight: '7g', qty: 7, price: 109.99 },
          { weight: '28g', qty: 28, price: 389.99 }
        ]},
        { key: '_field_strain_type', value: 'Hybrid' },
        { key: '_field_terpenes', value: 'Caryophyllene, Limonene, Myrcene' },
        { key: '_field_effects', value: 'Happy, Relaxed, Euphoric, Uplifted' },
        { key: '_field_lineage', value: 'Y Life × Snowman' }
      ],
      vendorId: 4,
      vendorSlug: 'zarati',
      stock_status: 'instock'
    },
    { 
      id: 80005, 
      name: 'Ice Cream Cake', 
      price: '18.99', 
      images: [], 
      categories: [{ id: 25, name: 'Flower', slug: 'flower' }], 
      meta_data: [
        { key: '_product_price_tiers', value: [
          { weight: '1g', qty: 1, price: 18.99 },
          { weight: '3.5g', qty: 3.5, price: 54.99 },
          { weight: '7g', qty: 7, price: 99.99 },
          { weight: '28g', qty: 28, price: 359.99 }
        ]},
        { key: '_field_strain_type', value: 'Indica' },
        { key: '_field_terpenes', value: 'Caryophyllene, Limonene, Linalool' },
        { key: '_field_effects', value: 'Relaxed, Sleepy, Euphoric, Happy' },
        { key: '_field_lineage', value: 'Wedding Cake × Gelato #33' }
      ],
      vendorId: 4,
      vendorSlug: 'zarati',
      stock_status: 'instock'
    },
  ];

  moonwaterProducts.forEach((product: any) => {
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

  zaratiProducts.forEach((product: any) => {
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

  // Extended vendors
  const allVendors = [
    ...vendors,
    {
      id: 3,
      name: 'Moonwater',
      slug: 'moonwater',
      logo: '/moonwater.png',
    },
    {
      id: 4,
      name: 'Zarati',
      slug: 'zarati',
      logo: '/zarati.png',
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
      vendorProducts={[...yachtClubProducts, ...cannaBoyzProducts, ...moonwaterProducts, ...zaratiProducts]}
      vendors={allVendors}
    />
  );
}
