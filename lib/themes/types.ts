/**
 * TV Menu Display Theme Type Definitions
 * Extracted from themes.ts for better maintainability
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
