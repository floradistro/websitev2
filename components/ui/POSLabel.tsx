import React from "react";

export interface POSLabelProps {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

/**
 * POS-themed label component with consistent dark styling
 * Used across the vendor dashboard for form labels
 */
export function POSLabel({
  children,
  required,
  className = "",
  htmlFor,
}: POSLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black ${className}`}
      style={{ fontWeight: 900 }}
    >
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  );
}
