"use strict";
/**
 * Compliance Pages for Cannabis Storefronts
 * Auto-generated legal pages (Privacy, Terms, FAQ, etc.)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANNABIS_EDUCATION = void 0;
exports.generateFAQContent = generateFAQContent;
exports.generatePrivacyPolicy = generatePrivacyPolicy;
exports.generateTermsOfService = generateTermsOfService;
exports.generateCookiePolicy = generateCookiePolicy;
exports.generateDisclaimers = generateDisclaimers;
function generateFAQContent(vendorName) {
    return [
        {
            question: "What forms of payment do you accept?",
            answer: "We accept all major credit cards, debit cards, and approved digital payment methods. All transactions are encrypted and processed through our secure payment gateway for your protection."
        },
        {
            question: "How long does delivery take?",
            answer: "Same-day delivery is available for orders placed before 2 PM. Standard delivery takes 1-2 business days. You can track your order in real-time through your account dashboard."
        },
        {
            question: "Is my delivery discreet?",
            answer: "Absolutely. All orders arrive in plain, unmarked packaging with no logos or identifying information. Packaging is also odor-proof to ensure complete discretion."
        },
        {
            question: "Are your products lab tested?",
            answer: "Yes. Every product is third-party tested by independent laboratories. We provide Certificates of Analysis (COA) showing potency, terpene profiles, and test results for pesticides, heavy metals, and residual solvents."
        },
        {
            question: "What is your return policy?",
            answer: "Unopened products can be returned within 30 days of delivery for a full refund. Due to health and safety regulations, opened cannabis products cannot be returned. See our Returns page for complete details."
        },
        {
            question: "Do I need a medical card?",
            answer: "Requirements vary by state. Some locations require a valid medical marijuana card, while others allow recreational purchases for adults 21+. We'll verify eligibility during checkout based on your delivery location."
        },
        {
            question: "How do you ensure product quality?",
            answer: `${vendorName} partners exclusively with licensed, compliant cultivators. All products undergo rigorous quality control and third-party testing before reaching our customers. We stand behind every item we sell.`
        },
        {
            question: "Can I track my order?",
            answer: "Yes. You'll receive tracking information via email and SMS as soon as your order ships. Track your delivery in real-time through your account dashboard or tracking link."
        },
        {
            question: "What if I'm not satisfied?",
            answer: "Your satisfaction is our priority. If you're not happy with your purchase, contact our support team within 30 days and we'll make it right."
        },
        {
            question: "Are there any delivery fees?",
            answer: "Delivery fees vary by location and order size. Orders over a minimum amount may qualify for free delivery. Exact fees are shown at checkout before you confirm your order."
        },
        {
            question: "How is cannabis stored and shipped?",
            answer: "All products are stored in climate-controlled facilities to preserve freshness and potency. During shipping, items are packaged to prevent damage and maintain optimal conditions."
        },
        {
            question: "Can I cancel or modify my order?",
            answer: "Orders can be cancelled or modified within 30 minutes of placement. After that, orders enter our fulfillment process and cannot be changed. Contact support immediately if you need assistance."
        }
    ];
}
function generatePrivacyPolicy(vendorName, vendorEmail) {
    return {
        title: "Privacy Policy",
        last_updated: new Date().toISOString().split('T')[0],
        sections: [
            {
                heading: "Your Privacy Matters",
                content: `${vendorName} takes your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases.`
            },
            {
                heading: "Information We Collect",
                content: "When you place an order, we collect your name, contact information (email, phone, address), payment information (processed securely through our payment provider), order history, and account credentials if you create an account."
            },
            {
                heading: "How We Use Your Information",
                content: "We use your information to process and fulfill orders, send order confirmations and shipping updates, provide customer support, improve our services, prevent fraud, and comply with legal obligations."
            },
            {
                heading: "Information Sharing",
                content: `${vendorName} does not sell your personal information. We may share your information only with service providers (payment processors, shipping carriers), when required by law, or in the event of a business transfer.`
            },
            {
                heading: "Data Security",
                content: "We implement industry-standard security measures including SSL encryption for all transactions, secure servers and firewalls, regular security audits, and strict access controls."
            },
            {
                heading: "Your Rights",
                content: `You have the right to access your personal information, correct inaccurate data, request deletion of your data, opt-out of marketing communications, and restrict processing. To exercise these rights, contact us at ${vendorEmail}`
            },
            {
                heading: "Cookies",
                content: "We use cookies to enhance your experience, analyze site traffic, and personalize content. You can control cookies through your browser settings."
            },
            {
                heading: "Cannabis-Specific Privacy",
                content: "We understand the sensitive nature of cannabis purchases. All packaging is unmarked and discreet. Billing appears as a generic descriptor on your statement. We never share your purchase history with third parties."
            },
            {
                heading: "Children's Privacy",
                content: "Our services are not intended for individuals under 21 years of age. We do not knowingly collect information from minors."
            },
            {
                heading: "Changes to This Policy",
                content: "We may update this Privacy Policy periodically. Changes will be posted on this page with an updated revision date."
            }
        ]
    };
}
function generateTermsOfService(vendorName) {
    return {
        title: "Terms of Service",
        last_updated: new Date().toISOString().split('T')[0],
        sections: [
            {
                heading: "Agreement to Terms",
                content: `By accessing and using ${vendorName}, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our services.`
            },
            {
                heading: "Age Requirement",
                content: "You must be at least 21 years of age to purchase cannabis products. By making a purchase, you confirm that you are of legal age in your jurisdiction."
            },
            {
                heading: "Medical Disclaimer",
                content: "Cannabis products have not been evaluated by the FDA. These products are not intended to diagnose, treat, cure, or prevent any disease. Consult with a physician before use if you have a medical condition or use prescription medications."
            },
            {
                heading: "Product Information",
                content: "We strive to provide accurate product descriptions, lab results, and pricing. However, we reserve the right to correct errors and update information at any time. Products are subject to availability."
            },
            {
                heading: "Orders and Payment",
                content: "All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including product unavailability, pricing errors, suspected fraud, or shipping restrictions."
            },
            {
                heading: "Shipping and Delivery",
                content: "Shipping times are estimates and not guaranteed. We are not responsible for delays caused by carriers or circumstances beyond our control. Delivery is only available where legally permitted."
            },
            {
                heading: "Returns and Refunds",
                content: "Unopened products may be returned within 30 days of delivery. Opened products cannot be returned due to health and safety regulations. See our Return Policy for complete details."
            },
            {
                heading: "Prohibited Uses",
                content: "You may not use our site for any unlawful purpose, to violate any laws, to transmit harmful code, to impersonate others, to interfere with security, or to resell products without authorization."
            },
            {
                heading: "Limitation of Liability",
                content: `To the fullest extent permitted by law, ${vendorName} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our products or services.`
            },
            {
                heading: "Governing Law",
                content: "These Terms are governed by the laws of the United States and applicable state laws, without regard to conflict of law principles."
            }
        ]
    };
}
function generateCookiePolicy(vendorName) {
    return {
        title: "Cookie Policy",
        last_updated: new Date().toISOString().split('T')[0],
        intro: `${vendorName} uses cookies to enhance your experience and understand how you use our site. This policy explains what cookies are, which ones we use, and how you can control them.`,
        cookie_types: [
            {
                type: "Essential Cookies",
                description: "Required for the website to function properly",
                examples: ["Session management", "Shopping cart", "Security and authentication", "Load balancing"]
            },
            {
                type: "Performance Cookies",
                description: "Help us understand how visitors interact with our site",
                examples: ["Page visit analytics", "User behavior tracking", "Error reporting", "Site performance metrics"]
            },
            {
                type: "Functional Cookies",
                description: "Remember your preferences and provide enhanced features",
                examples: ["Language preferences", "Location settings", "Recently viewed products", "Saved preferences"]
            },
            {
                type: "Marketing Cookies",
                description: "Track activity to deliver relevant advertisements",
                examples: ["Targeted advertising", "Social media integration", "Email campaign tracking", "Conversion tracking"]
            }
        ],
        third_party: [
            "Google Analytics (site usage and performance)",
            "Stripe (secure payment transactions)",
            "Social media platforms (sharing and advertising)",
            "Customer support tools"
        ],
        control: "You can control cookies through your browser settings. Note that blocking essential cookies may affect website functionality, including the ability to make purchases."
    };
}
function generateDisclaimers(vendorName) {
    return {
        medical: "The statements made regarding cannabis products have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure or prevent any disease. Consult with a physician before use if you have a serious medical condition or use prescription medications. A Doctor's advice should be sought before using this and any supplemental dietary product.",
        age: "You must be 21 years or older to purchase cannabis products. By entering this site, you confirm that you are of legal age in your jurisdiction. We require age verification at checkout and upon delivery.",
        effects: "Effects of cannabis products vary by individual. Start with low doses and wait at least 2 hours before consuming more edibles. Do not drive or operate machinery while using cannabis. Keep out of reach of children and pets.",
        legality: `${vendorName} operates in full compliance with state and local cannabis regulations. We only ship to locations where cannabis delivery is legal. Customers are responsible for knowing and complying with their local laws.`,
        dosage: "Dosage recommendations are for informational purposes only and do not constitute medical advice. Consult with a healthcare professional for personalized guidance. Always start with the lowest recommended dose.",
        storage: "Store cannabis products in a cool, dry place away from direct sunlight. Keep in original packaging until ready to use. Refrigeration may extend shelf life for some products.",
        liability: `${vendorName} is not liable for misuse of products, adverse reactions, or any consequences of use. Use cannabis responsibly and in accordance with local laws. If you experience adverse effects, discontinue use and consult a healthcare professional.`
    };
}
exports.CANNABIS_EDUCATION = {
    first_time_buyers: {
        title: "First Time Buying Cannabis?",
        intro: "We're here to help you navigate your cannabis journey with confidence.",
        tips: [
            {
                heading: "Start Low, Go Slow",
                content: "Begin with low-THC products and small doses. You can always consume more, but you can't undo overconsumption."
            },
            {
                heading: "Understand Product Types",
                content: "Flower (smokable), Edibles (ingested), Concentrates (high potency), Tinctures (sublingual), Topicals (applied to skin). Each has different onset times and duration."
            },
            {
                heading: "Read Lab Results",
                content: "Check THC/CBD percentages, terpene profiles, and safety test results. Higher THC doesn't always mean better - it's about finding what works for you."
            },
            {
                heading: "Know Your Tolerance",
                content: "Tolerance varies greatly between individuals. What works for someone else may be too much or too little for you. Listen to your body."
            },
            {
                heading: "Edibles Take Time",
                content: "Edibles can take 30 minutes to 2 hours to take effect. Wait before consuming more. Effects can last 4-8 hours."
            },
            {
                heading: "Store Properly",
                content: "Keep products in original packaging, in a cool, dry place, away from sunlight. Store securely away from children and pets."
            }
        ]
    },
    strain_guide: {
        indica: "Typically associated with relaxation and sedation. Often chosen for evening use, pain relief, and sleep support.",
        sativa: "Generally energizing and uplifting. Popular for daytime use, creativity, and social activities.",
        hybrid: "Balanced combination of indica and sativa effects. Offers middle-ground benefits tailored to specific needs."
    },
    consumption_methods: {
        smoking: "Immediate onset (1-5 minutes), effects last 1-3 hours. Traditional method, full flavor profile.",
        vaping: "Quick onset (5-10 minutes), effects last 2-4 hours. Smoother on lungs, precise temperature control.",
        edibles: "Delayed onset (30min-2hrs), effects last 4-8 hours. Longer-lasting, no inhalation required.",
        tinctures: "Moderate onset (15-45 minutes), effects last 2-4 hours. Precise dosing, discreet use.",
        topicals: "Localized effects, no psychoactive properties. Applied to skin for targeted relief."
    }
};
