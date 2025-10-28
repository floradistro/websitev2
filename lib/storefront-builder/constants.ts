/**
 * Storefront Builder Constants
 */

import { SmartComponent, Font } from './types';

export const FONT_LIBRARY: Font[] = [
  { name: 'Inter', category: 'Sans-serif', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'Roboto', category: 'Sans-serif', weights: [300, 400, 500, 700, 900] },
  { name: 'Playfair Display', category: 'Serif', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'Montserrat', category: 'Sans-serif', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'Bebas Neue', category: 'Display', weights: [400] },
  { name: 'Oswald', category: 'Sans-serif', weights: [400, 500, 600, 700] },
  { name: 'Raleway', category: 'Sans-serif', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'Poppins', category: 'Sans-serif', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'DM Sans', category: 'Sans-serif', weights: [400, 500, 700] },
  { name: 'Space Grotesk', category: 'Sans-serif', weights: [400, 500, 600, 700] },
];

export const SMART_COMPONENTS: SmartComponent[] = [
  { key: 'smart_hero', name: 'Hero Section', description: 'Full-width hero with headline and CTA', category: 'layout' },
  { key: 'smart_product_grid', name: 'Product Grid', description: 'Responsive product grid with real vendor data', category: 'commerce' },
  { key: 'smart_product_showcase', name: 'Product Showcase', description: 'Featured product carousel with real data', category: 'commerce' },
  { key: 'smart_testimonials', name: 'Testimonials', description: 'Customer reviews and ratings with real data', category: 'content' },
  { key: 'smart_features', name: 'Features Grid', description: 'Feature highlights with icons', category: 'content' },
  { key: 'smart_stats_counter', name: 'Stats Counter', description: 'Animated statistics display', category: 'interactive' },
  { key: 'smart_faq', name: 'FAQ Accordion', description: 'Expandable Q&A section', category: 'content' },
  { key: 'smart_contact', name: 'Contact Form', description: 'Contact form with validation', category: 'interactive' },
];

export const getInitialCode = (vendorLogoUrl?: string) => `export default function Component({ vendorId, vendorName }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        ${vendorLogoUrl ? `<img src="${vendorLogoUrl}" alt="Logo" className="h-24 w-auto mx-auto mb-12 object-contain opacity-20" />` : ''}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-white/10 mb-6 leading-[0.9]">
          {vendorName || "Your Store"}
        </h1>
        <p className="text-xl sm:text-2xl text-white/10 leading-relaxed">
          AI-powered storefront builder
        </p>
      </div>
    </div>
  );
}

/*
EXAMPLES - Copy one of these to get started:

1. PRODUCT GRID WITH REAL DATA:
component ProductShowcase {
  props {
    headline: String = "Featured Products"
  }

  data {
    products = fetch("/api/products?vendor_id=cd2e1122-d511-4edb-be5d-98ef274b4baf&limit=6") @cache(5m)
  }

  render {
    <div className="bg-black py-16 px-4">
      <h2 className="text-5xl font-black uppercase text-white mb-12 text-center">{headline}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {products.map(p => (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
            <img src={p.featured_image_storage} className="w-full aspect-square object-cover rounded-xl mb-4" />
            <h3 className="text-white font-black uppercase">{p.name}</h3>
            <p className="text-white/60 text-sm">\${p.price}</p>
          </div>
        ))}
      </div>
    </div>
  }
}

2. TESTIMONIALS WITH QUANTUM STATES:
component SmartTestimonials {
  data {
    reviews = fetch("/api/testimonials") @cache(10m)
  }

  render {
    quantum {
      state Mobile when user.device == "mobile" {
        <div className="py-12 px-4">
          {reviews.slice(0,3).map(r => <ReviewCard {...r} />)}
        </div>
      }

      state Desktop when user.device == "desktop" {
        <div className="py-20 px-8">
          <div className="grid grid-cols-3 gap-8">
            {reviews.map(r => <ReviewCard {...r} />)}
          </div>
        </div>
      }
    }
  }
}
*/`;
