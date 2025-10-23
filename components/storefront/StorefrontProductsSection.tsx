'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const ProductsCarousel = dynamic(() => import("@/components/ProductsCarousel"), {
  ssr: false,
  loading: () => (
    <div className="flex gap-4 px-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[300px] h-[400px] bg-[#3a3a3a]" />
      ))}
    </div>
  ),
});

interface StorefrontProductsSectionProps {
  products: any[];
}

export function StorefrontProductsSection({ products }: StorefrontProductsSectionProps) {
  const mappedProducts = products.slice(0, 12).map((p: any) => ({
    id: p.id,
    uuid: p.id,
    name: p.name,
    slug: p.slug || p.id,
    type: 'simple',
    status: p.status,
    price: p.retail_price || 0,
    regular_price: p.retail_price || 0,
    images: p.images && p.images.length > 0 ? [{ src: p.images[0], id: 0, name: p.name }] : [],
    categories: [{ name: p.category || 'Product' }],
    meta_data: {},
    blueprint_fields: [],
    stock_status: 'in_stock',
    stock_quantity: 100,
    total_stock: 100,
    inventory: [],
  }));

  return (
    <section className="relative py-16 overflow-x-hidden w-full border-b border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a3a]/35 to-[#3a3a3a]/30 backdrop-blur-md"></div>
      <div className="px-4 sm:px-6 mb-12 relative z-10">
        <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
          Featured Products
        </h2>
        <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent"></div>
      </div>

      <div className="relative z-10">
        <ProductsCarousel 
          products={mappedProducts}
          inventoryMap={{}}
          productFieldsMap={{}}
        />
      </div>
      
      <div className="text-center mt-12">
        <Link
          href="/shop"
          className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/90 transition-all font-medium"
        >
          View All Products
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

