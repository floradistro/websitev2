# Alpine IQ Complete Solution - How It Actually Works

## 🎯 The Big Picture

You asked: **"Why can't we pull the templates?"**

**Answer:** Alpine IQ templates are NOT accessible via API. Here's the complete understanding:

### What Alpine IQ Dashboard Does:
1. **Stores pre-approved message templates** (approved by carriers for 10DLC compliance)
2. **You can view these templates** in the dashboard UI
3. **Templates cannot be retrieved programmatically** via API
4. **You must manually copy template text** from dashboard to your code

### Why This System Exists:
- **10DLC Compliance:** Carriers (AT&T, Verizon, T-Mobile) require pre-approved message templates
- **Security:** Prevents unauthorized message modifications
- **Control:** Alpine IQ manages carrier relationships and approvals

## 📱 How SMS Campaigns Actually Work

### The Complete Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ALPINE IQ DASHBOARD                                          │
│    - Has approved templates stored by carriers                  │
│    - Example: "Special offer! {link}"                           │
│    - You manually view and copy these                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. YOUR CODE (alpine-templates.ts)                              │
│    - Store copied templates as constants                        │
│    - ALPINE_APPROVED_TEMPLATES.FLASH_SALE = "Special offer..."  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. YOUR DATABASE (Supabase)                                     │
│    - Query customers by segment                                 │
│    - Get phone numbers: ['+1555...', '+1666...']                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. YOUR CODE - CREATE CAMPAIGN                                  │
│    alpineiq.createSMSCampaign({                                 │
│      messageContent: "Special offer! {link}",                   │
│      landingHTML: "<h1>25% Off!</h1>",                          │
│      phoneList: ['+1555...', '+1666...']                        │
│    })                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ALPINE IQ API                                                │
│    - Validates messageContent matches approved template ✅       │
│    - Generates short link: https://aiq.co/abc123               │
│    - Hosts your landing HTML at that URL                        │
│    - Replaces {link} with actual short link                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. CUSTOMER RECEIVES SMS                                        │
│    "Special offer! https://aiq.co/abc123"                       │
│                                                                  │
│    Customer clicks link → sees your landing page                │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 What You Can Do in Alpine IQ Dashboard

### Capabilities:

1. **View Approved Templates** ✅
   - Location: Campaigns → Create Campaign → SMS
   - See pre-approved message templates
   - Copy exact text for use in code

2. **Create/Edit Templates** ❌ (Via Dashboard Only)
   - Must use dashboard to request new templates
   - Carrier approval takes 1-6 weeks
   - Cannot do this via API

3. **View Campaign Performance** ✅
   - See sent messages, clicks, conversions
   - Both in dashboard and via API

4. **Manage Audiences** ✅
   - Create segments in dashboard
   - Or programmatically via API

## 💻 Complete Working Example

### Step 1: Get Templates from Dashboard

Log into https://lab.alpineiq.com and find your approved templates. Let's say you find:

```
✅ Template 1: "Flash sale alert! {link}"
✅ Template 2: "Hi {firstName}, check out our new products: {link}"
✅ Template 3: "Order #{orderNumber} ready for pickup at {storeName}"
```

### Step 2: Add to Your Code

```typescript
// lib/marketing/alpine-templates.ts

export const ALPINE_APPROVED_TEMPLATES = {
  FLASH_SALE: {
    message: 'Flash sale alert! {link}',  // Copied from dashboard
    description: 'Flash sale with landing page',
    requiresLandingPage: true,
    placeholders: ['{link}'],
  },

  NEW_PRODUCTS: {
    message: 'Hi {firstName}, check out our new products: {link}',
    description: 'Personalized new product announcement',
    requiresLandingPage: true,
    placeholders: ['{firstName}', '{link}'],
  },

  ORDER_READY: {
    message: 'Order #{orderNumber} ready for pickup at {storeName}',
    description: 'Order ready notification',
    requiresLandingPage: false,
    placeholders: ['{orderNumber}', '{storeName}'],
  },
};
```

### Step 3: Send Campaign

