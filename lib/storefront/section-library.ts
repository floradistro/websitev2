/**
 * Section Library - Shopify/Wix Style
 * Pre-built section templates vendors can add to any page
 */

export interface SectionTemplate {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: 'hero' | 'content' | 'features' | 'social' | 'cta';
  defaultContent: any;
  pageTypes: string[]; // Which pages can use this section
}

export const SECTION_LIBRARY: SectionTemplate[] = [
  {
    key: 'hero',
    name: 'Hero Banner',
    description: 'Large header with headline, subheadline, and CTA buttons',
    icon: '',
    category: 'hero',
    pageTypes: ['home', 'shop', 'about', 'contact'],
    defaultContent: {
      headline: 'Your Headline Here',
      subheadline: 'A compelling subheadline that describes your value proposition',
      cta_primary: {
        text: 'Get Started',
        link: '/shop'
      },
      cta_secondary: {
        text: 'Learn More',
        link: '/about'
      },
      background_color: '#000000',
      overlay_opacity: 0.6,
      text_alignment: 'center'
    }
  },
  {
    key: 'process',
    name: 'Process Timeline',
    description: 'Show your process or workflow as visual steps',
    icon: '',
    category: 'features',
    pageTypes: ['home', 'shop', 'about'],
    defaultContent: {
      headline: 'How It Works',
      subheadline: 'Simple, fast, reliable',
      background_color: '#0a0a0a',
      steps: [
        { title: 'Step 1', description: 'First step description', icon: '1️⃣' },
        { title: 'Step 2', description: 'Second step description', icon: '2️⃣' },
        { title: 'Step 3', description: 'Third step description', icon: '3️⃣' },
        { title: 'Step 4', description: 'Fourth step description', icon: '4️⃣' }
      ]
    }
  },
  {
    key: 'about_story',
    name: 'Brand Story',
    description: 'Tell your brand story with rich text and images',
    icon: '',
    category: 'content',
    pageTypes: ['home', 'shop', 'about'],
    defaultContent: {
      headline: 'Our Story',
      paragraphs: [
        'We started with a simple mission: to deliver the freshest products directly to your door.',
        'Today, we work with the best suppliers across the country to bring you premium quality at fair prices.',
        'Every product is hand-selected, lab-tested, and delivered with care.'
      ],
      background_color: '#000000',
      image_url: null
    }
  },
  {
    key: 'differentiators',
    name: 'Key Features',
    description: 'Highlight what makes you different with icon cards',
    icon: '',
    category: 'features',
    pageTypes: ['home', 'shop', 'about'],
    defaultContent: {
      headline: 'Why Choose Us',
      subheadline: 'The difference is in the details',
      background_color: '#0a0a0a',
      features: [
        {
          title: 'Fast Shipping',
          description: 'Order before 2PM for same-day shipping',
          icon: '🚚'
        },
        {
          title: 'Lab Tested',
          description: 'Third-party testing on all products',
          icon: '🔬'
        },
        {
          title: 'Sustainably Sourced',
          description: 'We work with eco-conscious suppliers',
          icon: '🌱'
        },
        {
          title: 'Premium Quality',
          description: 'Hand-selected products only',
          icon: '✨'
        }
      ]
    }
  },
  {
    key: 'stats',
    name: 'Statistics',
    description: 'Show impressive numbers with animated counters',
    icon: '',
    category: 'social',
    pageTypes: ['home', 'shop', 'about'],
    defaultContent: {
      headline: 'By The Numbers',
      background_color: '#000000',
      stats: [
        { number: '15K+', label: 'Happy Customers' },
        { number: '99.9%', label: 'Purity' },
        { number: '100%', label: 'Lab Tested' },
        { number: '<48h', label: 'Shipping' }
      ]
    }
  },
  {
    key: 'reviews',
    name: 'Customer Reviews',
    description: 'Display customer testimonials and ratings',
    icon: '',
    category: 'social',
    pageTypes: ['home'],
    defaultContent: {
      headline: 'What Customers Say',
      subheadline: 'Real reviews from real customers',
      background_color: '#0a0a0a',
      show_real_reviews: true,
      fallback_reviews: [
        {
          name: 'Sarah M.',
          rating: 5,
          quote: 'The quality is exceptional. Finally found a brand I trust completely.',
          product: 'Blue Dream',
          verified: true
        },
        {
          name: 'Michael R.',
          rating: 5,
          quote: 'Clean, consistent, reliable. Everything I look for.',
          product: 'OG Kush',
          verified: true
        }
      ]
    }
  },
  {
    key: 'faq',
    name: 'FAQ',
    description: 'Frequently asked questions with expandable answers',
    icon: '',
    category: 'content',
    pageTypes: ['home', 'faq'],
    defaultContent: {
      headline: 'Frequently Asked Questions',
      subheadline: 'Everything you need to know',
      background_color: '#000000',
      questions: [
        {
          question: 'How long does shipping take?',
          answer: 'Orders placed before 2PM ship same day. Most orders arrive within 2-3 business days.'
        },
        {
          question: 'Do you offer free shipping?',
          answer: 'Yes! Free shipping on all orders over $45.'
        },
        {
          question: 'Are your products lab tested?',
          answer: 'Every product is third-party lab tested for purity and potency. Lab results available upon request.'
        }
      ]
    }
  },
  {
    key: 'cta',
    name: 'Call to Action',
    description: 'Strong call-to-action section to drive conversions',
    icon: '',
    category: 'cta',
    pageTypes: ['home', 'shop', 'about', 'contact'],
    defaultContent: {
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of satisfied customers',
      background_color: '#000000',
      cta_button: {
        text: 'Shop Now',
        link: '/shop'
      },
      style: 'centered' // centered, split, minimal
    }
  },
  {
    key: 'product_grid',
    name: 'Product Grid Header',
    description: 'Header section above product listings',
    icon: '',
    category: 'content',
    pageTypes: ['shop'],
    defaultContent: {
      headline: 'Shop All Products',
      subheadline: 'Browse our complete collection',
      show_filters: true,
      columns: 3
    }
  },
  {
    key: 'footer',
    name: 'Footer',
    description: 'Site footer with links, social, and contact info',
    icon: '',
    category: 'content',
    pageTypes: ['global'],
    defaultContent: {
      tagline: 'Your tagline here',
      show_social: true,
      show_links: true,
      copyright_text: '© 2025 Your Store. All rights reserved.'
    }
  },
  {
    key: 'shop_config',
    name: 'Shop Layout Settings',
    description: 'Configure product grid, cards, and filters',
    icon: '',
    category: 'settings',
    pageTypes: ['shop'],
    defaultContent: {
      // Page Header
      page_title: 'Shop All Products',
      page_subtitle: 'Premium quality, delivered fresh',
      
      // Layout
      grid_columns: 3,
      grid_columns_mobile: 2,
      grid_gap: 'md',
      
      // Card Container
      card_bg: '#000000',
      card_padding: 'md',
      card_radius: 'lg',
      card_border_width: '0',
      card_border_color: '#ffffff',
      card_hover_bg: '#1a1a1a',
      
      // Product Image
      image_aspect: 'square',
      image_bg: '#000000',
      image_fit: 'contain',
      image_padding: 'none',
      image_inset: 'none',
      image_spacing: 'md',
      image_radius: 'lg',
      image_border_width: '0',
      image_border_color: '#ffffff',
      
      // Product Info
      info_bg: '#000000',
      info_padding: 'md',
      name_color: '#ffffff',
      price_color: '#ffffff',
      field_label_color: '#737373',
      field_value_color: '#a3a3a3',
      
      // Display Options
      show_quick_add: true,
      show_stock_badge: true,
      show_pricing_tiers: true,
      show_product_fields: true,
      show_hover_overlay: true,
      show_categories: true,
      show_location_filter: true,
      show_sort: true
    }
  }
];

/**
 * Get sections available for a specific page type
 */
export function getSectionsForPage(pageType: string): SectionTemplate[] {
  return SECTION_LIBRARY.filter(section => 
    section.pageTypes.includes(pageType) || section.pageTypes.includes('all')
  );
}

/**
 * Get default content for a section
 */
export function getDefaultSectionContent(sectionKey: string): any {
  const section = SECTION_LIBRARY.find(s => s.key === sectionKey);
  return section ? section.defaultContent : {};
}

/**
 * Get section metadata
 */
export function getSectionMeta(sectionKey: string): SectionTemplate | undefined {
  return SECTION_LIBRARY.find(s => s.key === sectionKey);
}

