"use strict";
/**
 * Wilson's Template
 * Ultra-minimal dark luxury design with iOS 26 water effects
 * Premium cannabis storefront with subtle animations & polish
 * Based on Vercel.com design + Yacht Club existing pages
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLIANCE_CONTENT = exports.VERCEL_CANNABIS_TEMPLATE = void 0;
exports.VERCEL_CANNABIS_TEMPLATE = {
    template_id: 'wilsons',
    name: "Wilson's Template",
    description: 'Dark luxury design with iOS 26 water ripples, subtle glow effects, and polished typography. Premium cannabis storefront.',
    design_system: {
        colors: {
            background: '#000000',
            text_primary: '#ffffff',
            text_secondary: 'rgba(255,255,255,0.6)',
            text_tertiary: 'rgba(255,255,255,0.4)',
            border: 'rgba(255,255,255,0.1)',
            hover: 'rgba(255,255,255,0.05)',
        },
        typography: {
            hero_headline: { size: 'xlarge', weight: '300', tracking: 'tight' },
            section_heading: { size: 'medium', weight: '400', tracking: 'wider', case: 'uppercase' },
            subheading: { size: 'medium', weight: '400' },
            body: { size: 'small', weight: '300', color: 'rgba(255,255,255,0.4)' },
            cta: { size: 'small', weight: '500', tracking: 'widest', case: 'uppercase' },
        },
        spacing: [12, 16, 24, 32, 40, 48, 60, 80],
        effects: {
            gradient_underline: { width: '24px', opacity: 0.3 },
            glow: 'subtle blur on hover',
            border_style: '1px solid rgba(255,255,255,0.1)',
        }
    },
    structure: {
        required_sections: ['header', 'hero', 'trust_badges', 'featured_products', 'how_it_works', 'reviews', 'footer'],
        optional_sections: ['about', 'faq', 'locations', 'education'],
        page_types: ['home', 'about', 'faq', 'privacy', 'terms', 'cookies', 'returns', 'shipping', 'contact']
    },
    all_pages: [
        {
            section_key: 'header',
            section_order: -1,
            page_type: 'all',
            components: [
                {
                    component_key: 'smart_header',
                    props: { show_logo: true, show_search: true, show_cart: true }
                }
            ]
        },
        {
            section_key: 'hero',
            section_order: 0,
            pattern: 'centered_minimal',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'image', props: { src: '{{vendor.logo_url}}', alt: '{{vendor.store_name}}', width: 140, object_fit: 'contain' } },
                { component_key: 'spacer', props: { height: 32 } },
                { component_key: 'text', props: { text: '{{vendor.store_name}}', size: 'xlarge', color: '#ffffff', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 24 } },
                { component_key: 'text', props: { text: '{{vendor.store_tagline}}', size: 'large', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 48 } },
                { component_key: 'button', props: { text: 'SHOP NOW', link: '/shop', style: 'primary', size: 'large' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        {
            section_key: 'trust_badges',
            section_order: 1,
            pattern: 'horizontal_features_4',
            components: [
                { component_key: 'spacer', props: { height: 60 } },
                { component_key: 'text', props: { text: 'WHY CHOOSE US', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 48 } },
                // Feature 1
                { component_key: 'icon', props: { name: 'shield-check', size: 32, color: 'rgba(255,255,255,0.6)' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'LAB TESTED', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 8 } },
                { component_key: 'text', props: { text: 'Third-party tested for purity', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                // Feature 2
                { component_key: 'icon', props: { name: 'truck', size: 32, color: 'rgba(255,255,255,0.6)' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'FAST DELIVERY', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 8 } },
                { component_key: 'text', props: { text: 'Same-day delivery available', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                // Feature 3
                { component_key: 'icon', props: { name: 'lock', size: 32, color: 'rgba(255,255,255,0.6)' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'DISCREET', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 8 } },
                { component_key: 'text', props: { text: 'Unmarked, odor-proof packaging', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                // Feature 4
                { component_key: 'icon', props: { name: 'star', size: 32, color: 'rgba(255,255,255,0.6)' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'PREMIUM', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 8 } },
                { component_key: 'text', props: { text: 'Curated from trusted growers', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 60 } }
            ]
        },
        {
            section_key: 'featured_products',
            section_order: 2,
            pattern: 'product_grid_or_coming_soon',
            components: [
                { component_key: 'spacer', props: { height: 60 } },
                { component_key: 'divider', props: { color: 'rgba(255,255,255,0.1)', thickness: 1 } },
                { component_key: 'spacer', props: { height: 60 } },
                { component_key: 'text', props: { text: 'FEATURED PRODUCTS', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 48 } },
                { component_key: 'smart_product_grid', props: { maxProducts: 12, columns: 4, showPrice: true, showQuickAdd: true, cardStyle: 'minimal' } },
                { component_key: 'spacer', props: { height: 60 } }
            ]
        },
        {
            section_key: 'how_it_works',
            section_order: 3,
            pattern: 'numbered_steps_3',
            components: [
                { component_key: 'spacer', props: { height: 60 } },
                { component_key: 'divider', props: { color: 'rgba(255,255,255,0.1)', thickness: 1 } },
                { component_key: 'spacer', props: { height: 60 } },
                { component_key: 'text', props: { text: 'HOW IT WORKS', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 48 } },
                // Step 1
                { component_key: 'badge', props: { text: '01', variant: 'default', size: 'medium' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'Browse Our Selection', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Explore premium cannabis products with detailed lab results', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                // Step 2
                { component_key: 'badge', props: { text: '02', variant: 'default', size: 'medium' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'Place Your Order', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Quick checkout with secure, encrypted payment processing', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                // Step 3
                { component_key: 'badge', props: { text: '03', variant: 'default', size: 'medium' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'Fast & Discreet Delivery', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Track in real-time. Arrives in unmarked packaging', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 60 } }
            ]
        },
        // About Page
        {
            section_key: 'about_hero',
            section_order: 0,
            page_type: 'about',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'text', props: { text: 'ABOUT {{vendor.store_name}}', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 48 } },
                { component_key: 'text', props: { text: 'Premium cannabis delivered with care and discretion', size: 'large', color: '#ffffff', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 32 } },
                { component_key: 'text', props: { text: 'We believe in quality, transparency, and exceptional service. Every product we offer is carefully selected from trusted growers and rigorously tested for your safety and satisfaction.', size: 'medium', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        {
            section_key: 'about_story',
            section_order: 1,
            page_type: 'about',
            components: [
                { component_key: 'spacer', props: { height: 60 } },
                { component_key: 'divider', props: { color: 'rgba(255,255,255,0.1)', thickness: 1 } },
                { component_key: 'spacer', props: { height: 60 } },
                { component_key: 'text', props: { text: 'OUR MISSION', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 32 } },
                { component_key: 'text', props: { text: 'To provide safe, legal access to premium cannabis products with the professionalism and care you deserve.', size: 'large', color: 'rgba(255,255,255,0.7)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 60 } }
            ]
        },
        {
            section_key: 'about_values',
            section_order: 2,
            page_type: 'about',
            components: [
                { component_key: 'spacer', props: { height: 60 } },
                { component_key: 'divider', props: { color: 'rgba(255,255,255,0.1)', thickness: 1 } },
                { component_key: 'spacer', props: { height: 60 } },
                { component_key: 'text', props: { text: 'OUR VALUES', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 48 } },
                { component_key: 'text', props: { text: 'QUALITY FIRST', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 8 } },
                { component_key: 'text', props: { text: 'We never compromise on quality. Every product meets our rigorous standards.', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 32 } },
                { component_key: 'text', props: { text: 'TRANSPARENCY', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 8 } },
                { component_key: 'text', props: { text: 'Full lab results, clear pricing, honest communication. No surprises.', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 32 } },
                { component_key: 'text', props: { text: 'CUSTOMER FIRST', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 8 } },
                { component_key: 'text', props: { text: 'Your satisfaction drives everything we do. We\'re here to serve you.', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // FAQ Page
        {
            section_key: 'faq_hero',
            section_order: 0,
            page_type: 'faq',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'text', props: { text: 'FREQUENTLY ASKED QUESTIONS', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 24 } },
                { component_key: 'text', props: { text: 'Everything you need to know', size: 'large', color: '#ffffff', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        {
            section_key: 'faq_items',
            section_order: 1,
            page_type: 'faq',
            components: [
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Q: How long does delivery take?', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'A: Same-day delivery for orders before 2 PM. Standard delivery is 1-2 business days. Track your order in real-time.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Q: Are your products lab tested?', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'A: Yes. Every product is third-party tested for potency, purity, pesticides, and contaminants. Lab certificates (COA) available for all items.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Q: Is delivery discreet?', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'A: Absolutely. All orders arrive in plain, unmarked, odor-proof packaging. Complete privacy guaranteed.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Q: What payment methods do you accept?', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'A: We accept all major credit/debit cards and approved digital payment methods. All transactions are secure and encrypted.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Q: Can I return products?', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'A: Unopened products can be returned within 30 days. Health regulations prevent returns of opened cannabis products.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Q: Do I need a medical card?', size: 'small', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'A: Requirements vary by state. Some require medical cards, others allow recreational purchases 21+. We verify eligibility at checkout.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Contact Page
        {
            section_key: 'contact_hero',
            section_order: 0,
            page_type: 'contact',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'text', props: { text: 'CONTACT US', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 24 } },
                { component_key: 'text', props: { text: 'We\'re here to help', size: 'large', color: '#ffffff', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'Questions about products, orders, or delivery? Reach out anytime.', size: 'medium', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 48 } },
                { component_key: 'text', props: { text: 'Email: support@{{vendor.slug}}.com', size: 'small', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'Response time: Within 24 hours', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Shipping Page
        {
            section_key: 'shipping_hero',
            section_order: 0,
            page_type: 'shipping',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'text', props: { text: 'SHIPPING & DELIVERY', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 48 } },
                { component_key: 'text', props: { text: 'Same-Day Delivery', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Orders placed before 2 PM qualify for same-day delivery', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Standard Delivery', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: '1-2 business days for all other orders', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Discreet Packaging', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'All orders arrive in plain, unmarked, odor-proof packaging', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Privacy Page
        {
            section_key: 'privacy_hero',
            section_order: 0,
            page_type: 'privacy',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'icon', props: { name: 'shield', size: 48, color: 'rgba(255,255,255,0.6)' } },
                { component_key: 'spacer', props: { height: 24 } },
                { component_key: 'text', props: { text: 'PRIVACY POLICY', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'Last updated: January 2025', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        {
            section_key: 'privacy_content',
            section_order: 1,
            page_type: 'privacy',
            components: [
                { component_key: 'text', props: { text: 'Your Privacy Matters', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'We take your privacy seriously. This policy explains how we collect, use, and protect your information.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 48 } },
                { component_key: 'divider', props: { color: 'rgba(255,255,255,0.1)', thickness: 1 } },
                { component_key: 'spacer', props: { height: 48 } },
                { component_key: 'text', props: { text: 'Information We Collect', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Name, email, phone, address, payment info (securely processed), order history, browsing data.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'How We Use Your Data', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Process orders, send updates, provide support, improve services, prevent fraud, comply with legal requirements.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Cannabis Privacy', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'All packaging is unmarked. Billing appears as generic descriptor. We never share your purchase history.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Your Rights', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Access, correct, or delete your data anytime. Opt-out of marketing. Contact us to exercise your rights.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Terms Page
        {
            section_key: 'terms_hero',
            section_order: 0,
            page_type: 'terms',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'icon', props: { name: 'file-text', size: 48, color: 'rgba(255,255,255,0.6)' } },
                { component_key: 'spacer', props: { height: 24 } },
                { component_key: 'text', props: { text: 'TERMS OF SERVICE', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'Last updated: January 2025', size: 'small', color: 'rgba(255,255,255,0.4)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        {
            section_key: 'terms_content',
            section_order: 1,
            page_type: 'terms',
            components: [
                { component_key: 'text', props: { text: 'Agreement to Terms', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'By using our services, you agree to these terms. If you disagree, please do not use our services.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Age Requirement (21+)', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'You must be 21+ to purchase cannabis. By ordering, you confirm legal age in your jurisdiction.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Medical Disclaimer', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Products not evaluated by FDA. Not intended to diagnose, treat, cure, or prevent disease. Consult physician before use.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Returns & Refunds', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Unopened products: 30-day returns. Opened products: No returns (health regulations).', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Limitation of Liability', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'We are not liable for indirect damages. Use products responsibly and at your own risk.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Cookies Page
        {
            section_key: 'cookies_hero',
            section_order: 0,
            page_type: 'cookies',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'icon', props: { name: 'cookie', size: 48, color: 'rgba(255,255,255,0.6)' } },
                { component_key: 'spacer', props: { height: 24 } },
                { component_key: 'text', props: { text: 'COOKIE POLICY', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        {
            section_key: 'cookies_content',
            section_order: 1,
            page_type: 'cookies',
            components: [
                { component_key: 'text', props: { text: 'What Are Cookies?', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Small text files stored on your device to enhance your experience and remember your preferences.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Types We Use', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Essential (site functionality), Performance (analytics), Functional (preferences), Marketing (advertising).', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Managing Cookies', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Control cookies through your browser settings. Note: Blocking essential cookies may affect functionality.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Returns Page
        {
            section_key: 'returns_hero',
            section_order: 0,
            page_type: 'returns',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'icon', props: { name: 'rotate-ccw', size: 48, color: 'rgba(255,255,255,0.6)' } },
                { component_key: 'spacer', props: { height: 24 } },
                { component_key: 'text', props: { text: 'RETURN POLICY', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'Your satisfaction is our priority', size: 'large', color: '#ffffff', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        {
            section_key: 'returns_content',
            section_order: 1,
            page_type: 'returns',
            components: [
                { component_key: 'text', props: { text: '30-Day Return Window', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Unopened products can be returned within 30 days of delivery for full refund.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Eligible for Return', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Unopened products in original packaging with seals intact. Damaged or defective items (full refund within 7 days).', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'Not Eligible', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Opened or used products (health and safety regulations). Sale or clearance items (all sales final).', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'How to Return', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: '1. Contact us to initiate return  2. Receive prepaid label  3. Ship it back  4. Get refund (5-7 days)', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Shop Page - Polished Hero with Logo
        {
            section_key: 'shop_hero',
            section_order: 0,
            page_type: 'shop',
            components: [
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'image', props: { src: '{{vendor.logo_url}}', alt: '{{vendor.store_name}}', width: 240, height: 240, object_fit: 'contain' } },
                { component_key: 'spacer', props: { height: 24 } },
                { component_key: 'text', props: { text: 'Shop All', size: '4xl', color: '#ffffff', alignment: 'center', font_weight: '700', letter_spacing: '0.05em' } },
                { component_key: 'spacer', props: { height: 40 } }
            ]
        },
        {
            section_key: 'shop_controls',
            section_order: 1,
            page_type: 'shop',
            components: [
                { component_key: 'smart_shop_controls', props: { showSort: true, showCategories: true } },
                { component_key: 'spacer', props: { height: 40 } }
            ]
        },
        {
            section_key: 'shop_grid',
            section_order: 2,
            page_type: 'shop',
            components: [
                { component_key: 'smart_product_grid', props: { maxProducts: 100, columns: 4, showPrice: true, showQuickAdd: true, cardStyle: 'minimal' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Product Detail Page
        {
            section_key: 'product_detail',
            section_order: 0,
            page_type: 'product',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'smart_product_showcase', props: { limit: 1, layout: 'grid', columns: 1 } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Lab Results Page
        {
            section_key: 'lab_results_hero',
            section_order: 0,
            page_type: 'lab-results',
            components: [
                { component_key: 'spacer', props: { height: 80 } },
                { component_key: 'icon', props: { name: 'clipboard-check', size: 48, color: 'rgba(255,255,255,0.6)' } },
                { component_key: 'spacer', props: { height: 24 } },
                { component_key: 'text', props: { text: 'LAB RESULTS', size: 'medium', color: 'rgba(255,255,255,0.6)', alignment: 'center', font_weight: '400' } },
                { component_key: 'spacer', props: { height: 16 } },
                { component_key: 'text', props: { text: 'Third-party tested for your safety', size: 'large', color: '#ffffff', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        {
            section_key: 'lab_results_content',
            section_order: 1,
            page_type: 'lab-results',
            components: [
                { component_key: 'text', props: { text: 'Quality Assurance', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Every product is tested by independent, third-party laboratories. Certificates of Analysis (COA) available for all items.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'What We Test For', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Potency (THC/CBD levels), Terpene profiles, Pesticides, Heavy metals, Residual solvents, Microbial contaminants', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 40 } },
                { component_key: 'text', props: { text: 'View Results', size: 'medium', color: '#ffffff', alignment: 'center', font_weight: '500' } },
                { component_key: 'spacer', props: { height: 12 } },
                { component_key: 'text', props: { text: 'Lab certificates are displayed on each product page. Scan QR codes or view PDFs for detailed test results.', size: 'small', color: 'rgba(255,255,255,0.5)', alignment: 'center', font_weight: '300' } },
                { component_key: 'spacer', props: { height: 80 } }
            ]
        },
        // Footer (all pages)
        {
            section_key: 'footer',
            section_order: 999,
            page_type: 'all',
            components: [
                { component_key: 'smart_footer', props: { show_social: true, show_hours: false, show_newsletter: true } }
            ]
        }
    ]
};
exports.COMPLIANCE_CONTENT = {
    medical_disclaimer: `The statements made regarding cannabis products have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure or prevent any disease. Consult with a physician before use if you have a serious medical condition or use prescription medications. A Doctor's advice should be sought before using this and any supplemental dietary product.`,
    age_requirement: `You must be 21 years or older to purchase cannabis products. By entering this site, you confirm that you are of legal age in your jurisdiction.`,
    shipping_disclaimer: `Shipping restrictions apply. We can only ship to locations where cannabis delivery is legal. Some areas may require additional verification.`,
    lab_testing_statement: `All products are tested by independent, third-party laboratories. Certificates of Analysis (COA) are available for every batch. Lab results show potency, terpene profiles, and test for pesticides, heavy metals, and residual solvents.`,
    privacy_highlight: `Your privacy is our priority. All deliveries arrive in plain, unmarked packaging with no logos or identifying information. Billing appears as a generic descriptor on your statement.`,
    quality_statement: `We source exclusively from licensed, compliant cultivators who follow organic growing practices. Every product meets strict quality standards and undergoes rigorous testing before reaching our customers.`
};
