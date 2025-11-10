/**
 * Smart Component Base Classes & Utilities
 * Makes building smart components faster and more consistent
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

import { logger } from "@/lib/logger";
/**
 * Base props that all smart components should extend
 */
export interface SmartComponentBaseProps {
  vendorId?: string;
  vendorSlug?: string;
  vendorName?: string;
  vendorLogo?: string;
  className?: string;
  animate?: boolean;
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation(options?: {
  triggerOnce?: boolean;
  threshold?: number;
  rootMargin?: string;
}) {
  const { ref, inView } = useInView({
    triggerOnce: options?.triggerOnce ?? true,
    threshold: options?.threshold ?? 0.1,
    rootMargin: options?.rootMargin ?? "-50px",
  });

  return { ref, inView };
}

/**
 * Hook for fetching vendor-specific data
 */
export function useVendorData<T>(endpoint: string, vendorId?: string, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        if (process.env.NODE_ENV === "development") {
          logger.error("Error fetching vendor data:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [vendorId, endpoint, ...dependencies]);

  return { data, loading, error };
}

/**
 * Loading skeleton for smart components
 */
export function SmartComponentSkeleton({
  className = "",
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={`py-16 sm:py-20 px-4 sm:px-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/10 rounded-2xl w-64 mb-8" />
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-white/5 rounded-xl"
              style={{ width: `${100 - i * 10}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Error display for smart components
 */
export function SmartComponentError({
  error,
  componentName,
}: {
  error: Error;
  componentName: string;
}) {
  return (
    <div className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <p className="text-red-400 font-black uppercase tracking-wide text-sm">
            Error loading {componentName}
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-red-400/60 text-xs mt-2">{error.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component for consistent smart component structure
 */
export function SmartComponentWrapper({
  children,
  className = "",
  animate = true,
  loading = false,
  error = null,
  componentName = "Component",
  skeletonLines = 3,
}: {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  loading?: boolean;
  error?: Error | null;
  componentName?: string;
  skeletonLines?: number;
}) {
  const { ref, inView } = useScrollAnimation();

  if (loading) {
    return <SmartComponentSkeleton className={className} lines={skeletonLines} />;
  }

  if (error) {
    return <SmartComponentError error={error} componentName={componentName} />;
  }

  if (animate) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={className}>{children}</div>;
}

/**
 * Typography helpers for consistent styling
 */
export const SmartTypography = {
  Headline: ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <h2
      className={`text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-8 ${className}`}
      style={{ fontWeight: 900 }}
    >
      {children}
    </h2>
  ),

  Subheadline: ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <p className={`text-base sm:text-lg text-white/60 uppercase tracking-wide ${className}`}>
      {children}
    </p>
  ),

  Body: ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <p className={`text-sm sm:text-base text-white/60 leading-relaxed ${className}`}>{children}</p>
  ),

  Label: ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <span className={`text-white/40 uppercase tracking-[0.15em] font-black text-xs ${className}`}>
      {children}
    </span>
  ),
};

/**
 * Container helpers for consistent layouts
 */
export const SmartContainers = {
  Section: ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`py-16 sm:py-20 px-4 sm:px-6 ${className}`}>{children}</div>
  ),

  MaxWidth: ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`max-w-7xl mx-auto ${className}`}>{children}</div>
  ),

  Card: ({
    children,
    className = "",
    hover = true,
  }: {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
  }) => (
    <div
      className={`bg-[#0a0a0a] border border-white/5 rounded-2xl ${hover ? "hover:border-white/10" : ""} transition-all ${className}`}
    >
      {children}
    </div>
  ),

  Grid: ({
    children,
    cols = 3,
    className = "",
  }: {
    children: React.ReactNode;
    cols?: number;
    className?: string;
  }) => (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-4 sm:gap-6 ${className}`}
    >
      {children}
    </div>
  ),
};

/**
 * Button component with luxury styling
 */
export function SmartButton({
  children,
  onClick,
  href,
  variant = "primary",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  [key: string]: any;
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase tracking-[0.08em] text-xs sm:text-sm transition-all";

  const variants = {
    primary: "bg-white text-black hover:bg-white/90",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20",
    ghost: "text-white hover:bg-white/10",
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={combinedClassName} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={combinedClassName} {...props}>
      {children}
    </button>
  );
}
