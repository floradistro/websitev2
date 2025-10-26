/**
 * Hook to fetch template styles from database
 * Enables instant design updates without deployment
 */

import { useState, useEffect } from 'react';

interface TemplateStyle {
  color_palette: {
    background: string;
    card_bg: string;
    text_primary: string;
    text_secondary: string;
    border: string;
    border_hover: string;
    accent: string;
  };
  typography: {
    product_card_name_mobile: string;
    product_card_name_desktop: string;
    product_card_name_weight: number;
    product_card_name_tracking: string;
    product_detail_name_mobile: string;
    product_detail_name_desktop: string;
    product_detail_name_weight: number;
    price_size: string;
    price_weight: number;
    stock_size: string;
    field_label_size: string;
    field_value_size: string;
  };
  spacing_scale: {
    card_padding_mobile: string;
    card_padding_desktop: string;
    section_padding_mobile: string;
    section_padding_desktop: string;
    gap_small: string;
    gap_medium: string;
    gap_large: string;
  };
  border_radius: {
    card: string;
    button: string;
    input: string;
  };
  effects: {
    shadow: string;
    hover_lift: string;
    transition: string;
  };
}

// Default Wilson's template (fallback if DB fails)
const DEFAULT_WILSONS_STYLE: TemplateStyle = {
  color_palette: {
    background: '#000000',
    card_bg: '#0a0a0a',
    text_primary: '#ffffff',
    text_secondary: 'rgba(255,255,255,0.6)',
    border: 'rgba(255,255,255,0.05)',
    border_hover: 'rgba(255,255,255,0.1)',
    accent: '#ffffff',
  },
  typography: {
    product_card_name_mobile: '20px',
    product_card_name_desktop: '12px',
    product_card_name_weight: 900,
    product_card_name_tracking: '0.12em',
    product_detail_name_mobile: '24px',
    product_detail_name_desktop: '48px',
    product_detail_name_weight: 900,
    price_size: '14px',
    price_weight: 500,
    stock_size: '11px',
    field_label_size: '10px',
    field_value_size: '11px',
  },
  spacing_scale: {
    card_padding_mobile: '12px',
    card_padding_desktop: '16px',
    section_padding_mobile: '12px',
    section_padding_desktop: '48px',
    gap_small: '8px',
    gap_medium: '16px',
    gap_large: '24px',
  },
  border_radius: {
    card: '16px',
    button: '16px',
    input: '12px',
  },
  effects: {
    shadow: '0 0 30px rgba(255,255,255,0.02)',
    hover_lift: '-4px',
    transition: '300ms',
  },
};

export function useTemplateStyle(vendorId?: string): TemplateStyle {
  const [style, setStyle] = useState<TemplateStyle>(DEFAULT_WILSONS_STYLE);

  useEffect(() => {
    // If no vendorId, use default
    if (!vendorId) {
      setStyle(DEFAULT_WILSONS_STYLE);
      return;
    }

    // Fetch vendor's applied style preset
    async function fetchStyle() {
      try {
        const res = await fetch(`/api/vendor/style?vendor_id=${vendorId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.style) {
            setStyle({
              ...DEFAULT_WILSONS_STYLE,
              ...data.style,
            });
          }
        }
      } catch (error) {
        // Silently fail, use default
        console.log('Using default template style');
      }
    }

    fetchStyle();
  }, [vendorId]);

  return style;
}

