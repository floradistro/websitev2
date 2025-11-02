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
  // APPLE COLLECTION - Official apple.com design system
  {
    id: 'apple-light',
    name: 'Apple Light',
    description: 'Official apple.com light theme. Clean, minimal, sophisticated.',
    preview: {
      background: '#F5F5F7',
      cardBg: '#ffffff',
      textPrimary: '#1d1d1f',
      textSecondary: '#86868b',
      accent: '#0071e3',
    },
    styles: {
      background: '#F5F5F7',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(0, 0, 0, 0.04)',
        borderWidth: '1px',
        shadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
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
    id: 'apple-dark',
    name: 'Apple Dark',
    description: 'Official apple.com dark theme. Sleek, powerful, modern.',
    preview: {
      background: '#000000',
      cardBg: '#1d1d1f',
      textPrimary: '#f5f5f7',
      textSecondary: '#a1a1a6',
      accent: '#0E8BE9',
    },
    styles: {
      background: '#000000',
      productCard: {
        background: '#1d1d1f',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: '1px',
        shadow: '0 4px 24px rgba(0, 0, 0, 0.8)',
      },
      productName: {
        color: '#f5f5f7',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#a1a1a6',
        fontSize: '18px',
      },
      price: {
        color: '#f5f5f7',
        fontSize: '56px',
        fontWeight: '700',
      },
      menuTitle: {
        color: '#f5f5f7',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#a1a1a6',
        fontSize: '24px',
      },
    },
  },

  // LUXURY COLLECTION - Inspired by iconic luxury houses
  {
    id: 'maison-orange',
    name: 'Maison Orange',
    description: 'Inspired by French luxury. Vibrant orange meets rich saddle brown.',
    preview: {
      background: '#2c1810',
      cardBg: 'rgba(255, 102, 51, 0.08)',
      textPrimary: '#f5f5f7',
      textSecondary: '#d4a574',
      accent: '#ff6633',
    },
    styles: {
      background: '#2c1810',
      backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255, 102, 51, 0.12) 0%, transparent 50%)',
      productCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 102, 51, 0.25)',
        borderWidth: '1px',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      productName: {
        color: '#f5f5f7',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#d4a574',
        fontSize: '18px',
      },
      price: {
        color: '#ff6633',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 2px 16px rgba(255, 102, 51, 0.4)',
      },
      menuTitle: {
        color: '#f5f5f7',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#d4a574',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'robins-egg',
    name: "Robin's Egg",
    description: 'Inspired by iconic jewelry. Turquoise elegance meets white sophistication.',
    preview: {
      background: '#ffffff',
      cardBg: '#fafafa',
      textPrimary: '#1d1d1f',
      textSecondary: '#6e6e73',
      accent: '#81d8d0',
    },
    styles: {
      background: '#ffffff',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(129, 216, 208, 0.08) 0%, transparent 60%)',
      productCard: {
        background: '#fafafa',
        borderColor: 'rgba(129, 216, 208, 0.2)',
        borderWidth: '1px',
        shadow: '0 4px 24px rgba(129, 216, 208, 0.12)',
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
        color: '#81d8d0',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 1px 8px rgba(129, 216, 208, 0.3)',
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
    id: 'crimson-royale',
    name: 'Crimson Royale',
    description: 'Inspired by haute joaillerie. Deep burgundy with champagne gold accents.',
    preview: {
      background: '#1a0a0a',
      cardBg: 'rgba(139, 0, 0, 0.1)',
      textPrimary: '#f5f5f7',
      textSecondary: '#d4af37',
      accent: '#8b0000',
    },
    styles: {
      background: '#1a0a0a',
      backgroundImage: 'radial-gradient(circle at 40% 30%, rgba(139, 0, 0, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(212, 175, 55, 0.05) 0%, transparent 40%)',
      productCard: {
        background: 'rgba(139, 0, 0, 0.08)',
        borderColor: 'rgba(212, 175, 55, 0.2)',
        borderWidth: '1px',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      productName: {
        color: '#f5f5f7',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#d4af37',
        fontSize: '18px',
      },
      price: {
        color: '#d4af37',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 2px 16px rgba(212, 175, 55, 0.4)',
      },
      menuTitle: {
        color: '#f5f5f7',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#d4af37',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'monochrome-elegance',
    name: 'Monochrome Elegance',
    description: 'Inspired by haute couture. Pure black and white sophistication.',
    preview: {
      background: '#000000',
      cardBg: '#1a1a1a',
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      accent: '#ffffff',
    },
    styles: {
      background: '#000000',
      productCard: {
        background: '#1a1a1a',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: '1px',
        shadow: '0 4px 24px rgba(0, 0, 0, 0.8)',
      },
      productName: {
        color: '#ffffff',
        fontSize: '32px',
        fontWeight: '600',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
      },
      productDescription: {
        color: '#cccccc',
        fontSize: '18px',
      },
      price: {
        color: '#ffffff',
        fontSize: '56px',
        fontWeight: '700',
      },
      menuTitle: {
        color: '#ffffff',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#cccccc',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'heritage-brown',
    name: 'Heritage Brown',
    description: 'Inspired by legendary luggage. Rich cognac with lustrous gold.',
    preview: {
      background: '#3e2723',
      cardBg: 'rgba(121, 85, 72, 0.2)',
      textPrimary: '#f5f5f7',
      textSecondary: '#d7ccc8',
      accent: '#d4af37',
    },
    styles: {
      background: '#3e2723',
      backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(121, 85, 72, 0.3) 0%, transparent 60%)',
      productCard: {
        background: 'rgba(121, 85, 72, 0.15)',
        borderColor: 'rgba(212, 175, 55, 0.2)',
        borderWidth: '1px',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      productName: {
        color: '#f5f5f7',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#d7ccc8',
        fontSize: '18px',
      },
      price: {
        color: '#d4af37',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 2px 16px rgba(212, 175, 55, 0.4)',
      },
      menuTitle: {
        color: '#f5f5f7',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#d7ccc8',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'emerald-prestige',
    name: 'Emerald Prestige',
    description: 'Inspired by Swiss timepieces. Deep forest green with 18k gold.',
    preview: {
      background: '#0a1f0f',
      cardBg: 'rgba(1, 50, 32, 0.4)',
      textPrimary: '#f5f5f7',
      textSecondary: '#a7c4a0',
      accent: '#d4af37',
    },
    styles: {
      background: '#0a1f0f',
      backgroundImage: 'radial-gradient(circle at 40% 20%, rgba(1, 50, 32, 0.4) 0%, transparent 50%)',
      productCard: {
        background: 'rgba(1, 50, 32, 0.3)',
        borderColor: 'rgba(212, 175, 55, 0.25)',
        borderWidth: '1px',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
      },
      productName: {
        color: '#f5f5f7',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#a7c4a0',
        fontSize: '18px',
      },
      price: {
        color: '#d4af37',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 2px 16px rgba(212, 175, 55, 0.5)',
      },
      menuTitle: {
        color: '#f5f5f7',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#a7c4a0',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'champagne-classic',
    name: 'Champagne Classic',
    description: 'Inspired by Michelin dining. Warm beige with subtle gold accents.',
    preview: {
      background: '#f5f1e8',
      cardBg: '#ffffff',
      textPrimary: '#3e2723',
      textSecondary: '#6d4c41',
      accent: '#c9a961',
    },
    styles: {
      background: '#f5f1e8',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(201, 169, 97, 0.08) 0%, transparent 60%)',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(201, 169, 97, 0.2)',
        borderWidth: '1px',
        shadow: '0 4px 20px rgba(62, 39, 35, 0.06)',
      },
      productName: {
        color: '#3e2723',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#6d4c41',
        fontSize: '18px',
      },
      price: {
        color: '#c9a961',
        fontSize: '56px',
        fontWeight: '700',
      },
      menuTitle: {
        color: '#3e2723',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#6d4c41',
        fontSize: '24px',
      },
    },
  },

  // PREMIUM COLLECTION
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
  {
    id: 'midnight-elegance',
    name: 'Midnight Elegance',
    description: 'Deep indigo with silver accents. Sophisticated nighttime luxury.',
    preview: {
      background: '#0f1419',
      cardBg: 'rgba(99, 102, 241, 0.1)',
      textPrimary: '#e5e7eb',
      textSecondary: '#9ca3af',
      accent: '#818cf8',
    },
    styles: {
      background: '#0f1419',
      backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
      productCard: {
        background: 'rgba(99, 102, 241, 0.08)',
        borderColor: 'rgba(129, 140, 248, 0.2)',
        borderWidth: '1px',
        shadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
      },
      productName: {
        color: '#e5e7eb',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#9ca3af',
        fontSize: '18px',
      },
      price: {
        color: '#818cf8',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 2px 16px rgba(129, 140, 248, 0.4)',
      },
      menuTitle: {
        color: '#e5e7eb',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#9ca3af',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'bold-vibrant',
    name: 'Bold Vibrant',
    description: 'Electric energy. High-contrast modern design.',
    preview: {
      background: '#111827',
      cardBg: 'rgba(236, 72, 153, 0.1)',
      textPrimary: '#f9fafb',
      textSecondary: '#d1d5db',
      accent: '#ec4899',
    },
    styles: {
      background: '#111827',
      backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
      productCard: {
        background: 'rgba(236, 72, 153, 0.08)',
        borderColor: 'rgba(236, 72, 153, 0.25)',
        borderWidth: '2px',
        shadow: '0 8px 32px rgba(236, 72, 153, 0.2)',
      },
      productName: {
        color: '#f9fafb',
        fontSize: '32px',
        fontWeight: '700',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
      productDescription: {
        color: '#d1d5db',
        fontSize: '18px',
      },
      price: {
        color: '#ec4899',
        fontSize: '56px',
        fontWeight: '700',
        textShadow: '0 2px 20px rgba(236, 72, 153, 0.5)',
      },
      menuTitle: {
        color: '#f9fafb',
        fontSize: '48px',
        fontWeight: '700',
        textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
      },
      menuDescription: {
        color: '#d1d5db',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'fresh-market',
    name: 'Fresh Market',
    description: 'Natural green tones. Organic and welcoming.',
    preview: {
      background: '#f0fdf4',
      cardBg: '#ffffff',
      textPrimary: '#14532d',
      textSecondary: '#166534',
      accent: '#16a34a',
    },
    styles: {
      background: '#f0fdf4',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(34, 197, 94, 0.15)',
        borderWidth: '1px',
        shadow: '0 4px 24px rgba(34, 197, 94, 0.08)',
      },
      productName: {
        color: '#14532d',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#166534',
        fontSize: '18px',
      },
      price: {
        color: '#16a34a',
        fontSize: '56px',
        fontWeight: '700',
      },
      menuTitle: {
        color: '#14532d',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#166534',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Refined neutrals. Timeless simplicity.',
    preview: {
      background: '#fafaf9',
      cardBg: '#ffffff',
      textPrimary: '#1c1917',
      textSecondary: '#78716c',
      accent: '#44403c',
    },
    styles: {
      background: '#fafaf9',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(231, 229, 228, 0.5) 0%, transparent 70%)',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(28, 25, 23, 0.06)',
        borderWidth: '1px',
        shadow: '0 2px 20px rgba(0, 0, 0, 0.04)',
      },
      productName: {
        color: '#1c1917',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#78716c',
        fontSize: '18px',
      },
      price: {
        color: '#44403c',
        fontSize: '56px',
        fontWeight: '700',
      },
      menuTitle: {
        color: '#1c1917',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#78716c',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'warm-inviting',
    name: 'Warm Inviting',
    description: 'Amber glow. Cozy and welcoming atmosphere.',
    preview: {
      background: '#fffbeb',
      cardBg: '#ffffff',
      textPrimary: '#78350f',
      textSecondary: '#92400e',
      accent: '#f59e0b',
    },
    styles: {
      background: '#fffbeb',
      backgroundImage: 'radial-gradient(circle at 40% 30%, rgba(251, 191, 36, 0.12) 0%, transparent 60%)',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: '1px',
        shadow: '0 4px 24px rgba(245, 158, 11, 0.1)',
      },
      productName: {
        color: '#78350f',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#92400e',
        fontSize: '18px',
      },
      price: {
        color: '#f59e0b',
        fontSize: '56px',
        fontWeight: '700',
      },
      menuTitle: {
        color: '#78350f',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#92400e',
        fontSize: '24px',
      },
    },
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Coastal blue-green. Fresh and serene.',
    preview: {
      background: '#ecfeff',
      cardBg: '#ffffff',
      textPrimary: '#164e63',
      textSecondary: '#0e7490',
      accent: '#06b6d4',
    },
    styles: {
      background: '#ecfeff',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(103, 232, 249, 0.2) 0%, transparent 60%)',
      productCard: {
        background: '#ffffff',
        borderColor: 'rgba(6, 182, 212, 0.15)',
        borderWidth: '1px',
        shadow: '0 4px 24px rgba(6, 182, 212, 0.12)',
      },
      productName: {
        color: '#164e63',
        fontSize: '32px',
        fontWeight: '600',
      },
      productDescription: {
        color: '#0e7490',
        fontSize: '18px',
      },
      price: {
        color: '#06b6d4',
        fontSize: '56px',
        fontWeight: '700',
      },
      menuTitle: {
        color: '#164e63',
        fontSize: '48px',
        fontWeight: '700',
      },
      menuDescription: {
        color: '#0e7490',
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
