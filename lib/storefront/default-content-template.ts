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
        subheadline: 'Premium products, delivered fast',
        cta_primary: { text: 'Shop Now', link: '/shop' },
        cta_secondary: { text: 'Learn More', link: '/about' },
        background_type: 'animation',
        background_color: '#000000',
        text_color: '#FFFFFF',
        overlay_opacity: 0.6
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
          { icon: 'leaf', title: 'Browse', description: 'Explore our premium selection' },
          { icon: 'flask', title: 'Verify', description: 'Lab-tested for quality and safety' },
          { icon: 'package', title: 'Order', description: 'Quick and secure checkout' },
          { icon: 'truck', title: 'Receive', description: 'Fast, discreet delivery' }
        ],
        background_color: '#0a0a0a',
        text_color: '#FFFFFF'
      }
    },
    {
      section_key: 'locations',
      section_order: 3,
      is_enabled: true,
      content_data: {
        headline: 'Visit Us',
        subheadline: 'Find a location near you',
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
        headline: 'Customer Reviews',
        show_count: true,
        max_display: 6,
        layout: 'grid',
        background_color: '#0a0a0a'
      }
    },
    {
      section_key: 'about_story',
      section_order: 6,
      is_enabled: true,
      content_data: {
        headline: 'Our Story',
        paragraphs: [
          'We are committed to providing the highest quality products.',
          'Every item is carefully selected and tested for your satisfaction.',
          'Experience the difference with [Store Name].'
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
          { icon: 'truck', title: 'Fast Shipping', description: 'Quick delivery to your door' },
          { icon: 'package', title: 'Easy Pickup', description: 'Order online, pick up today' }
        ],
        background_color: '#0a0a0a'
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
        subheadline: 'Your trusted source for premium products',
        image_type: 'logo',
        background_color: '#000000'
      }
    },
    {
      section_key: 'story',
      section_order: 2,
      is_enabled: true,
      content_data: {
        intro: 'Welcome to [Store Name]',
        paragraphs: [
          'We started with a simple mission: provide the best products to our customers.',
          'Today, we continue that commitment with every order.',
          'Thank you for choosing [Store Name].'
        ],
        background_color: '#0a0a0a'
      }
    },
    {
      section_key: 'differentiators',
      section_order: 3,
      is_enabled: true,
      content_data: {
        headline: 'Why Choose Us',
        items: [
          { title: 'Quality First', description: 'Every product meets our high standards' },
          { title: 'Fast Delivery', description: 'Quick shipping to your location' },
          { title: 'Trusted', description: 'Thousands of satisfied customers' },
          { title: 'Support', description: 'Here to help whenever you need' }
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
          { number: '1000+', label: 'Happy Customers' },
          { number: '100%', label: 'Quality Tested' },
          { number: '24/7', label: 'Support' },
          { number: '5⭐', label: 'Average Rating' }
        ],
        background_color: '#0a0a0a'
      }
    },
    {
      section_key: 'cta',
      section_order: 5,
      is_enabled: true,
      content_data: {
        headline: 'Ready to Get Started?',
        description: 'Browse our selection today',
        button_text: 'Shop Now',
        button_link: '/shop',
        background_color: '#000000'
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
        description: 'We\'re here to help',
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
        custom_hours: 'Open Daily 9AM - 9PM',
        show_locations: true,
        show_social: true,
        background_color: '#0a0a0a'
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
          { question: 'How do I place an order?', answer: 'Browse our products and add items to your cart. Proceed to checkout when ready.' },
          { question: 'What are your shipping options?', answer: 'We offer standard and express shipping. Delivery times vary by location.' },
          { question: 'Do you offer returns?', answer: 'Yes, we accept returns on unopened products within 30 days.' },
          { question: 'How can I track my order?', answer: 'You will receive a tracking number via email once your order ships.' },
          { question: 'Do you ship to my state?', answer: 'We ship to most states. See our shipping page for details.' }
        ],
        background_color: '#000000'
      }
    }
  ],
  global: [
    {
      section_key: 'footer',
      section_order: 1,
      is_enabled: true,
      content_data: {
        compliance_text: 'All products comply with applicable regulations.',
        restricted_states: 'Shipping restrictions may apply in certain states.',
        show_powered_by: true,
        custom_footer_text: null
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

