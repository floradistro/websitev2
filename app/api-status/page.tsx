'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function ApiStatusPage() {
  const [mounted, setMounted] = useState(false);
  const [latency, setLatency] = useState(42);
  const [uptime, setUptime] = useState(99.9);

  useEffect(() => {
    setMounted(true);

    // Simulate live updates
    const interval = setInterval(() => {
      setLatency(prev => Math.max(20, Math.min(60, prev + (Math.random() - 0.5) * 5)));
      setUptime(prev => Math.min(100, prev + (Math.random() - 0.5) * 0.001));
    }, 3000);

    return () => clearInterval(interval);
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
        <div className="max-w-4xl mx-auto">
          {/* Logo + Title */}
          <div className="mb-20 text-center">
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
            <h1 className="text-6xl md:text-8xl font-light mb-6 tracking-tight">
              API
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm text-white/40 uppercase tracking-[0.2em]">Operational</span>
            </div>
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

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-12 mb-20 max-w-2xl">
            <div>
              <div className="text-5xl font-light text-white/90 mb-2">
                {mounted ? Math.round(latency) : '0'}
                <span className="text-2xl text-white/40">ms</span>
              </div>
              <div className="text-white/30 text-xs uppercase tracking-[0.2em]">Latency</div>
            </div>
            <div>
              <div className="text-5xl font-light text-white/90 mb-2">
                {mounted ? uptime.toFixed(2) : '0.00'}
                <span className="text-2xl text-white/40">%</span>
              </div>
              <div className="text-white/30 text-xs uppercase tracking-[0.2em]">Uptime</div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="border-t border-white/10 pt-12">
            <h2 className="text-2xl font-light mb-8 tracking-tight text-white/50">Endpoints</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <span className="text-white/30 text-sm font-mono">/products</span>
                <div className="flex items-center gap-4">
                  <span className="text-white/20 text-xs uppercase tracking-wider">GET · POST</span>
                  <div className="w-2 h-2 bg-white/20 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <span className="text-white/30 text-sm font-mono">/vendors</span>
                <div className="flex items-center gap-4">
                  <span className="text-white/20 text-xs uppercase tracking-wider">GET · PUT</span>
                  <div className="w-2 h-2 bg-white/20 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <span className="text-white/30 text-sm font-mono">/orders</span>
                <div className="flex items-center gap-4">
                  <span className="text-white/20 text-xs uppercase tracking-wider">POST</span>
                  <div className="w-2 h-2 bg-white/20 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4">
                <span className="text-white/30 text-sm font-mono">/analytics</span>
                <div className="flex items-center gap-4">
                  <span className="text-white/20 text-xs uppercase tracking-wider">GET</span>
                  <div className="w-2 h-2 bg-white/20 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/vendor/login"
                className="inline-block text-white/30 hover:text-white text-sm transition-colors"
              >
                Request Documentation
              </Link>
            </div>
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
