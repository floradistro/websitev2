/**
 * UNIFIED DASHBOARD DESIGN SYSTEM
 * Single source of truth for Admin + Vendor + any future dashboards
 * 
 * Usage:
 * import { getTheme } from '@/lib/dashboard-theme';
 * const theme = getTheme('admin'); // or 'vendor'
 */

// Base theme - shared by all dashboards
const baseTheme = {
  // === LAYOUT ===
  spacing: {
    card: 'p-6',
    cardSm: 'p-4',
    cardLg: 'p-8',
    gap: 'gap-3',
    gapSm: 'gap-2',
    gapLg: 'gap-4',
  },
  
  // === BORDERS ===
  borders: {
    radius: {
      sm: 'rounded-[8px]',
      md: 'rounded-[12px]',
      lg: 'rounded-[14px]',
      xl: 'rounded-[16px]',
      xxl: 'rounded-[20px]',
    },
  },
  
  // === EFFECTS ===
  effects: {
    glass: 'backdrop-filter backdrop-blur-[20px]',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.02)]',
    transition: 'transition-all duration-300',
  },
};

// Theme variants
const themes = {
  vendor: {
    name: 'Vendor Portal',
    colors: {
      bg: {
        primary: 'bg-black',
        card: 'bg-white/[0.02]',
        cardHover: 'hover:bg-white/[0.03]',
        input: 'bg-black/20',
        button: 'bg-white/10',
        buttonHover: 'hover:bg-white/20',
      },
      border: {
        default: 'border-white/5',
        hover: 'hover:border-white/20',
        focus: 'focus:border-white/30',
        active: 'border-white/20',
      },
      text: {
        primary: 'text-white/90',
        secondary: 'text-white/60',
        muted: 'text-white/40',
        disabled: 'text-white/30',
        label: 'text-white/40',
      },
      status: {
        success: 'text-green-500',
        warning: 'text-yellow-500',
        error: 'text-red-500',
        info: 'text-blue-500',
      },
    },
    typography: {
      h1: 'text-3xl font-thin text-white/90 tracking-tight',
      h2: 'text-2xl font-thin text-white/90',
      h3: 'text-xl font-light text-white/80',
      body: 'text-sm text-white/80',
      bodySmall: 'text-xs text-white/70',
      label: 'text-white/40 text-[11px] uppercase tracking-[0.2em] font-light',
      sublabel: 'text-white/30 text-[10px] font-light tracking-wider uppercase',
      stat: 'text-3xl font-thin text-white/90',
      code: 'font-mono text-xs',
    },
    components: {
      card: 'bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[14px]',
      cardHeader: 'border-b border-white/5 p-6',
      cardContent: 'p-6',
      cardHover: 'hover:bg-white/[0.03] transition-all duration-300',
      button: {
        base: 'px-6 py-3 text-xs uppercase tracking-wider transition-all duration-300 rounded-[14px]',
        primary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
        secondary: 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10',
        danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
        ghost: 'text-white/60 hover:text-white hover:bg-white/5',
      },
      input: 'w-full bg-black/20 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm',
      badge: {
        base: 'px-2 py-1 text-xs font-medium uppercase tracking-wider border rounded-[8px]',
        approved: 'bg-white/5 text-white/60 border-white/10',
        pending: 'bg-white/5 text-white/60 border-white/10',
        rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
        draft: 'bg-white/5 text-white/60 border-white/10',
      },
      stat: 'bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[14px] shadow-[0_0_30px_rgba(255,255,255,0.02)] p-6 hover:bg-white/[0.03] transition-all duration-300 group',
      action: 'group bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[14px] hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4',
    },
  },
  
  admin: {
    name: 'Admin Console',
    colors: {
      bg: {
        primary: 'bg-black',
        card: 'bg-white/[0.02]',
        cardHover: 'hover:bg-white/[0.03]',
        input: 'bg-black/20',
        button: 'bg-white/10',
        buttonHover: 'hover:bg-white/20',
      },
      border: {
        default: 'border-white/5',
        hover: 'hover:border-white/20',
        focus: 'focus:border-white/30',
        active: 'border-white/20',
      },
      text: {
        primary: 'text-white/90',
        secondary: 'text-white/60',
        muted: 'text-white/40',
        disabled: 'text-white/30',
        label: 'text-white/40',
      },
      status: {
        success: 'text-green-500',
        warning: 'text-yellow-500',
        error: 'text-red-500',
        info: 'text-blue-500',
      },
    },
    typography: {
      h1: 'text-3xl font-thin text-white/90 tracking-tight',
      h2: 'text-2xl font-thin text-white/90',
      h3: 'text-xl font-light text-white/80',
      body: 'text-sm text-white/80',
      bodySmall: 'text-xs text-white/70',
      label: 'text-white/40 text-[11px] uppercase tracking-[0.2em] font-light',
      sublabel: 'text-white/30 text-[10px] font-light tracking-wider uppercase',
      stat: 'text-3xl font-thin text-white/90',
      code: 'font-mono text-xs',
    },
    components: {
      card: 'bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[20px]',
      cardHeader: 'border-b border-white/5 p-6',
      cardContent: 'p-6',
      cardHover: 'hover:bg-white/[0.03] transition-all duration-300',
      button: {
        base: 'px-6 py-3 text-xs uppercase tracking-wider transition-all duration-300 rounded-[14px]',
        primary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
        secondary: 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10',
        danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
        ghost: 'text-white/60 hover:text-white hover:bg-white/5',
      },
      input: 'w-full bg-black/20 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm',
      badge: {
        base: 'px-2 py-1 text-xs font-medium uppercase tracking-wider border rounded-[8px]',
        approved: 'bg-white/5 text-white/60 border-white/10',
        pending: 'bg-white/5 text-white/60 border-white/10',
        rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
        draft: 'bg-white/5 text-white/60 border-white/10',
      },
      stat: 'bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[20px] shadow-[0_0_30px_rgba(255,255,255,0.02)] p-6 hover:bg-white/[0.03] transition-all duration-300 group',
      action: 'group bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[20px] hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4',
    },
  },
};

/**
 * Get theme by name
 */
export function getTheme(name: 'vendor' | 'admin') {
  return {
    ...baseTheme,
    ...themes[name],
  };
}

/**
 * Default export for vendor (backwards compatible)
 */
export const vendorTheme = getTheme('vendor');
export const adminTheme = getTheme('admin');

/**
 * Helper to combine theme classes
 */
export function tw(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get component classes with theme awareness
 */
export function getComponentClasses(
  theme: 'vendor' | 'admin',
  component: string,
  variant?: string,
  extra?: string
): string {
  const themeObj = getTheme(theme);
  const componentStyles = themeObj.components[component as keyof typeof themeObj.components];
  
  if (typeof componentStyles === 'string') {
    return tw(componentStyles, extra);
  }
  
  if (typeof componentStyles === 'object' && variant) {
    return tw(componentStyles[variant as keyof typeof componentStyles], extra);
  }
  
  return extra || '';
}

/**
 * Dashboard keyframes for animations
 */
export const dashboardKeyframes = `
  @keyframes subtle-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.02); }
    50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.05); }
  }
`;

/**
 * Type exports
 */
export type ThemeName = 'vendor' | 'admin';
export type Theme = ReturnType<typeof getTheme>;
