/**
 * Unified Design System for Yacht Club
 * Enterprise-grade luxury theme for Admin & Vendor dashboards
 */

export const dashboardTheme = {
  // Colors - Pure Black iOS 26 Style
  colors: {
    background: {
      primary: '#000000',
      secondary: '#000000',
      card: 'rgba(255, 255, 255, 0.02)',
      hover: 'rgba(255, 255, 255, 0.03)',
    },
    border: {
      default: 'rgba(255, 255, 255, 0.05)',
      hover: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.2)',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.9)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      tertiary: 'rgba(255, 255, 255, 0.4)',
      muted: 'rgba(255, 255, 255, 0.3)',
    },
  },

  // Border Radius - iOS 26 Style
  borderRadius: {
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    card: '20px',
    button: '14px',
  },

  // Typography
  typography: {
    heading: {
      fontSize: '3xl',
      fontWeight: 'thin',
      letterSpacing: 'tight',
      color: 'text-white/90',
    },
    subheading: {
      fontSize: 'xs',
      fontWeight: 'light',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'text-white/40',
    },
    body: {
      fontSize: 'sm',
      fontWeight: 'light',
      color: 'text-white/80',
    },
  },

  // Components - iOS 26 Rounded Style
  components: {
    card: {
      base: 'backdrop-filter backdrop-blur-[20px] border transition-all duration-300 rounded-[20px]',
      glass: 'bg-white/[0.02] border-white/5 hover:bg-white/[0.03] rounded-[20px]',
      glow: 'shadow-[0_0_30px_rgba(255,255,255,0.02)]',
    },
    button: {
      primary: 'bg-gradient-to-r from-white/10 to-white/5 text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300 rounded-[14px]',
      secondary: 'bg-black/20 hover:bg-white/[0.03] border border-white/10 hover:border-white/20 text-white text-xs font-light transition-all duration-300 rounded-[14px]',
      danger: 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 transition-all duration-300 rounded-[14px]',
    },
    input: {
      base: 'bg-black/20 border border-white/10 focus:border-white/30 text-white placeholder:text-white/30 transition-all duration-300 rounded-[14px]',
    },
    sidebar: {
      item: {
        base: 'group flex items-center gap-3 px-5 py-3 transition-all duration-300 border rounded-[14px]',
        active: 'text-white bg-gradient-to-r from-white/10 to-white/5 border-white/20 shadow-lg',
        inactive: 'text-white/40 hover:text-white/70 hover:bg-white/5 border-transparent hover:border-white/10',
      },
    },
    stat: {
      container: 'bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 p-6 hover:bg-white/[0.03] transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.02)] rounded-[20px]',
      label: 'text-white/40 text-[11px] uppercase tracking-[0.2em] font-light',
      value: 'text-3xl font-thin text-white/90',
      description: 'text-white/30 text-[10px] font-light tracking-wider uppercase',
    },
  },

  // Animations
  animations: {
    fadeIn: 'fade-in 0.6s ease-out',
    subtlePulse: 'subtle-pulse 3s ease-in-out infinite',
    gentleFloat: 'gentle-float 6s ease-in-out infinite',
  },

  // Spacing
  spacing: {
    section: 'mb-8',
    cardPadding: 'p-6',
    containerPadding: 'px-4 lg:px-0',
  },
} as const;

// CSS Keyframes to inject
export const dashboardKeyframes = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes subtle-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  @keyframes gentle-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
  }
  @keyframes subtle-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.03); }
    50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.06); }
  }
`;

// Utility classes - iOS 26 Rounded Style
export const luxuryClasses = {
  minimalGlass: 'bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[20px]',
  subtleGlow: 'shadow-[0_0_30px_rgba(255,255,255,0.02)]',
  luxuryGlow: 'animate-[subtle-glow_4s_ease-in-out_infinite]',
  luxuryBorder: 'border-image-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))_1]',
  roundedCard: 'rounded-[20px]',
  roundedButton: 'rounded-[14px]',
  roundedInput: 'rounded-[14px]',
  roundedSidebar: 'rounded-[14px]',
} as const;

// Helper function to apply theme classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Dashboard stat card component props
export interface DashboardStatProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<any>;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  delay?: string;
}

// Chart color scheme
export const chartColors = {
  primary: '#ffffff',
  gradient: {
    start: 'rgba(255,255,255,0.1)',
    end: 'rgba(255,255,255,0)',
  },
  grid: '#ffffff10',
  text: '#ffffff40',
} as const;

