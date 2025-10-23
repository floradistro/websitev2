import { VendorStorefront } from '@/lib/storefront/get-vendor';
import Link from 'next/link';

interface StorefrontHeroProps {
  vendor: VendorStorefront;
}

export function StorefrontHero({ vendor }: StorefrontHeroProps) {
  const hasCustomBanner = vendor.banner_url;

  return (
    <section 
      className="relative h-[70vh] flex items-center justify-center text-center"
      style={{
        backgroundImage: hasCustomBanner ? `url(${vendor.banner_url})` : 'none',
        backgroundColor: hasCustomBanner ? 'transparent' : (vendor.brand_colors?.primary || '#000'),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for better text readability */}
      {hasCustomBanner && (
        <div className="absolute inset-0 bg-black/40"></div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 
          className="text-5xl md:text-6xl font-bold mb-6"
          style={{ 
            color: hasCustomBanner ? '#FFFFFF' : (vendor.brand_colors?.secondary || '#FFFFFF')
          }}
        >
          {vendor.store_tagline || vendor.store_name}
        </h1>
        
        <p 
          className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto"
          style={{ 
            color: hasCustomBanner ? '#FFFFFF' : (vendor.brand_colors?.secondary || '#FFFFFF'),
            opacity: 0.9
          }}
        >
          {vendor.store_description || 'Premium cannabis products delivered to your door'}
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link 
            href="/shop"
            className="px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
            style={{
              backgroundColor: vendor.brand_colors?.accent || '#FFFFFF',
              color: vendor.brand_colors?.primary || '#000000'
            }}
          >
            Shop Now
          </Link>
          
          <Link 
            href="/about"
            className="px-8 py-4 rounded-lg font-semibold text-lg border-2 transition-all hover:scale-105"
            style={{
              borderColor: hasCustomBanner ? '#FFFFFF' : (vendor.brand_colors?.secondary || '#FFFFFF'),
              color: hasCustomBanner ? '#FFFFFF' : (vendor.brand_colors?.secondary || '#FFFFFF'),
              backgroundColor: 'transparent'
            }}
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}

