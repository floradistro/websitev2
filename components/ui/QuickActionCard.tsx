/**
 * UNIFIED QUICK ACTION CARD
 * Icon + label clickable card
 */

import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickActionCardProps {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
  span?: number; // Grid span (for col-span-2 etc)
}

export function QuickActionCard({
  href,
  icon: Icon,
  label,
  className = "",
  span = 1,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={`group minimal-glass hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4 ${span > 1 ? `col-span-${span}` : ""} ${className}`}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 rounded-[12px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
        <Icon
          size={20}
          className="text-white/60 group-hover:text-white transition-colors duration-300"
          strokeWidth={1.5}
        />
      </div>
      <div className="text-white/80 group-hover:text-white text-xs uppercase tracking-[0.15em] font-light transition-colors duration-300">
        {label}
      </div>
    </Link>
  );
}

interface QuickActionsGridProps {
  children: React.ReactNode;
  cols?: number;
  className?: string;
}

export function QuickActionsGrid({ children, cols = 6, className = "" }: QuickActionsGridProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${cols} gap-3 ${className}`}>{children}</div>
  );
}
