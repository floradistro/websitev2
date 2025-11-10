import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full bg-black/20 border text-white px-4 py-3
          focus:outline-none transition-all rounded-[14px] text-sm
          placeholder-white/30 resize-none
          ${error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-white/30"}
          ${props.disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
