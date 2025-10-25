// @ts-nocheck
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
// import ProductsCarousel from '@/components/ProductsCarousel'; // Component doesn't exist

interface FeaturedProductsSectionProps {
  content: {
    headline?: string;
    subheadline?: string;
  };
  products?: any[];
  inventoryMap?: any;
  productFieldsMap?: any;
  locations?: any[];
  vendor?: any;
  basePath?: string;
}

export function FeaturedProductsSection({
  content,
  products = [],
  inventoryMap = {},
  productFieldsMap = {},
  locations = [],
  vendor,
  basePath = '/storefront'
}: FeaturedProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-12 sm:py-20 px-0 sm:px-6 relative">
      <div className="absolute inset-0 bg-black" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8 sm:mb-12 px-4 sm:px-6 md:px-0">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-light text-white tracking-[-0.02em]">
            {typeof content?.headline === 'string' ? content.headline : 'Featured'}
          </h2>
          <Link
            href={`${basePath}/shop`}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-neutral-400 hover:text-white transition-colors font-semibold"
          >
            <span className="hidden sm:inline">View all</span>
            <span className="sm:hidden">All</span>
            <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
          </Link>
        </div>

        <div className="py-8 overflow-visible">
          
        </div>
      </div>
    </section>
  );
}

