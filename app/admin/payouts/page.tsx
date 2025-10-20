"use client";

import { DollarSign } from 'lucide-react';

export default function AdminPayouts() {
  return (
    <div>
      <h1 className="text-3xl text-white mb-2">Vendor Payouts</h1>
      <p className="text-white/60 text-sm mb-8">Manage vendor payments</p>
      <div className="bg-[#1a1a1a] border border-white/5 p-12 text-center">
        <DollarSign size={48} className="text-white/20 mx-auto mb-4" />
        <p className="text-white/60">Payout management coming soon</p>
      </div>
    </div>
  );
}
