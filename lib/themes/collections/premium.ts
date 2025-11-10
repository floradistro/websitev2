/**
 * Premium Collection - Modern & Contemporary Themes
 * Professional themes for modern displays
 */

import type { TVTheme } from "../types";

export const premiumThemes: TVTheme[] = [
  {
    id: "platinum",
    name: "Platinum",
    description: "Ultra-minimal elegance. Pure and timeless.",
    preview: {
      background: "#ffffff",
      cardBg: "#fafafa",
      textPrimary: "#1d1d1f",
      textSecondary: "#86868b",
      accent: "#1d1d1f",
    },
    styles: {
      background: "#ffffff",
      backgroundImage:
        "radial-gradient(circle at 50% 0%, rgba(245, 245, 247, 0.8) 0%, transparent 70%)",
      productCard: {
        background: "rgba(250, 250, 250, 0.95)",
        borderColor: "rgba(29, 29, 31, 0.04)",
        borderWidth: "1px",
        shadow: "0 2px 16px rgba(0, 0, 0, 0.03), 0 1px 4px rgba(0, 0, 0, 0.02)",
      },
      productName: {
        color: "#1d1d1f",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#86868b",
        fontSize: "18px",
      },
      price: {
        color: "#1d1d1f",
        fontSize: "56px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#1d1d1f",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#86868b",
        fontSize: "24px",
      },
    },
  },
  {
    id: "noir",
    name: "Noir",
    description: "Pure black. Infinite contrast. Maximum impact.",
    preview: {
      background: "#000000",
      cardBg: "rgba(255, 255, 255, 0.03)",
      textPrimary: "#ffffff",
      textSecondary: "#86868b",
      accent: "#ffffff",
    },
    styles: {
      background: "#000000",
      productCard: {
        background: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: "1px",
        shadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
      },
      productName: {
        color: "#ffffff",
        fontSize: "32px",
        fontWeight: "600",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
      },
      productDescription: {
        color: "#86868b",
        fontSize: "18px",
      },
      price: {
        color: "#ffffff",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      },
      menuTitle: {
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "700",
        textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
      },
      menuDescription: {
        color: "#86868b",
        fontSize: "24px",
      },
    },
  },
  {
    id: "gold-leaf",
    name: "Gold Leaf",
    description: "Timeless luxury. Refined sophistication.",
    preview: {
      background: "#1c1c1e",
      cardBg: "rgba(255, 255, 255, 0.04)",
      textPrimary: "#f5f5f7",
      textSecondary: "#98989d",
      accent: "#d4af37",
    },
    styles: {
      background: "#1c1c1e",
      backgroundImage:
        "radial-gradient(circle at 30% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(212, 175, 55, 0.04) 0%, transparent 50%)",
      productCard: {
        background: "rgba(255, 255, 255, 0.04)",
        borderColor: "rgba(212, 175, 55, 0.15)",
        borderWidth: "1px",
        shadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
      },
      productName: {
        color: "#f5f5f7",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#98989d",
        fontSize: "18px",
      },
      price: {
        color: "#d4af37",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 2px 12px rgba(212, 175, 55, 0.3)",
      },
      menuTitle: {
        color: "#f5f5f7",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#98989d",
        fontSize: "24px",
      },
    },
  },
  {
    id: "arctic",
    name: "Arctic",
    description: "Clean and cool. Crisp precision.",
    preview: {
      background: "#f5f8fa",
      cardBg: "#ffffff",
      textPrimary: "#1d1d1f",
      textSecondary: "#6e6e73",
      accent: "#0071e3",
    },
    styles: {
      background: "#f5f8fa",
      backgroundImage:
        "radial-gradient(circle at 50% 0%, rgba(0, 113, 227, 0.03) 0%, transparent 60%)",
      productCard: {
        background: "#ffffff",
        borderColor: "rgba(0, 113, 227, 0.08)",
        borderWidth: "1px",
        shadow: "0 2px 16px rgba(0, 113, 227, 0.04), 0 1px 4px rgba(0, 113, 227, 0.02)",
      },
      productName: {
        color: "#1d1d1f",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#6e6e73",
        fontSize: "18px",
      },
      price: {
        color: "#0071e3",
        fontSize: "56px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#1d1d1f",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#6e6e73",
        fontSize: "24px",
      },
    },
  },
  {
    id: "sunset-boulevard",
    name: "Sunset Boulevard",
    description: "Warm gradients. Premium vibrancy.",
    preview: {
      background: "linear-gradient(135deg, #ff6b6b 0%, #c44569 50%, #4a148c 100%)",
      cardBg: "rgba(255, 255, 255, 0.1)",
      textPrimary: "#ffffff",
      textSecondary: "#f5f5f7",
      accent: "#ff6b6b",
    },
    styles: {
      background: "linear-gradient(135deg, #ff6b6b 0%, #c44569 50%, #4a148c 100%)",
      productCard: {
        background: "rgba(255, 255, 255, 0.08)",
        borderColor: "rgba(255, 255, 255, 0.15)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        backdropBlur: "10px",
      },
      productName: {
        color: "#ffffff",
        fontSize: "32px",
        fontWeight: "600",
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
      },
      productDescription: {
        color: "#f5f5f7",
        fontSize: "18px",
      },
      price: {
        color: "#ffffff",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
      },
      menuTitle: {
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "700",
        textShadow: "0 2px 16px rgba(0, 0, 0, 0.3)",
      },
      menuDescription: {
        color: "#f5f5f7",
        fontSize: "24px",
      },
    },
  },
  {
    id: "midnight-elegance",
    name: "Midnight Elegance",
    description: "Deep indigo with silver accents. Sophisticated nighttime luxury.",
    preview: {
      background: "#0f1419",
      cardBg: "rgba(99, 102, 241, 0.1)",
      textPrimary: "#e5e7eb",
      textSecondary: "#9ca3af",
      accent: "#818cf8",
    },
    styles: {
      background: "#0f1419",
      backgroundImage:
        "radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
      productCard: {
        background: "rgba(99, 102, 241, 0.08)",
        borderColor: "rgba(129, 140, 248, 0.2)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(99, 102, 241, 0.15)",
      },
      productName: {
        color: "#e5e7eb",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#9ca3af",
        fontSize: "18px",
      },
      price: {
        color: "#818cf8",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 2px 16px rgba(129, 140, 248, 0.4)",
      },
      menuTitle: {
        color: "#e5e7eb",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#9ca3af",
        fontSize: "24px",
      },
    },
  },
  {
    id: "bold-vibrant",
    name: "Bold Vibrant",
    description: "Electric energy. High-contrast modern design.",
    preview: {
      background: "#111827",
      cardBg: "rgba(236, 72, 153, 0.1)",
      textPrimary: "#f9fafb",
      textSecondary: "#d1d5db",
      accent: "#ec4899",
    },
    styles: {
      background: "#111827",
      backgroundImage:
        "radial-gradient(circle at 30% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)",
      productCard: {
        background: "rgba(236, 72, 153, 0.08)",
        borderColor: "rgba(236, 72, 153, 0.25)",
        borderWidth: "2px",
        shadow: "0 8px 32px rgba(236, 72, 153, 0.2)",
      },
      productName: {
        color: "#f9fafb",
        fontSize: "32px",
        fontWeight: "700",
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      },
      productDescription: {
        color: "#d1d5db",
        fontSize: "18px",
      },
      price: {
        color: "#ec4899",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 2px 20px rgba(236, 72, 153, 0.5)",
      },
      menuTitle: {
        color: "#f9fafb",
        fontSize: "48px",
        fontWeight: "700",
        textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
      },
      menuDescription: {
        color: "#d1d5db",
        fontSize: "24px",
      },
    },
  },
  {
    id: "fresh-market",
    name: "Fresh Market",
    description: "Natural green tones. Organic and welcoming.",
    preview: {
      background: "#f0fdf4",
      cardBg: "#ffffff",
      textPrimary: "#14532d",
      textSecondary: "#166534",
      accent: "#16a34a",
    },
    styles: {
      background: "#f0fdf4",
      backgroundImage:
        "radial-gradient(circle at 50% 0%, rgba(134, 239, 172, 0.15) 0%, transparent 60%)",
      productCard: {
        background: "#ffffff",
        borderColor: "rgba(34, 197, 94, 0.15)",
        borderWidth: "1px",
        shadow: "0 4px 24px rgba(34, 197, 94, 0.08)",
      },
      productName: {
        color: "#14532d",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#166534",
        fontSize: "18px",
      },
      price: {
        color: "#16a34a",
        fontSize: "56px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#14532d",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#166534",
        fontSize: "24px",
      },
    },
  },
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    description: "Refined neutrals. Timeless simplicity.",
    preview: {
      background: "#fafaf9",
      cardBg: "#ffffff",
      textPrimary: "#1c1917",
      textSecondary: "#78716c",
      accent: "#44403c",
    },
    styles: {
      background: "#fafaf9",
      backgroundImage:
        "radial-gradient(circle at 50% 50%, rgba(231, 229, 228, 0.5) 0%, transparent 70%)",
      productCard: {
        background: "#ffffff",
        borderColor: "rgba(28, 25, 23, 0.06)",
        borderWidth: "1px",
        shadow: "0 2px 20px rgba(0, 0, 0, 0.04)",
      },
      productName: {
        color: "#1c1917",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#78716c",
        fontSize: "18px",
      },
      price: {
        color: "#44403c",
        fontSize: "56px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#1c1917",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#78716c",
        fontSize: "24px",
      },
    },
  },
  {
    id: "warm-inviting",
    name: "Warm Inviting",
    description: "Amber glow. Cozy and welcoming atmosphere.",
    preview: {
      background: "#fffbeb",
      cardBg: "#ffffff",
      textPrimary: "#78350f",
      textSecondary: "#92400e",
      accent: "#f59e0b",
    },
    styles: {
      background: "#fffbeb",
      backgroundImage:
        "radial-gradient(circle at 40% 30%, rgba(251, 191, 36, 0.12) 0%, transparent 60%)",
      productCard: {
        background: "#ffffff",
        borderColor: "rgba(245, 158, 11, 0.15)",
        borderWidth: "1px",
        shadow: "0 4px 24px rgba(245, 158, 11, 0.1)",
      },
      productName: {
        color: "#78350f",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#92400e",
        fontSize: "18px",
      },
      price: {
        color: "#f59e0b",
        fontSize: "56px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#78350f",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#92400e",
        fontSize: "24px",
      },
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Coastal blue-green. Fresh and serene.",
    preview: {
      background: "#ecfeff",
      cardBg: "#ffffff",
      textPrimary: "#164e63",
      textSecondary: "#0e7490",
      accent: "#06b6d4",
    },
    styles: {
      background: "#ecfeff",
      backgroundImage:
        "radial-gradient(circle at 50% 0%, rgba(103, 232, 249, 0.2) 0%, transparent 60%)",
      productCard: {
        background: "#ffffff",
        borderColor: "rgba(6, 182, 212, 0.15)",
        borderWidth: "1px",
        shadow: "0 4px 24px rgba(6, 182, 212, 0.12)",
      },
      productName: {
        color: "#164e63",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#0e7490",
        fontSize: "18px",
      },
      price: {
        color: "#06b6d4",
        fontSize: "56px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#164e63",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#0e7490",
        fontSize: "24px",
      },
    },
  },
  {
    id: "bulk",
    name: "Bulk Display",
    description: "Maximum density - fit 30+ products on screen",
    preview: {
      background: "#ffffff",
      cardBg: "#fafafa",
      textPrimary: "#000000",
      textSecondary: "#666666",
      accent: "#000000",
    },
    styles: {
      background: "#ffffff",
      productCard: {
        background: "transparent",
        borderColor: "#e5e5e5",
        borderWidth: "0px",
        shadow: "none",
      },
      productName: {
        color: "#000000",
        fontSize: "16px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#666666",
        fontSize: "13px",
      },
      price: {
        color: "#000000",
        fontSize: "18px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#000000",
        fontSize: "32px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#666666",
        fontSize: "18px",
      },
    },
  },
];
