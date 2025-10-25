'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store, Shield, Zap, Globe, BarChart3, Palette } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';

const LogoAnimation = dynamic(() => import('@/components/LogoAnimation'), {
  ssr: false,
  loading: () => <div className="w-[800px] h-[800px]" />
});

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    storefronts: 0,
    uptime: 0,
    transactions: 0,
    response: 0
  });

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
    
    return () => clearInterval(timer);
  }, []);

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
      <section className="relative pt-32 pb-20 px-4 overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="mb-12 flex justify-center relative">
            {/* Animated Background */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ width: '800px', height: '800px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <LogoAnimation />
            </div>
            {/* Large Logo */}
            <div className="relative z-10">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={280} 
                height={280}
                className="object-contain opacity-90"
                priority
              />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight leading-tight">
            Multi-Tenant
            <br />
            <span className="text-white/60">Commerce Platform</span>
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <p className="text-xl md:text-2xl text-white/50 font-light leading-relaxed max-w-3xl mx-auto mb-12">
            Build, manage, and scale unlimited vendor storefronts with enterprise-grade tools.
            <br />One platform. Infinite possibilities.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/vendor/login"
              className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all"
            >
              <span>Start Building</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/api-status"
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/30 font-medium transition-all"
            >
              <span>View API Status</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {/* Feature 1 */}
            <div className="bg-black p-12 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white/10 transition-all">
                <Store className="text-white/60" size={24} />
              </div>
              <h3 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Vendor Storefronts</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Unlimited multi-tenant storefronts with custom domains, themes, and complete branding control.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-black p-12 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white/10 transition-all">
                <Palette className="text-white/60" size={24} />
              </div>
              <h3 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Visual Builder</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Drag-and-drop component system. Build stunning storefronts without code.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-black p-12 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white/10 transition-all">
                <Shield className="text-white/60" size={24} />
              </div>
              <h3 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Enterprise Security</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Bank-level encryption, role-based access, and complete data isolation per tenant.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-black p-12 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white/10 transition-all">
                <Zap className="text-white/60" size={24} />
              </div>
              <h3 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Lightning Fast</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Optimized performance with edge caching, lazy loading, and smart code splitting.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-black p-12 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white/10 transition-all">
                <Globe className="text-white/60" size={24} />
              </div>
              <h3 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Custom Domains</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Full white-label support. Connect any domain with automatic SSL and DNS management.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-black p-12 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white/10 transition-all">
                <BarChart3 className="text-white/60" size={24} />
              </div>
              <h3 className="text-lg font-light text-white mb-3 uppercase tracking-wider">Advanced Analytics</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Real-time metrics, conversion tracking, and comprehensive reporting dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Minimal Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 mb-20">
            <div className="bg-black p-8 md:p-12 border border-white/5">
              <div className="text-4xl md:text-5xl font-light text-white/90 mb-2">
                {animatedStats.storefronts}
              </div>
              <div className="text-white/30 text-xs uppercase tracking-[0.2em]">Storefronts</div>
            </div>

            <div className="bg-black p-8 md:p-12 border border-white/5">
              <div className="text-4xl md:text-5xl font-light text-white/90 mb-2">
                {animatedStats.uptime}%
              </div>
              <div className="text-white/30 text-xs uppercase tracking-[0.2em]">Uptime</div>
            </div>

            <div className="bg-black p-8 md:p-12 border border-white/5">
              <div className="text-4xl md:text-5xl font-light text-white/90 mb-2">
                {animatedStats.transactions.toLocaleString()}
              </div>
              <div className="text-white/30 text-xs uppercase tracking-[0.2em]">Orders</div>
            </div>

            <div className="bg-black p-8 md:p-12 border border-white/5">
              <div className="text-4xl md:text-5xl font-light text-white/90 mb-2">
                {animatedStats.response}ms
              </div>
              <div className="text-white/30 text-xs uppercase tracking-[0.2em]">Response</div>
            </div>
          </div>

          {/* Single Monochrome Chart */}
          <div className="border border-white/10 bg-white/[0.01]">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-white/40 text-xs font-light tracking-[0.2em] uppercase">Growth</h3>
            </div>
            <div className="p-6 h-64">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="1 1" stroke="#ffffff08" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#ffffff20" 
                      style={{ fontSize: '10px' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#ffffff20" 
                      style={{ fontSize: '10px' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="vendors" 
                      stroke="#ffffff" 
                      strokeWidth={1}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-light text-white mb-8 tracking-tight">
            Ready to Scale?
          </h2>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <p className="text-xl text-white/50 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
            Join the platform trusted by enterprise merchants to power their multi-tenant commerce operations.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/vendor/login"
              className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all"
            >
              <span>Create Account</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/30 font-medium transition-all"
            >
              <span>Become a Partner</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 relative z-10">
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

