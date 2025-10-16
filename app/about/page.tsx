export default async function AboutPage() {
  return (
    <div className="bg-[#1a1a1a]">
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
            Premium cannabis distribution. Direct from our facilities.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-[#2a2a2a] py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            Built on quality.<br/>Driven by trust.
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
            Flora Distro connects premium cannabis from trusted cultivators to stores and consumers across the region. We cut out the middleman, pass savings to you, and deliver fresh product on your schedule.
          </p>
        </div>
      </section>

      {/* Values Grid */}
      <section className="bg-[#3a3a3a] py-16">
        <div className="px-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            Our Values
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px">
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Quality</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Top shelf product. No exceptions.
            </p>
          </div>
          
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Transparency</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Real pricing. Real product. Always.
            </p>
          </div>
          
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Speed</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Daily shipping. Next-day regional.
            </p>
          </div>
          
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-8 border border-white/5 hover:border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Service</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Here when you need us. Period.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white mb-12 leading-tight">
            No middleman. No games.
          </h2>
          <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
            We source directly from our partner farms and facilities, package fresh, and ship fast. That's it. Clean business.
          </p>
        </div>
      </section>
    </div>
  );
}
