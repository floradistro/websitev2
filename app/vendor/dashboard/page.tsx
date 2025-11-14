"use client";

import Link from "next/link";
import { useAppAuth } from "@/context/AppAuthContext";
import { allNavItems } from "@/lib/vendor-navigation";

export default function Dashboard() {
  const { hasAppAccess } = useAppAuth();

  // Filter apps user has access to
  const apps = allNavItems.filter((item) => {
    // Always show if no appKey required or if user has access
    return !item.appKey || hasAppAccess(item.appKey);
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {apps.map((app) => {
        const Icon = app.icon;
        return (
          <Link
            key={app.href}
            href={app.href}
            className="aspect-square bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4 group"
          >
            <Icon className="w-8 h-8 text-white/40 group-hover:text-white/60 transition-colors" strokeWidth={1.5} />
            <span className="text-xs text-white/60 group-hover:text-white/80 text-center font-light uppercase tracking-wider transition-colors">
              {app.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
