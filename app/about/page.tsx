import type { Metadata } from "next";
import Link from "next/link";
import { Store, Users, Truck, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Flora Distro",
  description: "Flora Distro is the premier cannabis marketplace connecting trusted vendors with customers. Premium products, transparent pricing, and fast delivery across NC and TN.",
  openGraph: {
    title: "About Flora Distro",
    description: "The premier cannabis marketplace. Connecting trusted vendors with customers nationwide.",
    type: "website",
  },
};

export default async function AboutPage() {
  return (
    <div 
      className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            About Flora Distro
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed max-w-2xl mx-auto">
            The premier cannabis marketplace connecting trusted vendors with customers nationwide.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-[#2a2a2a] py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            Built on quality.<br/>Driven by trust.
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed mb-8">
            Flora Distro is more than a marketplace. We're a curated ecosystem of verified vendors, each bringing their unique products and expertise to customers who demand quality.
          </p>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
            From our own facilities to carefully vetted partner vendors, every product on our platform meets rigorous standards. We handle the logistics, security, and trust—so vendors can focus on what they do best.
          </p>
        </div>
      </section>

      {/* Marketplace Features */}
      <section className="bg-[#3a3a3a] py-16">
        <div className="px-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            The Marketplace
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px">
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <Store className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Curated Vendors</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Verified cultivators and manufacturers. Every vendor meets our quality standards.
            </p>
          </div>
          
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <Users className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Vendor Partnership</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              We empower vendors with tools, support, and a platform to reach more customers.
            </p>
          </div>
          
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <Truck className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Unified Fulfillment</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Shop multiple vendors in one cart. We coordinate fulfillment for seamless delivery.
            </p>
          </div>
          
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <Shield className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Trust & Safety</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Secure transactions, verified products, guaranteed quality on every order.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="bg-[#2a2a2a] py-16">
        <div className="px-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            Our Values
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px">
          <div className="bg-[#2a2a2a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Quality</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Every product vetted. Every vendor verified. No compromises.
            </p>
          </div>
          
          <div className="bg-[#2a2a2a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Transparency</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Real pricing. Clear sourcing. Lab results available. Always.
            </p>
          </div>
          
          <div className="bg-[#2a2a2a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Innovation</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Empowering vendors with technology to grow their business.
            </p>
          </div>
          
          <div className="bg-[#2a2a2a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Community</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Building relationships between vendors and customers who value excellence.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            One platform. Endless possibilities.
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed mb-12">
            Whether you're a vendor looking to expand your reach or a customer seeking the best cannabis products, Flora Distro brings the industry together under one trusted roof.
          </p>
          <Link 
            href="/vendors"
            className="inline-flex items-center justify-center bg-black text-white px-12 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black font-medium border border-white/20 hover:border-white transition-all duration-300"
          >
            Browse Vendors
          </Link>
        </div>
      </section>
    </div>
  );
}
