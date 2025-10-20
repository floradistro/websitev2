
"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Package, ShoppingCart } from 'lucide-react';

export default function AdminAnalytics() {
  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      <div className="px-4 lg:px-0 py-6 lg:py-0 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
          Analytics
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Marketplace performance and insights
        </p>
      </div>

      <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 text-center">
        <TrendingUp size={48} className="text-white/20 mx-auto mb-4" />
        <p className="text-white/60">Analytics dashboard coming soon</p>
      </div>
    </div>
  );
}

