// Legacy templates system - deprecated
// Component Registry is now the standard for all storefronts
// This file exists only to prevent build errors in legacy code

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  isPremium: boolean;
}

export const AVAILABLE_TEMPLATES: TemplateMetadata[] = [
  {
    id: 'minimalist',
    name: 'Component Registry',
    description: 'Modern component-based architecture',
    preview_image: '',
    isPremium: false
  }
];

