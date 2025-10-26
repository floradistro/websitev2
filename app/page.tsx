'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store, Shield, Zap, Globe, BarChart3, Palette } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

const LogoAnimation = dynamic(() => import('@/components/LogoAnimation'), {
  ssr: false,
  loading: () => <div className="w-[800px] h-[800px]" />
});

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [visibleLines, setVisibleLines] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({
    storefronts: 0,
    uptime: 0,
    transactions: 0,
    response: 0
  });

  const fullCode = [
    { text: "import", type: "keyword", rest: " { generateEcosystem } from '@whaletools/ai';" },
    { text: "", type: "empty" },
    { text: "const", type: "keyword", rest: " config = {" },
    { text: "  ", type: "code", key: "vendor", value: "'acme-corp'" },
    { text: "  ", type: "code", key: "type", value: "'marketplace'" },
    { text: "  ", type: "code", key: "tenants", value: "1000" },
    { text: "  ", type: "code", key: "features", value: "['pos', 'wholesale', 'analytics']" },
    { text: "};", type: "code" },
    { text: "", type: "empty" },
    { text: "const", type: "keyword", rest: " result = await generateEcosystem(config);" },
    { text: "", type: "empty" },
    { text: "// Generated ecosystem:", type: "comment" },
    { text: "// → Public storefronts", type: "comment" },
    { text: "// → Vendor dashboards", type: "comment" },
    { text: "// → POS terminals", type: "comment" },
    { text: "// → Inventory management", type: "comment" },
    { text: "// → Wholesale portals", type: "comment" },
    { text: "// → Analytics platform", type: "comment" },
    { text: "", type: "empty" },
    { text: "// Stats:", type: "comment" },
    { text: "// - 299 components", type: "comment" },
    { text: "// - 13 pages per tenant", type: "comment" },
    { text: "// - 186 API endpoints", type: "comment" },
    { text: "// - Multi-tenant isolation", type: "comment" },
    { text: "", type: "empty" },
    { text: "console", type: "keyword2", rest: ".log(result.status); // 'deployed'" },
  ];

  const growthData = [
    { month: 'Jan', vendors: 12 },
    { month: 'Feb', vendors: 19 },
    { month: 'Mar', vendors: 28 },
    { month: 'Apr', vendors: 42 },
    { month: 'May', vendors: 68 },
    { month: 'Jun', vendors: 94 }
  ];

  useEffect(() => {
    setMounted(true);
    
    // Animate numbers counting up
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedStats({
        storefronts: Math.floor(progress * 247),
        uptime: Math.floor(progress * 99.9 * 10) / 10,
        transactions: Math.floor(progress * 1847),
        response: Math.floor(progress * 42)
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    
    // Countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setVisibleLines(0); // Reset code when countdown resets
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Code generation (synced with countdown) - faster
    const codeTimer = setInterval(() => {
      const elapsed = 20 - countdown;
      const linesToShow = Math.min(Math.floor(elapsed * 1.3), fullCode.length);
      setVisibleLines(linesToShow);
    }, 100);
    
    return () => {
      clearInterval(timer);
      clearInterval(countdownTimer);
      clearInterval(codeTimer);
    };
  }, [countdown]);

  return (
    <div className="min-h-screen bg-black text-white relative">
        {/* Subtle Pattern Background */}
        <div className="pattern-bg"></div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes count-up {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
        .pattern-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          pointer-events: none;
          background-color: #000000;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.5;
        }
        .pattern-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.02) 1px, transparent 0);
          background-size: 50px 50px;
        }
      `}</style>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={32} 
                height={32}
                className="object-contain"
              />
              <span className="text-xl font-light tracking-tight">WhaleTools</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link 
                href="/about" 
                className="text-sm text-white/60 hover:text-white transition-colors tracking-wide"
              >
                About
              </Link>
              <Link 
                href="/api-status" 
                className="text-sm text-white/60 hover:text-white transition-colors tracking-wide"
              >
                API
              </Link>
              <Link 
                href="/partners" 
                className="text-sm text-white/60 hover:text-white transition-colors tracking-wide"
              >
                Partners
              </Link>
              <Link 
                href="/vendor/login" 
                className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium uppercase tracking-wider hover:bg-white/90 transition-all"
              >
                Get Started
              </Link>
            </div>
            <div className="flex md:hidden">
              <Link 
                href="/vendor/login" 
                className="bg-white text-black px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all"
              >
                Start
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 sm:mb-12 flex justify-center relative"
          >
            {/* Animated Background - Desktop Only */}
            <div className="absolute inset-0 hidden lg:flex items-center justify-center" style={{ width: '800px', height: '800px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <LogoAnimation />
            </div>
            {/* Large Logo */}
            <div className="relative z-10">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={200} 
                height={200}
                className="object-contain opacity-90 sm:w-[240px] sm:h-[240px] md:w-[280px] md:h-[280px]"
                priority
              />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl font-light mb-6 tracking-tight leading-tight px-4"
          >
            Generate entire
            <br />
            <span className="text-white/60">business ecosystems.</span>
          </motion.h1>
          
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-xl md:text-2xl text-white/50 font-light leading-relaxed max-w-3xl mx-auto mb-12 px-6"
          >
            AI builds the entire stack. Storefronts, inventory, POS, analytics. Everything.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4"
          >
            <Link
              href="/vendor/login"
              className="group inline-flex items-center justify-center gap-2 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full text-xs sm:text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <span>Start Building</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/api-status"
              className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-xs sm:text-sm uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/30 font-medium transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <span>View API</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="border border-white/10 bg-white/[0.01] p-8 sm:p-16 hover:border-white/20 transition-colors duration-500"
          >
            <motion.h2 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-2xl sm:text-3xl md:text-5xl font-light mb-8 sm:mb-12 tracking-tight"
            >
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="block"
              >
                Public storefronts.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-white/60 block"
              >
                Internal dashboards.
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-white/40 block"
              >
                Complete infrastructure.
              </motion.span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1 }}
              className="text-white/30 text-sm uppercase tracking-[0.3em]"
            >
              All generated instantly
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* The Secret */}
      <section className="py-12 sm:py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="border border-white/10 bg-white/[0.01] p-8 sm:p-12 md:p-16 transition-all duration-500 hover:border-white/20"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-2xl sm:text-3xl md:text-5xl font-light mb-6 sm:mb-8 tracking-tight text-center leading-tight"
            >
              Not just websites.
              <br />
              <span className="text-white/60">Entire operating systems.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-white/40 text-center text-sm sm:text-base md:text-lg"
            >
              E-commerce. Inventory. POS. Wholesale. Analytics. Customer portals. Employee tools. All generated, all connected.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-12 sm:py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-2 sm:space-y-1 text-center">
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
              <motion.p
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="text-white/60 text-sm sm:text-base md:text-lg font-light"
              >
                {item}
              </motion.p>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-20 px-4 relative z-10 overflow-visible">
        <div className="max-w-6xl mx-auto relative">
          
          {/* Floating Code Generation - Inside Stats Section */}
          {mounted && visibleLines > 0 && (
            <div className="absolute bottom-0 right-0 hidden lg:block pointer-events-none">
              <div className="font-mono text-[13px] leading-[1.6] text-right flex flex-col-reverse" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                {visibleLines < fullCode.length && visibleLines > 0 && (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block w-[2px] h-4 bg-[#C586C0] ml-1 align-middle"
                  />
                )}
                {fullCode.slice(0, visibleLines).reverse().map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                  >
                    {line.type === 'comment' ? (
                      <span className="text-[#6A9955] italic">
                        {line.text}
                      </span>
                    ) : line.type === 'success' ? (
                      <span className="text-[#4EC9B0]">
                        {line.text}
                      </span>
                    ) : line.type === 'empty' ? (
                      <div className="h-[1.6em]">&nbsp;</div>
                    ) : line.type === 'keyword' ? (
                      <>
                        <span className="text-[#C586C0]">
                          {line.text}
                        </span>
                        <span className="text-[#D4D4D4]">
                          {line.rest}
                        </span>
                      </>
                    ) : line.type === 'keyword2' ? (
                      <>
                        <span className="text-[#DCDCAA]">
                          {line.text}
                        </span>
                        <span className="text-[#D4D4D4]">
                          {line.rest}
                        </span>
                      </>
                    ) : line.key ? (
                      <>
                        <span className="text-[#D4D4D4]">{line.text}</span>
                        <span className="text-[#9CDCFE]">
                          {line.key}
                        </span>
                        <span className="text-[#D4D4D4]">: </span>
                        <span className="text-[#CE9178]">
                          {line.value}
                        </span>
                        <span className="text-[#D4D4D4]">,</span>
                      </>
                    ) : (
                      <span className="text-[#D4D4D4]">{line.text}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Minimal Stats Grid */}
          <div className="text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1],
                scale: {
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }
              }}
            >
              <motion.div 
                key={countdown}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-5xl sm:text-6xl md:text-8xl font-light text-white/90 mb-3 sm:mb-4"
              >
                {countdown}
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-white/40 text-xs sm:text-sm tracking-[0.3em] uppercase"
              >
                seconds
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 md:py-32 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-4xl md:text-6xl font-light text-white mb-8 sm:mb-12 tracking-tight leading-tight px-4"
          >
            <span className="text-white/60">{countdown} seconds</span>
            <br />
            from idea to deployed.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-white/30 text-sm uppercase tracking-[0.3em] mb-12"
          >
            No designer. No developer.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4"
          >
            <Link
              href="/vendor/login"
              className="group inline-flex items-center justify-center gap-2 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full text-xs sm:text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <span>Create Account</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-xs sm:text-sm uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/30 font-medium transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <span>Partners</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 sm:py-12 px-4 relative z-10">
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
              <span className="text-xs sm:text-sm text-white/40">© 2025 WhaleTools. All rights reserved.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              <Link href="/about" className="text-xs sm:text-sm text-white/40 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/partners" className="text-xs sm:text-sm text-white/40 hover:text-white transition-colors">
                Partners
              </Link>
              <Link href="/api-status" className="text-xs sm:text-sm text-white/40 hover:text-white transition-colors">
                API
              </Link>
              <Link href="/privacy" className="text-xs sm:text-sm text-white/40 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-xs sm:text-sm text-white/40 hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

