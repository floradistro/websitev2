import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeNavigation } from "@/components/HomeNavigation";
import { HomeCountdown } from "@/components/HomeCountdown";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation - Client Component */}
      <HomeNavigation />

      {/* Hero Section - Server Rendered */}
      <section className="pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Large Logo */}
          <div className="mb-8 sm:mb-12 flex justify-center">
            <Image 
              src="/yacht-club-logo.png" 
              alt="Yacht Club" 
              width={180} 
              height={180}
              className="object-contain sm:w-[240px] sm:h-[240px] md:w-[280px] md:h-[280px]"
              priority
            />
          </div>
          
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 sm:mb-8 tracking-tight leading-[0.9] uppercase"
            style={{ fontWeight: 900 }}
          >
            Generate
            <br />
            Business
            <br />
            <span className="text-white/60">Ecosystems</span>
          </h1>
          
          <div className="h-[1px] w-32 bg-white/10 mx-auto mb-12" />
          
          <p className="text-base sm:text-lg md:text-xl text-white/60 font-normal leading-relaxed max-w-2xl mx-auto mb-12 sm:mb-16 px-4">
            AI builds the entire stack. Storefronts, inventory, POS, analytics. Everything.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/vendor/login"
              className="group inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/90 font-black transition-all hover:scale-105 w-full sm:w-auto"
              style={{ fontWeight: 900 }}
            >
              <span>Start Building</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/api-status"
              className="inline-flex items-center justify-center gap-3 bg-transparent border border-white/5 text-white px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/5 hover:border-white/10 font-black transition-all hover:scale-105 w-full sm:w-auto"
              style={{ fontWeight: 900 }}
            >
              <span>View API</span>
            </Link>
          </div>
        </div>
      </section>

      {/* What Gets Built */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-8 sm:mb-10 md:mb-12 tracking-tight uppercase text-center" style={{ fontWeight: 900 }}>
              Complete Infrastructure
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                { title: "Public Storefronts", desc: "Customer-facing e-commerce" },
                { title: "Internal Dashboards", desc: "Vendor & admin portals" },
                { title: "POS Systems", desc: "Point-of-sale terminals" },
                { title: "Inventory", desc: "Real-time stock management" },
                { title: "Wholesale", desc: "B2B ordering platforms" },
                { title: "Analytics", desc: "Business intelligence" },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="text-xs uppercase tracking-[0.12em] font-black text-white mb-2" style={{ fontWeight: 900 }}>
                    {item.title}
                  </div>
                  <div className="text-sm text-white/60">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Stack */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16">
            <div className="mb-6 sm:mb-8">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club" 
                width={60} 
                height={60}
                className="object-contain mx-auto opacity-40 sm:w-20 sm:h-20"
              />
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 uppercase tracking-tight" style={{ fontWeight: 900 }}>
              Not Just Websites
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto px-4">
              Complete business operating systems. E-commerce, inventory, POS, wholesale, analytics, customer portals, employee tools. All generated, all connected.
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-10 sm:mb-12 md:mb-16 text-center uppercase tracking-tight" 
            style={{ fontWeight: 900 }}
          >
            What We Build
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              "Multi-vendor marketplaces",
              "Point-of-sale systems",
              "Inventory management",
              "Wholesale platforms",
              "Analytics dashboards",
              "Customer loyalty programs",
              "Employee portals",
              "TV menu displays"
            ].map((item) => (
              <div
                key={item}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-6 hover:border-white/10 transition-colors"
              >
                <div className="text-xs sm:text-sm font-black uppercase tracking-[0.08em]" style={{ fontWeight: 900 }}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countdown Section - Client Component */}
      <HomeCountdown />

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 sm:mb-12">
            <Image 
              src="/yacht-club-logo.png" 
              alt="Yacht Club" 
              width={80} 
              height={80}
              className="object-contain mx-auto sm:w-[100px] sm:h-[100px]"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 sm:mb-12 uppercase tracking-tight leading-tight" style={{ fontWeight: 900 }}>
            Ready To Build?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/vendor/login"
              className="group inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/90 font-black transition-all hover:scale-105 w-full sm:w-auto"
              style={{ fontWeight: 900 }}
            >
              <span>Create Account</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center justify-center gap-3 bg-transparent border border-white/5 text-white px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/5 hover:border-white/10 font-black transition-all hover:scale-105 w-full sm:w-auto"
              style={{ fontWeight: 900 }}
            >
              <span>Partners</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 sm:py-12 md:py-16 px-4 sm:px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="flex items-center gap-3 sm:gap-4">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club" 
                width={28} 
                height={28}
                className="object-contain opacity-60 sm:w-8 sm:h-8"
              />
              <span className="text-xs uppercase tracking-[0.12em] text-white/40 font-black" style={{ fontWeight: 900 }}>
                © 2025 WhaleTools
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
              {['About', 'Partners', 'API', 'Privacy', 'Terms'].map(link => (
                <Link 
                  key={link} 
                  href={`/${link.toLowerCase()}`} 
                  className="text-xs uppercase tracking-[0.12em] text-white/40 hover:text-white transition-colors font-black"
                  style={{ fontWeight: 900 }}
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
          <div className="text-center">
            <Image 
              src="/yacht-club-logo.png" 
              alt="Yacht Club" 
              width={48} 
              height={48}
              className="object-contain mx-auto opacity-20 sm:w-[60px] sm:h-[60px]"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
