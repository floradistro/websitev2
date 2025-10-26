import { LucideIcon } from 'lucide-react';

interface InputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  label?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  label,
  disabled,
  className = '',
  error,
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full bg-black/20 border text-white px-4 py-3 
            focus:outline-none transition-all rounded-[14px] text-sm 
            placeholder-white/30
            ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-white/30'}
            ${Icon ? 'pl-10' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
}

