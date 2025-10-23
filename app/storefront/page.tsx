import { getVendorFromHeaders, getVendorStorefront, getVendorProducts } from '@/lib/storefront/get-vendor';
import { StorefrontHomeClient } from '@/components/storefront/StorefrontHomeClient';
import { notFound } from 'next/navigation';

export default async function StorefrontHomePage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);
  const allProducts = await getVendorProducts(vendorId);

  if (!vendor) {
    notFound();
  }

  // Format products to match Yacht Club structure
  const products = allProducts.map((p: any) => {
    const imageUrl = p.images && p.images.length > 0 ? p.images[0] : null;
    
    return {
      id: p.id,
      uuid: p.id,
      name: p.name,
      slug: p.slug || p.id,
      type: p.type || 'simple',
      status: p.status,
      price: p.retail_price || 0,
      regular_price: p.retail_price || 0,
      sale_price: p.sale_price,
      images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
      categories: p.category ? [{ name: p.category }] : [],
      meta_data: {},
      blueprint_fields: [],
      stock_status: 'in_stock',
      stock_quantity: 100,
      total_stock: 100,
      inventory: [],
    };
  });

  return (
    <StorefrontHomeClient 
      vendor={vendor}
      products={products}
      inventoryMap={{}}
      productFieldsMap={{}}
    />
  );
}

