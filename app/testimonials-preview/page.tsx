"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const PremiumTestimonials = dynamic(
  () => import('@/components/component-registry/smart/PremiumTestimonials').then(mod => ({ default: mod.PremiumTestimonials })),
  { ssr: false }
);

export default function TestimonialsPreviewPage() {
  const [mockData, setMockData] = useState({
    reviews: [],
    avgRating: { value: 0 },
    user: { device: 'desktop' }
  });
  
  useEffect(() => {
    // Mock data for preview
    setMockData({
      reviews: [
        {
          id: 1,
          rating: 5,
          text: 'Absolutely incredible quality and service. The attention to detail in every product is remarkable. Highly recommend to anyone seeking premium cannabis.',
          author: 'Sarah Mitchell',
          location: 'San Francisco, CA',
          avatar: 'https://i.pravatar.cc/150?img=1',
          verified: true
        },
        {
          id: 2,
          rating: 5,
          text: 'Fast delivery, discreet packaging, and the best selection of premium strains. This is now my go-to for all cannabis needs.',
          author: 'James Rodriguez',
          location: 'Los Angeles, CA',
          avatar: 'https://i.pravatar.cc/150?img=2',
          verified: true
        },
        {
          id: 3,
          rating: 4,
          text: 'The lab results and transparency are what sold me. You can really trust the quality here. Customer service is excellent too.',
          author: 'Emily Chen',
          location: 'Oakland, CA',
          avatar: 'https://i.pravatar.cc/150?img=3',
          verified: true
        },
        {
          id: 4,
          rating: 5,
          text: 'Been ordering for 6 months now and every single product has exceeded expectations. The curation is top-notch.',
          author: 'Michael Torres',
          location: 'San Diego, CA',
          avatar: 'https://i.pravatar.cc/150?img=4',
          verified: true
        },
        {
          id: 5,
          rating: 5,
          text: 'Premium quality at fair prices. The staff knowledge is impressive and they always help me find exactly what I need.',
          author: 'Jennifer Park',
          location: 'Berkeley, CA',
          avatar: 'https://i.pravatar.cc/150?img=5',
          verified: false
        },
        {
          id: 6,
          rating: 4,
          text: 'Great variety and the online experience is smooth. Will definitely be back for more.',
          author: 'David Kim',
          location: 'Sacramento, CA',
          avatar: 'https://i.pravatar.cc/150?img=6',
          verified: true
        }
      ],
      avgRating: { value: 4.7 },
      user: { device: 'desktop' }
    });
  }, []);
  
  // Mock API responses
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = function(url: any, ...args: any[]) {
      if (typeof url === 'string') {
        if (url.includes('/api/testimonials')) {
          return Promise.resolve(new Response(JSON.stringify(mockData.reviews), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        if (url.includes('/api/reviews/average')) {
          return Promise.resolve(new Response(JSON.stringify(mockData.avgRating.value), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        if (url.includes('/api/user')) {
          return Promise.resolve(new Response(JSON.stringify(mockData.user), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
      }
      return originalFetch.call(window, url, ...args);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [mockData]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-green-500/10 border-b border-green-500/20 p-6 fixed top-0 left-0 right-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white uppercase">
              🎨 AI-Generated Testimonials Component
            </h1>
            <p className="text-green-400 text-sm">
              WCL (141 lines) → TypeScript (210 lines) → 33% reduction → LIVE!
            </p>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-sm">Features:</div>
            <div className="text-green-400 font-bold">Quantum States | Star Ratings | Verified Badges</div>
          </div>
        </div>
      </div>
      
      {/* Live Component */}
      <div className="pt-20">
        <PremiumTestimonials
          vendorId="flora-distro"
          headline="TRUSTED BY CONNOISSEURS"
          subheadline="Premium experiences from our community"
          maxReviews={6}
          showRatings={true}
          accentColor="#10b981"
        />
      </div>
    </div>
  );
}
