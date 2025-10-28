import { ReactNode, ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = (() => {
    switch (variant) {
      case 'primary':
        return 'button-primary';
      case 'secondary':
        return 'button-secondary';
      case 'ghost':
        return 'bg-transparent border border-white/10 hover:bg-white/5 hover:border-white/20 text-white';
      default:
        return 'button-secondary';
    }
  })();

  const sizeClass = (() => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-[10px]';
      case 'md':
        return 'px-4 py-3 text-xs';
      case 'lg':
        return 'px-6 py-4 text-sm';
      default:
        return 'px-4 py-3 text-xs';
    }
  })();

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseClass} ${sizeClass} ${widthClass} ${disabledClass} flex items-center justify-center gap-2 uppercase tracking-wider ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      )}
      {Icon && iconPosition === 'left' && !loading && <Icon size={14} strokeWidth={1.5} />}
      {children}
      {Icon && iconPosition === 'right' && !loading && <Icon size={14} strokeWidth={1.5} />}
    </button>
  );
}
