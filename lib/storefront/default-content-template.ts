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
        background_color: '#000000',
        text_color: '#FFFFFF',
        overlay_opacity: 0
      }
    },
    {
      section_key: 'process',
      section_order: 2,
      is_enabled: true,
      content_data: {
        headline: 'How It Works',
        subheadline: 'Simple, fast, reliable',
        steps: [
          { icon: 'search', title: 'Browse', description: 'Explore our selection' },
          { icon: 'check', title: 'Select', description: 'Choose your products' },
          { icon: 'package', title: 'Order', description: 'Secure checkout' },
          { icon: 'truck', title: 'Receive', description: 'Fast delivery' }
        ],
        background_color: '#000000',
        text_color: '#FFFFFF'
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
        background_color: '#000000'
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
        background_color: '#000000'
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
        background_color: '#000000'
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
        background_color: '#000000',
        text_color: '#FFFFFF'
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
        background_color: '#000000'
      }
    },
    {
      section_key: 'footer',
      section_order: 8,
      is_enabled: true,
      content_data: {
        compliance_text: 'All products comply with applicable regulations.',
        restricted_states: 'Shipping restrictions may apply in certain states.',
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
        background_color: '#000000'
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
        background_color: '#000000'
      }
    },
    {
      section_key: 'differentiators',
      section_order: 3,
      is_enabled: true,
      content_data: {
        headline: 'Why Choose Us',
        items: [
          { title: 'Quality', description: 'Premium products you can trust' },
          { title: 'Service', description: 'Exceptional customer support' },
          { title: 'Speed', description: 'Fast and reliable delivery' },
          { title: 'Value', description: 'Competitive pricing' }
        ],
        background_color: '#000000'
      }
    },
    {
      section_key: 'stats',
      section_order: 4,
      is_enabled: true,
      content_data: {
        stats: [
          { number: '1000+', label: 'Customers' },
          { number: '100%', label: 'Satisfaction' },
          { number: '24/7', label: 'Support' },
          { number: '5★', label: 'Rated' }
        ],
        background_color: '#000000'
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
        background_color: '#000000'
      }
    },
    {
      section_key: 'footer',
      section_order: 6,
      is_enabled: true,
      content_data: {
        compliance_text: 'All products comply with applicable regulations.',
        restricted_states: 'Shipping restrictions may apply in certain states.',
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
  ],
  contact: [
    {
      section_key: 'hero',
      section_order: 1,
      is_enabled: true,
      content_data: {
        headline: 'Contact Us',
        description: 'Get in touch with our team',
        background_color: '#000000'
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
        background_color: '#000000'
      }
    },
    {
      section_key: 'footer',
      section_order: 3,
      is_enabled: true,
      content_data: {
        compliance_text: 'All products comply with applicable regulations.',
        restricted_states: 'Shipping restrictions may apply in certain states.',
        show_powered_by: false,
        custom_footer_text: '© 2025 [Store Name]. All rights reserved.',
        footer_links: [
          { title: 'Privacy Policy', url: '/privacy' },
          { title: 'Terms of Service', url: '/terms' },
          { title: 'Contact', url: '/contact' }
        ]
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
          { question: 'How do I place an order?', answer: 'Browse our products and add items to your cart. Click checkout when ready.' },
          { question: 'What are your shipping options?', answer: 'We offer standard and express shipping. Delivery times vary by location.' },
          { question: 'Do you accept returns?', answer: 'Yes, we accept returns within 30 days of purchase. Items must be unopened.' },
          { question: 'How can I track my order?', answer: 'You will receive a tracking number via email once your order ships.' },
          { question: 'Do you offer customer support?', answer: 'Yes, our support team is available via email and phone during business hours.' }
        ],
        background_color: '#000000'
      }
    },
    {
      section_key: 'footer',
      section_order: 2,
      is_enabled: true,
      content_data: {
        compliance_text: 'All products comply with applicable regulations.',
        restricted_states: 'Shipping restrictions may apply in certain states.',
        show_powered_by: false,
        custom_footer_text: '© 2025 [Store Name]. All rights reserved.',
        footer_links: [
          { title: 'Privacy Policy', url: '/privacy' },
          { title: 'Terms of Service', url: '/terms' },
          { title: 'FAQ', url: '/faq' }
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

