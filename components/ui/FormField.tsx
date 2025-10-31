"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local';

interface BaseFormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  icon?: ReactNode;
}

interface TextInputProps extends BaseFormFieldProps {
  type?: InputType;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

interface TextareaProps extends BaseFormFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

interface SelectProps extends BaseFormFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  disabled?: boolean;
  placeholder?: string;
}

interface CheckboxProps extends BaseFormFieldProps {
  type: 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}

type FormFieldProps = TextInputProps | TextareaProps | SelectProps | CheckboxProps;

export function FormField(props: FormFieldProps) {
  const { label, error, hint, required, className = '', icon } = props;

  // Checkbox has different layout
  if (props.type === 'checkbox') {
    return (
      <div className={`space-y-1 ${className}`}>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={props.checked}
            onChange={(e) => props.onChange(e.target.checked)}
            disabled={props.disabled}
            className="w-4 h-4 mt-0.5 bg-black/20 border border-white/10 rounded text-white focus:ring-2 focus:ring-white/20 cursor-pointer disabled:opacity-50"
          />
          <div className="flex-1">
            <div className="text-white text-xs uppercase tracking-tight font-black group-hover:text-white/80 transition-colors" style={{ fontWeight: 900 }}>
              {label}
              {required && <span className="text-red-400 ml-1">*</span>}
            </div>
            {props.description && (
              <p className="text-white/40 text-[10px] mt-1">{props.description}</p>
            )}
          </div>
        </label>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-[10px] mt-2">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // All other input types
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-white/40 text-[10px] uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {props.type === 'textarea' ? (
        <textarea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          disabled={props.disabled}
          rows={props.rows || 4}
          className={`w-full bg-black/20 border ${error ? 'border-red-400/50' : 'border-white/10'} text-white px-4 py-3 rounded-xl focus:outline-none focus:border-white/30 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ) : props.type === 'select' ? (
        <select
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          disabled={props.disabled}
          className={`w-full bg-black/20 border ${error ? 'border-red-400/50' : 'border-white/10'} text-white px-4 py-3 rounded-xl focus:outline-none focus:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none`}
        >
          {props.placeholder && <option value="">{props.placeholder}</option>}
          {props.options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </div>
          )}
          <input
            type={props.type || 'text'}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            disabled={props.disabled}
            min={props.min}
            max={props.max}
            step={props.step}
            className={`w-full bg-black/20 border ${error ? 'border-red-400/50' : 'border-white/10'} text-white ${icon ? 'pl-12' : 'px-4'} ${props.suffix ? 'pr-16' : 'px-4'} py-3 rounded-xl focus:outline-none focus:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {props.suffix && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
              {props.suffix}
            </div>
          )}
        </div>
      )}

      {hint && !error && (
        <p className="text-white/30 text-[9px] uppercase tracking-wider">{hint}</p>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-[10px]">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Convenience components for common patterns
export function FormSection({ title, description, children, className = '' }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-b border-white/5 pb-3">
        <h3 className="text-white/60 text-[10px] uppercase tracking-wider font-medium">{title}</h3>
        {description && (
          <p className="text-white/40 text-[9px] mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export function FormGrid({ columns = 2, children, className = '' }: { columns?: 1 | 2 | 3 | 4; children: ReactNode; className?: string }) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}
