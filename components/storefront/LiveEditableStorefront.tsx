"use client";

import { useLiveEditing } from './LiveEditingProvider';
import { HeroSection, ProcessSection, AboutStorySection } from './content-sections';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
// import ProductsCarousel from '@/components/ProductsCarousel'; // Component doesn't exist

interface LiveEditableStorefrontProps {
  vendor: VendorStorefront;
  products: any[];
  inventoryMap: any;
  productFieldsMap: any;
  locations: any[];
  reviews: any[];
}

export function LiveEditableStorefront({
  vendor,
  products,
  inventoryMap,
  productFieldsMap,
  locations,
  reviews,
}: LiveEditableStorefrontProps) {
  const { sections: liveSections, isLiveEditMode } = useLiveEditing();
  
  const templateStyle = (vendor.template_id === 'luxury' ? 'luxury' 
                      : vendor.template_id === 'bold' ? 'bold'
                      : vendor.template_id === 'organic' ? 'organic'
                      : 'minimalist') as 'minimalist' | 'luxury' | 'bold' | 'organic';

  // Use live sections if in edit mode, otherwise use props
  const activeSections = isLiveEditMode ? liveSections : [];
  
  const sectionMap = activeSections.reduce((acc, section) => {
    if (section.is_enabled !== false) {
      acc[section.section_key] = section.content_data;
    }
    return acc;
  }, {} as Record<string, any>);

  const basePath = `/storefront`;

  return (
    <>
      {/* Hero Section */}
      {sectionMap.hero && (
        <HeroSection 
          content={sectionMap.hero}
          templateStyle={templateStyle}
          basePath={basePath}
          vendor={vendor}
        />
      )}

      {/* Process Timeline Section */}
      {sectionMap.process && (
        <ProcessSection 
          content={sectionMap.process}
          templateStyle={templateStyle}
        />
      )}

      {/* Locations Section */}
      {sectionMap.locations && locations && locations.length > 0 && (
        <section className="py-24 px-6 relative bg-black">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-6xl font-light text-white mb-4 tracking-[-0.02em]">
                {sectionMap.locations.headline || 'Visit us in person'}
              </h2>
              <p className="text-xl text-neutral-400 font-light">
                {sectionMap.locations.subheadline || `${locations.length} locations`}
              </p>
            </div>
            <div className="text-white/40 text-center">
              {locations.length} location{locations.length !== 1 ? 's' : ''} configured
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {sectionMap.featured_products && products && products.length > 0 && (
        <div className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-light text-white">
                {sectionMap.featured_products.headline || 'Featured'}
              </h2>
            </div>
            <div className="text-white/60 text-sm">
              {products.length} products available
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {sectionMap.reviews && reviews && reviews.length > 0 && (
        <div className="py-20 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-12 text-center">
              {sectionMap.reviews.headline || 'Reviews'}
            </h2>
            <div className="text-white/60 text-sm text-center">
              {reviews.length} customer reviews
            </div>
          </div>
        </div>
      )}

      {/* About Story Section */}
      {sectionMap.about_story && (
        <AboutStorySection
          content={sectionMap.about_story}
          templateStyle={templateStyle}
          basePath={basePath}
        />
      )}

      {/* Shipping Badges */}
      {sectionMap.shipping_badges && sectionMap.shipping_badges.badges && (
        <div className="py-16 bg-[#0a0a0a] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {sectionMap.shipping_badges.badges.map((badge: any, index: number) => (
                <div key={index} className="flex items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-lg">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{badge.icon === 'truck' ? '🚚' : '📦'}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">{badge.title}</h3>
                    <p className="text-white/50 text-sm">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

