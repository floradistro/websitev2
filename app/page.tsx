import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeNavigation } from "@/components/HomeNavigation";
import { HomeCountdown } from "@/components/HomeCountdown";
import { HeroContent } from "@/components/HomePage/HeroContent";
import { AnimatedSection, AnimatedGrid, AnimatedGridItem } from "@/components/HomePage/AnimatedSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation - Client Component */}
      <HomeNavigation />

      {/* Hero Section - Animated */}
      <section className="pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative">
        <HeroContent />
      </section>

      {/* What Gets Built */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16 hover:border-white/10 transition-colors duration-500 relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-8 sm:mb-10 md:mb-12 tracking-tight uppercase text-center relative z-10" style={{ fontWeight: 900 }}>
              Everything You Need
            </h2>
            <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 relative z-10">
              {[
                { title: "Dispensary POS", desc: "Compliant point-of-sale systems" },
                { title: "E-Commerce", desc: "Online menu & ordering" },
                { title: "Inventory Management", desc: "Multi-location tracking" },
                { title: "Wholesale B2B", desc: "Distributor & brand portals" },
                { title: "Compliance & COAs", desc: "Lab results & documentation" },
                { title: "Analytics", desc: "Sales & performance insights" },
              ].map((item) => (
                <AnimatedGridItem key={item.title} className="text-center group">
                  <div className="text-xs uppercase tracking-[0.12em] font-black text-white mb-2 group-hover:text-white/80 transition-colors" style={{ fontWeight: 900 }}>
                    {item.title}
                  </div>
                  <div className="text-sm text-white/60">
                    {item.desc}
                  </div>
                </AnimatedGridItem>
              ))}
            </AnimatedGrid>
          </div>
        </div>
      </AnimatedSection>

      {/* The Stack */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16 hover:border-white/10 transition-all duration-500 group relative overflow-hidden">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="mb-6 sm:mb-8 relative">
              <div className="inline-block relative">
                <Image
                  src="/yacht-club-logo.png"
                  alt="Yacht Club"
                  width={60}
                  height={60}
                  className="object-contain mx-auto opacity-40 sm:w-20 sm:h-20 group-hover:opacity-60 transition-opacity duration-500"
                />
                {/* Subtle glow */}
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 uppercase tracking-tight relative z-10" style={{ fontWeight: 900 }}>
              Built for Cannabis
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto px-4 relative z-10">
              Every tool cannabis businesses need: compliant menus, strain data management, COA tracking, age verification, wholesale ordering, multi-location inventory, TV menu boards, and integrated POS. One platform, complete control.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Capabilities Grid */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-10 sm:mb-12 md:mb-16 text-center uppercase tracking-tight"
            style={{ fontWeight: 900 }}
          >
            Full-Stack Solutions
          </h2>
          <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              "Dispensary POS & payments",
              "Online menu & ordering",
              "Multi-location inventory",
              "Wholesale B2B portals",
              "Compliance & lab results",
              "Digital menu displays",
              "Brand & distributor tools",
              "Customer loyalty & analytics"
            ].map((item) => (
              <AnimatedGridItem
                key={item}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-6 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 group"
              >
                <div className="text-xs sm:text-sm font-black uppercase tracking-[0.08em] group-hover:text-white/90 transition-colors" style={{ fontWeight: 900 }}>
                  {item}
                </div>
              </AnimatedGridItem>
            ))}
          </AnimatedGrid>
        </div>
      </AnimatedSection>

      {/* Countdown Section - Client Component */}
      <HomeCountdown />

      {/* CTA Section */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 sm:mb-12 relative inline-block">
            <Image
              src="/yacht-club-logo.png"
              alt="Yacht Club"
              width={80}
              height={80}
              className="object-contain mx-auto sm:w-[100px] sm:h-[100px] relative z-10"
            />
            {/* Pulsing glow */}
            <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-8 sm:mb-12 uppercase tracking-tight leading-tight bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent" style={{ fontWeight: 900 }}>
            Ready To Build?
          </h2>
          <AnimatedGrid className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/vendor/login"
              className="group inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] font-black transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] w-full sm:w-auto relative overflow-hidden"
              style={{ fontWeight: 900 }}
            >
              <span className="relative z-10">Create Account</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform relative z-10" />
              {/* Animated shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center justify-center gap-3 bg-transparent border border-white/10 text-white px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/5 hover:border-white/20 font-black transition-all hover:scale-105 w-full sm:w-auto"
              style={{ fontWeight: 900 }}
            >
              <span>Partners</span>
            </Link>
          </AnimatedGrid>
        </div>
      </AnimatedSection>

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
