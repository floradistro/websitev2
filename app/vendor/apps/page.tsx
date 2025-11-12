"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { AppsGrid } from "@/components/admin/AppsGrid";
import { MapPin, Briefcase, TrendingUp, Package } from "lucide-react";
import { useVendorDashboard } from "@/hooks/useVendorData";
import { DashboardSkeleton } from "@/components/vendor/VendorSkeleton";
import { KPIWidget } from "@/components/dashboard/KPIWidget";
import { AIKPICreator } from "@/components/dashboard/AIKPICreator";

import { logger } from "@/lib/logger";
export default function MegaDashboard() {
  const { user, vendor, locations, primaryLocation, role, isLoading } = useAppAuth();
  const { data: dashboardData, loading } = useVendorDashboard();

  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    totalSales30d: 0,
    lowStock: 0,
  });

  const [showKPICreator, setShowKPICreator] = useState(false);
  const [kpiWidgets, setKpiWidgets] = useState<any[]>([]);
  const [badgeCounts, setBadgeCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!dashboardData) return;
    setStats({
      approved: dashboardData.stats?.approved || 0,
      pending: dashboardData.stats?.pending || 0,
      totalSales30d: dashboardData.stats?.totalSales30d || 0,
      lowStock: dashboardData.stats?.lowStock || 0,
    });
  }, [dashboardData]);

  useEffect(() => {
    const loadKPIWidgets = async () => {
      if (!vendor?.id) return;
      try {
        const response = await fetch(`/api/kpi-widgets?vendorId=${vendor.id}`);
        const data = await response.json();
        if (data.success) {
          setKpiWidgets(data.widgets);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error loading KPI widgets:", error);
        }
      }
    };
    loadKPIWidgets();
  }, [vendor?.id]);

  // Fetch badge counts
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      if (!vendor?.id) return;
      try {
        const response = await fetch(`/api/vendor/badge-counts?vendorId=${vendor.id}`);
        const data = await response.json();
        if (data.success) {
          setBadgeCounts(data.badgeCounts);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error fetching badge counts:", error);
        }
      }
    };
    fetchBadgeCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, [vendor?.id]);

  const handleSaveKPI = async (kpi: any) => {
    if (!vendor?.id) return;
    try {
      const response = await fetch("/api/kpi-widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          kpi: { ...kpi, originalPrompt: kpi.originalPrompt || "" },
        }),
      });
      const data = await response.json();
      if (data.success) {
        setKpiWidgets((prev) => [...prev, data.widget]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error saving KPI widget:", error);
      }
    }
  };

  const handleDeleteKPI = async (id: string) => {
    try {
      const response = await fetch(`/api/kpi-widgets?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setKpiWidgets((prev) => prev.filter((kpi) => kpi.id !== id));
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error deleting KPI widget:", error);
      }
    }
  };

  const handleRefreshKPI = async (id: string) => {};

  // CRITICAL FIX: Wait for auth context to load before rendering apps
  // This prevents "No apps available" from showing during context load
  if (isLoading || loading) {
    return <DashboardSkeleton />;
  }

  const vendorBranding = dashboardData?.vendor;
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="w-full">
      {/* Quick Stats */}
      {dashboardData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
                Products
              </span>
              <Package className="w-4 h-4 text-white/20" strokeWidth={1.5} />
            </div>
            <div className="text-2xl font-light text-white/90">{stats.approved}</div>
            {stats.lowStock > 0 && (
              <div className="text-[10px] text-red-400/60 mt-1">
                {stats.lowStock} low stock
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
                30-Day Sales
              </span>
              <TrendingUp className="w-4 h-4 text-white/20" strokeWidth={1.5} />
            </div>
            <div className="text-2xl font-light text-white/90">
              ${(stats.totalSales30d / 1000).toFixed(1)}k
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
                Location
              </span>
              <MapPin className="w-4 h-4 text-white/20" strokeWidth={1.5} />
            </div>
            <div className="text-sm font-light text-white/90 truncate">
              {primaryLocation?.name || "No location"}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
                Role
              </span>
              <Briefcase className="w-4 h-4 text-white/20" strokeWidth={1.5} />
            </div>
            <div className="text-sm font-light text-white/90 capitalize">
              {role?.replace(/_/g, " ") || "User"}
            </div>
          </div>
        </div>
      )}

      {/* Apps Grid */}
      <AppsGrid badgeCounts={badgeCounts} />

      {/* AI KPI Creator Modal */}
      <AIKPICreator
        isOpen={showKPICreator}
        onClose={() => setShowKPICreator(false)}
        onSave={handleSaveKPI}
        vendorId={vendor?.id || ""}
      />
    </div>
  );
}
