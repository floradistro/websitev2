/**
 * UNIFIED PAGE HEADER
 * Title + subtitle + action buttons
 */

import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-12 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/40 text-xs font-light tracking-wide uppercase">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex items-center gap-3">{action}</div>}
      </div>
    </div>
  );
}
