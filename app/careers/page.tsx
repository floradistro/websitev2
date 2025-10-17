import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers | Flora Distro",
  description: "Join the Flora Distro team. Explore career opportunities in customer service, fulfillment, quality control, and sales at our NC and TN locations.",
};

export default function Careers() {
  return (
    <div className="bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Careers
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed max-w-2xl mx-auto">
            Join the team. Build something real.
          </p>
        </div>
      </section>

      {/* Opportunities Grid */}
      <section className="bg-[#2a2a2a] py-16">
        <div className="px-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            Open Positions
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px">
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Customer Service</h3>
            <p className="text-xs text-white/50 font-light">Help customers get what they need</p>
          </div>
          
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Fulfillment</h3>
            <p className="text-xs text-white/50 font-light">Pack and ship orders daily</p>
          </div>
          
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Quality Control</h3>
            <p className="text-xs text-white/50 font-light">Ensure every product meets standards</p>
          </div>
          
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Sales</h3>
            <p className="text-xs text-white/50 font-light">Build relationships, grow accounts</p>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            Ready to apply?
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
