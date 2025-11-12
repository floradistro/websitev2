"use client";

import { useState, useEffect } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/vendor/VendorSkeleton";
import { pageLayouts, cardVariants, textPresets } from "@/lib/design-system";
import {
  Printer,
  Tag,
  FileText,
  Plus,
  History,
  Grid3x3,
  Sparkles,
  Package
} from "lucide-react";
import Link from "next/link";

interface QuickStat {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}

export default function LabelsPage() {
  const { vendor, isLoading } = useAppAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPrinted: 0,
    templatesCount: 0,
    lastPrintDate: null as string | null,
  });

  useEffect(() => {
    if (vendor?.id) {
      // TODO: Load stats from API
      setStats({
        totalPrinted: 1247,
        templatesCount: 5,
        lastPrintDate: new Date().toISOString(),
      });
    }
  }, [vendor?.id]);

  if (isLoading) {
    return <PageLoader message="Loading label center..." />;
  }

  const quickStats: QuickStat[] = [
    {
      label: "Labels Printed",
      value: stats.totalPrinted.toLocaleString(),
      icon: Printer,
      color: "text-blue-400",
    },
    {
      label: "Templates",
      value: stats.templatesCount,
      icon: FileText,
      color: "text-purple-400",
    },
    {
      label: "Last Print",
      value: stats.lastPrintDate
        ? new Date(stats.lastPrintDate).toLocaleDateString()
        : "Never",
      icon: History,
      color: "text-green-400",
    },
  ];

  const quickActions = [
    {
      title: "Quick Print",
      description: "Print labels from your products",
      icon: Printer,
      href: "/vendor/labels/print",
      color: "from-blue-500/10 to-blue-600/5",
      iconColor: "text-blue-400",
    },
    {
      title: "Templates",
      description: "Manage label templates",
      icon: Grid3x3,
      href: "/vendor/labels/templates",
      color: "from-purple-500/10 to-purple-600/5",
      iconColor: "text-purple-400",
    },
    {
      title: "Bulk Print",
      description: "Print multiple products at once",
      icon: Package,
      href: "/vendor/labels/print?bulk=true",
      color: "from-green-500/10 to-green-600/5",
      iconColor: "text-green-400",
    },
  ];

  const recentTemplates = [
    { name: "Default", description: "Standard shelf label", lastUsed: "2 hours ago" },
    { name: "Price Tag", description: "Simple price labels", lastUsed: "1 day ago" },
    { name: "Cannabis Premium", description: "Full product details", lastUsed: "3 days ago" },
  ];

  return (
    <div className={pageLayouts.page}>
      <div className={pageLayouts.content}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <p className={textPresets.statLabel}>{stat.label}</p>
                <stat.icon className={`w-5 h-5 ${stat.color}`} strokeWidth={1.5} />
              </div>
              <div className={textPresets.statValue}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-light text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] p-6 transition-all"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <action.icon className={`w-8 h-8 ${action.iconColor} mb-4`} strokeWidth={1.5} />
                  <h3 className="text-base font-medium text-white mb-1">{action.title}</h3>
                  <p className="text-sm text-white/40">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Templates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-light text-white">Recent Templates</h2>
            <Link
              href="/vendor/labels/templates"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTemplates.map((template) => (
              <div
                key={template.name}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <Tag className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{template.name}</div>
                    <div className="text-xs text-white/40">{template.description}</div>
                  </div>
                </div>
                <div className="text-xs text-white/30">{template.lastUsed}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white/60" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-light text-white mb-2">
                Professional Label Printing
              </h3>
              <p className="text-sm text-white/40 mb-4 max-w-2xl">
                Create beautiful, professional labels for your products. Choose from pre-designed templates
                or customize your own. Perfect for shelf tags, price labels, and product information.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/vendor/labels/print"
                  className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Start Printing
                </Link>
                <Link
                  href="/vendor/labels/templates"
                  className="px-4 py-2 rounded-lg bg-white/[0.06] text-white text-sm font-medium hover:bg-white/[0.08] transition-colors"
                >
                  Browse Templates
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
