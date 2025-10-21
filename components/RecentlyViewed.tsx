"use client";

import { useRecentlyViewedContext } from "@/context/RecentlyViewedContext";
import Link from "next/link";

export default function RecentlyViewed() {
  const { recentlyViewed } = useRecentlyViewedContext();

  // Don't show if no products viewed
  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/10 bg-[#2a2a2a] py-12">
      <div className="px-4 mb-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-white/60 font-medium">
          Recently Viewed
        </h2>
      </div>
      
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-px px-4" style={{ minWidth: 'min-content' }}>
          {recentlyViewed.slice(0, 8).map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group block bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-300 flex-shrink-0"
              style={{ width: '180px' }}
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-[#2a2a2a]">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <img
                      src="/yacht-club-logo.png"
                      alt="Yacht Club"
                      className="w-full h-full object-contain opacity-10"
                    />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-white line-clamp-2 leading-relaxed">
                  {product.name}
                </h3>
                {product.price && parseFloat(product.price) > 0 && (
                  <p className="text-xs font-medium text-white/80">
                    ${parseFloat(product.price).toFixed(0)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

