# Alpine IQ Dashboard - What You Can Actually Do

## 🔑 Key Understanding

**Alpine IQ uses a hybrid approach:**
- **Message templates** = Pre-approved by carriers, stored in dashboard, cannot be created via API
- **Landing pages** = Custom HTML you create, sent via API with the template

## 📱 How SMS Campaigns Work

### The Flow:
```
1. Dashboard has approved template: "Special offer! Check it out: {link}"
2. You create campaign via API with:
   - messageContent: "Special offer! Check it out: {link}"  ← Must match exactly
   - landingHTML: "<h1>25% Off Today!</h1><p>Use code: SAVE25</p>"
3. Alpine IQ:
   - Validates messageContent against approved templates
   - Generates short link (e.g., https://aiq.co/xyz123)
   - Replaces {link} with actual URL
   - Hosts your HTML at that URL
4. Customer receives: "Special offer! Check it out: https://aiq.co/xyz123"
5. Customer clicks link → sees your landing page
```

## 🎯 What You Need from Dashboard

### Step 1: Find Your Approved Templates

**How to access:**
1. Go to https://lab.alpineiq.com
2. Log in with your credentials
3. Navigate to: **Campaigns** → **Create Campaign** → **SMS/Text**
4. Look for section called:
   - "Message Templates"
   - "Approved Messages"
   - "Template Library"
   - or similar

### Step 2: Copy Template Text

You'll see something like:
```
✅ Approved Template 1:
   "Hi {firstName}, special offer just for you! {link}"

✅ Approved Template 2:
   "{storeName} has a flash sale! Check it out: {link}"

✅ Approved Template 3:
   "Exclusive deal for our members! {link}"
```

**Copy these EXACTLY as shown**, including all placeholders.

### Step 3: Available Placeholders

Common placeholders Alpine IQ supports:
- `{firstName}` - Customer's first name
- `{lastName}` - Customer's last name
- `{storeName}` - Your store name
- `{link}` - Auto-generated short link to landing page
- `{phone}` - Customer's phone (for support messages)
- `{email}` - Customer's email

## 💻 How to Use in Your Code

### Option 1: Store Templates as Constants

```typescript
// lib/marketing/alpine-templates.ts

export const ALPINE_APPROVED_TEMPLATES = {
  FLASH_SALE: {
    message: 'Special offer just for you! {link}',  // Copy from dashboard
    description: 'Generic flash sale template',
  },
  NEW_PRODUCT: {
    message: '{storeName} has new products! Check them out: {link}',
    description: 'New product announcement',
  },
  MEMBER_EXCLUSIVE: {
    message: 'Hi {firstName}, exclusive deal for our members! {link}',
    description: 'Member-only promotion',
  },
};
```

### Option 2: Use via API

