/**
 * Default Template - Shop Page Component
 * Simple product grid for vendors without a specific template
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

interface ShopPageProps {
  vendorId: string;
}

export default function ShopPage({ vendorId }: ShopPageProps) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [vendorSlug, setVendorSlug] = useState<string>("");
  const [locations, setLocations] = useState<any[]>([]);
  const dataFetched = useRef(false);

  useEffect(() => {
    if (dataFetched.current) return;
    dataFetched.current = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);

        const { whaletoolsAPI } = await import('@/lib/storefront/api-client');
        const result = await whaletoolsAPI.getProducts();

        if (result.success) {
          const apiProducts = result.data.products || [];
          const apiVendors = result.data.vendors || [];
          const apiLocations = result.data.locations || [];
          
          // Get vendor slug
          const vendor = apiVendors.find((v: any) => v.id === vendorId);
          if (vendor) {
            setVendorSlug(vendor.slug);
          }
          
          // Filter to only this vendor's products
          const vendorProducts = apiProducts
            .filter((p: any) => p.vendor_id === vendorId)
            .map((p: any) => ({
              ...p,
              total_stock: p.inventory?.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0) || 0
            }));
          
          setProducts(vendorProducts);
          setLocations(apiLocations.filter((l: any) => l.vendor_id === vendorId));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-900">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Shop All Products</h1>
        
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            No products available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-8">
            {products.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                vendorSlug={vendorSlug}
                locations={locations}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

