/**
 * PageHeader - Unified Header System for WhaleTools PWA
 *
 * Apple-quality consistency across all pages.
 * Respects safe areas, provides clear hierarchy, enables smooth navigation.
 *
 * Design principles:
 * - Ruthless consistency
 * - Information hierarchy (Title > Context > Action)
 * - Minimal, never empty
 * - Safe area aware
 * - Gesture-friendly
 */

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ds";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Tab {
  label: string;
  value: string;
  count?: number;
  icon?: LucideIcon;
}

export interface PageHeaderProps {
  // Content
  title: string;
  context?: string;

  // Navigation
  back?: string | (() => void);

  // Actions
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;

  // Tabs (optional)
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;

  // Variants
  minimal?: boolean;
  sticky?: boolean;

  // Accessibility
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  context,
  back,
  action,
  secondaryAction,
  tabs,
  activeTab,
  onTabChange,
  minimal = false,
  sticky = false,
  loading = false,
  ariaLabel,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof back === "function") {
      back();
    } else if (typeof back === "string") {
      router.push(back);
    }
  };

  return (
    <header
      className={cn(
        "w-full transition-all duration-300",
        // Safe area handling - iOS notch/Dynamic Island
        "pt-[max(env(safe-area-inset-top),16px)] pb-6 px-4",
        // Background & borders
        "bg-black/0", // Transparent by default
        sticky && "sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/[0.06]",
        className,
      )}
      role="banner"
      aria-label={ariaLabel || `${title} page`}
    >
      {/* Top Row: Back Button + Actions */}
      {(back || action || secondaryAction) && (
        <div className="flex items-center justify-between mb-4">
          {/* Back Button */}
          {back ? (
            <button
              onClick={handleBack}
              className={cn(
                "flex items-center gap-2",
                "text-white/60 hover:text-white",
                "transition-colors duration-200",
                "text-sm font-light tracking-tight",
                "-ml-2 px-2 py-1", // Extend touch target
              )}
              aria-label="Go back"
            >
              <ArrowLeft size={18} strokeWidth={1.5} />
              <span className="hidden sm:inline">Back</span>
            </button>
          ) : (
            <div /> /* Spacer */
          )}

          {/* Actions */}
          {(action || secondaryAction) && (
            <div className="flex items-center gap-2">
              {secondaryAction}
              {action}
            </div>
          )}
        </div>
      )}

      {/* Title + Context */}
      <div className={cn("space-y-1", minimal && "text-center")}>
        <h1
          className={cn(
            // Typography
            "text-[28px] font-light tracking-tight leading-tight",
            "text-white/90",
            // Animation
            "transition-opacity duration-300",
            loading && "opacity-40 animate-pulse",
          )}
        >
          {title}
        </h1>

        {context && !minimal && (
          <p
            className={cn(
              // Typography
              "text-[10px] font-light uppercase tracking-[0.15em]",
              "text-white/40",
              // Animation
              "transition-opacity duration-300",
              loading && "opacity-20",
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {context}
          </p>
        )}
      </div>

      {/* Tabs (Optional) */}
      {tabs && tabs.length > 0 && (
        <div
          className={cn(
            "flex gap-2 mt-6 pt-6 border-t border-white/[0.04]",
            "overflow-x-auto scrollbar-hide", // Horizontal scroll on mobile
            "-mx-4 px-4", // Bleed to edges
          )}
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const Icon = tab.icon;

            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.value}-panel`}
                onClick={() => onTabChange?.(tab.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5",
                  "border-b-2 transition-all duration-200",
                  "whitespace-nowrap", // Prevent wrapping
                  // Typography
                  "text-xs uppercase tracking-wider font-light",
                  // States
                  isActive
                    ? "border-white text-white"
                    : "border-transparent text-white/40 hover:text-white/60",
                )}
              >
                {Icon && <Icon size={14} strokeWidth={1} className="opacity-60" />}
                {tab.label}
                {typeof tab.count === "number" && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px]",
                      "bg-white/[0.06] text-white/60",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Exports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard header for list/grid pages
 *
 * @example
 * <PageHeader.Standard
 *   title="Products"
 *   count={42}
 *   action={<Button>Add Product</Button>}
 * />
 */
PageHeader.Standard = function Standard({
  title,
  count,
  sublabel,
  action,
  loading,
}: {
  title: string;
  count?: number;
  sublabel?: string;
  action?: React.ReactNode;
  loading?: boolean;
}) {
  const context = [
    typeof count === "number" ? `${count} ${count === 1 ? "ITEM" : "ITEMS"}` : null,
    sublabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageHeader title={title} context={context || undefined} action={action} loading={loading} />
  );
};

/**
 * Header with back button for detail pages
 *
 * @example
 * <PageHeader.Detail
 *   title="Edit Product"
 *   subtitle="GMO · Flower"
 *   back="/vendor/products"
 *   action={<Button>Save</Button>}
 * />
 */
PageHeader.Detail = function Detail({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back: string | (() => void);
  action?: React.ReactNode;
}) {
  return <PageHeader title={title} context={subtitle} back={back} action={action} />;
};

/**
 * Minimal header for auth and error pages
 *
 * @example
 * <PageHeader.Minimal title="Sign In" />
 */
PageHeader.Minimal = function Minimal({ title }: { title: string }) {
  return <PageHeader title={title} minimal />;
};

/**
 * Header with tabs for multi-section pages
 *
 * @example
 * <PageHeader.Tabbed
 *   title="Products"
 *   tabs={[
 *     { label: "Products", value: "products", count: 42 },
 *     { label: "Categories", value: "categories", count: 12 }
 *   ]}
 *   activeTab={tab}
 *   onTabChange={setTab}
 * />
 */
PageHeader.Tabbed = function Tabbed({
  title,
  context,
  tabs,
  activeTab,
  onTabChange,
  action,
}: {
  title: string;
  context?: string;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      context={context}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      action={action}
    />
  );
};
