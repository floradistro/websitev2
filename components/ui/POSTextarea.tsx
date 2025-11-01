import React from 'react';

export interface POSTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label?: string;
  required?: boolean;
  error?: string;
  containerClassName?: string;
}

/**
 * POS-themed textarea component with consistent dark styling
 * Used across the vendor dashboard for multi-line text inputs
 */
export function POSTextarea({
  value,
  onChange,
  label,
  required,
  error,
  containerClassName = '',
  className = '',
  ...props
}: POSTextareaProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all resize-none text-xs ${
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
