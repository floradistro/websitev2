/**
 * iOS 18 Collection - Beautiful Animated Gradient Themes
 * Inspired by iOS 18 design language with stunning gradient backgrounds
 */

import type { TVTheme } from "../types";

export const ios18Themes: TVTheme[] = [
  {
    id: "ios18-aurora",
    name: "Aurora",
    description: "Mesmerizing purple and blue aurora with smooth animations",
    preview: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      cardBg: "rgba(255, 255, 255, 0.15)",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.8)",
      accent: "#a78bfa",
    },
    styles: {
      background: "linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe)",
      backgroundSize: "400% 400%",
      animation: "gradient 15s ease infinite",
      productCard: {
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(20px) saturate(180%)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
      },
      productName: {
        color: "#ffffff",
        fontSize: "32px",
        fontWeight: "700",
        textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
      },
      productDescription: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: "18px",
      },
      price: {
        color: "#ffffff",
        fontSize: "56px",
        fontWeight: "800",
        textShadow: "0 2px 20px rgba(0, 0, 0, 0.4)",
      },
      menuTitle: {
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "800",
        textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      },
      menuDescription: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: "24px",
      },
    },
  },
  {
    id: "ios18-sunset",
    name: "Sunset Glow",
    description: "Warm sunset vibes with orange, pink, and purple gradients",
    preview: {
      background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      cardBg: "rgba(255, 255, 255, 0.18)",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.85)",
      accent: "#ff6b9d",
    },
    styles: {
      background: "linear-gradient(-45deg, #ff9a56, #ff6b9d, #c44569, #ffa07a)",
      backgroundSize: "400% 400%",
      animation: "gradient 18s ease infinite",
      productCard: {
        background: "rgba(255, 255, 255, 0.18)",
        backdropFilter: "blur(24px) saturate(200%)",
        borderColor: "rgba(255, 255, 255, 0.25)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
      },
      productName: {
        color: "#ffffff",
        fontSize: "32px",
        fontWeight: "700",
        textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
      },
      productDescription: {
        color: "rgba(255, 255, 255, 0.95)",
        fontSize: "18px",
      },
      price: {
        color: "#ffffff",
        fontSize: "56px",
        fontWeight: "800",
        textShadow: "0 2px 24px rgba(0, 0, 0, 0.5)",
      },
      menuTitle: {
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "800",
        textShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      menuDescription: {
        color: "rgba(255, 255, 255, 0.95)",
        fontSize: "24px",
      },
    },
  },
  {
    id: "ios18-ocean",
    name: "Ocean Depths",
    description: "Deep ocean blues and teals with flowing wave motion",
    preview: {
      background: "linear-gradient(135deg, #667eea 0%, #0093e9 100%)",
      cardBg: "rgba(255, 255, 255, 0.12)",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.8)",
      accent: "#38bdf8",
    },
    styles: {
      background: "linear-gradient(-45deg, #2e3192, #1bffff, #00d4ff, #667eea)",
      backgroundSize: "400% 400%",
      animation: "gradient 20s ease infinite",
      productCard: {
        background: "rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(20px) saturate(180%)",
        borderColor: "rgba(255, 255, 255, 0.18)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      },
      productName: {
        color: "#ffffff",
        fontSize: "32px",
        fontWeight: "700",
        textShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
      },
      productDescription: {
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: "18px",
      },
      price: {
        color: "#ffffff",
        fontSize: "56px",
        fontWeight: "800",
        textShadow: "0 2px 20px rgba(0, 0, 0, 0.45)",
      },
      menuTitle: {
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "800",
        textShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
      },
      menuDescription: {
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: "24px",
      },
    },
  },
  {
    id: "ios18-forest",
    name: "Forest Dream",
    description: "Lush green gradients with nature-inspired flowing motion",
    preview: {
      background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      cardBg: "rgba(255, 255, 255, 0.14)",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.85)",
      accent: "#4ade80",
    },
    styles: {
      background: "linear-gradient(-45deg, #11998e, #38ef7d, #22c55e, #10b981)",
      backgroundSize: "400% 400%",
      animation: "gradient 16s ease infinite",
      productCard: {
        background: "rgba(255, 255, 255, 0.14)",
        backdropFilter: "blur(22px) saturate(180%)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
      },
      productName: {
        color: "#ffffff",
        fontSize: "32px",
        fontWeight: "700",
        textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
      },
      productDescription: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: "18px",
      },
      price: {
        color: "#ffffff",
        fontSize: "56px",
        fontWeight: "800",
        textShadow: "0 2px 20px rgba(0, 0, 0, 0.4)",
      },
      menuTitle: {
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "800",
        textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      },
      menuDescription: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: "24px",
      },
    },
  },
  {
    id: "ios18-twilight",
    name: "Twilight Magic",
    description: "Magical twilight with deep purples, pinks, and midnight blues",
    preview: {
      background: "linear-gradient(135deg, #360033 0%, #0b8793 100%)",
      cardBg: "rgba(255, 255, 255, 0.1)",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.8)",
      accent: "#c084fc",
    },
    styles: {
      background: "linear-gradient(-45deg, #360033, #0b8793, #8e44ad, #2c3e50)",
      backgroundSize: "400% 400%",
      animation: "gradient 22s ease infinite",
      productCard: {
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(24px) saturate(200%)",
        borderColor: "rgba(255, 255, 255, 0.15)",
        borderWidth: "1px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      productName: {
        color: "#ffffff",
        fontSize: "32px",
        fontWeight: "700",
        textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
      },
      productDescription: {
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: "18px",
      },
      price: {
        color: "#ffffff",
        fontSize: "56px",
        fontWeight: "800",
        textShadow: "0 2px 24px rgba(0, 0, 0, 0.5)",
      },
      menuTitle: {
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "800",
        textShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      menuDescription: {
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: "24px",
      },
    },
  },
];
