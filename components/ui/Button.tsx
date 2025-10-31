"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Base classes matching POS design system
  const baseClass = 'inline-flex items-center justify-center gap-2 uppercase tracking-[0.15em] font-black transition-all rounded-xl';

  // Variant classes matching POS exactly
  const variantClass = (() => {
    switch (variant) {
      case 'primary':
        return 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30';
      case 'secondary':
        return 'bg-black/20 border border-white/5 text-white/60 hover:bg-white/5 hover:text-white';
      case 'ghost':
        return 'bg-transparent text-white/60 hover:bg-white/5 hover:text-white';
      case 'danger':
        return 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300';
      case 'success':
        return 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 hover:text-green-300';
      default:
        return 'bg-white/10 text-white border border-white/20 hover:bg-white/20';
    }
  })();

  // Size classes matching POS design system
  const sizeClass = (() => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-[9px]';
      case 'md':
        return 'px-4 py-2.5 text-[10px]';
      case 'lg':
        return 'px-6 py-3 text-[10px]';
      default:
        return 'px-4 py-2.5 text-[10px]';
    }
  })();

  const iconSize = { sm: 12, md: 14, lg: 16 }[size];

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${disabledClass} ${className}`}
      style={{ fontWeight: 900 }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={iconSize} className="animate-spin" />
          {children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span>{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span>{icon}</span>}
        </>
      )}
    </button>
  );
}

// Icon-only button variant matching POS
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  'aria-label': ariaLabel,
  ...props
}: Omit<ButtonProps, 'children'> & { icon: ReactNode; 'aria-label': string }) {
  const baseClass = 'inline-flex items-center justify-center font-black transition-all rounded-lg';

  const variantClass = (() => {
    switch (variant) {
      case 'primary':
        return 'bg-white/10 text-white border border-white/20 hover:bg-white/20';
      case 'secondary':
        return 'bg-black/20 border border-white/5 text-white/60 hover:bg-white/5 hover:text-white';
      case 'ghost':
        return 'bg-transparent text-white/60 hover:bg-white/10 hover:text-white';
      case 'danger':
        return 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20';
      case 'success':
        return 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20';
      default:
        return 'bg-transparent text-white/60 hover:bg-white/10 hover:text-white';
    }
  })();

  const sizeClass = { sm: 'p-2', md: 'p-2.5', lg: 'p-3' }[size];
  const iconSize = { sm: 14, md: 16, lg: 18 }[size];
  const disabledClass = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
      style={{ fontWeight: 900 }}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? <Loader2 size={iconSize} className="animate-spin" /> : icon}
    </button>
  );
}
