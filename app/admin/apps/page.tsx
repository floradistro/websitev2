'use client';

import { AppsGrid } from '@/components/admin/AppsGrid';
import { Briefcase, User, Shield } from 'lucide-react';

export default function AdminAppsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          {/* Hero Welcome */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.02] via-transparent to-transparent border border-white/5 rounded-3xl p-8 lg:p-12 mb-6">
            {/* Subtle animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-transparent opacity-50 animate-pulse" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Left: Logo + Welcome Message */}
              <div className="flex items-center gap-6 lg:gap-8">
                {/* WhaleTools Logo */}
                <img src="/whale.png" alt="WhaleTools" className="w-24 h-24 lg:w-32 lg:h-32 object-contain transition-all duration-300 hover:opacity-80" />

                {/* Welcome Text */}
                <div>
                  <h1 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tight mb-2 bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent" style={{ fontWeight: 900 }}>
                    WhaleTools Admin Center
                  </h1>
                  <p className="text-white/60 text-sm lg:text-base">
                    Select an app to manage your platform
                  </p>
                </div>
              </div>

              {/* Right: Admin Info Card */}
              <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[280px] backdrop-blur-sm">
                <div className="space-y-3">
                  {/* Admin Badge */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield size={18} className="text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-white/40">Role</div>
                      <div className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg border bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Platform Admin
                      </div>
                    </div>
                  </div>

                  {/* Access Level */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-white/40">Access Level</div>
                      <div className="text-white text-sm font-bold">Full System Access</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Admin Info */}
          <div className="lg:hidden bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-1">Role</div>
                <div className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg border bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Platform Admin
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-1">Access</div>
                <div className="text-white text-sm font-bold">Full System</div>
              </div>
            </div>
          </div>

          {/* Section Title */}
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-xs uppercase tracking-[0.15em] text-white/60 font-bold">
              Admin Tools
            </h2>
          </div>
        </div>

        {/* Apps Grid */}
        <AppsGrid />
      </div>
    </div>
  );
}
