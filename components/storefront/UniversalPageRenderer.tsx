"use client";

import { useLiveEditing } from './LiveEditingProvider';
import { 
  HeroSection, 
  ProcessSection, 
  AboutStorySection,
  DifferentiatorsSection,
  StatsSection,
  ReviewsSection,
  FAQSection,
  CTASection,
  StorySection,
  ContactInfoSection,
  FAQItemsSection,
  LocationsSection,
  FeaturedProductsSection,
  ShippingBadgesSection,
  FooterSection
} from './content-sections';
import { VendorStorefront } from '@/lib/storefront/get-vendor';

interface UniversalPageRendererProps {
  vendor: VendorStorefront;
  pageType: string;
  products?: any[];
  inventoryMap?: any;
  productFieldsMap?: any;
  locations?: any[];
  reviews?: any[];
}

// Map section keys to components
const SECTION_COMPONENTS: Record<string, any> = {
  hero: HeroSection,
  process: ProcessSection,
  about_story: AboutStorySection,
  story: StorySection,
  differentiators: DifferentiatorsSection,
  stats: StatsSection,
  reviews: ReviewsSection,
  faq: FAQSection,
  faq_items: FAQItemsSection,
  cta: CTASection,
  contact_info: ContactInfoSection,
  locations: LocationsSection,
  featured_products: FeaturedProductsSection,
  shipping_badges: ShippingBadgesSection,
  footer: FooterSection,
};

/**
 * Universal Page Renderer
 * Renders ANY page type using sections from the database
 * Works with Live Editor for real-time editing
 */
export function UniversalPageRenderer({
  vendor,
  pageType,
  products = [],
  inventoryMap = {},
  productFieldsMap = {},
  locations = [],
  reviews = [],
}: UniversalPageRendererProps) {
  const { sections: liveSections, isLiveEditMode } = useLiveEditing();
  
  const templateStyle = (vendor.template_id === 'luxury' ? 'luxury' 
                      : vendor.template_id === 'bold' ? 'bold'
                      : vendor.template_id === 'organic' ? 'organic'
                      : 'minimalist') as 'minimalist' | 'luxury' | 'bold' | 'organic';

  // Filter sections for this page
  const pageSections = liveSections
    .filter(s => s.page_type === pageType && s.is_enabled !== false)
    .sort((a, b) => a.section_order - b.section_order);
  
  const basePath = `/storefront`;

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">

      {/* Render Sections Dynamically */}
      <div className="relative z-10">
        {pageSections.length > 0 ? (
          pageSections.map((section, index) => {
            const SectionComponent = SECTION_COMPONENTS[section.section_key];
            
            if (!SectionComponent) {
              console.warn(`⚠️ No component found for section: ${section.section_key}`);
              return (
                <div key={section.id} className="py-16 px-6 relative">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
                  <div className="max-w-4xl mx-auto text-center relative z-10">
                    <p className="text-white/40 text-sm">
                      Section type "{section.section_key}" not found
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <section key={section.id} data-section-id={section.id} data-section-key={section.section_key}>
                <SectionComponent
                  content={section.content_data}
                  templateStyle={templateStyle}
                  basePath={basePath}
                  vendor={vendor}
                  products={products}
                  locations={locations}
                  reviews={reviews}
                />
              </section>
            );
          })
        ) : (
          <div className="py-32 px-6 relative">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                {pageType === 'home' ? 'Welcome' : pageType.charAt(0).toUpperCase() + pageType.slice(1)}
              </h2>
              <p className="text-xl text-neutral-400 font-light mb-8">
                {isLiveEditMode 
                  ? 'No sections yet. Add sections from the editor to build this page.' 
                  : 'This page is being configured.'}
              </p>
              {vendor.logo_url && (
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.store_name}
                  className="w-24 h-24 object-contain mx-auto opacity-40"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

