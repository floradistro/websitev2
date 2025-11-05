# Alpine IQ Messaging - Complete Usage Guide

## ✅ What Works

After thorough testing, here's exactly how Alpine IQ messaging works:

### The Workflow

1. **Segment customers in YOUR database** (Supabase)
2. **Get phone numbers/emails** from your customer data
3. **Use approved message template** from Alpine IQ dashboard
4. **Create campaign via API** with phone list + template
5. **Alpine IQ handles delivery** and compliance

### Required Parameters

When creating campaigns, you MUST provide:

```typescript
{
  campaignName: string,
  campaignType: 'TEXT' | 'EMAIL',
  messageContent: string,     // Must be approved template text
  userId: '3999',
  startDate: number,           // Unix timestamp

  // At least ONE of these (required):
  phoneList: string[],         // For SMS
  emailList: string[],         // For email
  contactIDs: string[],        // Alpine IQ contact IDs

  // Optional:
  audienceId: string           // For tracking/segmentation
}
```

## 🚨 The 10DLC Restriction

**Error you'll see:**
```
"invalid 10dlc: invalid notification message, must select from allowed list"
```

**What this means:**
- You have 10DLC approval ✅
- But message templates must be pre-approved by carriers
- You cannot send custom message content
- You must use exact text from approved templates

**How to fix:**
1. Log into Alpine IQ dashboard
2. Go to Campaigns → Templates (or similar)
3. Find your approved message templates
4. Copy the EXACT text
5. Use that text in `messageContent`

## 📱 How to Use (Step by Step)

### Step 1: Get Approved Templates

**You need to do this manually:**
1. Open Alpine IQ dashboard
2. Find "Message Templates" or "Approved Templates"
3. Copy the template text(s) you want to use
4. Save them somewhere (or add to your app as constants)

Example approved templates might look like:
```
"Hi {firstName}, we have a special offer for you! Visit us today. Reply STOP to opt out."
"Your order #{orderNumber} is ready for pickup. See you soon!"
"You've earned {points} loyalty points! Thanks for being a valued customer."
```

### Step 2: Use in Your Code

```typescript
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';
import { createClient } from '@supabase/supabase-js';

// Your approved templates (get from dashboard)
const APPROVED_TEMPLATES = {
  FLASH_SALE: 'Hi {firstName}, we have a special offer for you! Visit us today. Reply STOP to opt out.',
  ORDER_READY: 'Your order #{orderNumber} is ready for pickup. See you soon!',
  POINTS_EARNED: 'You\'ve earned {points} loyalty points! Thanks for being a valued customer.',
};

async function sendFlashSaleToGoldMembers() {
  const supabase = createClient(/* ... */);

  // 1. Segment customers from YOUR database
  const { data: customers } = await supabase
    .from('customers')
    .select('phone, first_name')
    .eq('vendor_id', vendorId)
    .eq('loyalty_tier', 'gold')
    .gte('loyalty_points', 500);

  // 2. Get phone numbers
  const phoneNumbers = customers
    .filter(c => c.phone)
    .map(c => c.phone);

  // 3. Create campaign with approved template
  const alpineiq = createAlpineIQClient({
    apiKey: process.env.ALPINE_IQ_API_KEY!,
    userId: process.env.ALPINE_IQ_USER_ID!,
  });

  const result = await alpineiq.createSMSCampaign({
    campaignName: 'Flash Sale - Gold Members',
    messageContent: APPROVED_TEMPLATES.FLASH_SALE,
    phoneList: phoneNumbers,
    startDate: new Date(Date.now() + 3600000), // 1 hour from now
  });

  console.log(`✅ Campaign created: ${result.campaignId}`);
  console.log(`   Will send to ${phoneNumbers.length} customers`);
}
```

### Step 3: Using the API Endpoint

Or use the built-in API endpoint:

```bash
curl -X POST http://localhost:3000/api/vendor/messaging/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sms",
    "segment": "loyalty_tier = '\''gold'\''",
    "message": "Your approved template text here",
    "campaignName": "Flash Sale Alert"
  }'
```

The API endpoint (`/api/vendor/messaging/send`) will:
1. Query YOUR customers database based on segment
2. Extract phone numbers
3. Create campaign in Alpine IQ
4. Return campaign ID and recipient count

## 📊 Available Methods

### Send SMS to Customer List

```typescript
const result = await alpineiq.sendBulkSMS({
  customers: [
    { phone: '+15551234567' },
    { phone: '+15559876543' },
  ],
  message: APPROVED_TEMPLATES.FLASH_SALE,
  campaignName: 'Weekend Sale',
});
```

### Send Email to Customer List

