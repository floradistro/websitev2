'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Store, BarChart3, Palette, DollarSign, Users, CheckCircle } from "lucide-react";
import { motion } from 'framer-motion';

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={32} 
                height={32}
                className="object-contain"
              />
              <span className="text-xl font-light tracking-tight">WhaleTools</span>
            </Link>
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={80} 
                height={80}
                className="object-contain opacity-90 logo-breathe"
              />
              <div className="absolute inset-0 logo-glow"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight">
            Build platforms
            <br />
            <span className="text-white/60">not products.</span>
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <p className="text-xl text-white/50 font-light leading-relaxed max-w-2xl mx-auto">
            Multi-tenant infrastructure where each tenant gets a complete business system. AI-generated.
          </p>
        </div>

        <style jsx>{`
          @keyframes breathe {
            0%, 100% { opacity: 0.9; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.02); }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0; }
            50% { opacity: 0.15; }
          }
          .logo-breathe {
            animation: breathe 4s ease-in-out infinite;
          }
          .logo-glow {
            background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
            animation: glow-pulse 4s ease-in-out infinite;
            pointer-events: none;
          }
        `}</style>
      </section>

      {/* The Vision */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="border border-white/10 p-16 text-center">
            <h2 className="text-4xl font-light mb-8 tracking-tight leading-tight">
              Enterprise-grade infrastructure.
              <br />
              <span className="text-white/60">AI-generated ecosystems.</span>
            </h2>
            <p className="text-white/40">
              Retail operations. Wholesale networks. POS systems. Inventory. Analytics. Everything a business needs to operate.
            </p>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12 text-center">
            {[
              { title: "Complete infrastructure", desc: "E-commerce, POS, wholesale, inventory" },
              { title: "Infinite tenants", desc: "Each isolated, each with full capabilities" },
              { title: "White label", desc: "Your platform, our engine" }
            ].map((item, i) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.2)" }}
                className="border border-white/10 p-12 transition-all duration-500"
              >
                <motion.h3 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 + 0.3 }}
                  className="text-2xl font-light mb-4 text-white"
                >
                  {item.title}
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 + 0.5 }}
                  className="text-white/40"
                >
                  {item.desc}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/40 text-sm uppercase tracking-[0.3em] mb-12">
            Use cases
          </p>
          <div className="space-y-4">
            <p className="text-white/60 text-xl font-light">Multi-vendor marketplaces</p>
            <p className="text-white/60 text-xl font-light">SaaS platforms with customer portals</p>
            <p className="text-white/60 text-xl font-light">Agency white-label solutions</p>
            <p className="text-white/60 text-xl font-light">Vertical-specific commerce</p>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="border border-white/10 p-16">
            <h2 className="text-4xl font-light mb-8 tracking-tight">
              Interested?
            </h2>
            <p className="text-white/40 text-sm uppercase tracking-[0.3em] mb-12">
              partners@whaletools.dev
            </p>
            <Link
              href="/vendor/login"
              className="inline-flex items-center bg-white text-black px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all"
            >
              Request Access
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={24} 
                height={24}
                className="object-contain opacity-60"
              />
              <span className="text-sm text-white/40">© 2025 WhaleTools. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/about" className="text-sm text-white/40 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/partners" className="text-sm text-white/40 hover:text-white transition-colors">
                Partners
              </Link>
              <Link href="/api-status" className="text-sm text-white/40 hover:text-white transition-colors">
                API
              </Link>
              <Link href="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-white/40 hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

