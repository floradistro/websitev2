'use client';

import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Standard page header for all dashboard pages
 * Matches POS/Digital Signage design system EXACTLY
 *
 * Design System (from POS):
 * - Ultra-small text: text-[10px] uppercase tracking-[0.15em]
 * - Headers: text-xs uppercase tracking-[0.15em] font-black (fontWeight: 900)
 * - Borders: border-white/5 for dividers
 * - Backgrounds: bg-white/5 with border-white/10
 * - Rounded: rounded-2xl everywhere
 */
export default function PageHeader({ title, subtitle, icon: Icon, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          {Icon && <Icon size={32} className="text-white" strokeWidth={2} />}
          <div>
            <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/**
 * Section Header - for sections within a page
 */
export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
      <div>
        <h2 className="text-xs uppercase tracking-[0.15em] text-white font-black" style={{ fontWeight: 900 }}>{title}</h2>
        {subtitle && <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Card - for content sections
 */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Field Row - for form fields
 */
export function FieldRow({ label, children, description }: { label: string; children: React.ReactNode; description?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] block">
        {label}
      </label>
      {children}
      {description && (
        <p className="text-white/30 text-[10px] uppercase tracking-[0.15em]">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Input - standard text input
 */
export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  prefix,
  className = ''
}: {
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] uppercase tracking-[0.15em]">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-white/5 border border-white/10 text-white ${prefix ? 'pl-10' : 'px-3'} pr-3 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 disabled:opacity-50 transition-all placeholder:text-white/40 hover:bg-white/10`}
      />
    </div>
  );
}

/**
 * Select - standard select dropdown
 */
export function Select({
  value,
  onChange,
  children,
  className = ''
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all cursor-pointer appearance-none pr-8 ${className}`}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Button - action buttons
 */
export function Button({
  onClick,
  disabled = false,
  children,
  variant = 'primary',
  className = ''
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}) {
  const baseClasses = "px-4 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] transition-all disabled:opacity-50 font-black";

  const variantClasses = {
    primary: "bg-white text-black hover:bg-white/90",
    secondary: "bg-white/10 border border-white/20 text-white hover:bg-white/20",
    ghost: "text-white/40 hover:text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ fontWeight: 900 }}
    >
      {children}
    </button>
  );
}
