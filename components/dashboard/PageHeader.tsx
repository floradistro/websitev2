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
 * Provides consistent typography, spacing, and layout
 *
 * Design System:
 * - Icon: 64px mobile, 80px desktop, strokeWidth 1
 * - Title: text-3xl mobile, text-5xl desktop, font-extralight
 * - Subtitle: text-sm, font-light, text-white/40
 * - Spacing: mb-12 mobile, mb-16 desktop
 */
export default function PageHeader({ title, subtitle, icon: Icon, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-12 md:mb-16">
      <div className="flex items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          {Icon && (
            <>
              <Icon size={64} className="md:hidden text-white flex-shrink-0" strokeWidth={1} />
              <Icon size={80} className="hidden md:block text-white flex-shrink-0" strokeWidth={1} />
            </>
          )}
          <div>
            <h1 className="text-3xl md:text-5xl font-extralight text-white tracking-tight mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm font-light text-white/40">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-4">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/**
 * Section Header - for sections within a page
 * Design: text-2xl, font-extralight, mb-8
 */
export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/[0.06]">
      <div>
        <h2 className="text-2xl font-extralight text-white mb-2">{title}</h2>
        {subtitle && <p className="text-sm font-light text-white/40">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </div>
  );
}

/**
 * Card - for content sections
 * Design: subtle borders, generous padding, clean background
 */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Field Row - for form fields
 * Design: flex layout, consistent spacing, subtle dividers
 */
export function FieldRow({ label, children, description }: { label: string; children: React.ReactNode; description?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-8">
      <div className="flex-1">
        <label className="text-white/50 text-sm font-light">{label}</label>
        {description && <p className="text-white/30 text-xs font-light mt-1">{description}</p>}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}

/**
 * Input - standard text input
 * Design: underline style, clean, minimal
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
        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 text-base font-light">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-transparent border-b border-white/10 text-white text-base font-light ${prefix ? 'pl-8' : 'pl-0'} pr-2 py-3 focus:outline-none focus:border-white/30 disabled:opacity-50 transition-colors placeholder:text-white/30`}
      />
    </div>
  );
}

/**
 * Select - standard select dropdown
 * Design: clean, minimal, text-right aligned
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
    <select
      value={value}
      onChange={onChange}
      className={`bg-transparent border-none text-white text-sm font-light focus:outline-none cursor-pointer text-right ${className}`}
    >
      {children}
    </select>
  );
}

/**
 * Button - primary action button
 * Design: white background, black text, clean
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
  const baseClasses = "text-sm font-light transition-all disabled:opacity-50";

  const variantClasses = {
    primary: "bg-white text-black px-8 py-3 hover:bg-white/90",
    secondary: "bg-white/10 text-white px-8 py-3 hover:bg-white/20",
    ghost: "text-white/40 hover:text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
