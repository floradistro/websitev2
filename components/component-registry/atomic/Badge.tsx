/**
 * Atomic Component: Badge
 * Small status indicators, labels, and tags
 */

import React from "react";

export interface BadgeProps {
  text: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  outline?: boolean;
  pill?: boolean;
  className?: string;
}

export function Badge({
  text,
  variant = "default",
  size = "md",
  icon,
  outline = false,
  pill = true,
  className = "",
}: BadgeProps) {
  const sizeClasses: Record<string, string> = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const variantClasses: Record<string, { solid: string; outline: string }> = {
    default: {
      solid: "bg-white/10 text-white border-white/5",
      outline: "bg-transparent text-white border-white/5",
    },
    success: {
      solid: "bg-green-600 text-white border-green-500",
      outline: "bg-transparent text-green-400 border-green-600",
    },
    warning: {
      solid: "bg-yellow-600 text-black border-yellow-500",
      outline: "bg-transparent text-yellow-400 border-yellow-600",
    },
    danger: {
      solid: "bg-red-600 text-white border-red-500",
      outline: "bg-transparent text-red-400 border-red-600",
    },
    info: {
      solid: "bg-blue-600 text-white border-blue-500",
      outline: "bg-transparent text-blue-400 border-blue-600",
    },
    neutral: {
      solid: "bg-neutral-200 text-neutral-900 border-neutral-300",
      outline: "bg-transparent text-neutral-400 border-neutral-500",
    },
  };

  const selectedVariant = outline
    ? variantClasses[variant].outline
    : variantClasses[variant].solid;

  const baseClasses = [
    "inline-flex items-center justify-center",
    "font-black uppercase tracking-[0.08em]",
    "border",
    pill ? "rounded-full" : "rounded",
    sizeClasses[size],
    selectedVariant,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={baseClasses}>
      {icon && <span className="mr-1">{icon}</span>}
      {text}
    </span>
  );
}
