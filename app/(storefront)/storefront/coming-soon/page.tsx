import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ComingSoonPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
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
        <div className="absolute top-[35%] right-[75%] w-[85px] h-[85px] md:w-[290px] md:h-[290px] bg-yellow-500/[0.10] rounded-full blur-[26px] md:blur-[46px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute bottom-[35%] right-[15%] w-[76px] h-[76px] md:w-[265px] md:h-[265px] bg-yellow-500/[0.08] rounded-full blur-[25px] md:blur-[44px] animate-pulse" style={{ animationDuration: '13s', animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Logo */}
        {vendor.logo_url && (
          <div className="mb-12 flex justify-center">
            <img 
              src={vendor.logo_url} 
              alt={vendor.store_name}
              className="w-32 h-32 object-contain opacity-80"
            />
          </div>
        )}

        {/* Heading */}
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 uppercase tracking-[-0.03em]">
          Coming Soon
        </h1>

        {/* Store Name */}
        <p className="text-3xl md:text-4xl text-white mb-6 font-light tracking-wide">
          {vendor.store_name}
        </p>

        {/* Tagline */}
        {vendor.store_tagline && (
          <p className="text-xl md:text-2xl text-neutral-400 font-light leading-relaxed mb-12 max-w-2xl mx-auto">
            {vendor.store_tagline}
          </p>
        )}

        {/* Message */}
        <p className="text-lg text-neutral-500 font-light mb-16 max-w-lg mx-auto">
          We're working on something special. Check back soon for the grand opening.
        </p>

        {/* Decorative Line */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-24 bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="h-px w-24 bg-white/20" />
        </div>

        {/* Footer Info */}
        <p className="text-sm text-white/40 font-light">
          Powered by Yacht Club
        </p>
      </div>
    </div>
  );
}

