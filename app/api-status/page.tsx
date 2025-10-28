'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSection, AnimatedGrid, AnimatedGridItem } from "@/components/HomePage/AnimatedSection";

export default function ApiStatusPage() {
  const [mounted, setMounted] = useState(false);
  const [latency, setLatency] = useState(42);
  const [uptime, setUptime] = useState(99.9);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setLatency(prev => Math.max(20, Math.min(60, prev + (Math.random() - 0.5) * 5)));
      setUptime(prev => Math.min(100, prev + (Math.random() - 0.5) * 0.001));
    }, 3000);

    const counterInterval = setInterval(() => {
      setRequestCount(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(counterInterval);
    };
  }, []);

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
        <div className="max-w-6xl mx-auto">
          {/* Subtle gradient glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

          <div className="text-center mb-12 sm:mb-16 md:mb-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="mb-8 sm:mb-12"
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
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 sm:mb-8 tracking-tight uppercase"
            style={{ fontWeight: 900 }}
          >
            <span className="bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">
              186 Endpoints
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="flex items-center justify-center gap-3"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs uppercase tracking-[0.12em] text-white/60 font-black" style={{ fontWeight: 900 }}>Live</span>
          </motion.div>
          </div>

          {/* Live Metrics */}
          <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-12 sm:mb-16 md:mb-20">
            {[
              { value: mounted ? Math.round(latency) : '42', unit: 'ms', label: 'Response' },
              { value: mounted ? uptime.toFixed(2) : '99.90', unit: '%', label: 'Uptime' },
              { value: mounted ? requestCount.toLocaleString() : '0', unit: '', label: 'Requests' }
            ].map((metric, i) => (
              <AnimatedGridItem
                key={metric.label}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-10 md:p-12 text-center hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300"
              >
                <div
                  className="text-4xl sm:text-5xl font-black mb-2 sm:mb-3"
                  style={{ fontWeight: 900 }}
                >
                  {metric.value}
                  {metric.unit && <span className="text-lg sm:text-xl text-white/60">{metric.unit}</span>}
                </div>
                <div className="text-xs uppercase tracking-[0.12em] text-white/60 font-black" style={{ fontWeight: 900 }}>
                  {metric.label}
                </div>
              </AnimatedGridItem>
            ))}
          </AnimatedGrid>

          {/* Capabilities */}
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="mb-12 sm:mb-16 md:mb-20">
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
                <p className="text-xs uppercase tracking-[0.12em] text-white/60 font-black mb-8 sm:mb-12 relative z-10" style={{ fontWeight: 900 }}>
                  Capabilities
                </p>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 tracking-tight uppercase relative z-10" style={{ fontWeight: 900 }}>
                  Generate. Deploy. Track.
                  <br />
                  <span className="text-white/60">Repeat Infinitely</span>
                </h2>
              </div>
            </AnimatedSection>

            {/* Categories */}
            <AnimatedSection className="mb-12 sm:mb-16 md:mb-20">
              <AnimatedGrid className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  "Cannabis POS",
                  "Compliance",
                  "Inventory",
                  "Orders",
                  "Analytics",
                  "Lab Results",
                  "Wholesale",
                  "Payments",
                  "Real-time"
                ].map((item, i) => (
                  <AnimatedGridItem
                    key={item}
                    className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-6 text-center hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 group"
                  >
                    <p className="text-xs uppercase tracking-[0.08em] font-black group-hover:text-white/90 transition-colors" style={{ fontWeight: 900 }}>
                      {item}
                    </p>
                  </AnimatedGridItem>
                ))}
              </AnimatedGrid>
            </AnimatedSection>

            {/* Access CTA */}
            <AnimatedSection>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-10 md:p-12 lg:p-16 text-center hover:border-white/10 transition-colors duration-500 group relative overflow-hidden">
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
                <p className="text-xs uppercase tracking-[0.12em] text-white/60 font-black mb-8 sm:mb-12 relative z-10" style={{ fontWeight: 900 }}>
                  Partnership Required
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
            </AnimatedSection>
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
