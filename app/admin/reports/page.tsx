"use client";

import { FileText } from 'lucide-react';

export default function AdminReports() {
  return (
    <div>
      <h1 className="text-3xl text-white mb-2">Reports</h1>
      <p className="text-white/60 text-sm mb-8">Generate and view reports</p>
      <div className="bg-[#1a1a1a] border border-white/5 p-12 text-center">
        <FileText size={48} className="text-white/20 mx-auto mb-4" />
        <p className="text-white/60">Reports coming soon</p>
      </div>
    </div>
  );
}
