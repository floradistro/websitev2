import { getVendorFromHeaders, getVendorStorefront, getVendorProducts, getVendorLocations } from '@/lib/storefront/get-vendor';
import { StorefrontHomeClient } from '@/components/storefront/StorefrontHomeClient';
import { notFound } from 'next/navigation';

export default async function StorefrontHomePage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const [vendor, allProducts, locations] = await Promise.all([
    getVendorStorefront(vendorId),
    getVendorProducts(vendorId, 12), // Limit to 12 featured products for home page
    getVendorLocations()
  ]);

  if (!vendor) {
    notFound();
  }

  // Products now come pre-formatted from getVendorProducts with:
  // - fields (from blueprint_fields)
  // - pricingTiers (from vendor_pricing_configs)
  // - inventory (with location data)
  // - proper stock calculation
  
  // Map to format expected by StorefrontHomeClient
  const products = allProducts.map((p: any) => {
    const imageUrl = p.featured_image_storage || (p.image_gallery_storage && p.image_gallery_storage[0]);
    
    return {
      id: p.id,
      uuid: p.id,
      name: p.name,
      slug: p.slug || p.id,
      price: p.price || 0,
      regular_price: p.regular_price || 0,
      sale_price: p.sale_price,
      images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
      categories: p.categories || [],
      stock_status: p.stock_status,
      stock_quantity: p.stock_quantity,
      total_stock: p.total_stock,
      inventory: p.inventory || [],
      fields: p.fields || {},
      pricingTiers: p.pricingTiers || [],
    };
  });

  // Build inventory map and product fields map for StorefrontHomeClient
  const inventoryMap: { [key: string]: any[] } = {};
  const productFieldsMap: { [key: string]: any } = {};
  
  products.forEach((p: any) => {
    inventoryMap[p.id] = p.inventory;
    productFieldsMap[p.id] = { fields: p.fields };
  });

  return (
    <StorefrontHomeClient 
      vendor={vendor}
      products={products}
      inventoryMap={inventoryMap}
      productFieldsMap={productFieldsMap}
      locations={locations}
    />
  );
}

