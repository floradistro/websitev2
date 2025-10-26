"use strict";
/**
 * COMPLETE Smart Component Registry for AI Agent
 * Every page, every component, every prop - 100% coverage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WHALETOOLS_DESIGN_SYSTEM = exports.COMPLETE_PAGE_STRUCTURE = exports.COMPLETE_SMART_COMPONENT_REGISTRY = void 0;
exports.COMPLETE_SMART_COMPONENT_REGISTRY = {
    // ============================================================================
    // LAYOUT COMPONENTS (Required on ALL pages)
    // ============================================================================
    smart_header: {
        component_key: 'smart_header',
        description: 'Luxury navigation header with vendor branding, categories dropdown, cart, search',
        auto_wires: ['vendorId', 'vendorSlug', 'vendorName', 'vendorLogo'],
        page_type: 'all',
        section_key: 'header',
        section_order: -1,
        required: true,
        props: {
            backgroundColor: 'string (default: "bg-black/95 backdrop-blur-xl")',
            textColor: 'string (default: "text-white/60")',
            showSearch: 'boolean (default: true)',
            showCart: 'boolean (default: true)',
            showAccount: 'boolean (default: true)',
            sticky: 'boolean (default: true)',
            navLinks: 'array of {label, href, showDropdown?}'
        },
        best_practices: 'Always include. Auto-fetches categories from database for dropdown.'
    },
    smart_footer: {
        component_key: 'smart_footer',
        description: 'Luxury footer with links, social, legal compliance, copyright',
        auto_wires: ['vendorId', 'vendorSlug', 'vendorName', 'vendorLogo'],
        page_type: 'all',
        section_key: 'footer',
        section_order: 999,
        required: true,
        props: {
            columns: 'array of {title, links: [{label, href}]}',
            instagramUrl: 'string (optional)',
            facebookUrl: 'string (optional)',
            twitterUrl: 'string (optional)',
            showLegalCompliance: 'boolean (default: true)',
            legalText1: 'string (cannabis compliance)',
            legalText2: 'string (shipping restrictions)',
            showCopyright: 'boolean (default: true)',
            showPoweredBy: 'boolean (default: true)'
        },
        best_practices: 'Always include. Auto-styled with WhaleTools luxury theme.'
    },
    // ============================================================================
    // HOMEPAGE COMPONENTS
    // ============================================================================
    smart_features: {
        component_key: 'smart_features',
        description: 'Animated "Why Choose Us" section with luxury cards and icons',
        page_type: 'home',
        section_key: 'how_it_works',
        props: {
            headline: 'string (e.g., "WHY CHOOSE US")',
            subheadline: 'string (optional)',
            features: 'array of {icon, title, description}',
            animate: 'boolean (default: true)'
        },
        best_practices: 'Use for trust-building. Features like "Lab Tested", "Fast Delivery", "Discreet", "Premium Quality"'
    },
    smart_product_grid: {
        component_key: 'smart_product_grid',
        description: 'Auto-fetches and displays products from database with luxury styling',
        auto_wires: ['vendorId'],
        page_type: ['home', 'shop'],
        section_key: 'featured_products',
        props: {
            selectedProductIds: 'array of UUIDs (optional - filter specific products)',
            selectedCategoryIds: 'array of UUIDs (optional - filter by category)',
            headline: 'string (e.g., "FEATURED PRODUCTS")',
            subheadline: 'string (optional)',
            maxProducts: 'number (default: 12)',
            columns: 'number (default: 3)',
            showPrice: 'boolean (default: true)',
            showQuickAdd: 'boolean (default: true)',
            cardStyle: '"minimal" | "bordered" | "elevated"'
        },
        best_practices: 'Always include on homepage. Fetches real products automatically.'
    },
    smart_faq: {
        component_key: 'smart_faq',
        description: 'Animated accordion FAQ with vendor logo and luxury styling',
        auto_wires: ['vendorId', 'vendorName', 'vendorLogo'],
        page_type: ['home', 'faq'],
        section_key: 'faq_items',
        props: {
            headline: 'string (e.g., "FREQUENTLY ASKED QUESTIONS")',
            subheadline: 'string (optional)',
            faqs: 'array of {question, answer}',
            animate: 'boolean (default: true)'
        },
        best_practices: 'Include on homepage for trust. Full page available at /faq'
    },
    // ============================================================================
    // SHOP PAGE COMPONENTS
    // ============================================================================
    smart_shop_controls: {
        component_key: 'smart_shop_controls',
        description: 'Filter controls (category, location, sort) for shop page',
        auto_wires: ['vendorId'],
        page_type: 'shop',
        section_key: 'shop_config',
        props: {
            onCategoryChange: 'callback (optional)',
            onSortChange: 'callback (optional)',
            onLocationChange: 'callback (optional)'
        },
        best_practices: 'Required for /shop page. Auto-fetches categories and locations.'
    },
    // ============================================================================
    // PRODUCT DETAIL PAGE COMPONENT
    // ============================================================================
    smart_product_detail: {
        component_key: 'smart_product_detail',
        description: 'Complete product page with images, pricing, fields, COA, add to cart',
        auto_wires: ['vendorId', 'vendorSlug'],
        page_type: 'product',
        section_key: 'product_detail',
        props: {
            productSlug: 'string (extracted from URL)',
            showGallery: 'boolean (default: true)',
            showPricingTiers: 'boolean (default: true)',
            showFields: 'boolean (default: true)',
            showAddToCart: 'boolean (default: true)',
            showBreadcrumbs: 'boolean (default: true)',
            showWishlistButton: 'boolean (default: true)',
            showShareButton: 'boolean (default: true)',
            showLabResults: 'boolean (default: true)',
            showRelatedProducts: 'boolean (default: false)'
        },
        best_practices: 'Required for /products/[slug] page. Fetches product data automatically.'
    },
    // ============================================================================
    // ABOUT PAGE COMPONENT
    // ============================================================================
    smart_about: {
        component_key: 'smart_about',
        description: 'About page with mission, story, values, and vendor logo',
        auto_wires: ['vendorId', 'vendorName', 'vendorLogo'],
        page_type: 'about',
        section_key: 'about',
        props: {
            headline: 'string (e.g., "ABOUT [VENDOR NAME]")',
            subheadline: 'string (e.g., "Premium Cannabis, Delivered with Care")',
            mission: 'string (mission statement)',
            story: 'string (brand story)',
            values: 'array of {title, description}',
            animate: 'boolean (default: true)'
        },
        best_practices: 'Required for /about page. Use vendor-specific content.'
    },
    // ============================================================================
    // CONTACT PAGE COMPONENT
    // ============================================================================
    smart_contact: {
        component_key: 'smart_contact',
        description: 'Contact page with form, info cards, and vendor logo',
        auto_wires: ['vendorId', 'vendorName', 'vendorLogo'],
        page_type: 'contact',
        section_key: 'contact_info',
        props: {
            headline: 'string (e.g., "CONTACT US")',
            subheadline: 'string (e.g., "Questions? We\'re here to help")',
            email: 'string (support email)',
            phone: 'string (phone number)',
            address: 'string (physical address)',
            hours: 'string (business hours)',
            showForm: 'boolean (default: true)',
            animate: 'boolean (default: true)'
        },
        best_practices: 'Required for /contact page. Include real contact info.'
    },
    // ============================================================================
    // LEGAL PAGES COMPONENT (Privacy, Terms, Cookies)
    // ============================================================================
    smart_legal_page: {
        component_key: 'smart_legal_page',
        description: 'Reusable legal page component for Privacy, Terms, Cookies',
        auto_wires: ['vendorId', 'vendorName', 'vendorLogo'],
        page_type: ['privacy', 'terms', 'cookies'],
        section_key: 'legal',
        props: {
            headline: 'string (e.g., "PRIVACY POLICY")',
            subheadline: 'string (e.g., "Last Updated: [date]")',
            pageType: '"privacy" | "terms" | "cookies"',
            content: 'array of {heading, body} sections',
            lastUpdated: 'string (date)',
            animate: 'boolean (default: true)'
        },
        best_practices: 'Use for /privacy, /terms, /cookies pages. Include actual legal content.'
    },
    // ============================================================================
    // SHIPPING PAGE COMPONENT
    // ============================================================================
    smart_shipping: {
        component_key: 'smart_shipping',
        description: 'Shipping & delivery information page with vendor logo',
        auto_wires: ['vendorId', 'vendorName', 'vendorLogo'],
        page_type: 'shipping',
        section_key: 'shipping',
        props: {
            headline: 'string (e.g., "SHIPPING & DELIVERY")',
            subheadline: 'string (e.g., "Fast, discreet, and reliable")',
            deliveryOptions: 'array of {name, price, time, description}',
            shippingInfo: 'string (general shipping information)',
            animate: 'boolean (default: true)'
        },
        best_practices: 'Required for /shipping page. Include real shipping details.'
    },
    // ============================================================================
    // RETURNS PAGE COMPONENT
    // ============================================================================
    smart_returns: {
        component_key: 'smart_returns',
        description: 'Returns & refunds policy page with vendor logo',
        auto_wires: ['vendorId', 'vendorName', 'vendorLogo'],
        page_type: 'returns',
        section_key: 'returns',
        props: {
            headline: 'string (e.g., "RETURNS & REFUNDS")',
            subheadline: 'string (e.g., "Your satisfaction is our priority")',
            returnPolicy: 'string (return policy text)',
            process: 'array of {step, description}',
            timeframe: 'string (e.g., "30 days")',
            animate: 'boolean (default: true)'
        },
        best_practices: 'Required for /returns page. Include actual return policy.'
    },
    // ============================================================================
    // LAB RESULTS PAGE COMPONENT
    // ============================================================================
    smart_lab_results: {
        component_key: 'smart_lab_results',
        description: 'Lab results page with COA PDFs from Supabase storage',
        auto_wires: ['vendorId', 'vendorName', 'vendorLogo'],
        page_type: 'lab-results',
        section_key: 'lab_results',
        props: {
            headline: 'string (e.g., "LAB RESULTS")',
            subheadline: 'string (e.g., "Third-party tested. Full transparency.")',
            coaFiles: 'array of COA file objects (server-side fetched)',
            animate: 'boolean (default: true)'
        },
        best_practices: 'Required for /lab-results page. COA files auto-fetched from storage bucket.'
    },
    // ============================================================================
    // ADDITIONAL SMART COMPONENTS
    // ============================================================================
    smart_location_map: {
        component_key: 'smart_location_map',
        description: 'Auto-fetches and displays vendor locations with map integration',
        auto_wires: ['vendorId'],
        page_type: ['home', 'locations'],
        section_key: 'locations',
        props: {
            selectedLocationIds: 'array of UUIDs (optional)',
            headline: 'string (e.g., "FIND US")',
            subheadline: 'string (optional)',
            showMap: 'boolean (default: false)',
            showDirections: 'boolean (default: true)',
            columns: 'number (default: 3)'
        },
        best_practices: 'Include if vendor has locations. Auto-fetches from database.'
    },
    smart_testimonials: {
        component_key: 'smart_testimonials',
        description: 'Auto-fetches customer reviews from database',
        auto_wires: ['vendorId'],
        page_type: 'home',
        section_key: 'reviews',
        props: {
            productId: 'string (optional - for product-specific reviews)',
            limit: 'number (default: 6)',
            minRating: 'number (default: 1)',
            layout: '"grid" | "carousel"',
            showProductName: 'boolean (default: true)'
        },
        best_practices: 'Include for social proof. Handles 0 reviews gracefully.'
    },
    smart_category_nav: {
        component_key: 'smart_category_nav',
        description: 'Auto-generated category navigation',
        auto_wires: ['vendorId'],
        page_type: 'home',
        props: {
            selectedCategoryIds: 'array of UUIDs (optional)',
            headline: 'string (optional)',
            showProductCounts: 'boolean (default: true)',
            layout: '"horizontal" | "vertical" | "grid"'
        },
        best_practices: 'Use for category browsing.'
    },
    smart_product_showcase: {
        component_key: 'smart_product_showcase',
        description: 'Hero-style product showcase with filters',
        auto_wires: ['vendorId'],
        page_type: 'home',
        props: {
            filter: '"featured" | "newest" | "bestsellers" | "sale"',
            categoryIds: 'array of UUIDs (optional)',
            headline: 'string (optional)',
            subheadline: 'string (optional)',
            limit: 'number (default: 8)',
            layout: '"grid" | "carousel"',
            columns: 'number (default: 4)',
            showFilters: 'boolean (default: false)'
        },
        best_practices: 'Alternative to smart_product_grid for hero sections.'
    },
    smart_stats_counter: {
        component_key: 'smart_stats_counter',
        description: 'Animated stats counter for credibility',
        props: {
            stats: 'array of {label, value, suffix, prefix}',
            animate: 'boolean (default: true)',
            layout: '"horizontal" | "grid"'
        },
        best_practices: 'Use for social proof (e.g., "500+ Products", "10K+ Customers")'
    }
};
// ============================================================================
// COMPLETE PAGE STRUCTURE FOR AI AGENT
// ============================================================================
exports.COMPLETE_PAGE_STRUCTURE = {
    home: {
        path: '/storefront?vendor=X',
        page_type: 'home',
        required_sections: ['header', 'hero', 'featured_products', 'footer'],
        recommended_sections: ['how_it_works', 'locations', 'reviews', 'faq_items'],
        components: [
            'smart_header (section_order: -1)',
            'smart_features (Why Choose Us)',
            'smart_product_grid (Featured Products)',
            'smart_faq (FAQ)',
            'smart_footer (section_order: 999)'
        ]
    },
    shop: {
        path: '/storefront/shop?vendor=X',
        page_type: 'shop',
        required_sections: ['header', 'shop_config', 'featured_products', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_shop_controls (Filters & Sort)',
            'smart_product_grid (All Products)',
            'smart_footer (section_order: 999)'
        ]
    },
    product_detail: {
        path: '/storefront/products/[slug]?vendor=X',
        page_type: 'product',
        required_sections: ['header', 'product_detail', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_product_detail (Full Product Page)',
            'smart_footer (section_order: 999)'
        ]
    },
    about: {
        path: '/storefront/about?vendor=X',
        page_type: 'about',
        required_sections: ['header', 'about', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_about (About Page)',
            'smart_footer (section_order: 999)'
        ]
    },
    contact: {
        path: '/storefront/contact?vendor=X',
        page_type: 'contact',
        required_sections: ['header', 'contact_info', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_contact (Contact Page)',
            'smart_footer (section_order: 999)'
        ]
    },
    faq: {
        path: '/storefront/faq?vendor=X',
        page_type: 'faq',
        required_sections: ['header', 'faq_items', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_faq (FAQ Page)',
            'smart_footer (section_order: 999)'
        ]
    },
    lab_results: {
        path: '/storefront/lab-results?vendor=X',
        page_type: 'lab-results',
        required_sections: ['header', 'lab_results', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_lab_results (Lab Results with COA PDFs)',
            'smart_footer (section_order: 999)'
        ]
    },
    privacy: {
        path: '/storefront/privacy?vendor=X',
        page_type: 'privacy',
        required_sections: ['header', 'legal', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_legal_page (pageType: "privacy")',
            'smart_footer (section_order: 999)'
        ]
    },
    terms: {
        path: '/storefront/terms?vendor=X',
        page_type: 'terms',
        required_sections: ['header', 'legal', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_legal_page (pageType: "terms")',
            'smart_footer (section_order: 999)'
        ]
    },
    cookies: {
        path: '/storefront/cookies?vendor=X',
        page_type: 'cookies',
        required_sections: ['header', 'legal', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_legal_page (pageType: "cookies")',
            'smart_footer (section_order: 999)'
        ]
    },
    shipping: {
        path: '/storefront/shipping?vendor=X',
        page_type: 'shipping',
        required_sections: ['header', 'shipping', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_shipping (Shipping Info)',
            'smart_footer (section_order: 999)'
        ]
    },
    returns: {
        path: '/storefront/returns?vendor=X',
        page_type: 'returns',
        required_sections: ['header', 'returns', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            'smart_returns (Returns Policy)',
            'smart_footer (section_order: 999)'
        ]
    },
    cart: {
        path: '/storefront/cart?vendor=X',
        page_type: 'cart',
        required_sections: ['header', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            '(cart is handled by built-in cart component)',
            'smart_footer (section_order: 999)'
        ]
    },
    login: {
        path: '/storefront/login?vendor=X',
        page_type: 'login',
        required_sections: ['header', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            '(login is handled by built-in auth component)',
            'smart_footer (section_order: 999)'
        ]
    },
    register: {
        path: '/storefront/register?vendor=X',
        page_type: 'register',
        required_sections: ['header', 'footer'],
        components: [
            'smart_header (section_order: -1)',
            '(register is handled by built-in auth component)',
            'smart_footer (section_order: 999)'
        ]
    }
};
// ============================================================================
// WHALETOOLS DESIGN SYSTEM (MANDATORY)
// ============================================================================
exports.WHALETOOLS_DESIGN_SYSTEM = {
    colors: {
        background: 'bg-black or bg-[#0a0a0a]',
        borders: 'border-white/5 hover:border-white/10',
        text_heading: 'text-white',
        text_body: 'text-white/60',
        text_label: 'text-white/40'
    },
    typography: {
        headings: 'font-black uppercase tracking-tight (font-weight: 900)',
        body: 'text-white/60 leading-relaxed',
        labels: 'text-white/40 uppercase tracking-[0.15em]'
    },
    spacing: {
        rounded: 'rounded-2xl (iOS 26 style)',
        section_padding: 'py-16 sm:py-20 px-4 sm:px-6',
        card_padding: 'p-6 sm:p-8'
    },
    animations: {
        library: 'Framer Motion',
        easing: '[0.22, 1, 0.36, 1]',
        duration: '0.6s',
        scroll_trigger: 'react-intersection-observer'
    }
};
