'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store, Shield, Zap, Globe, BarChart3, Palette, Users, TrendingUp, Activity } from "lucide-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  // Performance data
  const performanceData = [
    { time: '00:00', requests: 120, latency: 45 },
    { time: '04:00', requests: 85, latency: 38 },
    { time: '08:00', requests: 240, latency: 52 },
    { time: '12:00', requests: 380, latency: 48 },
    { time: '16:00', requests: 420, latency: 42 },
    { time: '20:00', requests: 290, latency: 39 },
    { time: '23:59', requests: 150, latency: 41 }
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
            <div className="flex items-center gap-6">
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

      {/* Real-time Stats */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 fade-in text-center">
            <h2 className="text-2xl font-thin text-white/90 tracking-tight mb-3">Platform Performance</h2>
            <p className="text-white/40 text-xs font-light tracking-wide uppercase">Live Metrics · Updated in Real-Time</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {/* Active Storefronts */}
            <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Storefronts</span>
                <Store size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-thin text-white/90 mb-2">
                {animatedStats.storefronts}
              </div>
              <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Active Now</div>
            </div>

            {/* Uptime */}
            <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Uptime</span>
                <Activity size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-thin text-white/90 mb-2">
                {animatedStats.uptime}%
              </div>
              <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Last 30 Days</div>
            </div>

            {/* Transactions */}
            <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Transactions</span>
                <TrendingUp size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-thin text-white/90 mb-2">
                {animatedStats.transactions.toLocaleString()}
              </div>
              <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Per Hour</div>
            </div>

            {/* Response Time */}
            <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 group fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Response</span>
                <Zap size={16} className="text-white/20 group-hover:text-white/30 transition-all duration-300" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-thin text-white/90 mb-2">
                {animatedStats.response}ms
              </div>
              <div className="text-white/30 text-[10px] font-light tracking-wider uppercase">Avg Latency</div>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="grid lg:grid-cols-2 gap-3">
            {/* Request Volume Chart */}
            <div className="minimal-glass subtle-glow p-6 fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Request Volume</h3>
                  <p className="text-white/30 text-[10px] font-light">24 HOUR CYCLE</p>
                </div>
                <div className="w-1 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="h-64">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="50%" stopColor="#a855f7" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#ffffff40" 
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#ffffff40" 
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#000000', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '0px',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#ffffff80' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="requests" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#requestGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Vendor Growth Chart */}
            <div className="minimal-glass subtle-glow p-6 fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase mb-2">Vendor Growth</h3>
                  <p className="text-white/30 text-[10px] font-light">LAST 6 MONTHS</p>
                </div>
                <div className="w-1 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="h-64">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#ffffff40" 
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#ffffff40" 
                        style={{ fontSize: '11px' }}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#000000', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '0px',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: '#ffffff80' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="vendors" 
                        stroke="#a855f7" 
                        strokeWidth={2}
                        dot={{ fill: '#a855f7', r: 4 }}
                        activeDot={{ r: 6, fill: '#a855f7' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
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

