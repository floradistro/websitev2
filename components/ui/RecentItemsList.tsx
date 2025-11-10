/**
 * UNIFIED RECENT ITEMS LIST
 * Generic list for recent products, orders, activity, etc.
 */

import Link from "next/link";
import { LucideIcon, Calendar } from "lucide-react";
import { ReactNode } from "react";

interface RecentItem {
  id: string | number;
  title: string;
  subtitle?: string;
  image?: string;
  date?: string;
  status?: ReactNode | string;
  icon?: LucideIcon;
}

interface RecentItemsListProps {
  title: string;
  items: RecentItem[];
  viewAllHref?: string;
  emptyMessage?: string;
  loading?: boolean;
  renderItem?: (item: RecentItem) => ReactNode;
  className?: string;
}

export function RecentItemsList({
  title,
  items,
  viewAllHref,
  emptyMessage = "No items yet",
  loading = false,
  renderItem,
  className = "",
}: RecentItemsListProps) {
  return (
    <div className={`minimal-glass ${className}`}>
      <div className="border-b border-white/5 p-6 flex justify-between items-center">
        <h2 className="text-white/40 text-[11px] font-light tracking-[0.2em] uppercase">
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-white/60 hover:text-white text-xs uppercase tracking-wider transition-colors"
          >
            View All
          </Link>
        )}
      </div>
      <div className="divide-y divide-white/10">
        {loading ? (
          <div className="p-12 text-center text-white/40 text-xs">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-white/40 text-xs">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-6 hover:bg-white/[0.02] transition-all"
            >
              {renderItem ? (
                renderItem(item)
              ) : (
                <DefaultItemRenderer item={item} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DefaultItemRenderer({ item }: { item: RecentItem }) {
  const ItemIcon = item.icon;

  return (
    <div className="flex items-center gap-4">
      {item.image ? (
        <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden rounded-[8px]">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : ItemIcon ? (
        <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 rounded-[8px]">
          <ItemIcon size={20} className="text-white/30" />
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <div className="text-white font-medium mb-1 text-sm">{item.title}</div>
        {item.subtitle && (
          <div className="text-xs text-white/50 mb-1">{item.subtitle}</div>
        )}
        {item.date && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Calendar size={12} />
            <span>{item.date}</span>
          </div>
        )}
      </div>

      {item.status && (
        <div className="flex items-center gap-3">{item.status}</div>
      )}
    </div>
  );
}
