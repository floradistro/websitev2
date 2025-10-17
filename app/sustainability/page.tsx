import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sustainability | Flora Distro",
  description: "Flora Distro's commitment to sustainable cannabis cultivation. Organic growing methods, minimal packaging, renewable energy, and continuous improvement.",
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
            Clean growing. Minimal waste. Better business.
          </p>
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
              <p className="text-xs text-white/50 font-light">• Water conservation</p>
              <p className="text-xs text-white/50 font-light">• Renewable energy</p>
            </div>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-12 border border-white/5">
            <h3 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Minimal Packaging</h3>
            <div className="space-y-3">
              <p className="text-xs text-white/50 font-light">• Recyclable materials</p>
              <p className="text-xs text-white/50 font-light">• Biodegradable options</p>
              <p className="text-xs text-white/50 font-light">• Minimal plastic</p>
              <p className="text-xs text-white/50 font-light">• Reusable containers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            We're always improving.
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
            Sustainability isn't a checkbox. It's ongoing work. We assess our impact regularly and make changes that matter.
          </p>
        </div>
      </section>
    </div>
  );
}
