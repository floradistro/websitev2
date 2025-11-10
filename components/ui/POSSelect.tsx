import React from "react";

export interface POSSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  required?: boolean;
  error?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

/**
 * POS-themed select component with consistent dark styling
 * Used across the vendor dashboard for dropdowns
 */
export function POSSelect({
  value,
  onChange,
  label,
  required,
  error,
  containerClassName = "",
  className = "",
  children,
  ...props
}: POSSelectProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label
          className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black"
          style={{ fontWeight: 900 }}
        >
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs ${
          error ? "border-red-500/50" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-500/80 text-[9px] mt-1">{error}</p>}
    </div>
  );
}
