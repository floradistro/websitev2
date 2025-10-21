"use client";

import { TrendingUp } from 'lucide-react';

export default function AdminAnalytics() {
  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
          Analytics
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Marketplace insights and performance
        </p>
      </div>
      
      <div className="bg-[#1a1a1a] lg:border border-t lg:border-t-0 border-white/5 p-12 lg:p-16 text-center">
        <TrendingUp size={48} className="text-white/20 mx-auto mb-4" />
        <h3 className="text-white text-lg font-medium mb-2">Analytics - Coming Soon</h3>
        <p className="text-white/60 text-sm">
          Advanced analytics and reporting features will be added here
        </p>
      </div>
    </div>
  );
}
