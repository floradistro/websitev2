"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import ProductsClient from "@/components/ProductsClient";
import axios from "axios";

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const dataFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (dataFetched.current) return;
    dataFetched.current = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔵 Loading products via bulk endpoint...');
        
        // Use bulk endpoint - returns ALL data in ONE call
        const response = await fetch('/api/page-data/products');
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Products page data loaded in ${result.meta.responseTime}`);
          console.log(`📦 Products with stock: ${result.data.products.filter((p: any) => p.total_stock > 0).length} of ${result.data.products.length}`);
          
          const apiProducts = result.data.products || [];
          
          // Map to component format
          const mappedProducts = apiProducts.map((p: any) => {
            console.log(`Product ${p.name}: stock_quantity=${p.stock_quantity}, total_stock=${p.total_stock}, inventory=${p.inventory?.length || 0}`);
            
            const imageUrl = p.featured_image_storage || 
                            (p.image_gallery_storage && p.image_gallery_storage[0]);
            
            const vendor = result.data.vendors?.find((v: any) => v.id === p.vendor_id);
            
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              regular_price: p.regular_price,
              sale_price: p.sale_price,
              images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
              stock_quantity: p.stock_quantity, // Already calculated from inventory
              stock_status: p.stock_status, // Already calculated
              inventory: p.inventory || [],
              total_stock: p.total_stock, // Already calculated
              categories: p.categories || [],
              pricingTiers: p.pricing_tiers || [],
              fields: p.fields || {},
              vendorId: p.vendor_id,
              vendorSlug: vendor?.slug || '',
              vendor: vendor
            };
          });
          
          setProducts(mappedProducts);
          setCategories(result.data.categories || []);
          setLocations(result.data.locations || []);
          setVendors(result.data.vendors || []);
        } else {
          console.error('Failed to load products:', result.error);
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching products:', error);
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading products...</div>
      </div>
    }>
      <ProductsClient 
        categories={categories}
        locations={locations}
        vendorProducts={products}
        vendors={vendors}
      />
    </Suspense>
  );
}
