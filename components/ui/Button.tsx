/**
 * UNIFIED BUTTON COMPONENT
 * Works across all dashboards
 */

import { LucideIcon } from 'lucide-react';

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

export function Button({
  children,
  variant = 'primary',
  icon: Icon,
  onClick,
  disabled,
  type = 'button',
  className = '',
  loading,
}: ButtonProps) {
  const variants = {
    primary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
    secondary: 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
    ghost: 'text-white/60 hover:text-white hover:bg-white/5',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-6 py-3 
        text-xs uppercase tracking-wider 
        transition-all duration-300 
        rounded-[14px]
        flex items-center justify-center gap-2
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
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

