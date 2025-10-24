/**
 * Shop Configuration Section
 * Controls the appearance and behavior of the shop page
 * This is a special "meta" section that doesn't render visible content
 * but provides configuration for the shop layout
 */

interface ShopConfigSectionProps {
  content: {
    // Layout
    grid_columns?: number; // 2, 3, 4
    card_style?: 'minimal' | 'card' | 'bordered';
    
    // Product Cards
    show_quick_add?: boolean;
    show_stock_badge?: boolean;
    show_pricing_tiers?: boolean;
    image_aspect?: 'square' | 'portrait' | 'landscape';
    corner_radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    
    // Filters
    show_categories?: boolean;
    show_location_filter?: boolean;
    show_sort?: boolean;
    
    // Title
    page_title?: string;
    page_subtitle?: string;
  };
}

export function ShopConfigSection({ content }: ShopConfigSectionProps) {
  // This section doesn't render anything - it just provides config
  // The actual shop page reads this config and applies it
  return null;
}

