import { getTheme, tw } from '@/lib/dashboard-theme';
import { LucideIcon } from 'lucide-react';

const vendorTheme = getTheme('vendor');

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  loading?: boolean;
}

export function VendorButton({
  children,
  variant = 'primary',
  icon: Icon,
  onClick,
  disabled,
  type = 'button',
  className,
  loading,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={tw(
        vendorTheme.components.button.base,
        vendorTheme.components.button[variant],
        'flex items-center justify-center gap-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={14} />
      ) : null}
      {children}
    </button>
  );
}

