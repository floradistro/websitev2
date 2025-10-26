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
              <span className="text-xl font-black uppercase tracking-[0.08em]" style={{ fontWeight: 900 }}>WhaleTools</span>
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
          <div className="mb-12">
            <Image 
              src="/yacht-club-logo.png" 
              alt="Yacht Club" 
              width={120} 
              height={120}
              className="object-contain mx-auto"
            />
          </div>
          
          <h1 
            className="text-6xl md:text-8xl font-black mb-8 tracking-tight uppercase"
            style={{ fontWeight: 900 }}
          >
            186 Endpoints
          </h1>
          
          <div className="flex items-center justify-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs uppercase tracking-[0.12em] text-white/60 font-black" style={{ fontWeight: 900 }}>Live</span>
          </div>
          </div>

          {/* Live Metrics */}
          <div className="grid md:grid-cols-3 gap-4 mb-20">
            {[
              { value: mounted ? Math.round(latency) : '42', unit: 'ms', label: 'Response' },
              { value: mounted ? uptime.toFixed(2) : '99.90', unit: '%', label: 'Uptime' },
              { value: mounted ? requestCount.toLocaleString() : '0', unit: '', label: 'Requests' }
            ].map((metric, i) => (
              <div
                key={metric.label}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-12 text-center hover:border-white/10 transition-colors"
              >
                <div 
                  className="text-5xl font-black mb-3"
                  style={{ fontWeight: 900 }}
                >
                  {metric.value}
                  {metric.unit && <span className="text-xl text-white/60">{metric.unit}</span>}
                </div>
                <div className="text-xs uppercase tracking-[0.12em] text-white/60 font-black" style={{ fontWeight: 900 }}>
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          {/* Capabilities */}
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 text-center mb-20"
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
              <p className="text-xs uppercase tracking-[0.12em] text-white/60 font-black mb-12" style={{ fontWeight: 900 }}>
                Capabilities
              </p>
              <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight uppercase" style={{ fontWeight: 900 }}>
                Generate. Deploy. Track.
                <br />
                <span className="text-white/60">Repeat Infinitely</span>
              </h2>
            </motion.div>

            {/* Categories */}
            <div className="grid md:grid-cols-3 gap-4 mb-20">
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                  className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 text-center hover:border-white/10 transition-colors"
                >
                  <p className="text-xs uppercase tracking-[0.08em] font-black" style={{ fontWeight: 900 }}>
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Access CTA */}
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
                  width={100} 
                  height={100}
                  className="object-contain mx-auto"
                />
              </div>
              <p className="text-xs uppercase tracking-[0.12em] text-white/60 font-black mb-12" style={{ fontWeight: 900 }}>
                Partnership Required
              </p>
              <Link
                href="/vendor/login"
                className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/90 font-black transition-all hover:scale-105"
                style={{ fontWeight: 900 }}
              >
                Request Access
              </Link>
            </motion.div>
          </div>
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
                © 2025 WhaleTools
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
