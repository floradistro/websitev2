import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env FIRST before importing anything that uses it
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { render } from '@react-email/render';
import { sendEmail } from '../lib/email/resend-client';
import WelcomeEmail from '../emails/WelcomeEmail';

async function testEmail() {
  console.log('🧪 Testing Resend Email System...\n');

  // Render the React Email template to HTML string
  const emailHtml = await render(
    WelcomeEmail({
      customerName: 'Darion',
      storeName: 'Flora Distro',
      storeUrl: 'https://floradistro.com',
      loyaltyPoints: 100,
    }),
    { pretty: false }
  );

  try {
    const result = await sendEmail({
      to: 'darioncdjr@gmail.com', // Your email
      subject: '🎉 Welcome to Flora Distro - Test Email',
      html: emailHtml,
      from: 'Flora Distro <noreply@floradistro.com>',
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Email ID: ${result.emailId}`);
    console.log(`\n   Check your inbox at darioncdjr@gmail.com`);
    console.log(`\n🎨 Email is dark-themed and beautiful - matches your brand!\n`);
  } catch (error: any) {
    console.error('❌ Failed to send email:');
    console.error(`   ${error.message}\n`);

    if (error.message.includes('domain')) {
      console.log('💡 Tip: Make sure floradistro.com domain is verified in Resend');
      console.log('   Go to https://resend.com/domains and verify the domain\n');
    }
  }
}

testEmail();