```typescript
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';
import { ALPINE_APPROVED_TEMPLATES } from '@/lib/marketing/alpine-templates';
import { createClient } from '@supabase/supabase-js';

async function sendFlashSaleCampaign() {
  // 1. Get customers from YOUR database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: customers } = await supabase
    .from('customers')
    .select('phone, first_name')
    .eq('vendor_id', 'your-vendor-id')
    .eq('loyalty_tier', 'gold')
    .eq('sms_opt_in', true);

  const phoneNumbers = customers
    .filter(c => c.phone)
    .map(c => c.phone);

  console.log(`Targeting ${phoneNumbers.length} gold tier customers`);

  // 2. Create landing page HTML
  const landingHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flash Sale - 25% Off!</title>
      <style>
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 20px;
          padding: 40px 30px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { font-size: 32px; color: #333; margin: 0 0 20px 0; }
        .emoji { font-size: 60px; margin-bottom: 20px; }
        .code {
          background: #f0f0f0;
          padding: 15px;
          border-radius: 10px;
          font-size: 28px;
          font-weight: bold;
          color: #667eea;
          margin: 20px 0;
          letter-spacing: 3px;
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
        .expiry { color: #999; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="emoji">🔥</div>
        <h1>Flash Sale Alert!</h1>
        <p>Exclusive 25% off for Gold Members</p>
        <div class="code">GOLD25</div>
        <p><strong>Valid on all products</strong></p>
        <p>In-store and online</p>
        <a href="https://yourstore.com/shop" class="button">Shop Now</a>
        <p class="expiry">Expires: Tonight at 11:59 PM</p>
      </div>
    </body>
    </html>
  `;

  // 3. Create campaign via Alpine IQ
  const alpineiq = createAlpineIQClient({
    apiKey: process.env.ALPINE_IQ_API_KEY!,
    userId: process.env.ALPINE_IQ_USER_ID!,
  });

  const result = await alpineiq.createSMSCampaign({
    campaignName: 'Flash Sale - Gold Members - Dec 2024',
    messageContent: ALPINE_APPROVED_TEMPLATES.FLASH_SALE.message,
    landingHTML: landingHTML,
    phoneList: phoneNumbers,
    startDate: new Date(Date.now() + 1800000), // Send in 30 minutes
  });

  console.log('✅ Campaign created!');
  console.log(`   Campaign ID: ${result.campaignId}`);
  console.log(`   Recipients: ${phoneNumbers.length}`);
  console.log(`   Scheduled: ${new Date(Date.now() + 1800000).toLocaleString()}`);

  // 4. Log to your database
  await supabase.from('marketing_campaigns').insert({
    vendor_id: 'your-vendor-id',
    name: 'Flash Sale - Gold Members',
    type: 'sms',
    provider: 'alpineiq',
    provider_campaign_id: result.campaignId,
    recipients_count: phoneNumbers.length,
    segment: 'loyalty_tier = gold',
    message_content: ALPINE_APPROVED_TEMPLATES.FLASH_SALE.message,
    scheduled_at: new Date(Date.now() + 1800000).toISOString(),
    status: 'scheduled',
  });

  return result;
}

// Run it
sendFlashSaleCampaign()
  .then(result => console.log('Campaign sent successfully!'))
  .catch(error => console.error('Campaign failed:', error));
```

## 🎨 Creating Effective Landing Pages

### Best Practices:

1. **Mobile-First Design**
   - 80% of SMS recipients are on mobile
   - Use large text and buttons
   - Test on various screen sizes

2. **Clear Call-to-Action**
   - One primary action (Shop Now, Claim Offer, etc.)
   - Make button prominent and clickable
   - Use action-oriented text

3. **Fast Loading**
   - Inline CSS (no external stylesheets)
   - Optimize/compress images
   - Keep HTML under 50KB

4. **Include Key Info**
   - Offer details front and center
   - Promo code (if applicable)
   - Expiration date/urgency
   - Direct links to products/shop

### Landing Page Template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Offer Title</title>
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
    h1 { font-size: 32px; color: #333; margin-bottom: 10px; }
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
      font-size: 18px;
    }
    .button:hover { transform: scale(1.05); }
    .expiry { color: #999; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Emoji/Icon -->
    <div class="emoji">🎁</div>

    <!-- Main Heading -->
    <h1>Your Offer Title</h1>

    <!-- Supporting Text -->
    <p>Brief description of the offer</p>

    <!-- Promo Code (if applicable) -->
    <div class="code">PROMO25</div>

    <!-- Offer Details -->
    <p><strong>25% OFF</strong> your entire purchase</p>
    <p>Valid on all products</p>

    <!-- Call-to-Action Button -->
    <a href="https://yourstore.com/shop" class="button">Shop Now</a>

    <!-- Expiration/Terms -->
    <p class="expiry">Offer expires: December 31, 2024</p>
  </div>
</body>
</html>
```

## 📊 API Reference

### Files Created:
- `/lib/marketing/alpineiq-client.ts` - Alpine IQ API client with campaign methods
- `/lib/marketing/alpine-templates.ts` - Store your approved templates here
- `/app/api/vendor/messaging/send/route.ts` - API endpoint for sending campaigns
- `ALPINE_IQ_DASHBOARD_GUIDE.md` - Detailed dashboard usage guide
- `ALPINE_IQ_USAGE_GUIDE.md` - Code examples and workflows

### Key Methods:

```typescript
// Create SMS campaign with landing page
await alpineiq.createSMSCampaign({
  campaignName: string,
  messageContent: string,      // Approved template
  landingHTML?: string,         // Your landing page
  phoneList: string[],
  startDate?: Date,
});

// Simple bulk SMS
await alpineiq.sendBulkSMS({
  customers: Array<{ phone: string }>,
  message: string,              // Approved template
  landingHTML?: string,
  campaignName?: string,
});

// Create email campaign
await alpineiq.createEmailCampaign({
  campaignName: string,
  subject: string,
  messageContent: string,       // HTML email content
  emailList: string[],
});
```

## ✅ Next Steps

1. **Log into Alpine IQ Dashboard** (https://lab.alpineiq.com)
2. **Find your approved templates**
   - Go to Campaigns → Create Campaign → SMS
   - Look for "Message Templates" section
   - Copy exact text
3. **Update `alpine-templates.ts`** with your actual templates
4. **Test with yourself** first
   - Send to your own phone
   - Verify link works
   - Check landing page on mobile
5. **Build vendor UI** for:
   - Selecting templates
   - Creating landing pages
   - Choosing customer segments
   - Scheduling campaigns
6. **Monitor results** in Alpine IQ dashboard

## 🚀 When to Migrate Away

Consider replacing Alpine IQ when:
- You need more than 3-5 message templates
- You want dynamic/personalized message content
- You need transactional messaging (order updates, etc.)
- Alpine IQ costs exceed $50/month
- You're ready to manage your own 10DLC registration

**Alternative:** Twilio + Resend
- Full message customization
- Better pricing (~$0.0079/SMS)
- Complete API control
- But requires 10DLC registration (1-6 weeks)
