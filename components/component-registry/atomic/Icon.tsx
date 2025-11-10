/**
 * Atomic Component: Icon
 * Renders icons with consistent sizing and styling
 */

import React from "react";

export interface IconProps {
  name: string; // Emoji or SVG identifier
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  color?: string;
  className?: string;
  emoji?: boolean; // True if using emoji instead of SVG
}

export function Icon({
  name,
  size = "md",
  color,
  className = "",
  emoji = true,
}: IconProps) {
  const sizeClasses: Record<string, string> = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-4xl",
  };

  const baseClasses = [
    "inline-flex items-center justify-center",
    sizeClasses[size],
    color ? "" : "text-current",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = color ? { color } : undefined;

  if (emoji) {
    return (
      <span className={baseClasses} style={style} role="img" aria-label={name}>
        {name}
      </span>
    );
  }

  // TODO: Add SVG icon support (Heroicons, etc.)
  return (
    <span className={baseClasses} style={style}>
      {name}
    </span>
  );
}
