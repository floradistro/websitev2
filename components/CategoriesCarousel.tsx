"use client";

import Link from "next/link";
import HorizontalScroll from "./HorizontalScroll";

interface CategoriesCarouselProps {
  categories: any[];
}

export default function CategoriesCarousel({ categories }: CategoriesCarouselProps) {
  return (
    <HorizontalScroll className="flex overflow-x-auto gap-0 scrollbar-hide snap-x snap-mandatory -mx-px">
      {categories.filter((cat: any) => cat.count > 0).slice(0, 5).map((category: any, index: number) => (
        <Link
          key={category.id}
          href={`/products?category=${category.slug}`}
          className="group flex-shrink-0 w-[75vw] sm:w-[45vw] md:w-[32vw] lg:w-[18vw] snap-start block bg-[#3a3a3a] md:hover:bg-[#404040] active:bg-[#454545] transition-none md:transition-all md:duration-200 cursor-pointer md:hover:shadow-xl"
          style={{
            animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
          }}
        >
          {/* Image Container */}
          <div className="relative aspect-[4/5] overflow-hidden bg-[#2a2a2a] transition-all duration-500">
            {category.image?.src ? (
              <img 
                src={category.image.src} 
                alt={category.name}
                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-12">
                <img
                  src="/yacht-club-logo.png"
                  alt="Yacht Club"
                  className="w-full h-full object-contain opacity-10 transition-opacity duration-500 group-hover:opacity-15"
                />
              </div>
            )}
          </div>

          {/* Category Info */}
          <div className="space-y-3 px-3 py-4">
            <h3 className="text-xs uppercase tracking-[0.15em] font-normal text-white line-clamp-1 leading-relaxed transition-all duration-300 group-hover:tracking-[0.2em]">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-xs text-white/50 font-light leading-relaxed line-clamp-2">
                {category.description.replace(/<[^>]*>/g, '')}
              </p>
            )}
          </div>
        </Link>
      ))}
    </HorizontalScroll>
  );
}

