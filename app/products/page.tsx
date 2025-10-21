"use client";

import { useEffect, useState } from "react";
import ProductsClient from "@/components/ProductsClient";
import axios from "axios";

// Client-side only to bypass SSR cache issues

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [productFieldsMap, setProductFieldsMap] = useState<any>({});
  const [inventoryMap, setInventoryMap] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [categoriesRes, locationsRes, productsRes, vendorsRes] = await Promise.all([
          axios.get('/api/supabase/categories').catch(() => ({ data: { categories: [] } })),
          axios.get('/api/supabase/locations').catch(() => ({ data: { locations: [] } })),
          axios.get('/api/supabase/products?per_page=200').catch(() => ({ data: { products: [] } })),
          axios.get('/api/admin/vendors').catch(() => ({ data: { vendors: [] } }))
        ]);
        
        setCategories(categoriesRes.data.categories || []);
        setLocations(locationsRes.data.locations || []);
        setVendors(vendorsRes.data.vendors || []);
        
        const bulkProducts = productsRes.data.products || [];
        
        console.log('🔵 Client fetched products:', bulkProducts.length);
  
  // Map Supabase products - ONLY Supabase Storage images
  const allProducts = bulkProducts.map((p: any) => {
    // ONLY use Supabase Storage (WordPress URLs removed!)
    const imageUrl = p.featured_image_storage || 
                     (p.image_gallery_storage && p.image_gallery_storage[0]);
    
    return {
      id: p.wordpress_id || p.id,
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
      stock_status: p.stock_status || 'instock',
      total_stock: p.stock_quantity || 0,
      inventory: [],
    };
  });

  console.log('🔵 Total products from API:', bulkProducts.length);
  console.log('🔵 Products with stock_quantity:', bulkProducts.filter((p: any) => p.stock_quantity > 0).length);
  console.log('🔵 Vendor products raw:', bulkProducts.filter((p: any) => p.vendor_id).map((p: any) => ({
    name: p.name,
    vendor_id: p.vendor_id,
    stock_quantity: p.stock_quantity
  })));

  // Show ALL products - stock status will be displayed on cards
  const inStockProducts = allProducts;
  
        console.log('✅ Total products to display:', inStockProducts.length);
        console.log('✅ Products in stock:', allProducts.filter((p: any) => p.total_stock > 0).length);
        console.log('✅ Products out of stock:', allProducts.filter((p: any) => p.total_stock === 0).length);

        // OPTIMIZED: Process fields, pricing, and inventory in a single pass
        const fieldsMap: { [key: number]: any } = {};
        const invMap: { [key: number]: any[] } = {};
        
        bulkProducts.forEach((product: any) => {
          const productId = product.wordpress_id || product.id;
          
          // Extract pricing tiers from meta_data (JSONB object in Supabase)
          const metaData = product.meta_data || {};
          const pricingTiers = metaData.pricing_tiers || metaData._product_price_tiers || [];
          
          // Process blueprint fields efficiently (JSONB array in Supabase)
          const blueprintFields = product.blueprint_fields || [];
          const fields: { [key: string]: string } = {};
          
          blueprintFields.forEach((field: any) => {
            if (field && field.field_name && field.field_type !== 'blueprint' && !field.field_name.includes('blueprint')) {
              fields[field.field_name] = field.field_value || '';
            }
          });
          
          fieldsMap[productId] = { fields, pricingTiers };
          invMap[productId] = product.inventory || [];
        });

        // ALL products are vendor products now
        const vendorProductsList = inStockProducts.map((p: any) => {
          const fullProduct = bulkProducts.find((bp: any) => (bp.wordpress_id || bp.id) === p.id);
          const vendor = vendorsRes.data.vendors?.find((v: any) => v.id === fullProduct?.vendor_id);
          
          return {
            ...p,
            vendorId: fullProduct?.vendor_id,
            vendorSlug: vendor?.slug || ''
          };
        });
        
        const vendorsList = vendorsRes.data.vendors
          ?.filter((v: any) => v.status === 'active')
          .map((v: any) => ({
            id: v.id,
            name: v.store_name,
            slug: v.slug,
            logo: v.logo_url || '/yacht-club-logo.png'
          })) || [];
        
        setAllProducts(vendorProductsList);
        setVendors(vendorsList);
        setProductFieldsMap(fieldsMap);
        setInventoryMap(invMap);
        setLoading(false);
        
        console.log('✅ Products loaded on client:', vendorProductsList.length);
        console.log('✅ Vendors loaded:', vendorsList.length, vendorsList);
        
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading products...</div>
      </div>
    );
  }

  return (
    <ProductsClient 
      categories={categories}
      locations={locations}
      initialProducts={[]}
      inventoryMap={inventoryMap}
      productFieldsMap={productFieldsMap}
      vendorProducts={allProducts}
      vendors={vendors}
    />
  );
}