```typescript
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';
import { ALPINE_APPROVED_TEMPLATES } from '@/lib/marketing/alpine-templates';

async function sendFlashSaleCampaign() {
  const alpineiq = createAlpineIQClient({
    apiKey: process.env.ALPINE_IQ_API_KEY!,
    userId: process.env.ALPINE_IQ_USER_ID!,
  });

  // Get customers from your database
  const customers = await getGoldTierCustomers();
  const phoneNumbers = customers.map(c => c.phone);

  // Create landing page HTML
  const landingHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Flash Sale - 25% Off!</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 40px; }
        h1 { color: #e91e63; }
        .button {
          background: #e91e63;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>🎉 Flash Sale - 25% Off!</h1>
      <p>Exclusive offer for our gold tier members</p>
      <p>Use code: <strong>GOLD25</strong></p>
      <p>Valid until midnight tonight!</p>
      <a href="https://yourstore.com/shop" class="button">Shop Now</a>
    </body>
    </html>
  `;

  // Create campaign
  const result = await alpineiq.createSMSCampaign({
    campaignName: 'Flash Sale - Gold Members',
    messageContent: ALPINE_APPROVED_TEMPLATES.FLASH_SALE.message,
    landingHTML: landingHTML,
    phoneList: phoneNumbers,
    startDate: new Date(Date.now() + 1800000), // 30 min from now
  });

  console.log(`✅ Campaign created: ${result.campaignId}`);
}
```

## 🎨 Landing Page Best Practices

### Keep it Simple
- Mobile-first design (most SMS recipients on mobile)
- Clear call-to-action
- Fast loading (no heavy images)

### Include Key Info
- Offer details prominently displayed
- Promo code (if applicable)
- Expiration date
- Direct link to shop/product

### Example Template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px 30px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      font-size: 32px;
      color: #333;
      margin-bottom: 10px;
    }
    .emoji { font-size: 48px; margin-bottom: 20px; }
    p { color: #666; font-size: 18px; line-height: 1.6; margin: 15px 0; }
    .code {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 10px;
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      margin: 20px 0;
      letter-spacing: 2px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 15px 40px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
      transition: transform 0.2s;
    }
    .button:hover { transform: scale(1.05); }
    .expiry {
      color: #999;
      font-size: 14px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="emoji">🎁</div>
    <h1>Exclusive Offer!</h1>
    <p>Thank you for being a valued member</p>

    <div class="code">SAVE25</div>

    <p><strong>25% OFF</strong> your entire purchase</p>
    <p>Valid on all products in store and online</p>

    <a href="https://yourstore.com/shop" class="button">Shop Now</a>

    <p class="expiry">Offer expires: 11:59 PM tonight</p>
  </div>
</body>
</html>
```

## 🔄 Complete Workflow Example

```typescript
// app/api/vendor/marketing/send-campaign/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth/middleware';
import { createClient } from '@supabase/supabase-js';
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';
import { ALPINE_APPROVED_TEMPLATES } from '@/lib/marketing/alpine-templates';

export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;

  const { template, segment, landingHTML, campaignName } = await request.json();

  // Get approved template
  const approvedTemplate = ALPINE_APPROVED_TEMPLATES[template];
  if (!approvedTemplate) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
  }

  // Get customers from YOUR database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: customers } = await supabase
    .from('customers')
    .select('phone, first_name')
    .eq('vendor_id', authResult.vendorId)
    .eq('loyalty_tier', segment)
    .eq('sms_opt_in', true);

  const phoneNumbers = customers.map(c => c.phone).filter(Boolean);

  // Create campaign via Alpine IQ
  const alpineiq = createAlpineIQClient({
    apiKey: process.env.ALPINE_IQ_API_KEY!,
    userId: process.env.ALPINE_IQ_USER_ID!,
  });

  const result = await alpineiq.createSMSCampaign({
    campaignName: campaignName,
    messageContent: approvedTemplate.message,
    landingHTML: landingHTML,
    phoneList: phoneNumbers,
    startDate: new Date(Date.now() + 1800000),
  });

  return NextResponse.json({
    success: true,
    campaignId: result.campaignId,
    recipientCount: phoneNumbers.length,
  });
}
```

## ⚠️ Important Notes

### Template Restrictions
- Must use EXACT text from dashboard
- Cannot modify approved templates
- Placeholders like `{link}` must stay as-is
- If you need new templates, contact Alpine IQ support

### Landing Pages
- Full creative control over HTML/CSS
- Can include forms, images, videos
- Hosted by Alpine IQ (no hosting needed)
- Mobile-responsive is critical

### Rate Limits
- Check with Alpine IQ for sending limits
- Respect customer opt-in preferences
- Follow SMS best practices (timing, frequency)

## 🚀 Next Steps

1. **Log into Alpine IQ dashboard** → Copy your approved templates
2. **Add to code** → Create `alpine-templates.ts` file
3. **Test campaign** → Send to yourself first
4. **Build UI** → Let vendor select template + customize landing page
5. **Monitor results** → Track clicks in Alpine IQ dashboard

## 📞 Getting More Templates

**Contact Alpine IQ support to:**
- Request new message templates
- Get templates approved by carriers
- Understand approval timeline (usually 1-6 weeks)
- Learn about template restrictions for your industry
