import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, MapPin, DollarSign } from 'lucide-react';

export default async function ShippingPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
          <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider">
            <Link href="/storefront" className="text-white/40 hover:text-white transition-colors">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white/60 font-medium">Shipping</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-black rounded-[32px] border border-white/10 p-8 md:p-12">
          {/* Animated Logo Header */}
          {vendor.logo_url && (
            <div className="mb-8 flex justify-center">
              <div className="relative w-20 h-20 animate-fadeIn">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.store_name}
                  className="relative w-full h-full object-contain drop-shadow-xl opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-500"
                />
              </div>
            </div>
          )}
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 uppercase tracking-[-0.03em] text-center">
            Shipping Policy
          </h1>
          <p className="text-neutral-400 text-lg mb-12 font-light text-center">
            Fast, reliable shipping across the United States
          </p>

          <div className="space-y-12">
            {/* Shipping Options */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Shipping Options</h2>
              </div>
              <div className="space-y-4 text-neutral-300 font-light leading-relaxed">
                <div className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                  <h3 className="text-white font-semibold mb-2">Standard Shipping</h3>
                  <p className="text-sm">3-5 business days • $9.99</p>
                  <p className="text-sm mt-2">Free on orders over $45</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                  <h3 className="text-white font-semibold mb-2">Express Shipping</h3>
                  <p className="text-sm">2-3 business days • $19.99</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                  <h3 className="text-white font-semibold mb-2">Same-Day Shipping</h3>
                  <p className="text-sm">Order before 2PM local time • Ships same day</p>
                  <p className="text-sm mt-2">Available for select regions</p>
                </div>
              </div>
            </section>

            {/* Processing Time */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Processing Time</h2>
              </div>
              <div className="space-y-4 text-neutral-300 font-light leading-relaxed">
                <p>All orders are processed within 24 hours. Orders placed after 2PM will be processed the next business day.</p>
                <p>You will receive a confirmation email with tracking information once your order ships.</p>
              </div>
            </section>

            {/* Shipping Restrictions */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Shipping Restrictions</h2>
              </div>
              <div className="space-y-4 text-neutral-300 font-light leading-relaxed">
                <p>We currently ship to all US states except:</p>
                <div className="bg-red-500/10 border border-red-500/20 rounded-[20px] p-6">
                  <p className="text-sm">Arkansas, Hawaii, Idaho, Kansas, Louisiana, Oklahoma, Oregon, Rhode Island, Utah, Vermont</p>
                </div>
                <p className="text-sm">All products contain less than 0.3% hemp-derived Delta-9 THC in compliance with the 2018 Farm Bill.</p>
              </div>
            </section>

            {/* International */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white">International Shipping</h2>
              </div>
              <div className="space-y-4 text-neutral-300 font-light leading-relaxed">
                <p>We currently only ship within the United States. International shipping is not available at this time.</p>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t border-white/10 pt-8">
              <p className="text-neutral-400 text-sm">
                Have questions about shipping? <Link href="/storefront/contact" className="text-white hover:underline">Contact us</Link>
              </p>
            </section>
          </div>
        </div>
      </div>
      
    </div>
  );
}

