/**
 * UNIFIED DESIGN SYSTEM
 * Single source of truth for ALL dashboards (Admin + Vendor)
 * Based on Vendor's clean aesthetic
 */

export const theme = {
  // === COLORS ===
  colors: {
    // Background
    bg: {
      primary: 'bg-black',
      card: 'bg-white/[0.02]',
      cardHover: 'hover:bg-white/[0.03]',
      input: 'bg-black/20',
      button: 'bg-white/10',
      buttonHover: 'hover:bg-white/20',
    },
    
    // Borders
    border: {
      default: 'border-white/5',
      card: 'border-white/10',
      hover: 'hover:border-white/20',
      focus: 'focus:border-white/30',
      active: 'border-white/20',
    },
    
    // Text
    text: {
      primary: 'text-white/90',
      secondary: 'text-white/60',
      muted: 'text-white/40',
      disabled: 'text-white/30',
      label: 'text-white/40',
    },
    
    // Status
    status: {
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
      info: 'text-blue-500',
    },
  },
  
  // === SPACING ===
  spacing: {
    card: 'p-6',
    cardSm: 'p-4',
    cardLg: 'p-8',
    gap: 'gap-3',
    gapSm: 'gap-2',
    gapLg: 'gap-4',
  },
  
  // === TYPOGRAPHY ===
  typography: {
    // Headings
    h1: 'text-3xl font-thin text-white/90 tracking-tight',
    h2: 'text-2xl font-thin text-white/90',
    h3: 'text-xl font-light text-white/80',
    
    // Body
    body: 'text-sm text-white/80',
    bodySmall: 'text-xs text-white/70',
    
    // Labels
    label: 'text-white/40 text-[11px] uppercase tracking-[0.2em] font-light',
    sublabel: 'text-white/30 text-[10px] font-light tracking-wider uppercase',
    
    // Special
    stat: 'text-3xl font-thin text-white/90',
    code: 'font-mono text-xs',
  },
  
  // === BORDERS ===
  borders: {
    radius: {
      sm: 'rounded-[8px]',
      md: 'rounded-[12px]',
      lg: 'rounded-[14px]',  // Standard for cards, stats
      xl: 'rounded-[16px]',
    },
  },
  
  // === EFFECTS ===
  effects: {
    glass: 'backdrop-filter backdrop-blur-[20px]',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.02)]',
    subtleGlow: 'subtle-glow',
    transition: 'transition-all duration-300',
  },
  
  // === COMPONENTS ===
  components: {
    // Card
    card: 'bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[14px] shadow-[0_0_30px_rgba(255,255,255,0.02)]',
    cardHeader: 'border-b border-white/5 p-6',
    cardContent: 'p-6',
    cardHover: 'hover:bg-white/[0.03] transition-all duration-300',
    
    // Button
    button: {
      base: 'px-6 py-3 text-xs uppercase tracking-wider transition-all duration-300 rounded-[14px] flex items-center justify-center gap-2',
      primary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
      secondary: 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white',
      danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
      ghost: 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent',
    },
    
    // Input
    input: 'w-full bg-black/20 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm placeholder-white/30',
    
    // Badge
    badge: {
      base: 'px-2 py-1 text-xs font-medium uppercase tracking-wider border rounded-[8px]',
      approved: 'bg-white/5 text-white/60 border-white/10',
      pending: 'bg-white/5 text-white/60 border-white/10',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
      draft: 'bg-white/5 text-white/60 border-white/10',
      success: 'bg-green-500/10 text-green-500 border-green-500/20',
      warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    },
    
    // Stat Card
    stat: 'bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[14px] shadow-[0_0_30px_rgba(255,255,255,0.02)] p-6 hover:bg-white/[0.03] transition-all duration-300 group',
    
    // Quick Action
    action: 'group bg-white/[0.02] backdrop-filter backdrop-blur-[20px] border border-white/5 rounded-[14px] hover:bg-white/[0.03] p-6 transition-all duration-300 flex items-center gap-4',
  },
};

/**
 * Helper to combine classes
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Type exports
 */
export type Theme = typeof theme;

