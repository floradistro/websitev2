import type { Metadata } from "next";
import { Leaf, Package, Recycle, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Sustainability | Flora Distro",
  description: "Flora Distro's commitment to sustainable cannabis cultivation. Organic growing, minimal packaging, renewable energy—marketplace-wide standards.",
};

export default function Sustainability() {
  return (
    <div className="bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Sustainability
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed max-w-2xl mx-auto">
            Clean growing. Minimal waste. Better business—across our entire marketplace.
          </p>
        </div>
      </section>

      {/* Commitment */}
      <section className="bg-[#2a2a2a] py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            Marketplace-wide commitment
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed mb-8">
            As a marketplace, our responsibility extends beyond our own operations. We work with every vendor to uphold sustainable practices throughout the supply chain.
          </p>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
            When vendors join Flora Distro, they commit to our environmental standards. It's not optional—it's part of our partnership.
          </p>
        </div>
      </section>

      {/* Vendor Standards */}
      <section className="bg-[#3a3a3a] py-16">
        <div className="px-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            Vendor Standards
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px">
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Leaf className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Natural Cultivation</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              All vendors must use organic methods, minimize chemical inputs, and prioritize plant and soil health.
            </p>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Package className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Smart Packaging</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Recyclable materials, minimal plastic, biodegradable options. We review every vendor's packaging.
            </p>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Recycle className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Waste Reduction</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              From cultivation to fulfillment, vendors track and minimize waste at every step.
            </p>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Users className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Community Impact</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Fair labor practices, local sourcing, and giving back to the communities we serve.
            </p>
          </div>
        </div>
      </section>

      {/* Practices Grid */}
      <section className="bg-[#2a2a2a] py-16">
        <div className="px-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            Our Practices
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px">
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-12 border border-white/5">
            <h3 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Natural Farming</h3>
            <div className="space-y-3">
              <p className="text-xs text-white/50 font-light">• Organic growing methods</p>
              <p className="text-xs text-white/50 font-light">• No synthetic pesticides</p>
              <p className="text-xs text-white/50 font-light">• Water conservation systems</p>
              <p className="text-xs text-white/50 font-light">• Renewable energy priority</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-12 border border-white/5">
            <h3 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Minimal Packaging</h3>
            <div className="space-y-3">
              <p className="text-xs text-white/50 font-light">• Recyclable materials only</p>
              <p className="text-xs text-white/50 font-light">• Biodegradable options</p>
              <p className="text-xs text-white/50 font-light">• Plastic reduction targets</p>
              <p className="text-xs text-white/50 font-light">• Reusable container programs</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-12 border border-white/5">
            <h3 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Efficient Logistics</h3>
            <div className="space-y-3">
              <p className="text-xs text-white/50 font-light">• Consolidated shipping</p>
              <p className="text-xs text-white/50 font-light">• Route optimization</p>
              <p className="text-xs text-white/50 font-light">• Carbon offset programs</p>
              <p className="text-xs text-white/50 font-light">• Regional fulfillment hubs</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-12 border border-white/5">
            <h3 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Vendor Accountability</h3>
            <div className="space-y-3">
              <p className="text-xs text-white/50 font-light">• Regular sustainability audits</p>
              <p className="text-xs text-white/50 font-light">• Compliance verification</p>
              <p className="text-xs text-white/50 font-light">• Continuous improvement plans</p>
              <p className="text-xs text-white/50 font-light">• Transparent reporting</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Message */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            We're always improving.
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed mb-8">
            Sustainability isn't a checkbox. It's ongoing work. We assess our impact—and our vendors' impact—regularly and make changes that matter.
          </p>
          <p className="text-sm text-white/40 font-light">
            Every vendor partner commits to our sustainability standards. No exceptions.
          </p>
        </div>
      </section>
    </div>
  );
}
