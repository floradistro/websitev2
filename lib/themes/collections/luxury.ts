/**
 * Luxury Collection - Inspired by Iconic Luxury Houses
 * Premium themes inspired by haute couture, jewelry, and timepieces
 */

import type { TVTheme } from "../types";

export const luxuryThemes: TVTheme[] = [
  {
    id: "maison-orange",
    name: "Maison Orange",
    description:
      "Inspired by French luxury. Vibrant orange meets rich saddle brown.",
    preview: {
      background: "#2c1810",
      cardBg: "rgba(255, 102, 51, 0.08)",
      textPrimary: "#f5f5f7",
      textSecondary: "#d4a574",
      accent: "#ff6633",
    },
    styles: {
      background: "#2c1810",
      backgroundImage:
        "radial-gradient(circle at 30% 20%, rgba(255, 102, 51, 0.12) 0%, transparent 50%)",
      productCard: {
        background: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 102, 51, 0.25)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      productName: {
        color: "#f5f5f7",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#d4a574",
        fontSize: "18px",
      },
      price: {
        color: "#ff6633",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 2px 16px rgba(255, 102, 51, 0.4)",
      },
      menuTitle: {
        color: "#f5f5f7",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#d4a574",
        fontSize: "24px",
      },
    },
  },
  {
    id: "robins-egg",
    name: "Robin's Egg",
    description:
      "Inspired by iconic jewelry. Turquoise elegance meets white sophistication.",
    preview: {
      background: "#ffffff",
      cardBg: "#fafafa",
      textPrimary: "#1d1d1f",
      textSecondary: "#6e6e73",
      accent: "#81d8d0",
    },
    styles: {
      background: "#ffffff",
      backgroundImage:
        "radial-gradient(circle at 50% 0%, rgba(129, 216, 208, 0.08) 0%, transparent 60%)",
      productCard: {
        background: "#fafafa",
        borderColor: "rgba(129, 216, 208, 0.2)",
        borderWidth: "1px",
        shadow: "0 4px 24px rgba(129, 216, 208, 0.12)",
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
        color: "#81d8d0",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 1px 8px rgba(129, 216, 208, 0.3)",
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
    id: "crimson-royale",
    name: "Crimson Royale",
    description:
      "Inspired by haute joaillerie. Deep burgundy with champagne gold accents.",
    preview: {
      background: "#1a0a0a",
      cardBg: "rgba(139, 0, 0, 0.1)",
      textPrimary: "#f5f5f7",
      textSecondary: "#d4af37",
      accent: "#8b0000",
    },
    styles: {
      background: "#1a0a0a",
      backgroundImage:
        "radial-gradient(circle at 40% 30%, rgba(139, 0, 0, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(212, 175, 55, 0.05) 0%, transparent 40%)",
      productCard: {
        background: "rgba(139, 0, 0, 0.08)",
        borderColor: "rgba(212, 175, 55, 0.2)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
      },
      productName: {
        color: "#f5f5f7",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#d4af37",
        fontSize: "18px",
      },
      price: {
        color: "#d4af37",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 2px 16px rgba(212, 175, 55, 0.4)",
      },
      menuTitle: {
        color: "#f5f5f7",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#d4af37",
        fontSize: "24px",
      },
    },
  },
  {
    id: "monochrome-elegance",
    name: "Monochrome Elegance",
    description:
      "Inspired by haute couture. Pure black and white sophistication.",
    preview: {
      background: "#000000",
      cardBg: "#1a1a1a",
      textPrimary: "#ffffff",
      textSecondary: "#cccccc",
      accent: "#ffffff",
    },
    styles: {
      background: "#000000",
      productCard: {
        background: "#1a1a1a",
        borderColor: "rgba(255, 255, 255, 0.15)",
        borderWidth: "1px",
        shadow: "0 4px 24px rgba(0, 0, 0, 0.8)",
      },
      productName: {
        color: "#ffffff",
        fontSize: "32px",
        fontWeight: "600",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
      },
      productDescription: {
        color: "#cccccc",
        fontSize: "18px",
      },
      price: {
        color: "#ffffff",
        fontSize: "56px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#cccccc",
        fontSize: "24px",
      },
    },
  },
  {
    id: "heritage-brown",
    name: "Heritage Brown",
    description:
      "Inspired by legendary luggage. Rich cognac with lustrous gold.",
    preview: {
      background: "#3e2723",
      cardBg: "rgba(121, 85, 72, 0.2)",
      textPrimary: "#f5f5f7",
      textSecondary: "#d7ccc8",
      accent: "#d4af37",
    },
    styles: {
      background: "#3e2723",
      backgroundImage:
        "radial-gradient(circle at 50% 30%, rgba(121, 85, 72, 0.3) 0%, transparent 60%)",
      productCard: {
        background: "rgba(121, 85, 72, 0.15)",
        borderColor: "rgba(212, 175, 55, 0.2)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
      },
      productName: {
        color: "#f5f5f7",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#d7ccc8",
        fontSize: "18px",
      },
      price: {
        color: "#d4af37",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 2px 16px rgba(212, 175, 55, 0.4)",
      },
      menuTitle: {
        color: "#f5f5f7",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#d7ccc8",
        fontSize: "24px",
      },
    },
  },
  {
    id: "emerald-prestige",
    name: "Emerald Prestige",
    description:
      "Inspired by Swiss timepieces. Deep forest green with 18k gold.",
    preview: {
      background: "#0a1f0f",
      cardBg: "rgba(1, 50, 32, 0.4)",
      textPrimary: "#f5f5f7",
      textSecondary: "#a7c4a0",
      accent: "#d4af37",
    },
    styles: {
      background: "#0a1f0f",
      backgroundImage:
        "radial-gradient(circle at 40% 20%, rgba(1, 50, 32, 0.4) 0%, transparent 50%)",
      productCard: {
        background: "rgba(1, 50, 32, 0.3)",
        borderColor: "rgba(212, 175, 55, 0.25)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
      },
      productName: {
        color: "#f5f5f7",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#a7c4a0",
        fontSize: "18px",
      },
      price: {
        color: "#d4af37",
        fontSize: "56px",
        fontWeight: "700",
        textShadow: "0 2px 16px rgba(212, 175, 55, 0.5)",
      },
      menuTitle: {
        color: "#f5f5f7",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#a7c4a0",
        fontSize: "24px",
      },
    },
  },
  {
    id: "champagne-classic",
    name: "Champagne Classic",
    description:
      "Inspired by Michelin dining. Warm beige with subtle gold accents.",
    preview: {
      background: "#f5f1e8",
      cardBg: "#ffffff",
      textPrimary: "#3e2723",
      textSecondary: "#6d4c41",
      accent: "#c9a961",
    },
    styles: {
      background: "#f5f1e8",
      backgroundImage:
        "radial-gradient(circle at 50% 0%, rgba(201, 169, 97, 0.08) 0%, transparent 60%)",
      productCard: {
        background: "#ffffff",
        borderColor: "rgba(201, 169, 97, 0.2)",
        borderWidth: "1px",
        shadow: "0 4px 20px rgba(62, 39, 35, 0.06)",
      },
      productName: {
        color: "#3e2723",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#6d4c41",
        fontSize: "18px",
      },
      price: {
        color: "#c9a961",
        fontSize: "56px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#3e2723",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#6d4c41",
        fontSize: "24px",
      },
    },
  },
];
