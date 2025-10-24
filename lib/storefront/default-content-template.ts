// Default content template - Given to ALL new vendors
// This is the "blank slate" that vendors customize

export const DEFAULT_CONTENT_TEMPLATE = {
  home: [
    {
      section_key: 'hero',
      section_order: 1,
      is_enabled: true,
      content_data: {
        headline: 'Welcome to [Store Name]',
        subheadline: 'Your tagline goes here',
        cta_primary: { text: 'Shop Now', link: '/shop' },
        cta_secondary: { text: 'Learn More', link: '/about' },
        background_type: 'solid',
        background_color: '#f9fafb',
        text_color: '#111827',
        overlay_opacity: 0
      }
    },
    {
      section_key: 'process',
      section_order: 2,
      is_enabled: true,
      content_data: {
        headline: 'How It Works',
        subheadline: 'Your process description',
        steps: [
          { icon: 'search', title: 'Step 1', description: 'Describe your first step' },
          { icon: 'check', title: 'Step 2', description: 'Describe your second step' },
          { icon: 'package', title: 'Step 3', description: 'Describe your third step' },
          { icon: 'truck', title: 'Step 4', description: 'Describe your final step' }
        ],
        background_color: '#ffffff',
        text_color: '#111827'
      }
    },
    {
      section_key: 'locations',
      section_order: 3,
      is_enabled: true,
      content_data: {
        headline: 'Our Locations',
        subheadline: 'Visit us in person',
        show_from_database: true,
        background_color: '#f9fafb'
      }
    },
    {
      section_key: 'featured_products',
      section_order: 4,
      is_enabled: true,
      content_data: {
        headline: 'Featured Products',
        products_count: 12,
        cta_text: 'View all',
        cta_link: '/shop',
        background_color: '#ffffff'
      }
    },
    {
      section_key: 'reviews',
      section_order: 5,
      is_enabled: true,
      content_data: {
        headline: 'What Our Customers Say',
        show_count: true,
        max_display: 6,
        layout: 'grid',
        background_color: '#f9fafb'
      }
    },
    {
      section_key: 'about_story',
      section_order: 6,
      is_enabled: true,
      content_data: {
        headline: 'About [Store Name]',
        paragraphs: [
          'Tell your customers about your business and what makes you unique.',
          'Share your story, mission, and values.',
          'This is your chance to connect with your audience.'
        ],
        cta_text: 'Learn more',
        cta_link: '/about',
        background_color: '#ffffff',
        text_color: '#111827'
      }
    },
    {
      section_key: 'shipping_badges',
      section_order: 7,
      is_enabled: true,
      content_data: {
        badges: [
          { icon: 'truck', title: 'Free Shipping', description: 'On orders over $50' },
          { icon: 'shield', title: 'Secure Checkout', description: 'Safe and encrypted' }
        ],
        background_color: '#ffffff'
      }
    }
  ],
  about: [
    {
      section_key: 'hero',
      section_order: 1,
      is_enabled: true,
      content_data: {
        headline: 'About [Store Name]',
        subheadline: 'Learn more about who we are',
        image_type: 'logo',
        background_color: '#f9fafb'
      }
    },
    {
      section_key: 'story',
      section_order: 2,
      is_enabled: true,
      content_data: {
        intro: 'Our Story',
        paragraphs: [
          'Add your company history and background here.',
          'Explain what makes your business special and why customers should choose you.',
          'Share your values, mission, and vision for the future.'
        ],
        background_color: '#ffffff'
      }
    },
    {
      section_key: 'differentiators',
      section_order: 3,
      is_enabled: true,
      content_data: {
        headline: 'Why Choose Us',
        items: [
          { title: 'Feature 1', description: 'Describe your first key benefit' },
          { title: 'Feature 2', description: 'Describe your second key benefit' },
          { title: 'Feature 3', description: 'Describe your third key benefit' },
          { title: 'Feature 4', description: 'Describe your fourth key benefit' }
        ],
        background_color: '#f9fafb'
      }
    },
    {
      section_key: 'stats',
      section_order: 4,
      is_enabled: true,
      content_data: {
        stats: [
          { number: '---', label: 'Your Stat 1' },
          { number: '---', label: 'Your Stat 2' },
          { number: '---', label: 'Your Stat 3' },
          { number: '---', label: 'Your Stat 4' }
        ],
        background_color: '#ffffff'
      }
    },
    {
      section_key: 'cta',
      section_order: 5,
      is_enabled: true,
      content_data: {
        headline: 'Ready to Get Started?',
        description: 'Explore our products',
        button_text: 'Shop Now',
        button_link: '/shop',
        background_color: '#f9fafb'
      }
    }
  ],
  contact: [
    {
      section_key: 'hero',
      section_order: 1,
      is_enabled: true,
      content_data: {
        headline: 'Contact Us',
        description: 'Get in touch with our team',
        background_color: '#f9fafb'
      }
    },
    {
      section_key: 'contact_info',
      section_order: 2,
      is_enabled: true,
      content_data: {
        show_email: true,
        show_phone: true,
        show_hours: true,
        custom_hours: 'Add your business hours',
        show_locations: true,
        show_social: true,
        background_color: '#ffffff'
      }
    }
  ],
  faq: [
    {
      section_key: 'faq_items',
      section_order: 1,
      is_enabled: true,
      content_data: {
        headline: 'Frequently Asked Questions',
        items: [
          { question: 'Your question here?', answer: 'Add your answer here. Be clear and helpful.' },
          { question: 'Another common question?', answer: 'Provide a detailed answer.' },
          { question: 'Question about shipping?', answer: 'Explain your shipping policy.' },
          { question: 'Returns and refunds?', answer: 'Describe your return policy.' },
          { question: 'How to contact support?', answer: 'Provide contact information.' }
        ],
        background_color: '#f9fafb'
      }
    }
  ],
  global: [
    {
      section_key: 'footer',
      section_order: 1,
      is_enabled: true,
      content_data: {
        compliance_text: 'Add compliance or legal text here.',
        restricted_states: 'Add shipping restrictions if applicable.',
        show_powered_by: false,
        custom_footer_text: '© 2025 [Store Name]. All rights reserved.',
        footer_links: [
          { title: 'Privacy Policy', url: '/privacy' },
          { title: 'Terms of Service', url: '/terms' },
          { title: 'Shipping', url: '/shipping' },
          { title: 'Returns', url: '/returns' }
        ]
      }
    }
  ]
};

/**
 * Personalize default content for a specific vendor
 */
export function personalizeDefaultContent(vendorName: string) {
  const template = JSON.parse(JSON.stringify(DEFAULT_CONTENT_TEMPLATE));
  
  // Replace placeholders with vendor name
  const str = JSON.stringify(template);
  const personalized = str
    .replace(/\[Store Name\]/g, vendorName)
    .replace(/our store/g, vendorName)
    .replace(/Our store/g, vendorName);
  
  return JSON.parse(personalized);
}

/**
 * Get default sections for a specific page
 */
export function getDefaultPageSections(pageType: keyof typeof DEFAULT_CONTENT_TEMPLATE) {
  return DEFAULT_CONTENT_TEMPLATE[pageType] || [];
}

