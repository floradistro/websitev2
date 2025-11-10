"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  AnimatedSection,
  AnimatedGrid,
  AnimatedGridItem,
} from "@/components/HomePage/AnimatedSection";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2 sm:gap-4">
              <Image
                src="/yacht-club-logo.png"
                alt="Yacht Club"
                width={32}
                height={32}
                className="object-contain sm:w-10 sm:h-10"
              />
              <span
                className="text-base sm:text-xl font-black uppercase tracking-[0.08em]"
                style={{ fontWeight: 900 }}
              >
                WhaleTools
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors"
              style={{ fontWeight: 900 }}
            >
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
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.21, 0.45, 0.27, 0.9],
            }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tight uppercase leading-[0.9] relative z-10"
            style={{ fontWeight: 900 }}
          >
            <span className="bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">
              Cannabis
            </span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.4,
                ease: [0.21, 0.45, 0.27, 0.9],
              }}
              className="inline-block"
            >
              Operations
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.6,
                ease: [0.21, 0.45, 0.27, 0.9],
              }}
              className="inline-block text-white/60"
            >
              Simplified
            </motion.span>
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{
              duration: 0.8,
              delay: 0.8,
              ease: [0.21, 0.45, 0.27, 0.9],
            }}
            className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-8 sm:mb-12"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 1,
              ease: [0.21, 0.45, 0.27, 0.9],
            }}
            className="text-base sm:text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto px-4 relative z-10"
          >
            The first complete operations platform built specifically for
            cannabis retailers, distributors, and brands. From storefront to
            back office, we handle it all.
          </motion.p>
        </div>
      </section>

      {/* What We Build */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16 hover:border-white/10 transition-colors duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <h2
              className="text-2xl sm:text-3xl font-black mb-8 sm:mb-12 tracking-tight uppercase text-center relative z-10"
              style={{ fontWeight: 900 }}
            >
              Built for Cannabis
            </h2>
            <div className="space-y-8 relative z-10">
              {[
                {
                  title: "Dispensary Operations",
                  desc: "Compliant POS systems, online menus, inventory management, TV displays, age verification, compliance tracking",
                },
                {
                  title: "Wholesale & Distribution",
                  desc: "B2B portals for brands and distributors, bulk ordering, multi-vendor catalogs, commission tracking, purchase orders",
                },
                {
                  title: "Complete Platform",
                  desc: "Everything runs on one system. Retailers, distributors, and brands all connected. Real-time inventory, automated fulfillment, seamless data flow",
                },
              ].map((item, i) => (
                <div key={i}>
                  {i > 0 && <div className="h-[1px] bg-white/5 mb-8"></div>}
                  <div
                    className="text-sm font-black uppercase tracking-[0.08em] text-white mb-2"
                    style={{ fontWeight: 900 }}
                  >
                    {item.title}
                  </div>
                  <div className="text-sm text-white/60">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* The Secret */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16 text-center hover:border-white/10 transition-all duration-500 group relative overflow-hidden">
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
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
            <h2
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 tracking-tight uppercase relative z-10"
              style={{ fontWeight: 900 }}
            >
              Why Cannabis Businesses
              <br />
              <span className="text-white/60">Choose WhaleTools</span>
            </h2>
            <p className="text-sm sm:text-base text-white/60 px-4 relative z-10">
              Purpose-built for cannabis compliance, strain data, lab results
              (COAs), age verification, and the unique needs of dispensaries and
              distributors. Not adapted from retail software—designed from the
              ground up for cannabis.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* The Flow */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <AnimatedGrid className="space-y-3 sm:space-y-4">
            {[
              "Launch your online menu & POS",
              "Connect inventory across locations",
              "Enable wholesale ordering for brands",
              "Track compliance & lab results",
            ].map((text, i) => (
              <AnimatedGridItem
                key={i}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-6 text-center hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 group"
              >
                <div
                  className="text-xs sm:text-sm font-black uppercase tracking-[0.08em] group-hover:text-white/90 transition-colors"
                  style={{ fontWeight: 900 }}
                >
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
                alt="Yacht Club"
                width={80}
                height={80}
                className="object-contain mx-auto sm:w-[100px] sm:h-[100px] relative z-10"
              />
              <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" />
            </div>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-black mb-8 sm:mb-12 uppercase tracking-tight relative z-10"
              style={{ fontWeight: 900 }}
            >
              Request Access
            </h2>
            <Link
              href="/vendor/login"
              className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] font-black transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] relative z-10 overflow-hidden group"
              style={{ fontWeight: 900 }}
            >
              <span className="relative z-10">Get Started</span>
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
                alt="Yacht Club"
                width={28}
                height={28}
                className="object-contain opacity-60 sm:w-8 sm:h-8"
              />
              <span
                className="text-xs uppercase tracking-[0.12em] text-white/40 font-black"
                style={{ fontWeight: 900 }}
              >
                © 2025 WhaleTools
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
              {["About", "Partners", "API", "Privacy", "Terms"].map((link) => (
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
