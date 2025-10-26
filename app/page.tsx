'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from 'framer-motion';

export default function HomePage() {
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 20 : prev - 1));
    }, 1000);
    
    return () => clearInterval(countdownTimer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club" 
                width={40} 
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-black uppercase tracking-[0.08em]" style={{ fontWeight: 900 }}>Yacht Club</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link 
                href="/about" 
                className="text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors" 
                style={{ fontWeight: 900 }}
              >
                About
              </Link>
              <Link 
                href="/api-status" 
                className="text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors" 
                style={{ fontWeight: 900 }}
              >
                API
              </Link>
              <Link 
                href="/partners" 
                className="text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors" 
                style={{ fontWeight: 900 }}
              >
                Partners
              </Link>
              <Link 
                href="/vendor/login" 
                className="bg-white text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.08em] hover:bg-white/90 transition-all"
                style={{ fontWeight: 900 }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Large Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="mb-12 flex justify-center"
          >
            <Image 
              src="/yacht-club-logo.png" 
              alt="Yacht Club" 
              width={280} 
              height={280}
              className="object-contain"
              priority
            />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-8xl font-black mb-8 tracking-tight leading-[0.9] uppercase"
            style={{ fontWeight: 900 }}
          >
            Generate
            <br />
            Business
            <br />
            <span className="text-white/60">Ecosystems</span>
          </motion.h1>
          
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="h-[1px] w-32 bg-white/10 mx-auto mb-12"
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-white/60 font-normal leading-relaxed max-w-2xl mx-auto mb-16"
          >
            AI builds the entire stack. Storefronts, inventory, POS, analytics. Everything.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
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
          </motion.div>
        </div>
      </section>

      {/* What Gets Built */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-12 md:p-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-12 tracking-tight uppercase text-center" style={{ fontWeight: 900 }}>
              Complete Infrastructure
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Public Storefronts", desc: "Customer-facing e-commerce" },
                { title: "Internal Dashboards", desc: "Vendor & admin portals" },
                { title: "POS Systems", desc: "Point-of-sale terminals" },
                { title: "Inventory", desc: "Real-time stock management" },
                { title: "Wholesale", desc: "B2B ordering platforms" },
                { title: "Analytics", desc: "Business intelligence" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-xs uppercase tracking-[0.12em] font-black text-white mb-2" style={{ fontWeight: 900 }}>
                    {item.title}
                  </div>
                  <div className="text-sm text-white/60">
                    {item.desc}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Stack */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-12 md:p-16"
          >
            <div className="mb-8">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club" 
                width={80} 
                height={80}
                className="object-contain mx-auto opacity-40"
              />
            </div>
            <h3 className="text-2xl md:text-4xl font-black mb-6 uppercase tracking-tight" style={{ fontWeight: 900 }}>
              Not Just Websites
            </h3>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Complete business operating systems. E-commerce, inventory, POS, wholesale, analytics, customer portals, employee tools. All generated, all connected.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black mb-16 text-center uppercase tracking-tight" 
            style={{ fontWeight: 900 }}
          >
            What We Build
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Multi-vendor marketplaces",
              "Point-of-sale systems",
              "Inventory management",
              "Wholesale platforms",
              "Analytics dashboards",
              "Customer loyalty programs",
              "Employee portals",
              "TV menu displays"
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
              >
                <div className="text-sm font-black uppercase tracking-[0.08em]" style={{ fontWeight: 900 }}>
                  {item}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 md:p-24"
          >
            <div className="mb-8">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club" 
                width={120} 
                height={120}
                className="object-contain mx-auto opacity-20"
              />
            </div>
            <motion.div 
              key={countdown}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-8xl md:text-9xl font-black mb-6"
              style={{ fontWeight: 900 }}
            >
              {countdown}
            </motion.div>
            <div className="text-xs uppercase tracking-[0.12em] text-white/60 font-black mb-12" style={{ fontWeight: 900 }}>
              Seconds
            </div>
            <h3 className="text-2xl md:text-4xl font-black mb-6 uppercase tracking-tight" style={{ fontWeight: 900 }}>
              From Idea To Deployed
            </h3>
            <p className="text-sm uppercase tracking-[0.12em] text-white/40 font-black" style={{ fontWeight: 900 }}>
              No Designer. No Developer.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-12">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club" 
                width={100} 
                height={100}
                className="object-contain mx-auto"
              />
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-12 uppercase tracking-tight leading-tight" style={{ fontWeight: 900 }}>
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
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-4">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club" 
                width={32} 
                height={32}
                className="object-contain opacity-60"
              />
              <span className="text-xs uppercase tracking-[0.12em] text-white/40 font-black" style={{ fontWeight: 900 }}>
                © 2025 Yacht Club
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8">
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
              width={60} 
              height={60}
              className="object-contain mx-auto opacity-20"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
