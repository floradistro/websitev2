"use client";

import ProductCard from "./ProductCard";
import HorizontalScroll from "./HorizontalScroll";

interface ProductsCarouselProps {
  products: any[];
  locations: any[];
  pricingRules: any[];
  productFieldsMap: { [key: number]: any };
}

export default function ProductsCarousel({ products, locations, pricingRules, productFieldsMap }: ProductsCarouselProps) {
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
            pricingRules={pricingRules}
            productFields={productFieldsMap[product.id]}
          />
        </div>
      ))}
    </HorizontalScroll>
  );
}

