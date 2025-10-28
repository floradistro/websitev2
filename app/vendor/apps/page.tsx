'use client';

import { useAppAuth } from '@/context/AppAuthContext';
import { AppsGrid } from '@/components/admin/AppsGrid';
import { MapPin, User, Briefcase } from 'lucide-react';

export default function AppsPage() {
  const { user, vendor, locations, primaryLocation, role } = useAppAuth();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'vendor_admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'manager':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'employee':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'vendor_admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'employee':
        return 'Employee';
      default:
        return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          {/* Hero Welcome with Vendor Logo */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.02] via-transparent to-transparent border border-white/5 rounded-3xl p-8 lg:p-12 mb-6">
            {/* Subtle animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-transparent opacity-50 animate-pulse" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Left: Logo + Welcome Message */}
              <div className="flex items-center gap-6 lg:gap-8">
                {/* Vendor Logo with Glow */}
                {vendor?.logo_url ? (
                  <div className="relative group">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20 flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:border-white/40">
                      <img
                        src={vendor.logo_url}
                        alt={vendor.store_name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-2xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                ) : (
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-white/20">
                    <Briefcase size={40} className="text-white/60" />
                  </div>
                )}

                {/* Welcome Text */}
                <div>
                  <h1 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-tight mb-2 bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent" style={{ fontWeight: 900 }}>
                    Welcome Back, {vendor?.store_name || user?.name}
                  </h1>
                  <p className="text-white/60 text-sm lg:text-base">
                    Select an app to get started
                  </p>
                </div>
              </div>

              {/* Right: User Info Card */}
              <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[280px] backdrop-blur-sm">
                <div className="space-y-3">
                {/* Vendor */}
                {vendor && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      {vendor.logo_url ? (
                        <img
                          src={vendor.logo_url}
                          alt={vendor.store_name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Briefcase size={18} className="text-white/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-white/40">Vendor</div>
                      <div className="text-white text-sm font-bold truncate">{vendor.store_name}</div>
                    </div>
                  </div>
                )}

                {/* Role */}
                {role && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-white/60" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-1">Role</div>
                      <div className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${getRoleBadgeColor(role)}`}>
                        {getRoleLabel(role)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Location */}
                {primaryLocation && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-white/40">Location</div>
                      <div className="text-white text-sm font-bold truncate">{primaryLocation.name}</div>
                    </div>
                  </div>
                )}

                {/* Location count for multi-location employees */}
                {locations.length > 1 && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 text-center">
                      Access to {locations.length} locations
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile User Info */}
          <div className="lg:hidden bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              {vendor && (
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-1">Vendor</div>
                  <div className="text-white text-sm font-bold">{vendor.store_name}</div>
                </div>
              )}
              {role && (
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-1">Role</div>
                  <div className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${getRoleBadgeColor(role)}`}>
                    {getRoleLabel(role)}
                  </div>
                </div>
              )}
              {primaryLocation && (
                <div className="col-span-2">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-1">Location</div>
                  <div className="text-white text-sm font-bold">{primaryLocation.name}</div>
                  {locations.length > 1 && (
                    <div className="text-[9px] text-white/60 mt-1">
                      +{locations.length - 1} more {locations.length === 2 ? 'location' : 'locations'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section Title */}
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-xs uppercase tracking-[0.15em] text-white/60 font-bold">
              Your Apps
            </h2>
          </div>
        </div>

        {/* Apps Grid */}
        <AppsGrid />
      </div>
    </div>
  );
}
