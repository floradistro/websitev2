import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface CampaignEmailProps {
  subject?: string;
  storeName?: string;
  storeUrl?: string;
  logoUrl?: string;
  htmlContent?: string;
  textContent?: string;
  unsubscribeUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export const CampaignEmail = ({
  subject = 'Special announcement',
  storeName = 'Flora Distro',
  storeUrl = 'https://floradistro.com',
  logoUrl = '',
  htmlContent = '',
  textContent = '',
  unsubscribeUrl = '',
  primaryColor = '#8b5cf6',
  accentColor = '#a78bfa',
}: CampaignEmailProps) => {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt={storeName}
                style={logo}
              />
            ) : (
              <Heading style={{...h1, color: primaryColor}}>{storeName}</Heading>
            )}
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            {htmlContent ? (
              <div
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={htmlContentWrapper}
              />
            ) : (
              <Text style={text}>{textContent}</Text>
            )}
          </Section>

          {/* Divider */}
          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </Text>
            <Text style={footerText}>
              {unsubscribeUrl && (
                <>
                  <Link href={unsubscribeUrl} style={footerLink}>
                    Unsubscribe
                  </Link>
                  {' · '}
                </>
              )}
              <Link href={storeUrl} style={footerLink}>
                Visit Store
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CampaignEmail;

// Styles - Modern, clean, universally beautiful
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
};

const header = {
  padding: '40px 40px 32px',
  textAlign: 'center' as const,
  backgroundColor: '#ffffff',
};

const logo = {
  maxWidth: '180px',
  height: 'auto',
  margin: '0 auto',
};

const h1 = {
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '-0.5px',
  lineHeight: '1.2',
};

const contentSection = {
  padding: '0 40px 40px',
};

const htmlContentWrapper = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '0',
};

const footer = {
  padding: '32px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#f8f9fa',
};

const footerText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '8px 0',
};

const footerLink = {
  color: '#8b5cf6',
  textDecoration: 'none',
};
