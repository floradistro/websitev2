import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront, getVendorLocations } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, Instagram, Facebook, Twitter } from 'lucide-react';
import { UniversalPageRenderer } from '@/components/storefront/UniversalPageRenderer';

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const [vendor, locations] = await Promise.all([
    getVendorStorefront(vendorId),
    getVendorLocations(vendorId)
  ]);

  if (!vendor) {
    notFound();
  }

  const retailLocations = locations.filter((loc: any) => loc.type === 'retail');

  // Check if in preview mode (live editor)
  const params = await searchParams;
  if (params.preview === 'true') {
    return (
      <>
        <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
            <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider">
              <Link href="/storefront" className="text-white/40 hover:text-white transition-colors whitespace-nowrap">Home</Link>
              <span className="text-white/20">/</span>
              <span className="text-white/60 font-medium">Contact</span>
            </nav>
          </div>
        </div>
        <UniversalPageRenderer vendor={vendor} pageType="contact" locations={locations} />
      </>
    );
  }

  // Normal mode - show full page
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* UHD Gradient Background - iOS 26 */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_100%)]" />
      </div>
      
      {/* Scattered Color Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[3%] left-[2%] w-[80px] h-[80px] md:w-[280px] md:h-[280px] bg-red-500/[0.20] rounded-full blur-[25px] md:blur-[45px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[3%] right-[2%] w-[75px] h-[75px] md:w-[260px] md:h-[260px] bg-red-500/[0.18] rounded-full blur-[24px] md:blur-[42px] animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
        <div className="absolute top-[5%] right-[2%] w-[78px] h-[78px] md:w-[270px] md:h-[270px] bg-blue-500/[0.19] rounded-full blur-[25px] md:blur-[44px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute bottom-[5%] left-[2%] w-[72px] h-[72px] md:w-[250px] md:h-[250px] bg-blue-500/[0.17] rounded-full blur-[24px] md:blur-[43px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '5s' }} />
      </div>

      {/* Breadcrumb Navigation */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
          <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider">
            <Link
              href="/storefront"
              className="text-white/40 hover:text-white transition-colors whitespace-nowrap"
            >
              Home
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/60 font-medium">Contact</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* Animated Logo */}
            {vendor.logo_url && (
              <div className="mb-12 flex justify-center">
                <div className="relative w-32 h-32 md:w-40 md:h-40 animate-fadeIn">
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                  <img 
                    src={vendor.logo_url} 
                    alt={vendor.store_name}
                    className="relative w-full h-full object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            )}
            
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 uppercase tracking-[-0.03em]">
              Get in Touch
            </h1>
            <p className="text-2xl text-neutral-400 font-light leading-relaxed">
              We're here to help. Reach out anytime.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16 px-6 relative">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {/* Email */}
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all text-center">
                <div className="w-14 h-14 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center mb-6 mx-auto">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white mb-3 tracking-tight uppercase">Email Us</h3>
                <a href={`mailto:${vendor.social_links?.email || 'info@' + vendor.slug + '.com'}`} className="text-sm text-neutral-400 hover:text-white font-light transition-colors">
                  {vendor.social_links?.email || 'info@' + vendor.slug + '.com'}
                </a>
              </div>

              {/* Phone */}
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all text-center">
                <div className="w-14 h-14 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center mb-6 mx-auto">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white mb-3 tracking-tight uppercase">Call Us</h3>
                <a href={`tel:${retailLocations[0]?.phone || '1-800-CANNABIS'}`} className="text-sm text-neutral-400 hover:text-white font-light transition-colors">
                  {retailLocations[0]?.phone || '1-800-CANNABIS'}
                </a>
              </div>

              {/* Hours */}
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all text-center">
                <div className="w-14 h-14 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center mb-6 mx-auto">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white mb-3 tracking-tight uppercase">Hours</h3>
                <p className="text-sm text-neutral-400 font-light">
                  Mon-Sat: 9AM-9PM<br/>
                  Sunday: 10AM-6PM
                </p>
              </div>
            </div>

            {/* Social Media */}
            {vendor.social_links && (Object.keys(vendor.social_links).length > 0) && (
              <div className="text-center">
                <h3 className="text-xs uppercase tracking-wider font-semibold mb-6 text-white/60">
                  Follow Us
                </h3>
                <div className="flex items-center justify-center gap-4">
                  {vendor.social_links.instagram && (
                    <a 
                      href={vendor.social_links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-white/10 border border-white/20 hover:bg-white hover:border-white flex items-center justify-center transition-all hover:scale-110 group"
                    >
                      <Instagram className="w-5 h-5 text-white group-hover:text-black transition-colors" />
                    </a>
                  )}
                  {vendor.social_links.facebook && (
                    <a 
                      href={vendor.social_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-white/10 border border-white/20 hover:bg-white hover:border-white flex items-center justify-center transition-all hover:scale-110 group"
                    >
                      <Facebook className="w-5 h-5 text-white group-hover:text-black transition-colors" />
                    </a>
                  )}
                  {vendor.social_links.twitter && (
                    <a 
                      href={vendor.social_links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-white/10 border border-white/20 hover:bg-white hover:border-white flex items-center justify-center transition-all hover:scale-110 group"
                    >
                      <Twitter className="w-5 h-5 text-white group-hover:text-black transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Locations */}
        {retailLocations.length > 0 && (
          <section className="py-16 px-6 relative">
            <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
            <div className="max-w-7xl mx-auto relative z-10">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-12 text-center tracking-[-0.02em]">
                Visit Us
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {retailLocations.map((location: any) => {
                  const fullAddress = `${location.address_line1}, ${location.city}, ${location.state} ${location.zip}`;
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                  
                  return (
                    <div
                      key={location.id}
                      className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start gap-3 mb-6">
                        <div className="w-10 h-10 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1 tracking-tight">
                            {location.name}
                          </h3>
                          <div className="space-y-1 text-sm text-neutral-400 font-light">
                            <div>{location.address_line1}</div>
                            <div>{location.city}, {location.state} {location.zip}</div>
                          </div>
                        </div>
                      </div>

                      {location.phone && (
                        <div className="mb-6">
                          <a href={`tel:${location.phone}`} className="text-sm text-neutral-400 hover:text-white transition-colors">
                            {location.phone}
                          </a>
                        </div>
                      )}

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-white font-semibold hover:gap-3 transition-all"
                      >
                        <span>Get directions</span>
                        <span>→</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6 tracking-[-0.02em]">
              Have a question about a product?
            </h2>
            <p className="text-lg text-neutral-400 font-light mb-10">
              Our team is standing by to help you find exactly what you need.
            </p>
            <Link
              href="/storefront/shop"
              className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full text-base font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all duration-300 shadow-2xl shadow-white/20 hover:shadow-white/30 hover:scale-105"
            >
              <span>Browse Products</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
