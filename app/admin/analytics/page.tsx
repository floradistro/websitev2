"use client";

import { TrendingUp } from 'lucide-react';

export default function AdminAnalytics() {
  return (
    <div>
      <h1 className="text-3xl text-white mb-2">Analytics</h1>
      <p className="text-white/60 text-sm mb-8">Marketplace insights</p>
      <div className="bg-[#1a1a1a] border border-white/5 p-12 text-center">
        <TrendingUp size={48} className="text-white/20 mx-auto mb-4" />
        <p className="text-white/60">Analytics coming soon</p>
      </div>
    </div>
  );
}
