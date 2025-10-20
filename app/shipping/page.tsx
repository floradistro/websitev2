import { Package, Clock, MapPin, Shield, Truck } from 'lucide-react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy | Flora Distro",
  description: "Fast, reliable shipping across our marketplace. Daily 2PM cutoff, next-day regional delivery to NC and East Tennessee. Full tracking on every order.",
};

export default function Shipping() {
  return (
    <div 
      className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Shipping
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed">
            Fast fulfillment across our marketplace. Daily shipping, full tracking, discreet delivery.
          </p>
        </div>
      </section>

      {/* Marketplace Shipping */}
      <section className="bg-[#2a2a2a] py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            One marketplace. Coordinated delivery.
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed mb-8">
            Shop multiple vendors in one cart. We coordinate fulfillment to ensure your products arrive quickly, safely, and discreetly—whether shipped from Flora Distro facilities or vendor locations.
          </p>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
            All vendors meet our strict shipping standards. You get the same quality experience, no matter who fulfills your order.
          </p>
        </div>
      </section>

      {/* Shipping Info Grid */}
      <section className="bg-[#3a3a3a] py-16">
        <div className="px-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            Delivery Standards
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px">
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Clock className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Daily Processing</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed mb-4">
              Most orders ship daily at 2PM EST
            </p>
            <p className="text-xs text-white/40 font-light">Mon-Fri, excluding holidays</p>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Truck className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Regional Next-Day</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed mb-4">
              NC and East Tennessee delivery
            </p>
            <p className="text-xs text-white/40 font-light">1 business day typical</p>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Shield className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Tracked & Insured</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed mb-4">
              Full tracking on every order
            </p>
            <p className="text-xs text-white/40 font-light">Email notifications</p>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Package className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Discreet Packaging</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed mb-4">
              Plain boxes, no branding
            </p>
            <p className="text-xs text-white/40 font-light">Marketplace-wide standard</p>
          </div>
        </div>
      </section>

      {/* Multi-Vendor Orders */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl uppercase tracking-[0.2em] text-white mb-8 font-normal">Multi-Vendor Orders</h2>
          <div className="bg-[#3a3a3a] border border-white/10 p-8">
            <p className="text-sm text-white/50 font-light leading-relaxed mb-6">
              If your cart includes products from multiple vendors, you may receive separate shipments. We optimize fulfillment for speed and product freshness.
            </p>
            <p className="text-sm text-white/50 font-light leading-relaxed mb-6">
              Each shipment is tracked individually. You'll receive tracking numbers for all packages via email.
            </p>
            <p className="text-xs text-white/40 font-light">
              Free shipping thresholds apply per-vendor. Orders over $45 from each vendor ship free.
            </p>
          </div>
        </div>
      </section>

      {/* Restricted States */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight text-center">
            Shipping restrictions
          </h2>
          <div className="bg-white/5 border border-white/10 p-8">
            <p className="text-sm text-white/50 font-light leading-relaxed mb-6">
              We cannot ship to: Arkansas, Hawaii, Idaho, Kansas, Louisiana, Oklahoma, Oregon, Rhode Island, Utah, Vermont.
            </p>
            <p className="text-xs text-white/40 font-light">
              You are responsible for ensuring products are legal in your state before ordering.
            </p>
          </div>
        </div>
      </section>

      {/* Policy */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl uppercase tracking-[0.2em] text-white mb-8 font-normal">Shipping Policy</h2>
          <div className="space-y-6 text-sm text-white/50 font-light leading-relaxed">
            <p>Orders ship Monday-Friday, excluding major holidays. Orders placed after 2PM EST process the next business day.</p>
            <p>Free shipping on orders over $45 per vendor. Standard rates apply otherwise and are calculated at checkout.</p>
            <p>Delivery times vary by vendor location and destination. Most orders arrive within 2-4 business days.</p>
            <p>We're not responsible for lost/stolen packages confirmed delivered to your address. Choose a secure delivery location.</p>
            <p>Damaged shipments? Contact us within 7 days with photos for replacement or refund.</p>
            <p>All vendors on our marketplace follow the same quality and safety standards for shipping.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
