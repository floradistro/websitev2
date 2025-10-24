"use client";

import { usePathname } from "next/navigation";
import ProductCard from "./ProductCard";
import StorefrontProductCard from "./storefront/StorefrontProductCard";
import HorizontalScroll from "./HorizontalScroll";

interface ProductsCarouselProps {
  products: any[];
  locations: any[];
  productFieldsMap: { [key: number]: any };
  inventoryMap: { [key: number]: any[] };
  vendorSlug?: string;
}

export default function ProductsCarousel({ products, locations, productFieldsMap, inventoryMap, vendorSlug }: ProductsCarouselProps) {
  const pathname = usePathname();
  const isStorefront = pathname?.startsWith('/storefront');

  return (
    <HorizontalScroll className="flex overflow-x-auto overflow-y-visible gap-1 sm:gap-3 scrollbar-hide snap-x snap-mandatory py-2 px-1 sm:px-0 -mx-1 sm:mx-0">
      {products.map((product: any, index: number) => (
        <div 
          key={product.id}
          className="flex-shrink-0 w-[calc(100vw-8px)] sm:w-[45vw] md:w-[32vw] lg:w-[23vw] snap-start"
        >
          {isStorefront ? (
            <StorefrontProductCard 
              product={product}
              vendorSlug={vendorSlug}
            />
          ) : (
            <ProductCard 
              product={product} 
              index={index} 
              locations={locations}
              pricingTiers={productFieldsMap[product.id]?.pricingTiers || []}
              productFields={productFieldsMap[product.id]}
              inventory={inventoryMap[product.id] || []}
            />
          )}
        </div>
      ))}
    </HorizontalScroll>
  );
}

