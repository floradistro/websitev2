"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { AppsGrid } from "@/components/admin/AppsGrid";
import { MapPin, User, Briefcase, Store, Sparkles, TrendingUp, Package } from "lucide-react";
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
    <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden flex flex-col">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/[0.008] rounded-full blur-3xl" />
      </div>

      <div className="flex-1 overflow-y-auto w-full relative z-10">
        {/* Left-aligned content container */}
        <div className="max-w-5xl mx-auto px-8 pt-16">
          {/* Greeting Header - Left aligned */}
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden shadow-lg shadow-black/40">
                <img
                  src={vendor?.logo_url || "/yacht-club-logo.png"}
                  alt={vendor?.store_name || "Logo"}
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <div>
                <h1 className="text-white text-xl tracking-tight font-medium">{getGreeting()}</h1>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">
                  {vendor?.store_name || "Your Store"}
                </p>
              </div>
            </div>
          </div>

          {/* Section divider */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-white/90 text-sm uppercase tracking-[0.15em] font-medium">
                Apps
              </h2>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
          </div>

          {/* App Grid - Left aligned, constrained width */}
          <div className="max-w-3xl pb-16">
            <AppsGrid badgeCounts={badgeCounts} />
          </div>
        </div>
      </div>

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
