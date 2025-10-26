'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-4">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club" 
                width={40} 
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-black uppercase tracking-[0.08em]" style={{ fontWeight: 900 }}>Yacht Club</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-black text-white/60 hover:text-white transition-colors" style={{ fontWeight: 900 }}>
              <ArrowLeft size={14} />
              Back
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="mb-12"
          >
            <Image 
              src="/yacht-club-logo.png" 
              alt="Yacht Club" 
              width={120} 
              height={120}
              className="object-contain mx-auto"
            />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tight uppercase leading-[0.9]"
            style={{ fontWeight: 900 }}
          >
            Business
            <br />
            Infrastructure
            <br />
            <span className="text-white/60">That Generates Itself</span>
          </motion.h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="h-[1px] w-32 bg-white/10 mx-auto mb-12"
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xl text-white/60 leading-relaxed max-w-2xl mx-auto"
          >
            From retail operations to wholesale networks. AI builds the entire stack.
          </motion.p>
        </div>
      </section>

      {/* What We Build */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16"
          >
            <h2 className="text-3xl font-black mb-12 tracking-tight uppercase text-center" style={{ fontWeight: 900 }}>
              Complete Business Systems
            </h2>
            <div className="space-y-8">
              {[
                { title: "Retail Operations", desc: "Storefronts, POS terminals, inventory across locations, employee dashboards" },
                { title: "Wholesale Infrastructure", desc: "B2B portals, bulk ordering, distributor networks, commission tracking" },
                { title: "Multi-Tenant Platforms", desc: "Infinite isolated tenants. Each gets their own complete ecosystem" }
              ].map((item, i) => (
                <div key={i}>
                  {i > 0 && <div className="h-[1px] bg-white/5 mb-8"></div>}
                  <div className="text-sm font-black uppercase tracking-[0.08em] text-white mb-2" style={{ fontWeight: 900 }}>
                    {item.title}
                  </div>
                  <div className="text-sm text-white/60">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Secret */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 text-center"
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
            <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight uppercase" style={{ fontWeight: 900 }}>
              Components That Understand
              <br />
              <span className="text-white/60">Tenant Isolation</span>
            </h2>
            <p className="text-white/60">
              Each component automatically scopes to its tenant. No manual configuration. No data leaks.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Flow */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {[
              "AI understands your prompt",
              "Generates component architecture",
              "Components auto-fetch tenant data",
              "Live app in 20 seconds"
            ].map((text, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 text-center"
              >
                <div className="text-sm font-black uppercase tracking-[0.08em]" style={{ fontWeight: 900 }}>
                  {text}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16"
          >
            <div className="mb-8">
              <Image 
                src="/yacht-club-logo.png" 
                alt="Yacht Club" 
                width={100} 
                height={100}
                className="object-contain mx-auto"
              />
            </div>
            <h2 className="text-4xl font-black mb-12 uppercase tracking-tight" style={{ fontWeight: 900 }}>
              Request Access
            </h2>
            <Link
              href="/vendor/login"
              className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/90 font-black transition-all hover:scale-105"
              style={{ fontWeight: 900 }}
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6">
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
