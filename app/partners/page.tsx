'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-black text-white">
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
      <section className="pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className="mb-8 sm:mb-12"
          >
            <Image 
              src="/yacht-club-logo.png" 
              alt="Yacht Club" 
              width={100} 
              height={100}
              className="object-contain mx-auto sm:w-[120px] sm:h-[120px]"
            />
          </div>
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tight uppercase leading-[0.9]"
            style={{ fontWeight: 900 }}
          >
            Build
            <br />
            Platforms
            <br />
            <span className="text-white/60">Not Products</span>
          </h1>
          <div 
            className="h-[1px] w-32 bg-white/10 mx-auto mb-8 sm:mb-12"
          />
          <p 
            className="text-base sm:text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto px-4"
          >
            Multi-tenant infrastructure where each tenant gets a complete business system. AI-generated.
          </p>
        </div>
      </section>

      {/* The Vision */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div 
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16 text-center"
          >
            <div className="mb-6 sm:mb-8">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={60} 
                height={60}
                className="object-contain mx-auto opacity-40 sm:w-20 sm:h-20"
              />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 uppercase tracking-tight" style={{ fontWeight: 900 }}>
              Enterprise-Grade Infrastructure
              <br />
              <span className="text-white/60">AI-Generated Ecosystems</span>
            </h2>
            <p className="text-sm sm:text-base text-white/60 px-4">
              Retail operations. Wholesale networks. POS systems. Inventory. Analytics. Everything a business needs.
            </p>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black mb-8 sm:mb-12 text-center uppercase tracking-tight" style={{ fontWeight: 900 }}>
            What You Get
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { title: "Complete Infrastructure", desc: "E-commerce, POS, wholesale, inventory" },
              { title: "Infinite Tenants", desc: "Each isolated, each with full capabilities" },
              { title: "White Label", desc: "Your platform, our engine" }
            ].map((item, i) => (
              <div 
                key={i}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/10 transition-colors"
              >
                <div className="text-xs sm:text-sm font-black uppercase tracking-[0.08em] text-white mb-2 sm:mb-3" style={{ fontWeight: 900 }}>
                  {item.title}
                </div>
                <div className="text-xs sm:text-sm text-white/60">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-[0.12em] font-black text-center text-white/60 mb-8 sm:mb-12" style={{ fontWeight: 900 }}>
            Use Cases
          </div>
          <div className="space-y-3 sm:space-y-4">
            {[
              "Multi-vendor marketplaces",
              "SaaS platforms with customer portals",
              "Agency white-label solutions",
              "Vertical-specific commerce"
            ].map((text, i) => (
              <div 
                key={i}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-6 text-center"
              >
                <div className="text-xs sm:text-sm font-black uppercase tracking-[0.08em]" style={{ fontWeight: 900 }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16"
          >
            <div className="mb-6 sm:mb-8">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={80} 
                height={80}
                className="object-contain mx-auto sm:w-[100px] sm:h-[100px]"
              />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-6 uppercase tracking-tight" style={{ fontWeight: 900 }}>
              Interested?
            </h2>
            <p className="text-xs uppercase tracking-[0.12em] text-white/60 font-black mb-8 sm:mb-12" style={{ fontWeight: 900 }}>
              partners@yachtclub.dev
            </p>
            <Link
              href="/vendor/login"
              className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/90 font-black transition-all hover:scale-105"
              style={{ fontWeight: 900 }}
            >
              Request Access
            </Link>
          </div>
        </div>
      </section>

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
