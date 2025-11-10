/**
 * UNIFIED ACTIONS LIST
 * List of clickable action items with icons
 */

import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";

interface Action {
  id: string | number;
  title: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  onClick?: () => void;
}

interface ActionsListProps {
  title: string;
  actions: Action[];
  className?: string;
}

export function ActionsList({
  title,
  actions,
  className = "",
}: ActionsListProps) {
  return (
    <div className={`minimal-glass ${className}`}>
      <div className="mb-6 p-6 border-b border-white/5">
        <h3 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-2 p-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <div className="flex items-center gap-4 p-4 rounded-[14px] hover:bg-white/[0.03] transition-all duration-300 group">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon size={16} className="text-white/60" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-light mb-0.5">
                  {action.title}
                </p>
                {action.description && (
                  <p className="text-white/40 text-xs">{action.description}</p>
                )}
              </div>
              <ArrowUpRight
                size={14}
                className="text-white/40 group-hover:text-white/60 transition-colors"
              />
            </div>
          );

          if (action.onClick) {
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="w-full text-left"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={action.id} href={action.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
