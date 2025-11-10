/**
 * Apple Collection - Official apple.com Design System
 * Minimal, elegant, sophisticated themes inspired by apple.com
 */

import type { TVTheme } from "../types";

export const appleThemes: TVTheme[] = [
  {
    id: "apple-light",
    name: "Apple Light",
    description:
      "Official apple.com light theme. Clean, minimal, sophisticated.",
    preview: {
      background: "#F5F5F7",
      cardBg: "#ffffff",
      textPrimary: "#1d1d1f",
      textSecondary: "#86868b",
      accent: "#0071e3",
    },
    styles: {
      background: "#F5F5F7",
      productCard: {
        background: "#ffffff",
        borderColor: "rgba(0, 0, 0, 0.04)",
        borderWidth: "1px",
        shadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
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
    id: "apple-dark",
    name: "Apple Dark",
    description: "Official apple.com dark theme. Sleek, powerful, modern.",
    preview: {
      background: "#000000",
      cardBg: "#1d1d1f",
      textPrimary: "#f5f5f7",
      textSecondary: "#a1a1a6",
      accent: "#0E8BE9",
    },
    styles: {
      background: "#000000",
      productCard: {
        background: "#1d1d1f",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: "1px",
        shadow: "0 4px 24px rgba(0, 0, 0, 0.8)",
      },
      productName: {
        color: "#f5f5f7",
        fontSize: "32px",
        fontWeight: "600",
      },
      productDescription: {
        color: "#a1a1a6",
        fontSize: "18px",
      },
      price: {
        color: "#f5f5f7",
        fontSize: "56px",
        fontWeight: "700",
      },
      menuTitle: {
        color: "#f5f5f7",
        fontSize: "48px",
        fontWeight: "700",
      },
      menuDescription: {
        color: "#a1a1a6",
        fontSize: "24px",
      },
    },
  },
];
