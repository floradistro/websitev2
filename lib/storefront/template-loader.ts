import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';

// Template component types
export interface TemplateComponents {
  Header: typeof StorefrontHeader;
  Footer: typeof StorefrontFooter;
}

// Template metadata interface
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  category: string;
  features: string[];
  best_for: string[];
}

/**
 * Load template components based on vendor's template_id
 * This allows vendors to choose different themes/layouts
 * 
 * Future templates:
 * - minimalist (default/current)
 * - luxury (elegant, serif fonts, animations)
 * - bold (vibrant colors, modern)
 * - organic (natural, earthy tones)
 */
export function getTemplateComponents(templateId: string = 'default'): TemplateComponents {
  switch (templateId) {
    case 'minimalist':
    case 'default':
    default:
      // Current template (minimalist/default)
      return {
        Header: StorefrontHeader,
        Footer: StorefrontFooter,
      };
    
    // Future templates can be added here:
    // case 'luxury':
    //   return {
    //     Header: LuxuryHeader,
    //     Footer: LuxuryFooter,
    //   };
  }
}

/**
 * Get available templates for vendor selection
 */
const availableTemplates: TemplateMetadata[] = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, modern design focused on products with minimal distractions',
    preview_image: '/templates/minimalist-preview.jpg',
    category: 'Modern',
    features: ['Clean layout', 'Fast loading', 'Mobile-first', 'High contrast'],
    best_for: ['Concentrates', 'Vapes', 'Modern brands'],
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Premium, elegant design with sophisticated typography and animations',
    preview_image: '/templates/luxury-preview.jpg',
    category: 'Premium',
    features: ['Serif fonts', 'Smooth animations', 'Elegant spacing', 'Gold accents'],
    best_for: ['High-end flower', 'Craft cannabis', 'Boutique brands'],
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Vibrant, energetic design with strong colors and modern aesthetics',
    preview_image: '/templates/bold-preview.jpg',
    category: 'Energetic',
    features: ['Vibrant colors', 'Large typography', 'Dynamic layouts', 'Eye-catching'],
    best_for: ['Edibles', 'Beverages', 'Youth-focused brands'],
  },
  {
    id: 'organic',
    name: 'Organic',
    description: 'Natural, earthy design with warm tones and organic shapes',
    preview_image: '/templates/organic-preview.jpg',
    category: 'Natural',
    features: ['Earthy colors', 'Natural textures', 'Soft edges', 'Eco-friendly vibe'],
    best_for: ['Organic flower', 'Wellness products', 'Sustainable brands'],
  },
];

export function getAvailableTemplates(): TemplateMetadata[] {
  return availableTemplates;
}
