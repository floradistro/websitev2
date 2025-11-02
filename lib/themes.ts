/**
 * TV Menu Display Themes - Premium Collection
 * Steve Jobs-approved: Minimal, elegant, and sophisticated
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
    id: 'platinum',
    name: 'Platinum',
    description: 'Ultra-minimal elegance. Pure and timeless.',
    preview: {
      background: '#ffffff',
      cardBg: '#fafafa',
      textPrimary: '#1d1d1f',
      textSecondary: '#86868b',
      accent: '#1d1d1f',
    },
    styles: {
      background: '#ffffff',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(245, 245, 247, 0.8) 0%, transparent 70%)',
      productCard: {
        background: 'rgba(250, 250, 250, 0.95)',
        borderColor: 'rgba(29, 29, 31, 0.04)',
        borderWidth: '1px',
        shadow: '0 2px 16px rgba(0, 0, 0, 0.03), 0 1px 4px rgba(0, 0, 0, 0.02)',
      },
      productName: {
        color: '#1d1d1f',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#86868b',
        fontSize: '18px',
      },
      price: {
        color: '#1d1d1f',
        fontSize: '56px',
        fontWeight: '700',
      },
      menuTitle: {
        color: '#1d1d1f',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#86868b',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'Pure black. Infinite contrast. Maximum impact.',
    preview: {
      background: '#000000',
      cardBg: 'rgba(255, 255, 255, 0.03)',
      textPrimary: '#ffffff',
      textSecondary: '#86868b',
      accent: '#ffffff',
    },
    styles: {
      background: '#000000',
      productCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: '1px',
        shadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
      },
      productName: {
        color: '#ffffff',
        fontSize: '32px',
        fontWeight: '600',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
      },
      productDescription: {
        color: '#86868b',
        fontSize: '18px',
      },
      price: {
        color: '#ffffff',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
      menuTitle: {
        color: '#ffffff',
        fontSize: '48px',
        fontWeight: '700',
        textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
      },
      menuDescription: {
        color: '#86868b',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'gold-leaf',
    name: 'Gold Leaf',
    description: 'Timeless luxury. Refined sophistication.',
    preview: {
      background: '#1c1c1e',
      cardBg: 'rgba(255, 255, 255, 0.04)',
      textPrimary: '#f5f5f7',
      textSecondary: '#98989d',
      accent: '#d4af37',
    },
    styles: {
      background: '#1c1c1e',
      backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(212, 175, 55, 0.04) 0%, transparent 50%)',
      productCard: {
        background: 'rgba(255, 255, 255, 0.04)',
        borderColor: 'rgba(212, 175, 55, 0.15)',
        borderWidth: '1px',
        shadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      productName: {
        color: '#f5f5f7',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#98989d',
        fontSize: '18px',
      },
      price: {
        color: '#d4af37',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 2px 12px rgba(212, 175, 55, 0.3)',
      },
      menuTitle: {
        color: '#f5f5f7',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#98989d',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Clean and cool. Crisp precision.',
    preview: {
      background: '#f5f8fa',
      cardBg: '#ffffff',
      textPrimary: '#1d1d1f',
      textSecondary: '#6e6e73',
      accent: '#0071e3',
    },
    styles: {
      background: '#f5f8fa',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0, 113, 227, 0.03) 0%, transparent 60%)',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(0, 113, 227, 0.08)',
        borderWidth: '1px',
        shadow: '0 2px 16px rgba(0, 113, 227, 0.04), 0 1px 4px rgba(0, 113, 227, 0.02)',
      },
      productName: {
        color: '#1d1d1f',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#6e6e73',
        fontSize: '18px',
      },
      price: {
        color: '#0071e3',
        fontSize: '56px',
        fontWeight: '700',
      },
      menuTitle: {
        color: '#1d1d1f',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#6e6e73',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'sunset-boulevard',
    name: 'Sunset Boulevard',
    description: 'Warm gradients. Premium vibrancy.',
    preview: {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #c44569 50%, #4a148c 100%)',
      cardBg: 'rgba(255, 255, 255, 0.1)',
      textPrimary: '#ffffff',
      textSecondary: '#f5f5f7',
      accent: '#ff6b6b',
    },
    styles: {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #c44569 50%, #4a148c 100%)',
      productCard: {
        background: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: '1px',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        backdropBlur: '10px',
      },
      productName: {
        color: '#ffffff',
        fontSize: '32px',
        fontWeight: '600',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
      },
      productDescription: {
        color: '#f5f5f7',
        fontSize: '18px',
      },
      price: {
        color: '#ffffff',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
      },
      menuTitle: {
        color: '#ffffff',
        fontSize: '48px',
        fontWeight: '700',
        textShadow: '0 2px 16px rgba(0, 0, 0, 0.3)',
      },
      menuDescription: {
        color: '#f5f5f7',
        fontSize: '24px',
      },
    },
  },
];

export const getTheme = (themeId: string | null | undefined): TVTheme => {
  if (!themeId) return themes[0]; // Default to Platinum
  return themes.find(t => t.id === themeId) || themes[0];
};

export const getDefaultTheme = (): TVTheme => themes[0];
