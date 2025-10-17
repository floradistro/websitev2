"use client";

import { useLoyalty } from "@/context/LoyaltyContext";
import { useAuth } from "@/context/AuthContext";
import { Coins } from "lucide-react";
import Link from "next/link";

export default function LoyaltyBadge() {
  const { points, pointsLabel, loading } = useLoyalty();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated || loading) return null;

  // Get singular label (e.g., "Chip" from "Chip:Chips")
  const [singularLabel, pluralLabel] = pointsLabel.split(':');
  const label = points === 1 ? singularLabel : (pluralLabel || singularLabel);

  return (
    <Link
      href="/dashboard?tab=loyalty"
      className="hidden lg:flex items-center gap-2 text-white/60 hover:text-white transition-smooth group relative"
      title={`${points.toLocaleString()} ${label}`}
    >
      <Coins size={14} className="text-amber-400" />
      <span className="text-xs font-light tracking-wide">
        {points.toLocaleString()} {label}
      </span>
      <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </Link>
  );
}
