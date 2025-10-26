/**
 * Migrate Compliance Content to Supabase
 * Moves ALL legal/FAQ content to database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEMPLATE_ID = 'b17045df-9bf8-4abe-8d5b-bfd09ed3ccd0';

const FAQ_CONTENT = [
  {
    question: "What forms of payment do you accept?",
    answer: "We accept all major credit cards, debit cards, and approved digital payment methods. All transactions are encrypted and processed through our secure payment gateway."
  },
  {
    question: "How long does delivery take?",
    answer: "Same-day delivery available for orders before 2 PM. Standard delivery takes 1-2 business days. Track your order in real-time through your account dashboard."
  },
  {
    question: "Is my delivery discreet?",
    answer: "All orders arrive in plain, unmarked, odor-proof packaging with no logos or identifying information."
  },
  {
    question: "Are your products lab tested?",
    answer: "Yes. Every product is third-party tested by independent laboratories. We provide Certificates of Analysis (COA) for all items."
  },
  {
    question: "What is your return policy?",
    answer: "Unopened products can be returned within 30 days for a full refund. Due to health regulations, opened cannabis products cannot be returned."
  },
  {
    question: "Do I need a medical card?",
    answer: "Requirements vary by state. Some locations require a valid medical marijuana card, others allow recreational purchases for adults 21+."
  },
  {
    question: "Can I track my order?",
    answer: "Yes. You'll receive tracking information via email and SMS as soon as your order ships."
  },
  {
    question: "What if I'm not satisfied?",
    answer: "Your satisfaction is our priority. Contact our support team within 30 days and we'll make it right."
  }
];

const PRIVACY_POLICY = {
  title: "Privacy Policy",
  sections: [
    {
      heading: "Information We Collect",
      content: "We collect information you provide directly (name, email, delivery address, payment information) and automatically (device info, IP address, browsing data)."
    },
    {
      heading: "How We Use Your Information",
      content: "We use your information to process orders, communicate with you, improve our services, and comply with legal obligations."
    },
    {
      heading: "Data Security",
      content: "We implement industry-standard security measures to protect your personal information. All payment data is encrypted and processed through secure channels."
    },
    {
      heading: "Your Rights",
      content: "You have the right to access, correct, or delete your personal data. Contact us to exercise these rights."
    }
  ]
};

const TERMS_OF_SERVICE = {
  title: "Terms of Service",
  sections: [
    {
      heading: "Age Requirement",
      content: "You must be 21+ to purchase cannabis products. We verify age at checkout and delivery."
    },
    {
      heading: "Product Availability",
      content: "All products are subject to availability. We reserve the right to limit quantities or refuse service."
    },
    {
      heading: "Pricing",
      content: "Prices are subject to change without notice. The price at checkout is the final price."
    },
    {
      heading: "Prohibited Uses",
      content: "You may not use our service for any illegal purpose or to violate any laws in your jurisdiction."
    }
  ]
};

async function migrate() {
  console.log('🚀 Migrating compliance content to Supabase...\n');

  // Insert FAQ
  console.log('📝 Inserting FAQ content...');
  for (let i = 0; i < FAQ_CONTENT.length; i++) {
    const faq = FAQ_CONTENT[i];
    const { error } = await supabase
      .from('template_compliance_content')
      .insert({
        template_id: TEMPLATE_ID,
        content_type: 'faq',
        content_key: `faq_${i}`,
        title: faq.question,
        content: { question: faq.question, answer: faq.answer },
        display_order: i
      });

    if (error) console.error(`❌ Error inserting FAQ ${i}:`, error);
  }
  console.log(`✅ ${FAQ_CONTENT.length} FAQ items inserted\n`);

  // Insert Privacy Policy
  console.log('📝 Inserting Privacy Policy...');
  const { error: privacyError } = await supabase
    .from('template_compliance_content')
    .insert({
      template_id: TEMPLATE_ID,
      content_type: 'privacy',
      content_key: 'privacy_policy',
      title: PRIVACY_POLICY.title,
      content: { sections: PRIVACY_POLICY.sections },
      display_order: 0
    });

  if (privacyError) console.error('❌ Error inserting Privacy Policy:', privacyError);
  else console.log('✅ Privacy Policy inserted\n');

  // Insert Terms of Service
  console.log('📝 Inserting Terms of Service...');
  const { error: termsError } = await supabase
    .from('template_compliance_content')
    .insert({
      template_id: TEMPLATE_ID,
      content_type: 'terms',
      content_key: 'terms_of_service',
      title: TERMS_OF_SERVICE.title,
      content: { sections: TERMS_OF_SERVICE.sections },
      display_order: 0
    });

  if (termsError) console.error('❌ Error inserting Terms:', termsError);
  else console.log('✅ Terms of Service inserted\n');

  console.log('🎉 Migration complete!');
  console.log('   Template ID:', TEMPLATE_ID);
  console.log('   FAQ items:', FAQ_CONTENT.length);
  console.log('   Legal docs: 2 (Privacy + Terms)');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });

