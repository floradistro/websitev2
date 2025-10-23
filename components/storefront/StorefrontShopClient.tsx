'use client';

import ProductCard from './ProductCard';

interface StorefrontShopClientProps {
  products: any[];
  locations: any[];
  inventoryMap: { [key: string]: any[] };
  productFieldsMap: { [key: string]: any };
}

export function StorefrontShopClient({ products, locations, inventoryMap, productFieldsMap }: StorefrontShopClientProps) {
  // Log to verify data is being received
  console.log('🛒 Shop Client - Products:', products.length);
  console.log('🛒 Shop Client - productFieldsMap keys:', Object.keys(productFieldsMap).length);
  
  const productsWithPricing = Object.keys(productFieldsMap).filter(id => {
    const tiers = productFieldsMap[id]?.pricingTiers || [];
    return tiers.length > 0;
  });
  console.log('🛒 Shop Client - Products with pricing tiers:', productsWithPricing.length);

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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px">
            {products.map((product, index) => {
              const pricingTiers = productFieldsMap[product.id]?.pricingTiers || [];
              const productFields = productFieldsMap[product.id] ? { fields: productFieldsMap[product.id].fields } : undefined;
              
              return (
                <ProductCard 
                  key={product.id}
                  product={product}
                  index={index}
                  locations={locations}
                  pricingTiers={pricingTiers}
                  productFields={productFields}
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


