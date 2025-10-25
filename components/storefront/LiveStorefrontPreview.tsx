"use client";

import { HeroSection, ProcessSection, AboutStorySection } from './content-sections';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
// import ProductsCarousel from '@/components/ProductsCarousel'; // Component doesn't exist
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';

interface LiveStorefrontPreviewProps {
  vendor: VendorStorefront;
  sections: any[];
  products: any[];
  inventoryMap: any;
  productFieldsMap: any;
  locations: any[];
  reviews: any[];
}

export function LiveStorefrontPreview({
  vendor,
  sections,
  products,
  inventoryMap,
  productFieldsMap,
  locations,
  reviews,
}: LiveStorefrontPreviewProps) {
  const templateStyle = (vendor.template_id === 'luxury' ? 'luxury' 
                      : vendor.template_id === 'bold' ? 'bold'
                      : vendor.template_id === 'organic' ? 'organic'
                      : 'minimalist') as 'minimalist' | 'luxury' | 'bold' | 'organic';

  const sectionMap = sections.reduce((acc, section) => {
    acc[section.section_key] = section.content_data;
    return acc;
  }, {} as Record<string, any>);

  const basePath = `/storefront`;

  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <div className="bg-black min-h-screen">
            {/* Storefront Header */}
            <StorefrontHeader vendor={vendor} />
            
            {/* Main Content */}
            <main>
      {/* Hero Section */}
      {sectionMap.hero && (
        <HeroSection 
          content={sectionMap.hero}
          templateStyle={templateStyle}
          basePath={basePath}
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
        <div className="py-20 bg-[#0a0a0a] text-center">
          <h2 className="text-4xl text-white mb-4">
            {sectionMap.locations.headline}
          </h2>
          <p className="text-white/60">{sectionMap.locations.subheadline}</p>
          <div className="mt-8 text-white/40 text-sm">
            {locations.length} locations
          </div>
        </div>
      )}

      {/* Featured Products Section */}
      {sectionMap.featured_products && products && products.length > 0 && (
        <div className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl text-white mb-8">
              {sectionMap.featured_products.headline}
            </h2>
            <div className="text-white/60 text-sm">
              {products.length} products available
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {sectionMap.reviews && reviews && reviews.length > 0 && (
        <div className="py-20 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl text-white mb-8 text-center">
              {sectionMap.reviews.headline}
            </h2>
            <div className="text-white/60 text-sm text-center">
              {reviews.length} reviews
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
      {sectionMap.shipping_badges && (
        <div className="py-16 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {sectionMap.shipping_badges.badges?.map((badge: any, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded">
                  <h3 className="text-white font-medium">{badge.title}</h3>
                  <p className="text-white/50 text-sm">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </main>

            {/* Storefront Footer */}
            <StorefrontFooter vendor={vendor} />
          </div>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

