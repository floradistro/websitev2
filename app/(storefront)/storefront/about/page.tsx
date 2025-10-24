import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Award, Leaf, Users } from 'lucide-react';
import AnimatedStats from '@/components/storefront/AnimatedStats';
import { UniversalPageRenderer } from '@/components/storefront/UniversalPageRenderer';

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  // If in preview mode (live editor), use Universal Renderer without breadcrumb
  const params = await searchParams;
  if (params.preview === 'true') {
    return (
      <div className="-mt-[44px]">
        <UniversalPageRenderer vendor={vendor} pageType="about" />
      </div>
    );
  }

  // Normal mode - show existing page
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
            <span className="text-white/60 font-medium">About</span>
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
              We're the biggest
            </h1>
            <p className="text-2xl text-neutral-400 font-light leading-relaxed">
              Because we deliver the freshest product. Period.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="space-y-6 text-xl text-white/90 leading-relaxed font-light">
              <p className="text-2xl text-white font-normal">
                Sourced nationwide. Headquartered in Charlotte, NC.
              </p>
              
              <p>
                We built {vendor.store_name} on one principle: if it's not the freshest, we don't carry it.
              </p>
              
              <p>
                While others warehouse product for months, we move inventory in days. Direct relationships 
                with the best growers across the country. Small-batch drops. Never stale.
              </p>
              
              <p>
                Same-day shipping before 2PM. Next-day regional delivery. 
                This isn't just logistics—it's our commitment to peak freshness.
              </p>
            </div>
          </div>
        </section>

        {/* What Sets Us Apart - Sharp & Direct */}
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
          <div className="max-w-7xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 text-center tracking-[-0.03em] uppercase">
              The difference
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 hover:bg-white/[0.08] hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Fastest turnover</h3>
                <p className="text-base text-neutral-300 font-light leading-relaxed">
                  Product moves in days. What you buy was harvested recently.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 hover:bg-white/[0.08] hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Nationwide sourcing</h3>
                <p className="text-base text-neutral-300 font-light leading-relaxed">
                  Direct relationships with top cultivators. Hand-selected strains only.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 hover:bg-white/[0.08] hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Lab tested</h3>
                <p className="text-base text-neutral-300 font-light leading-relaxed">
                  Third-party testing on everything. Full transparency.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 hover:bg-white/[0.08] hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Charlotte HQ</h3>
                <p className="text-base text-neutral-300 font-light leading-relaxed">
                  Five retail locations. Ship nationwide (where legal).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Numbers Section - Animated */}
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
          <div className="max-w-5xl mx-auto relative z-10">
            <AnimatedStats />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-[-0.03em]">
              Freshness isn't a feature.<br/>It's the standard.
            </h2>
            <p className="text-xl text-neutral-400 font-light mb-12">
              Experience the difference.
            </p>
            <Link
              href="/storefront/shop"
              className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full text-base font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all duration-300 shadow-2xl shadow-white/20 hover:shadow-white/30 hover:scale-105"
            >
              <span>Shop Now</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
