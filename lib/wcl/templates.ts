/**
 * WCL Templates Library
 * Pre-built templates that can be loaded and customized
 */

export interface WCLTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'landing' | 'portfolio' | 'blog';
  author: string;
  thumbnail?: string;
  wclCode: string;
}

export const WILSON_LUXURY_TEMPLATE: WCLTemplate = {
  id: 'wilson-luxury',
  name: "Wilson's Luxury Storefront",
  description: 'Premium luxury cannabis storefront with hero, featured products, and testimonials. Perfect for high-end dispensaries.',
  category: 'ecommerce',
  author: 'WhaleTools',
  wclCode: `component LuxuryStorefront {
  props {
    heroHeadline: String = "ELEVATED EXPERIENCE"
    heroSubheadline: String = "Premium Cannabis, Expertly Curated"
    ctaPrimary: String = "Shop Collection"
    ctaSecondary: String = "Learn More"
    featuredTitle: String = "FEATURED COLLECTION"
  }
  
  data {
    products = fetch("/api/products?vendor_id=VENDOR_ID&limit=6&featured=true") @cache(5m)
    testimonials = fetch("/api/testimonials?vendor_id=VENDOR_ID&limit=3") @cache(10m)
  }
  
  render {
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-black to-white/[0.01]"></div>
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23fff' fill-opacity='1'/%3E%3C/svg%3E')"}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-20 sm:py-28 md:py-36 lg:py-44">
          <div className="text-center">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter mb-4 sm:mb-6 leading-[0.9]">
              <span className="text-white">{heroHeadline}</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-4 leading-relaxed">
              {heroSubheadline}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <button className="w-full sm:w-auto bg-white hover:bg-white/90 text-black px-8 sm:px-10 md:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-tight transition-all hover:scale-105">
                {ctaPrimary}
              </button>
              <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 px-8 sm:px-10 md:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-tight transition-all">
                {ctaSecondary}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-4 sm:mb-6">
            <span className="text-white">{featuredTitle}</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
            Handpicked strains for the discerning connoisseur
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {products.map((p, index) => (
            <div key={index} className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02]">
              <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-2xl mb-6 overflow-hidden">
                <img src={p.featured_image_storage} alt={p.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-2 sm:mb-3 leading-tight">
                  {p.name}
                </h3>
                <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-4">
                  {p.description}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white">\${p.price}</div>
                  <div className="text-white/40 text-xs sm:text-sm uppercase tracking-wider">{p.stock_quantity} in stock</div>
                </div>
                <button className="bg-white hover:bg-white/90 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-black uppercase text-xs sm:text-sm tracking-tight transition-all group-hover:scale-105">
                  ADD TO BAG
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="border-t border-b border-white/5 bg-gradient-to-br from-white/[0.01] to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
              CUSTOMER REVIEWS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((review, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-black text-xl">
                    {review.customer_name?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-black uppercase text-sm sm:text-base">{review.customer_name}</div>
                    <div className="text-white/60 text-xs sm:text-sm">{'★'.repeat(review.rating)}</div>
                  </div>
                </div>
                <p className="text-white/60 leading-relaxed text-sm sm:text-base">{review.review_text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-4 sm:mb-6">VENDOR_NAME</div>
            <p className="text-white/40 text-xs sm:text-sm mb-6 sm:mb-8">Premium Cannabis • 21+ Only • Lab Tested</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-white/60 text-xs sm:text-sm">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Lab Results</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  }
}`
};

export const WCL_TEMPLATES: WCLTemplate[] = [
  WILSON_LUXURY_TEMPLATE,
  // Add more templates here as they're created
];

/**
 * Load a template and customize it for a specific vendor
 */
export function loadTemplate(templateId: string, vendorId: string, vendorName: string): string {
  const template = WCL_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  // Replace placeholders with vendor-specific data
  let customized = template.wclCode
    .replace(/VENDOR_ID/g, vendorId)
    .replace(/VENDOR_NAME/g, vendorName);
  
  return customized;
}

