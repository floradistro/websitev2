"use client";

import { ReactNode } from "react";

interface SectionHeaderProps {
  /**
   * The header text to display
   */
  children: ReactNode;

  /**
   * HTML tag to render (h1, h2, h3, h4)
   * @default "h2"
   */
  as?: "h1" | "h2" | "h3" | "h4";

  /**
   * Whether to include bottom margin (mb-4)
   * @default true
   */
  withMargin?: boolean;

  /**
   * Optional content to display on the right side
   * (e.g., badges, buttons, counts)
   */
  rightContent?: ReactNode;

  /**
   * Additional CSS classes to append
   */
  className?: string;
}

/**
 * POS-themed section header component
 *
 * Provides consistent styling for section headers across the application:
 * - Ultra-small uppercase text (10px)
 * - Wide letter spacing (0.15em)
 * - Black font weight (900)
 * - White with 40% opacity
 *
 * @example
 * ```tsx
 * <SectionHeader>Product Images</SectionHeader>
 *
 * <SectionHeader as="h3" withMargin={false}>
 *   Pricing Tiers
 * </SectionHeader>
 *
 * <SectionHeader rightContent={
 *   <span className="text-red-400 text-[9px]">Required</span>
 * }>
 *   Basic Information
 * </SectionHeader>
 * ```
 */
export default function SectionHeader({
  children,
  as = "h2",
  withMargin = true,
  rightContent,
  className = "",
}: SectionHeaderProps) {
  const Tag = as;

  const baseClasses =
    "text-[10px] uppercase tracking-[0.15em] text-white/40 font-black";
  const marginClass = withMargin ? "mb-4" : "";
  const finalClasses = `${baseClasses} ${marginClass} ${className}`.trim();

  if (rightContent) {
    return (
      <div className={`flex items-center justify-between ${marginClass}`}>
        <Tag className={baseClasses} style={{ fontWeight: 900 }}>
          {children}
        </Tag>
        {rightContent}
      </div>
    );
  }

  return (
    <Tag className={finalClasses} style={{ fontWeight: 900 }}>
      {children}
    </Tag>
  );
}
