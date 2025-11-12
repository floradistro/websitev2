import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  customerName?: string;
  storeName?: string;
  storeUrl?: string;
  loyaltyPoints?: number;
}

export const WelcomeEmail = ({
  customerName = 'Customer',
  storeName = 'Flora Distro',
  storeUrl = 'https://floradistro.com',
  loyaltyPoints = 0,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {storeName} - Your journey starts here</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{storeName}</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Welcome, {customerName}</Heading>

            <Text style={text}>
              We're excited to have you as part of our community. Your account has been created
              and you're all set to start exploring.
            </Text>

            {loyaltyPoints > 0 && (
              <Section style={pointsBox}>
                <Text style={pointsText}>
                  You've earned <strong>{loyaltyPoints} loyalty points</strong> to get you started!
                </Text>
              </Section>
            )}

            <Text style={text}>
              Start browsing our collection and discover premium products curated just for you.
            </Text>

            <Link href={storeUrl} style={button}>
              Start Shopping
            </Link>

            <Text style={text}>
              Questions? Just reply to this email - we're here to help.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </Text>
            <Link href={`${storeUrl}/unsubscribe`} style={footerLink}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// Styles - Clean, minimal, works in dark mode
const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#111',
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  padding: '40px 40px 20px',
};

const h1 = {
  color: '#fff',
  fontSize: '24px',
  fontWeight: '900',
  margin: '0',
  letterSpacing: '-0.02em',
  textTransform: 'uppercase' as const,
};

const content = {
  padding: '0 40px 40px',
};

const h2 = {
  color: '#fff',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 20px',
};

const text = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const pointsBox = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  borderRadius: '12px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid rgba(255,255,255,0.1)',
};

const pointsText = {
  color: '#fff',
  fontSize: '14px',
  margin: '0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#fff',
  color: '#000',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  borderRadius: '8px',
  margin: '24px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const footer = {
  padding: '20px 40px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
};

const footerText = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
  margin: '0 0 8px',
};

const footerLink = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: '12px',
  textDecoration: 'underline',
};