```typescript
const result = await alpineiq.sendBulkEmail({
  customers: [
    { email: 'customer@example.com' },
  ],
  subject: 'Special Offer Just for You',
  htmlContent: '<h1>Hello!</h1><p>Your approved email template here</p>',
  campaignName: 'Email Newsletter',
});
```

### Create SMS Campaign (Advanced)

```typescript
const result = await alpineiq.createSMSCampaign({
  campaignName: 'Black Friday Sale',
  messageContent: APPROVED_TEMPLATES.FLASH_SALE,
  phoneList: ['+15551234567', '+15559876543'],
  startDate: new Date('2024-11-29T08:00:00'),
});
```

### Create Email Campaign (Advanced)

```typescript
const result = await alpineiq.createEmailCampaign({
  campaignName: 'Weekly Newsletter',
  subject: 'This Week at Our Store',
  messageContent: '<html>Your email HTML here</html>',
  emailList: ['customer1@example.com', 'customer2@example.com'],
  startDate: new Date('2024-12-01T10:00:00'),
});
```

## 🎯 Complete Example: Send to Segment

```typescript
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';
import { createClient } from '@supabase/supabase-js';

const APPROVED_TEMPLATES = {
  NEW_PRODUCT: 'New products just arrived! Come check them out. Reply STOP to opt out.',
};

async function notifyHighValueCustomers() {
  // Initialize clients
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const alpineiq = createAlpineIQClient({
    apiKey: process.env.ALPINE_IQ_API_KEY!,
    userId: process.env.ALPINE_IQ_USER_ID!,
  });

  // Get high-value customers from YOUR database
  const { data: customers } = await supabase
    .from('customers')
    .select('id, phone, first_name, email')
    .eq('vendor_id', 'your-vendor-id')
    .gte('lifetime_spend', 500)
    .eq('sms_opt_in', true);

  console.log(`Found ${customers.length} high-value customers`);

  // Get valid phone numbers
  const phoneNumbers = customers
    .filter(c => c.phone)
    .map(c => c.phone);

  console.log(`${phoneNumbers.length} have valid phone numbers`);

  // Create SMS campaign
  const result = await alpineiq.createSMSCampaign({
    campaignName: 'New Product Alert - High Value Customers',
    messageContent: APPROVED_TEMPLATES.NEW_PRODUCT,
    phoneList: phoneNumbers,
    startDate: new Date(Date.now() + 1800000), // 30 minutes from now
  });

  // Log to your database
  await supabase.from('marketing_campaigns').insert({
    vendor_id: 'your-vendor-id',
    name: 'New Product Alert',
    type: 'sms',
    provider: 'alpineiq',
    provider_campaign_id: result.campaignId,
    recipients_count: phoneNumbers.length,
    segment: 'lifetime_spend >= 500',
    message_content: APPROVED_TEMPLATES.NEW_PRODUCT,
    scheduled_at: new Date(Date.now() + 1800000).toISOString(),
    status: 'scheduled',
  });

  return {
    campaignId: result.campaignId,
    recipientCount: phoneNumbers.length,
  };
}

// Run it
notifyHighValueCustomers()
  .then(result => {
    console.log('✅ Campaign created successfully!');
    console.log(`   Campaign ID: ${result.campaignId}`);
    console.log(`   Recipients: ${result.recipientCount}`);
  })
  .catch(error => {
    console.error('❌ Campaign failed:', error.message);
  });
```

## 🔧 Environment Variables

Add to `.env.local`:

```bash
ALPINE_IQ_API_KEY=U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw
ALPINE_IQ_USER_ID=3999
```

## ⚠️ Important Notes

### Message Templates
- You **MUST** use approved templates from Alpine IQ dashboard
- Cannot send custom/dynamic messages without carrier approval
- Each template must go through carrier approval process
- Contact Alpine IQ support to get new templates approved

### Segmentation
- Do segmentation in YOUR database (Supabase)
- Alpine IQ just handles delivery
- You control who gets what message

### Timing
- Campaigns are scheduled (not instant)
- Minimum: startDate must be in the future
- Recommended: Schedule at least 30-60 minutes ahead

### Audience IDs (Optional)
- You can create audiences in Alpine IQ dashboard
- Use `audienceId` parameter for tracking purposes
- But you still need to provide `phoneList` or `emailList`

## 🚀 Next Steps

1. **Get approved templates** from Alpine IQ dashboard (Priority #1)
2. **Test with one customer** first
3. **Build UI** for selecting templates and segments
4. **Monitor campaigns** via Alpine IQ dashboard
5. **Track results** in your `marketing_campaigns` table

## 💡 Future: Migrate to Twilio

Once you're ready for full control:
- Register your own 10DLC with Twilio (~1-6 weeks)
- No template restrictions after approval
- Better pricing ($0.0079/SMS vs Alpine IQ markup)
- Full API control

But for now, Alpine IQ works and you already have it setup!
