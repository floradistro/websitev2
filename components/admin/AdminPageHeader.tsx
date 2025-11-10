"use client";

import { LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6 md:mb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 md:gap-6">
          {Icon && (
            <>
              <Icon
                size={56}
                className="md:hidden text-white/90"
                strokeWidth={1.5}
              />
              <Icon
                size={72}
                className="hidden md:block text-white/90"
                strokeWidth={1.5}
              />
            </>
          )}
          <div>
            <h1 className="text-2xl md:text-4xl font-thin text-white tracking-tight mb-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/50 text-xs md:text-sm font-light tracking-wide uppercase">
                {subtitle} ·{" "}
                {new Date()
                  .toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .toUpperCase()}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
