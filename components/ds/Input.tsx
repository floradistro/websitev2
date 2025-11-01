import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { ds, cn } from '@/lib/design-system';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  compact?: boolean;
}

/**
 * 🎯 Standardized Input Component
 *
 * Minimal padding, professional
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, iconPosition = 'left', compact = true, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            'block mb-1',
            ds.typography.size.xs,
            ds.typography.weight.light,
            ds.colors.text.quaternary,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide
          )}>
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
              <Icon size={14} className={ds.colors.text.quaternary} strokeWidth={1.5} />
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              ds.colors.bg.input,
              ds.colors.border.default,
              'border',
              ds.effects.radius.md,
              compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
              Icon && iconPosition === 'left' && 'pl-8',
              Icon && iconPosition === 'right' && 'pr-8',
              ds.typography.size.sm,
              ds.typography.weight.normal,
              ds.colors.text.secondary,
              'placeholder:' + ds.colors.text.quaternary,
              'focus:' + ds.colors.border.strong,
              'focus:' + ds.colors.bg.elevated,
              'outline-none',
              ds.effects.transition.normal,
              'w-full',
              error && 'border-red-500/30',
              className
            )}
            {...props}
          />

          {Icon && iconPosition === 'right' && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <Icon size={14} className={ds.colors.text.quaternary} strokeWidth={1.5} />
            </div>
          )}
        </div>

        {error && (
          <p className={cn(
            'mt-1',
            ds.typography.size.xs,
            ds.colors.status.error
          )}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea component
 */
interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, rows = 3, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            'block mb-1',
            ds.typography.size.xs,
            ds.typography.weight.light,
            ds.colors.text.quaternary,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide
          )}>
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            ds.colors.bg.input,
            ds.colors.border.default,
            'border',
            ds.effects.radius.md,
            'px-2.5 py-1.5',
            ds.typography.size.sm,
            ds.typography.weight.normal,
            ds.colors.text.secondary,
            'placeholder:' + ds.colors.text.quaternary,
            'focus:' + ds.colors.border.strong,
            'focus:' + ds.colors.bg.elevated,
            'outline-none',
            ds.effects.transition.normal,
            'w-full resize-none',
            error && 'border-red-500/30',
            className
          )}
          {...props}
        />

        {error && (
          <p className={cn(
            'mt-1',
            ds.typography.size.xs,
            ds.colors.status.error
          )}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Select component
 */
interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            'block mb-1',
            ds.typography.size.xs,
            ds.typography.weight.light,
            ds.colors.text.quaternary,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide
          )}>
            {label}
          </label>
        )}

        <select
          ref={ref}
          className={cn(
            ds.colors.bg.input,
            ds.colors.border.default,
            'border',
            ds.effects.radius.md,
            'px-2.5 py-1.5',
            ds.typography.size.sm,
            ds.typography.weight.normal,
            ds.colors.text.secondary,
            'focus:' + ds.colors.border.strong,
            'focus:' + ds.colors.bg.elevated,
            'outline-none',
            ds.effects.transition.normal,
            'w-full',
            error && 'border-red-500/30',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className={cn(
            'mt-1',
            ds.typography.size.xs,
            ds.colors.status.error
          )}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
