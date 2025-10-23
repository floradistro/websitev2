'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

interface StorefrontShopClientProps {
  products: any[];
  locations: any[];
  inventoryMap: { [key: string]: any[] };
  productFieldsMap: { [key: string]: any };
}

export function StorefrontShopClient({ products, locations, inventoryMap, productFieldsMap }: StorefrontShopClientProps) {
  const [pricingData, setPricingData] = useState<{ [key: string]: any[] }>({});
  const [loadingPricing, setLoadingPricing] = useState(true);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const productIds = products.map(p => p.id);
        
        const response = await fetch('/api/storefront/products/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds })
        });

        if (response.ok) {
          const data = await response.json();
          setPricingData(data.pricingMap || {});
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
      } finally {
        setLoadingPricing(false);
      }
    }

    if (products.length > 0) {
      fetchPricing();
    } else {
      setLoadingPricing(false);
    }
  }, [products]);

  return (
    <div className="bg-[#2a2a2a] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 uppercase tracking-wider">Shop All Products</h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-purple-500/60 to-transparent mb-6"></div>
          <p className="text-white/60 text-lg font-light">
            Browse our complete collection of premium cannabis products
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/60 text-lg font-light">No products available at the moment.</p>
          </div>
        ) : loadingPricing ? (
          <div className="text-center py-16">
            <p className="text-white/60 text-lg font-light">Loading pricing...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px">
            {products.map((product, index) => {
              // Extract fields from blueprint_fields array
              const fields: { [key: string]: any } = {};
              if (Array.isArray(product.blueprint_fields)) {
                product.blueprint_fields.forEach((field: any) => {
                  if (field && typeof field === 'object') {
                    // Handle both array format and direct object format
                    Object.keys(field).forEach(key => {
                      if (key !== 'field_name' && key !== 'field_value') {
                        fields[key] = field[key];
                      }
                    });
                  }
                });
              }

              return (
                <ProductCard 
                  key={product.id}
                  product={product}
                  index={index}
                  locations={locations}
                  pricingTiers={pricingData[product.id] || []}
                  productFields={{ fields }}
                  inventory={inventoryMap[product.id] || []}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


