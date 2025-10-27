"use client";

import React, { useState, useEffect } from 'react';
import { FloraDistroHomepage } from '@/components/component-registry/smart/FloraDistroHomepage';

const FLORA_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

export default function FloraDistroDemo() {
  const [realProducts, setRealProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch REAL Flora Distro products
    fetch(`/api/products?vendor_id=${FLORA_VENDOR_ID}`)
      .then(res => res.json())
      .then(data => {
        console.log('✅ Real Flora Distro products loaded:', data);
        const products = data.products || [];
        setRealProducts(products);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Failed to fetch products:', err);
        setLoading(false);
      });
  }, []);

  // Mock the internal API calls made by the component
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = function(url: any, ...args: any[]) {
      if (typeof url === 'string' && url.includes('/api/products?vendor_id=')) {
        console.log('🔄 Intercepted product fetch, returning real data');
        return Promise.resolve(new Response(JSON.stringify(realProducts), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      return originalFetch.call(window, url, ...args);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [realProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌿</div>
          <h1 className="text-3xl font-black text-white uppercase">Loading Flora Distro...</h1>
          <p className="text-white/60 mt-2">Fetching real products</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Demo Header */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-600 via-purple-600 to-blue-600 p-3 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-3xl animate-bounce">🎨</div>
            <div>
              <h1 className="text-white font-black uppercase text-lg">
                AI-Generated Colorful Demo
              </h1>
              <p className="text-white/80 text-xs">
                Claude Sonnet 4.5 | {realProducts.length} Real Products | Quantum States | Animations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-4 py-2 rounded-full">
              <span className="text-white/90 text-sm font-bold">✓ Floating Particles</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-full">
              <span className="text-white/90 text-sm font-bold">✓ Glassmorphism</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-full">
              <span className="text-white/90 text-sm font-bold">✓ Gradient Animations</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Component with top padding to avoid header overlap */}
      <div className="pt-16">
        <FloraDistroHomepage
          vendorId={FLORA_VENDOR_ID}
          heroHeadline="ELEVATE YOUR EXPERIENCE"
          heroSubheadline="Premium Cannabis for Discerning Connoisseurs"
          trustBadges={[
            { icon: "✓", text: "Lab Tested", color: "#10b981" },
            { icon: "🌿", text: "Organic", color: "#8b5cf6" },
            { icon: "⚡", text: "Fast Delivery", color: "#3b82f6" },
            { icon: "🔒", text: "Secure", color: "#10b981" }
          ]}
        />
      </div>

      {/* Floating Success Badges */}
      <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-3">
        <div className="bg-emerald-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-500/50 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <div className="font-black uppercase text-sm">AI Generated</div>
              <div className="text-xs opacity-80">{realProducts.length} Products Wired</div>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-2xl shadow-purple-500/50 animate-pulse" style={{animationDelay: '0.5s'}}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎨</span>
            <div>
              <div className="font-black uppercase text-sm">Colorful Design</div>
              <div className="text-xs opacity-80">3 Gradient Colors</div>
            </div>
          </div>
        </div>
        <div className="bg-blue-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-2xl shadow-blue-500/50 animate-pulse" style={{animationDelay: '1s'}}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-black uppercase text-sm">Full Stack</div>
              <div className="text-xs opacity-80">DB → AI → UI</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

