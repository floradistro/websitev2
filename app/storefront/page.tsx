import { getVendorFromHeaders, getVendorStorefront, getVendorProducts } from '@/lib/storefront/get-vendor';
import { StorefrontHero } from '@/components/storefront/StorefrontHero';
import { StorefrontProductsSection } from '@/components/storefront/StorefrontProductsSection';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Package, CheckCircle, Truck, Shield } from 'lucide-react';

export default async function StorefrontHomePage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);
  const products = await getVendorProducts(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="bg-[#2a2a2a] overflow-x-hidden w-full">
      {/* Hero Section */}
      <StorefrontHero vendor={vendor} />

      {/* Vendor Mission Statement */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/40 via-[#1a1a1a]/35 to-[#1a1a1a]/30 backdrop-blur-sm"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-8 leading-none tracking-tight">
            {vendor.store_tagline || `Premium Cannabis`}
          </h2>
          <p className="text-base sm:text-lg md:text-xl font-light text-white/50 leading-relaxed max-w-2xl mx-auto mb-12">
            {vendor.store_description || `Curated selection of premium cannabis products.`}
          </p>
          <Link 
            href="/shop"
            className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/15 hover:border-white/30 transition-all duration-300 font-medium"
          >
            <Package size={16} />
            <span>Shop Now</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <StorefrontProductsSection products={products} />
      )}

      {/* Vendor Features */}
      <section className="relative py-16 overflow-x-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a3a]/35 to-[#3a3a3a]/30 backdrop-blur-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px relative z-10">
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <Package className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Premium Quality</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Every product curated for quality and consistency.
            </p>
          </div>
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <Truck className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Fast Delivery</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Quick and discreet shipping to your door.
            </p>
          </div>
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <Shield className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Secure Shopping</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Safe checkout with encrypted payments.
            </p>
          </div>
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <CheckCircle className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Verified Products</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Lab tested and compliant with all regulations.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      {vendor.store_description && (
        <section className="relative py-20 px-4 sm:px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/60 to-[#1a1a1a]/40"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6 uppercase tracking-wider">
              About {vendor.store_name}
            </h2>
            <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent mx-auto mb-8"></div>
            <p className="text-white/60 text-lg font-light leading-relaxed">
              {vendor.store_description}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

