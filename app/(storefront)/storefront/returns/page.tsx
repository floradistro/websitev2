import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default async function ReturnsPage() {
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
            <span className="text-white/60 font-medium">Returns</span>
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
            Return Policy
          </h1>
          <p className="text-neutral-400 text-lg mb-12 font-light text-center">
            Your satisfaction is our priority
          </p>

          <div className="space-y-12">
            {/* Return Window */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white">30-Day Return Window</h2>
              </div>
              <div className="space-y-4 text-neutral-300 font-light leading-relaxed">
                <p>You have 30 days from the date of delivery to return any unused product in its original packaging.</p>
                <p>To be eligible for a return, products must be unopened and in the same condition that you received them.</p>
              </div>
            </section>

            {/* Eligible Items */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Eligible for Return</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-[20px] p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold text-sm">Unopened Products</p>
                    <p className="text-neutral-400 text-sm">In original packaging with seals intact</p>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-[20px] p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold text-sm">Damaged or Defective Items</p>
                    <p className="text-neutral-400 text-sm">Full refund or replacement within 7 days</p>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-[20px] p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold text-sm">Wrong Item Received</p>
                    <p className="text-neutral-400 text-sm">We'll cover return shipping</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Non-Returnable */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Not Eligible for Return</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-[20px] p-4 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold text-sm">Opened or Used Products</p>
                    <p className="text-neutral-400 text-sm">Cannot be returned for health and safety reasons</p>
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-[20px] p-4 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold text-sm">Sale or Clearance Items</p>
                    <p className="text-neutral-400 text-sm">All sales final</p>
                  </div>
                </div>
              </div>
            </section>

            {/* How to Return */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white">How to Return</h2>
              </div>
              <div className="space-y-4 text-neutral-300 font-light leading-relaxed">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm">1</div>
                    <div>
                      <p className="text-white font-semibold">Contact Us</p>
                      <p className="text-sm">Email us at returns@{vendor.slug}.com or call to initiate a return</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm">2</div>
                    <div>
                      <p className="text-white font-semibold">Get Return Label</p>
                      <p className="text-sm">We'll email you a prepaid return shipping label</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm">3</div>
                    <div>
                      <p className="text-white font-semibold">Ship It Back</p>
                      <p className="text-sm">Package securely and drop off at any shipping location</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm">4</div>
                    <div>
                      <p className="text-white font-semibold">Get Your Refund</p>
                      <p className="text-sm">Refund processed within 5-7 business days of receiving your return</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t border-white/10 pt-8">
              <p className="text-neutral-400 text-sm">
                Questions about returns? <Link href="/storefront/contact" className="text-white hover:underline">Contact us</Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

