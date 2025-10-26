'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Code, Globe, Zap, Shield } from "lucide-react";
import { motion } from 'framer-motion';

export default function AboutPage() {
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 flex justify-center"
          >
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
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-light mb-6 tracking-tight"
          >
            Business infrastructure
            <br />
            <span className="text-white/60">that generates itself.</span>
          </motion.h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xl text-white/50 font-light leading-relaxed max-w-2xl mx-auto"
          >
            From retail operations to wholesale networks. AI builds the entire stack.
          </motion.p>
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

      {/* What We Build */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="border border-white/10 p-12"
          >
            <h2 className="text-3xl font-light mb-8 tracking-tight">Complete business systems</h2>
            <div className="space-y-6">
              <div>
                <p className="text-white text-lg leading-relaxed mb-2">Retail operations</p>
                <p className="text-white/40 text-sm">Storefronts, POS terminals, inventory across locations, employee dashboards.</p>
              </div>
              <div className="h-[1px] bg-white/5"></div>
              <div>
                <p className="text-white text-lg leading-relaxed mb-2">Wholesale infrastructure</p>
                <p className="text-white/40 text-sm">B2B portals, bulk ordering, distributor networks, commission tracking.</p>
              </div>
              <div className="h-[1px] bg-white/5"></div>
              <div>
                <p className="text-white text-lg leading-relaxed mb-2">Multi-tenant platforms</p>
                <p className="text-white/40 text-sm">Infinite isolated tenants. Each gets their own complete ecosystem.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Revelation */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02 }}
            className="border border-white/10 p-16 text-center transition-all duration-500 hover:border-white/20"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-5xl font-light mb-8 tracking-tight leading-tight"
            >
              Components that understand
              <br />
              <span className="text-white/60">tenant isolation.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-white/40 text-lg"
            >
              Each component automatically scopes to its tenant. No manual configuration. No data leaks.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* The Pattern */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8 text-center">
            {[
              { type: 'text', content: 'AI understands your prompt' },
              { type: 'arrow', content: '↓' },
              { type: 'text', content: 'Generates component architecture' },
              { type: 'arrow', content: '↓' },
              { type: 'text', content: 'Components auto-fetch tenant data' },
              { type: 'arrow', content: '↓' },
              { type: 'text', content: 'Live app in 20 seconds' }
            ].map((item, i) => (
              item.type === 'arrow' ? (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                  className="text-white/40 text-sm"
                >
                  {item.content}
                </motion.div>
              ) : (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.2)" }}
                  className="border border-white/10 p-8 transition-all duration-300"
                >
                  {item.type === 'code' ? (
                    <code className="text-white/70 text-sm">{item.content}</code>
                  ) : (
                    <p className="text-white/60">{item.content}</p>
                  )}
                </motion.div>
              )
            ))}
          </div>
        </div>
      </section>


      {/* The Difference */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/40 text-sm uppercase tracking-[0.3em] mb-12">
            How it's different
          </p>
          <div className="space-y-8">
            <p className="text-white/60 text-xl font-light">
              Traditional: weeks of development, custom code for each tenant.
            </p>
            <p className="text-white/60 text-xl font-light">
              AI builders: generate once, can't update without regenerating.
            </p>
            <p className="text-white text-xl font-light">
              WhaleTools: generate instantly, update in real-time from database.
            </p>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-light mb-8 tracking-tight">
            Request access
          </h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/vendor/login"
              className="bg-white text-black px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all"
            >
              Get Started
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
