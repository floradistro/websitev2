import type { Metadata } from "next";
import { Building2, Store, Headphones, Package, TrendingUp, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers | Flora Distro",
  description: "Join Flora Distro or become a vendor partner. Opportunities in marketplace operations, vendor support, logistics, and business partnerships.",
};

export default function Careers() {
  return (
    <div 
      className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Careers
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed max-w-2xl mx-auto">
            Build the future of cannabis commerce. Join the team or become a vendor partner.
          </p>
        </div>
      </section>

      {/* Two Paths */}
      <section className="bg-[#2a2a2a] py-16">
        <div className="grid md:grid-cols-2 gap-px">
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-16 border border-white/5">
            <Building2 className="w-12 h-12 mb-8 text-white/60" />
            <h2 className="text-2xl font-light text-white mb-6 uppercase tracking-wider">
              Join Flora Distro
            </h2>
            <p className="text-sm text-white/50 font-light leading-relaxed">
              Work with us to build the platform, support vendors, and create the best marketplace experience in cannabis.
            </p>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-16 border border-white/5">
            <Store className="w-12 h-12 mb-8 text-white/60" />
            <h2 className="text-2xl font-light text-white mb-6 uppercase tracking-wider">
              Become a Vendor
            </h2>
            <p className="text-sm text-white/50 font-light leading-relaxed">
              Bring your products to a curated marketplace. Gain access to customers, tools, and support to grow your business.
            </p>
          </div>
        </div>
      </section>

      {/* Opportunities Grid */}
      <section className="bg-[#1a1a1a] py-16">
        <div className="px-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            Open Positions
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">
          <div className="bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <Headphones className="w-8 h-8 mb-4 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Vendor Support</h3>
            <p className="text-xs text-white/50 font-light">Help vendors succeed on the platform</p>
          </div>
          
          <div className="bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <Package className="w-8 h-8 mb-4 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Fulfillment Ops</h3>
            <p className="text-xs text-white/50 font-light">Coordinate logistics across vendors</p>
          </div>
          
          <div className="bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <Users className="w-8 h-8 mb-4 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Customer Service</h3>
            <p className="text-xs text-white/50 font-light">Help customers navigate the marketplace</p>
          </div>

          <div className="bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <TrendingUp className="w-8 h-8 mb-4 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Marketplace Analytics</h3>
            <p className="text-xs text-white/50 font-light">Data-driven insights for growth</p>
          </div>
          
          <div className="bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <Building2 className="w-8 h-8 mb-4 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Vendor Relations</h3>
            <p className="text-xs text-white/50 font-light">Recruit and onboard new vendors</p>
          </div>

          <div className="bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <Store className="w-8 h-8 mb-4 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Quality Assurance</h3>
            <p className="text-xs text-white/50 font-light">Ensure vendor compliance and quality</p>
          </div>
        </div>
      </section>

      {/* Vendor Partnership */}
      <section className="bg-[#2a2a2a] py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight text-center">
            Ready to sell on Flora Distro?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-[#3a3a3a] border border-white/10 p-8">
              <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">What We Provide</h3>
              <div className="space-y-3 text-xs text-white/50 font-light">
                <p>• Access to established customer base</p>
                <p>• Marketplace platform & tools</p>
                <p>• Payment processing & security</p>
                <p>• Marketing & promotion support</p>
                <p>• Fulfillment coordination</p>
              </div>
            </div>

            <div className="bg-[#3a3a3a] border border-white/10 p-8">
              <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">What We Require</h3>
              <div className="space-y-3 text-xs text-white/50 font-light">
                <p>• Quality products & lab testing</p>
                <p>• Reliable inventory management</p>
                <p>• Commitment to sustainability</p>
                <p>• Professional customer service</p>
                <p>• Compliance with platform standards</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-base md:text-lg font-light text-white/50 leading-relaxed mb-8">
              Interested in becoming a vendor partner? Let's talk.
            </p>
            <a 
              href="mailto:vendors@floradistro.com" 
              className="inline-flex items-center justify-center bg-black text-white px-12 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black font-medium border border-white/20 hover:border-white transition-all duration-300"
            >
              vendors@floradistro.com
            </a>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            Ready to apply for a position?
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed mb-12">
            Send your resume to <a href="mailto:careers@floradistro.com" className="text-white underline hover:no-underline">careers@floradistro.com</a>
          </p>
          <p className="text-xs text-white/40 font-light">
            Flora Distro is an equal opportunity employer.
          </p>
        </div>
      </section>
    </div>
  );
}
