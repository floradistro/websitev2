/**
 * TV Menu Display Themes
 * Curated presets designed for maximum visual impact
 */

export type TVTheme = {
  id: string;
  name: string;
  description: string;
  preview: {
    background: string;
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
  };
  styles: {
    background: string;
    backgroundImage?: string;
    productCard: {
      background: string;
      borderColor: string;
      borderWidth: string;
      shadow: string;
      backdropBlur?: string;
    };
    productName: {
      color: string;
      fontSize: string;
      fontWeight: string;
      textShadow?: string;
    };
    productDescription: {
      color: string;
      fontSize: string;
    };
    price: {
      color: string;
      fontSize: string;
      fontWeight: string;
      textShadow?: string;
      background?: string;
      padding?: string;
      borderRadius?: string;
    };
    menuTitle: {
      color: string;
      fontSize: string;
      fontWeight: string;
      textShadow?: string;
    };
    menuDescription: {
      color: string;
      fontSize: string;
    };
  };
};

export const themes: TVTheme[] = [
  {
    id: 'midnight-elegance',
    name: 'Midnight Elegance',
    description: 'Dark, luxurious, and sophisticated',
    preview: {
      background: '#0a0a0a',
      cardBg: 'rgba(255, 255, 255, 0.05)',
      textPrimary: '#ffffff',
      textSecondary: '#a0a0a0',
      accent: '#d4af37',
    },
    styles: {
      background: '#0a0a0a',
      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)',
      productCard: {
        background: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(212, 175, 55, 0.2)',
        borderWidth: '1px',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropBlur: '10px',
      },
      productName: {
        color: '#ffffff',
        fontSize: '32px',
        fontWeight: '700',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
      },
      productDescription: {
        color: '#a0a0a0',
        fontSize: '18px',
      },
      price: {
        color: '#d4af37',
        fontSize: '56px',
        fontWeight: '900',
        textShadow: '0 2px 12px rgba(212, 175, 55, 0.4)',
      },
      menuTitle: {
        color: '#ffffff',
        fontSize: '48px',
        fontWeight: '900',
        textShadow: '0 2px 12px rgba(0, 0, 0, 0.6)',
      },
      menuDescription: {
        color: '#a0a0a0',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'fresh-market',
    name: 'Fresh Market',
    description: 'Bright, organic, and inviting',
    preview: {
      background: '#f8faf5',
      cardBg: '#ffffff',
      textPrimary: '#1a3d2e',
      textSecondary: '#5a7a6a',
      accent: '#4a9d5f',
    },
    styles: {
      background: '#f8faf5',
      backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(74, 157, 95, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(106, 185, 127, 0.06) 0%, transparent 50%)',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(74, 157, 95, 0.15)',
        borderWidth: '2px',
        shadow: '0 4px 24px rgba(74, 157, 95, 0.1)',
      },
      productName: {
        color: '#1a3d2e',
        fontSize: '32px',
        fontWeight: '800',
      },
      productDescription: {
        color: '#5a7a6a',
        fontSize: '18px',
      },
      price: {
        color: '#ffffff',
        fontSize: '56px',
        fontWeight: '900',
        background: 'linear-gradient(135deg, #4a9d5f 0%, #6ab97f 100%)',
        padding: '12px 32px',
        borderRadius: '16px',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      menuTitle: {
        color: '#1a3d2e',
        fontSize: '48px',
        fontWeight: '900',
      },
      menuDescription: {
        color: '#5a7a6a',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean, spacious, and refined',
    preview: {
      background: '#ffffff',
      cardBg: '#fafafa',
      textPrimary: '#000000',
      textSecondary: '#666666',
      accent: '#000000',
    },
    styles: {
      background: '#ffffff',
      productCard: {
        background: '#fafafa',
        borderColor: '#e5e5e5',
        borderWidth: '1px',
        shadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
      },
      productName: {
        color: '#000000',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#666666',
        fontSize: '18px',
      },
      price: {
        color: '#000000',
        fontSize: '56px',
        fontWeight: '800',
      },
      menuTitle: {
        color: '#000000',
        fontSize: '48px',
        fontWeight: '800',
      },
      menuDescription: {
        color: '#666666',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'warm-inviting',
    name: 'Warm & Inviting',
    description: 'Cozy, approachable, and friendly',
    preview: {
      background: '#fdf6ed',
      cardBg: '#ffffff',
      textPrimary: '#3d2817',
      textSecondary: '#8a6d4f',
      accent: '#d97638',
    },
    styles: {
      background: '#fdf6ed',
      backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(217, 118, 56, 0.06) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(235, 149, 77, 0.04) 0%, transparent 50%)',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(217, 118, 56, 0.15)',
        borderWidth: '2px',
        shadow: '0 4px 24px rgba(217, 118, 56, 0.08)',
      },
      productName: {
        color: '#3d2817',
        fontSize: '32px',
        fontWeight: '700',
      },
      productDescription: {
        color: '#8a6d4f',
        fontSize: '18px',
      },
      price: {
        color: '#d97638',
        fontSize: '56px',
        fontWeight: '900',
        textShadow: '0 2px 8px rgba(217, 118, 56, 0.2)',
      },
      menuTitle: {
        color: '#3d2817',
        fontSize: '48px',
        fontWeight: '900',
      },
      menuDescription: {
        color: '#8a6d4f',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'bold-vibrant',
    name: 'Bold & Vibrant',
    description: 'Eye-catching and energetic',
    preview: {
      background: '#1a1a2e',
      cardBg: 'rgba(255, 255, 255, 0.08)',
      textPrimary: '#ffffff',
      textSecondary: '#c0c0e0',
      accent: '#ff6b9d',
    },
    styles: {
      background: '#1a1a2e',
      backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 107, 157, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(138, 92, 246, 0.12) 0%, transparent 50%)',
      productCard: {
        background: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 107, 157, 0.3)',
        borderWidth: '2px',
        shadow: '0 8px 32px rgba(255, 107, 157, 0.15)',
        backdropBlur: '10px',
      },
      productName: {
        color: '#ffffff',
        fontSize: '32px',
        fontWeight: '800',
        textShadow: '0 2px 12px rgba(255, 107, 157, 0.3)',
      },
      productDescription: {
        color: '#c0c0e0',
        fontSize: '18px',
      },
      price: {
        color: '#ffffff',
        fontSize: '56px',
        fontWeight: '900',
        background: 'linear-gradient(135deg, #ff6b9d 0%, #8a5cf6 100%)',
        padding: '12px 32px',
        borderRadius: '20px',
        textShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
      },
      menuTitle: {
        color: '#ffffff',
        fontSize: '48px',
        fontWeight: '900',
        textShadow: '0 2px 16px rgba(255, 107, 157, 0.4)',
      },
      menuDescription: {
        color: '#c0c0e0',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Cool, calming, and refreshing',
    preview: {
      background: '#e8f4f8',
      cardBg: '#ffffff',
      textPrimary: '#0d3b52',
      textSecondary: '#4a7c8f',
      accent: '#1e90cf',
    },
    styles: {
      background: '#e8f4f8',
      backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(30, 144, 207, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(52, 168, 220, 0.06) 0%, transparent 50%)',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(30, 144, 207, 0.2)',
        borderWidth: '2px',
        shadow: '0 4px 24px rgba(30, 144, 207, 0.12)',
      },
      productName: {
        color: '#0d3b52',
        fontSize: '32px',
        fontWeight: '700',
      },
      productDescription: {
        color: '#4a7c8f',
        fontSize: '18px',
      },
      price: {
        color: '#ffffff',
        fontSize: '56px',
        fontWeight: '900',
        background: 'linear-gradient(135deg, #1e90cf 0%, #34a8dc 100%)',
        padding: '12px 32px',
        borderRadius: '16px',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      menuTitle: {
        color: '#0d3b52',
        fontSize: '48px',
        fontWeight: '900',
      },
      menuDescription: {
        color: '#4a7c8f',
        fontSize: '24px',
      },
    },
  },
];

export const getTheme = (themeId: string | null | undefined): TVTheme => {
  if (!themeId) return themes[0]; // Default to Midnight Elegance
  return themes.find(t => t.id === themeId) || themes[0];
};

export const getDefaultTheme = (): TVTheme => themes[0];
