'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion } from 'framer-motion';

export default function ApiStatusPage() {
  const [mounted, setMounted] = useState(false);
  const [latency, setLatency] = useState(42);
  const [uptime, setUptime] = useState(99.9);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Simulate live updates (slower intervals for better performance)
    const interval = setInterval(() => {
      setLatency(prev => Math.max(20, Math.min(60, prev + (Math.random() - 0.5) * 5)));
      setUptime(prev => Math.min(100, prev + (Math.random() - 0.5) * 0.001));
    }, 3000);
    
    // Request counter (much slower for performance)
    const counterInterval = setInterval(() => {
      setRequestCount(prev => prev + Math.floor(Math.random() * 50) + 10);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(counterInterval);
    };
  }, []);

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

      {/* Content */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="mb-32 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1],
                scale: { type: "spring", stiffness: 100, damping: 20 }
              }}
              className="mb-12 flex justify-center relative"
            >
              <div className="absolute inset-0 bg-white/5 blur-[100px] animate-pulse" />
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={120} 
                height={120}
                className="object-contain opacity-90 relative z-10"
                priority
              />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl font-light mb-8 tracking-tight"
            >
              186 endpoints.
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center gap-3"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm text-white/40 uppercase tracking-[0.3em]">Live</span>
            </motion.div>
          </div>

          {/* Live Metrics */}
          <div className="grid md:grid-cols-3 gap-px bg-white/5 mb-32">
            {[
              { value: mounted ? Math.round(latency) : '42', unit: 'ms', label: 'Response', live: latency },
              { value: mounted ? uptime.toFixed(2) : '99.90', unit: '%', label: 'Uptime', live: false },
              { value: mounted ? requestCount.toLocaleString() : '0', unit: '', label: 'Requests', live: requestCount }
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ 
                  duration: 1, 
                  delay: i * 0.15,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ 
                  scale: 1.05,
                  borderColor: "rgba(255,255,255,0.2)",
                  transition: { duration: 0.3 }
                }}
                className="bg-black p-12 border border-white/5 text-center group"
              >
                <motion.div 
                  key={metric.label}
                  initial={metric.live ? { scale: 1.2, opacity: 0 } : undefined}
                  animate={metric.live ? { scale: 1, opacity: 1 } : undefined}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-5xl font-light text-white/90 mb-3 group-hover:text-white transition-colors"
                >
                  {metric.value}
                  {metric.unit && <span className="text-xl text-white/40">{metric.unit}</span>}
                </motion.div>
                <div className="text-white/30 text-xs uppercase tracking-[0.3em] group-hover:text-white/50 transition-colors">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Capabilities */}
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.3)" }}
              className="border border-white/10 p-16 text-center mb-20 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-white/40 text-sm uppercase tracking-[0.3em] mb-12 relative z-10"
              >
                Capabilities
              </motion.p>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-4xl font-light mb-12 tracking-tight leading-tight relative z-10"
              >
                Generate. Deploy. Track.
                <br />
                <span className="text-white/60">Repeat infinitely.</span>
              </motion.h2>
            </motion.div>

            {/* Categories - Flowing Grid */}
            <div className="grid md:grid-cols-3 gap-px bg-white/5 mb-20">
              {[
                "Generation",
                "Multi-tenant",
                "Inventory",
                "Orders",
                "Analytics",
                "POS",
                "Wholesale",
                "Payments",
                "Real-time"
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                    duration: 0.6, 
                    delay: i * 0.08,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    borderColor: "rgba(255,255,255,0.3)",
                    backgroundColor: "rgba(255,255,255,0.02)"
                  }}
                  className="bg-black p-8 border border-white/5 text-center cursor-default"
                >
                  <p className="text-white/60 text-sm font-light">
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Access */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="border border-white/10 p-12 text-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-white/40 text-sm mb-8 relative z-10"
              >
                Partnership required
              </motion.p>
              <Link
                href="/vendor/login"
                className="inline-flex items-center bg-white text-black px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all duration-300 hover:scale-105 relative z-10"
              >
                Request Access
              </Link>
            </motion.div>
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
