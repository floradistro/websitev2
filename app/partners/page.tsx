'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSection, AnimatedGrid, AnimatedGridItem } from "@/components/HomePage/AnimatedSection";

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2 sm:gap-4">
              <Image
                src="/yacht-club-logo.png"
                alt="WhaleTools"
                width={32}
                height={32}
                className="object-contain sm:w-10 sm:h-10"
              />
              <span className="text-base sm:text-xl font-black uppercase tracking-[0.08em]" style={{ fontWeight: 900 }}>WhaleTools</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors" style={{ fontWeight: 900 }}>
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Subtle gradient glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="mb-8 sm:mb-12 relative z-10"
          >
            <div className="relative inline-block">
              <Image
                src="/yacht-club-logo.png"
                alt="Yacht Club"
                width={100}
                height={100}
                className="object-contain mx-auto sm:w-[120px] sm:h-[120px]"
              />
              <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl scale-75" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tight uppercase leading-[0.9] relative z-10"
            style={{ fontWeight: 900 }}
          >
            <span className="bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">White Label</span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.45, 0.27, 0.9] }}
              className="inline-block"
            >
              Cannabis
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.21, 0.45, 0.27, 0.9] }}
              className="inline-block text-white/60"
            >
              Commerce
            </motion.span>
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-8 sm:mb-12"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="text-base sm:text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto px-4 relative z-10"
          >
            Power your platform with our complete cannabis operations infrastructure. Fully white-labeled, infinitely scalable, purpose-built for cannabis retail and wholesale.
          </motion.p>
        </div>
      </section>

      {/* The Vision */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16 text-center hover:border-white/10 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="mb-6 sm:mb-8 relative">
              <div className="inline-block relative">
                <Image
                  src="/yacht-club-logo.png"
                  alt="WhaleTools"
                  width={60}
                  height={60}
                  className="object-contain mx-auto opacity-40 sm:w-20 sm:h-20 group-hover:opacity-60 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 uppercase tracking-tight relative z-10" style={{ fontWeight: 900 }}>
              Complete Cannabis
              <br />
              <span className="text-white/60">Operations Platform</span>
            </h2>
            <p className="text-sm sm:text-base text-white/60 px-4 relative z-10">
              Dispensary POS, online menus, wholesale portals, multi-location inventory, compliance tracking, lab results management. Everything your customers need, under your brand.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* What You Get */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-12 text-center uppercase tracking-tight" style={{ fontWeight: 900 }}>
            Partnership Benefits
          </h2>
          <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { title: "Full Cannabis Stack", desc: "Compliant POS, menus, inventory, wholesale, COAs" },
              { title: "Unlimited Customers", desc: "Scale infinitely, each customer fully isolated" },
              { title: "Your Brand", desc: "Fully white-labeled under your platform" }
            ].map((item, i) => (
              <AnimatedGridItem
                key={i}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 group"
              >
                <div className="text-xs sm:text-sm font-black uppercase tracking-[0.08em] text-white mb-2 sm:mb-3 group-hover:text-white/90 transition-colors" style={{ fontWeight: 900 }}>
                  {item.title}
                </div>
                <div className="text-xs sm:text-sm text-white/60">
                  {item.desc}
                </div>
              </AnimatedGridItem>
            ))}
          </AnimatedGrid>
        </div>
      </AnimatedSection>

      {/* Use Cases */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-[0.12em] font-black text-center text-white/60 mb-8 sm:mb-12" style={{ fontWeight: 900 }}>
            Use Cases
          </div>
          <AnimatedGrid className="space-y-3 sm:space-y-4">
            {[
              "Cannabis marketplace platforms",
              "Regional dispensary networks",
              "Technology service providers",
              "Cannabis brands & distributors"
            ].map((text, i) => (
              <AnimatedGridItem
                key={i}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-6 text-center hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 group"
              >
                <div className="text-xs sm:text-sm font-black uppercase tracking-[0.08em] group-hover:text-white/90 transition-colors" style={{ fontWeight: 900 }}>
                  {text}
                </div>
              </AnimatedGridItem>
            ))}
          </AnimatedGrid>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16 hover:border-white/10 transition-colors duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="mb-6 sm:mb-8 relative inline-block">
              <Image
                src="/yacht-club-logo.png"
                alt="WhaleTools"
                width={80}
                height={80}
                className="object-contain mx-auto sm:w-[100px] sm:h-[100px] relative z-10"
              />
              <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-6 uppercase tracking-tight relative z-10" style={{ fontWeight: 900 }}>
              Interested?
            </h2>
            <p className="text-xs uppercase tracking-[0.12em] text-white/60 font-black mb-8 sm:mb-12 relative z-10" style={{ fontWeight: 900 }}>
              partners@yachtclub.dev
            </p>
            <Link
              href="/vendor/login"
              className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] font-black transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] relative z-10 overflow-hidden group"
              style={{ fontWeight: 900 }}
            >
              <span className="relative z-10">Request Access</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="flex items-center gap-3 sm:gap-4">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
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
