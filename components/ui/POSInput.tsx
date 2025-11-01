import React from 'react';

export interface POSInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  required?: boolean;
  error?: string;
  containerClassName?: string;
}

/**
 * POS-themed input component with consistent dark styling
 * Used across the vendor dashboard for form inputs
 */
export function POSInput({
  value,
  onChange,
  label,
  required,
  error,
  containerClassName = '',
  className = '',
  ...props
}: POSInputProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        value={value}
        onChange={onChange}
        className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs ${
          error ? 'border-red-500/50' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500/80 text-[9px] mt-1">{error}</p>
      )}
    </div>
  );
}
