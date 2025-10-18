"use client";

import ProductCard from "./ProductCard";
import HorizontalScroll from "./HorizontalScroll";

interface ProductsCarouselProps {
  products: any[];
  locations: any[];
  productFieldsMap: { [key: number]: any };
  inventoryMap: { [key: number]: any[] };
}

export default function ProductsCarousel({ products, locations, productFieldsMap, inventoryMap }: ProductsCarouselProps) {
  return (
    <HorizontalScroll className="flex overflow-x-auto gap-0 scrollbar-hide snap-x snap-mandatory -mx-px">
      {products.map((product: any, index: number) => (
        <div 
          key={product.id}
          className="flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-[32vw] lg:w-[23vw] snap-start"
        >
          <ProductCard 
            product={product} 
            index={index} 
            locations={locations}
            pricingTiers={productFieldsMap[product.id]?.pricingTiers || []}
            productFields={productFieldsMap[product.id]}
            inventory={inventoryMap[product.id] || []}
          />
        </div>
      ))}
    </HorizontalScroll>
  );
}

