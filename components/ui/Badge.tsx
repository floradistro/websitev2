interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-white/5 text-white/60 border-white/10',
    primary: 'bg-white/10 text-white/90 border-white/20',
    secondary: 'bg-white/5 text-white/50 border-white/10',
    ghost: 'bg-transparent text-white/40 border-white/5',
  };
  
  return (
    <span
      className={`
        px-2 py-1 text-xs font-medium uppercase tracking-wider 
        border rounded-[8px] inline-flex items-center
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

