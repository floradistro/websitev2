import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { getVendorPageSections } from '@/lib/storefront/content-api';
import { HeroSection, ProcessSection, AboutStorySection } from './content-sections';
import ProductsCarousel from '@/components/ProductsCarousel';

interface ContentDrivenHomePageProps {
  vendor: VendorStorefront;
  products: any[];
  inventoryMap: { [key: number]: any[] };
  productFieldsMap: { [key: number]: any };
  locations?: any[];
  reviews?: any[];
}

export async function ContentDrivenHomePage({
  vendor,
  products,
  inventoryMap,
  productFieldsMap,
  locations = [],
  reviews = [],
}: ContentDrivenHomePageProps) {
  // Fetch all content sections for home page
  const sections = await getVendorPageSections(vendor.id, 'home');
  
  // Get template style from vendor
  const templateStyle = (vendor.template_id === 'luxury' ? 'luxury' 
                      : vendor.template_id === 'bold' ? 'bold'
                      : vendor.template_id === 'organic' ? 'organic'
                      : 'minimalist') as 'minimalist' | 'luxury' | 'bold' | 'organic';

  // Organize sections by key
  const sectionMap = sections.reduce((acc, section) => {
    acc[section.section_key] = section.content_data;
    return acc;
  }, {} as Record<string, any>);

  const basePath = `/storefront`;

  // Add client-side script to check for draft changes in preview mode
  const previewScript = `
    <script>
      if (window.location.search.includes('preview_mode=true')) {
        // This is preview mode - check for draft sections
        const draftSections = localStorage.getItem('draft_sections');
        if (draftSections) {
          console.log('Preview mode: Loading draft sections');
          // Draft sections are applied via client-side hydration
        }
      }
    </script>
  `;

  return (
    <div className="bg-black min-h-screen">
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
        <section className="py-24 px-6 relative bg-black">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-6xl font-light text-white mb-4 tracking-[-0.02em]">
                {sectionMap.locations.headline || 'Visit us in person'}
              </h2>
              <p className="text-xl text-neutral-400 font-light">
                {sectionMap.locations.subheadline || `${locations.filter((l: any) => l.type === 'retail').length} locations`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations
                .filter((location: any) => location.type === 'retail' || !location.type)
                .map((location: any, idx: number) => {
                  const fullAddress = location.full_address || 
                    `${location.address_line1 || location.address || ''}, ${location.city || ''}, ${location.state || ''} ${location.zip || ''}`;
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                  
                  return (
                    <div
                      key={location.id || idx}
                      className="group bg-black/80 backdrop-blur-xl hover:bg-black/90 rounded-[32px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-1"
                    >
                      {/* Logo Header */}
                      <div className="aspect-[4/3] bg-black/20 flex items-center justify-center p-8 border-b border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                        {vendor.logo_url ? (
                          <img 
                            src={vendor.logo_url} 
                            alt={vendor.store_name}
                            className="w-full h-full object-contain opacity-40 group-hover:opacity-60 transition-all duration-700 relative z-10"
                          />
                        ) : (
                          <div className="text-4xl font-light text-white/20">{vendor.store_name[0]}</div>
                        )}
                      </div>
                      
                      {/* Location Info */}
                      <div className="p-8">
                        <div className="flex items-start gap-3 mb-6">
                          <div className="w-10 h-10 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1.5 tracking-tight">
                              {location.name || location.location_name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                <polyline points="12 6 12 12 16 14" strokeWidth={2} />
                              </svg>
                              <span>Open daily</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-sm text-neutral-400 mb-6 font-light">
                          <div>{location.address_line1 || location.address}</div>
                          <div>{location.city}, {location.state} {location.zip}</div>
                        </div>

                        {location.phone && (
                          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{location.phone}</span>
                          </div>
                        )}

                        {/* Action Badges */}
                        <div className="flex gap-2 mb-6">
                          <div className="flex-1 bg-white/5 border border-white/20 rounded-full px-3 py-2 flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-xs text-white font-medium">Pickup</span>
                          </div>
                          <div className="flex-1 bg-white/5 border border-white/20 rounded-full px-3 py-2 flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                            <span className="text-xs text-white font-medium">Delivery</span>
                          </div>
                        </div>

                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-white font-semibold group-hover:gap-3 transition-all"
                        >
                          <span>Get directions</span>
                          <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  );
                })}
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
              {sectionMap.featured_products.cta_link && (
                <a 
                  href={`${basePath}${sectionMap.featured_products.cta_link}`}
                  className="text-white/60 hover:text-white text-sm uppercase tracking-wider"
                >
                  {sectionMap.featured_products.cta_text || 'View all'} →
                </a>
              )}
            </div>
            
            <ProductsCarousel
              products={products}
              inventoryMap={inventoryMap}
              productFieldsMap={productFieldsMap}
              basePath={basePath}
            />
          </div>
        </div>
      )}

      {/* Reviews Section - Simplified to avoid rendering errors */}
      {sectionMap.reviews && reviews && reviews.length > 0 && (
        <div className="py-20 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-12 text-center">
              {sectionMap.reviews.headline || 'Reviews'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, sectionMap.reviews.max_display || 6).map((review: any, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <svg key={star} className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/70 text-sm mb-4 leading-relaxed">
                    "{review.review_text || review.quote || review.text || ''}"
                  </p>
                  <p className="text-white/50 text-xs">
                    {review.customer_name || review.name || 'Anonymous'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Story Section (Bottom) */}
      {sectionMap.about_story && (
        <AboutStorySection
          content={sectionMap.about_story}
          templateStyle={templateStyle}
          basePath={basePath}
        />
      )}

      {/* Shipping Badges Section */}
      {sectionMap.shipping_badges && sectionMap.shipping_badges.badges && (
        <div className="py-16 bg-[#0a0a0a] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {sectionMap.shipping_badges.badges.map((badge: any, index: number) => (
                <div key={index} className="flex items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-lg">
                  <div className="text-white/80">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {badge.icon === 'truck' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        )}
                      </svg>
                    </div>
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
    </div>
  );
}
