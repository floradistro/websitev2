/**
 * 🎨 Unified Design System - "SF Family" for Vendor Platform
 *
 * This is our single source of truth for all design tokens.
 * Apple-level consistency across the entire ecosystem.
 */

export const designSystem = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 TYPOGRAPHY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  typography: {
    // Sizes
    size: {
      micro: "text-[9px]", // Tiny labels, badges
      xs: "text-[10px]", // Standard labels, buttons, nav
      sm: "text-[11px]", // Subtitles, descriptions
      base: "text-sm", // Body text
      md: "text-base", // Emphasized text
      lg: "text-lg", // Section headers
      xl: "text-xl", // Page headers
      "2xl": "text-2xl", // Hero text
      "3xl": "text-3xl", // Large numbers
    },

    // Weights
    weight: {
      light: "font-light", // Primary style (300)
      normal: "font-normal", // Body text (400)
      medium: "font-medium", // Emphasis (500)
      semibold: "font-semibold", // Numbers, CTAs (600)
      bold: "font-bold", // Rare, only for impact (700)
    },

    // Letter spacing (tracking)
    tracking: {
      tight: "tracking-tight", // -0.025em for large text
      normal: "tracking-normal", // 0em
      wide: "tracking-[0.15em]", // Standard for labels
      wider: "tracking-[0.2em]", // Extra refined
      widest: "tracking-[0.25em]", // Maximum refinement
    },

    // Text transform
    transform: {
      uppercase: "uppercase",
      none: "normal-case",
    },

    // Line height
    leading: {
      tight: "leading-tight",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 COLORS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  colors: {
    // Text colors (white with opacity)
    text: {
      primary: "text-white/90", // Main content
      secondary: "text-white/70", // Less important
      tertiary: "text-white/60", // Muted text
      quaternary: "text-white/40", // Placeholder, disabled
      ghost: "text-white/30", // Very subtle
      whisper: "text-white/25", // Barely visible
      invisible: "text-white/20", // Almost gone
    },

    // Background colors
    bg: {
      primary: "bg-[#0a0a0a]", // Main dark
      secondary: "bg-black", // Pure black
      elevated: "bg-white/[0.04]", // Subtle lift
      hover: "bg-white/[0.06]", // Hover state
      active: "bg-white/[0.08]", // Active/selected
      input: "bg-white/[0.03]", // Form inputs
    },

    // Border colors
    border: {
      subtle: "border-white/[0.04]", // Barely visible
      default: "border-white/[0.06]", // Standard
      emphasis: "border-white/[0.08]", // Hover state
      strong: "border-white/[0.12]", // Active/focus
      visible: "border-white/10", // Clear separation
    },

    // Status colors
    status: {
      success: "text-green-400/70",
      warning: "text-orange-400/70",
      error: "text-red-400/70",
      info: "text-blue-400/70",
    },

    // Icon colors (muted)
    icon: {
      blue: "text-blue-400/70",
      purple: "text-purple-400/70",
      green: "text-green-400/70",
      orange: "text-orange-400/70",
      red: "text-red-400/70",
      indigo: "text-indigo-400/70",
      teal: "text-teal-400/70",
      fuchsia: "text-fuchsia-400/70",
      emerald: "text-emerald-400/70",
      cyan: "text-cyan-400/70",
      pink: "text-pink-400/70",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📏 SPACING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  spacing: {
    gap: {
      xs: "gap-2", // 8px
      sm: "gap-3", // 12px
      md: "gap-4", // 16px
      lg: "gap-6", // 24px
      xl: "gap-8", // 32px
    },
    padding: {
      xs: "p-2", // 8px
      sm: "p-3", // 12px
      md: "p-4", // 16px
      lg: "p-6", // 24px
      xl: "p-8", // 32px
    },
    margin: {
      xs: "m-2",
      sm: "m-3",
      md: "m-4",
      lg: "m-6",
      xl: "m-8",
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎭 EFFECTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  effects: {
    // Border radius
    radius: {
      sm: "rounded-md", // 6px
      md: "rounded-lg", // 8px
      lg: "rounded-xl", // 12px
      xl: "rounded-2xl", // 16px
      "2xl": "rounded-3xl", // 24px - iOS style
      full: "rounded-full",
    },

    // Shadows
    shadow: {
      sm: "shadow-sm shadow-black/20",
      md: "shadow-md shadow-black/30",
      lg: "shadow-lg shadow-black/30",
      xl: "shadow-xl shadow-black/40",
    },

    // Transitions
    transition: {
      fast: "transition-all duration-150 ease-out",
      normal: "transition-all duration-200 ease-out",
      slow: "transition-all duration-300 ease-out",
      slower: "transition-all duration-400 ease-out",
    },

    // Hover/Active states
    interactive: {
      scale: {
        subtle: "active:scale-[0.98]",
        normal: "active:scale-[0.95]",
        strong: "active:scale-[0.92]",
      },
      opacity: {
        subtle: "active:opacity-90",
        normal: "active:opacity-60",
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧩 COMPONENT PATTERNS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  components: {
    // Standard label (like nav items, buttons)
    label: "text-[10px] uppercase tracking-[0.15em] font-light",

    // Refined label (extra spacing)
    labelRefined: "text-[10px] uppercase tracking-[0.2em] font-light",

    // Container (dark elevated)
    container: "bg-[#0a0a0a] border border-white/[0.06] rounded-xl",

    // Icon container (like app icons)
    iconContainer:
      "bg-[#0a0a0a] rounded-3xl border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.06] transition-all duration-400 ease-out shadow-lg shadow-black/30",

    // Input field
    input:
      "bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:border-white/[0.12] focus:bg-white/[0.04] outline-none transition-all duration-200",

    // Button primary
    button:
      "bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-lg px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-light text-white/70 hover:text-white/90 transition-all duration-300 ease-out",

    // Card/Panel
    card: "bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4",
  },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 PRESET COMBINATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ds = designSystem; // Shorthand

// Common text styles
export const textStyles = {
  // Headers
  h1: `${ds.typography.size["2xl"]} ${ds.typography.weight.light} ${ds.typography.tracking.tight} ${ds.colors.text.secondary}`,
  h2: `${ds.typography.size.xl} ${ds.typography.weight.light} ${ds.typography.tracking.tight} ${ds.colors.text.secondary}`,
  h3: `${ds.typography.size.lg} ${ds.typography.weight.light} ${ds.colors.text.secondary}`,

  // Body
  body: `${ds.typography.size.base} ${ds.typography.weight.normal} ${ds.colors.text.secondary}`,
  bodyMuted: `${ds.typography.size.base} ${ds.typography.weight.normal} ${ds.colors.text.tertiary}`,

  // Labels
  label: ds.components.label,
  labelRefined: ds.components.labelRefined,

  // Micro text
  micro: `${ds.typography.size.micro} ${ds.typography.weight.light} ${ds.colors.text.quaternary}`,
};

// Helper function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
