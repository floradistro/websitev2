import { ReactNode, ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';
import { ds, cn } from '@/lib/design-system';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * 🎯 Standardized Button Component
 *
 * Compact, professional, minimal padding
 */
export function Button({
  variant = 'primary',
  size = 'sm',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-1.5
    ${ds.effects.radius.md} ${ds.effects.transition.normal}
    ${ds.typography.weight.light} ${ds.typography.transform.uppercase}
    focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black
    disabled:opacity-40 disabled:cursor-not-allowed
    ${ds.effects.interactive.scale.subtle}
  `;

  const sizeStyles = {
    xs: `px-2 py-1 ${ds.typography.size.micro} ${ds.typography.tracking.wide}`,
    sm: `px-2.5 py-1.5 ${ds.typography.size.xs} ${ds.typography.tracking.wide}`,
    md: `px-3 py-2 ${ds.typography.size.sm} ${ds.typography.tracking.normal}`,
  };

  const variantStyles = {
    primary: `
      ${ds.colors.bg.elevated} hover:${ds.colors.bg.hover}
      ${ds.colors.border.default} border hover:${ds.colors.border.emphasis}
      ${ds.colors.text.tertiary} hover:${ds.colors.text.secondary}
    `,
    secondary: `
      ${ds.colors.bg.primary} hover:${ds.colors.bg.elevated}
      ${ds.colors.border.default} border hover:${ds.colors.border.emphasis}
      ${ds.colors.text.quaternary} hover:${ds.colors.text.tertiary}
    `,
    ghost: `
      bg-transparent hover:${ds.colors.bg.elevated}
      ${ds.colors.text.quaternary} hover:${ds.colors.text.tertiary}
    `,
    danger: `
      ${ds.colors.bg.elevated} hover:bg-red-500/10
      ${ds.colors.border.default} border hover:border-red-500/30
      ${ds.colors.status.error} hover:text-red-400
    `,
  };

  return (
    <button
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'xs' ? 12 : 14} strokeWidth={1.5} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={size === 'xs' ? 12 : 14} strokeWidth={1.5} />}
        </>
      )}
    </button>
  );
}

/**
 * Icon-only button variant
 */
export function IconButton({
  icon: Icon,
  size = 'sm',
  variant = 'ghost',
  className = '',
  ...props
}: Omit<ButtonProps, 'children'> & { icon: LucideIcon }) {
  const sizeStyles = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
  };

  return (
    <button
      className={cn(
        `inline-flex items-center justify-center ${ds.effects.radius.md} ${ds.effects.transition.normal}`,
        sizeStyles[size],
        variant === 'ghost' && `hover:${ds.colors.bg.elevated} ${ds.colors.text.quaternary} hover:${ds.colors.text.tertiary}`,
        className
      )}
      {...props}
    >
      <Icon size={iconSizes[size]} strokeWidth={1.5} />
    </button>
  );
}
