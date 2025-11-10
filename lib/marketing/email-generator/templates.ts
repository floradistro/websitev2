/**
 * Email HTML Templates
 * Branded HTML email templates with responsive design
 */

import type { EmailGenerationParams, EmailContent } from "./types";

/**
 * Build branded HTML email
 */
export function buildEmailHTML(params: EmailGenerationParams, content: EmailContent): string {
  const primaryColor = params.vendor.brand_colors?.primary || "#22c55e";
  const secondaryColor = params.vendor.brand_colors?.secondary || "#000000";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #191919;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      max-width: 180px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .headline {
      font-size: 28px;
      font-weight: bold;
      color: #191919;
      margin: 0 0 20px 0;
      line-height: 1.2;
    }
    .body-text {
      font-size: 16px;
      color: #191919;
      margin: 0 0 20px 0;
    }
    .body-text p {
      margin: 0 0 16px 0;
    }
    .cta {
      display: inline-block;
      padding: 16px 40px;
      background: ${primaryColor};
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
    }
    .cta:hover {
      opacity: 0.9;
    }
    .product-card {
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      display: flex;
      gap: 20px;
      align-items: center;
    }
    .product-image {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
    }
    .product-info h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #191919;
    }
    .product-price {
      font-size: 24px;
      font-weight: bold;
      color: ${primaryColor};
      margin: 8px 0;
    }
    .footer {
      background: #f5f5f5;
      padding: 30px 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: ${primaryColor};
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: #e5e5e5;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .headline {
        font-size: 24px;
      }
      .product-card {
        flex-direction: column;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${content.preheader}
  </div>

  <div class="container">
    <!-- Header -->
    <div class="header">
      ${params.vendor.logo_url ? `<img src="${params.vendor.logo_url}" alt="${params.vendor.name}" class="logo">` : `<h1 style="color: #ffffff; margin: 0;">${params.vendor.name}</h1>`}
    </div>

    <!-- Content -->
    <div class="content">
      <h1 class="headline">${content.headline}</h1>

      <div class="body-text">
        ${content.body}
      </div>

      ${
        params.productData
          ? `
      <div class="product-card">
        ${params.productData.image_url ? `<img src="${params.productData.image_url}" alt="${params.productData.name}" class="product-image">` : ""}
        <div class="product-info">
          <h3>${params.productData.name}</h3>
          <p style="margin: 0; color: #666;">${params.productData.description || ""}</p>
          ${params.productData.thc_percent ? `<p style="margin: 4px 0; font-size: 14px; color: #666;">THC: ${params.productData.thc_percent}% ${params.productData.cbd_percent ? `| CBD: ${params.productData.cbd_percent}%` : ""}</p>` : ""}
          <div class="product-price">$${params.productData.price?.toFixed(2)}</div>
        </div>
      </div>
      `
          : ""
      }

      <center>
        <a href="${content.cta_url}?utm_source=email&utm_medium=email&utm_campaign={{campaign_id}}" class="cta">
          ${content.cta_text}
        </a>
      </center>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #666; text-align: center;">
        ${content.footer_text}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">${params.vendor.name}</p>
      <p style="margin: 0 0 10px 0;">
        <a href="{{unsubscribe_url}}">Unsubscribe</a> |
        <a href="{{preferences_url}}">Email Preferences</a>
      </p>
      <p style="margin: 0;">
        You're receiving this email because you signed up for updates from ${params.vendor.name}.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px;">
        21+ only. Please consume cannabis responsibly.
        ${params.additionalContext?.includes("medical") ? "Valid medical card required." : ""}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
