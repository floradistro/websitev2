# How to Use Alpine IQ Messaging (RIGHT NOW)

## ✅ You're Already Setup!

Since you have 10DLC approval through Alpine IQ, you can start using their SMS/Email API immediately.

## Quick Start

### Option 1: Use the API Endpoint

```javascript
// Send SMS to all gold tier customers
POST /api/vendor/messaging/send
{
  "type": "sms",
  "segment": "loyalty_tier = 'gold'",
  "message": "Your approved message template here",
  "campaignName": "Gold Member Flash Sale"
}

// Send Email to customers with 100+ points
POST /api/vendor/messaging/send
{
  "type": "email",
  "segment": "loyalty_points >= 100",
  "subject": "Special Offer Just for You!",
  "message": "<h1>You've earned a reward!</h1><p>Your HTML email here</p>",
  "campaignName": "Loyalty Reward Email"
}

// Send to ALL customers
POST /api/vendor/messaging/send
{
  "type": "sms",
  "segment": "all",
  "message": "Your message here"
}
```

### Option 2: Use Alpine IQ Client Directly

```typescript
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';

// Initialize client
const alpineiq = createAlpineIQClient({
  api_key: 'YOUR_KEY',
  user_id: 'YOUR_ID',
});

// Send SMS
const result = await alpineiq.sendBulkSMS({
  customers: [
    { phone: '+15551234567' },
    { phone: '+15559876543' },
  ],
  message: 'Your approved message template',
  campaignName: 'Flash Sale Alert',
});

console.log(`Sent to ${result.recipientCount} customers`);
console.log(`Campaign ID: ${result.campaignId}`);

// Send Email
await alpineiq.sendBulkEmail({
  customers: [
    { email: 'customer@example.com' },
  ],
  subject: 'Special Offer',
  htmlContent: '<h1>Hello!</h1>',
  campaignName: 'Weekly Newsletter',
});
```

## 🚨 IMPORTANT: Message Template Approval

**The Issue:**
You're getting this error:
```
"invalid 10dlc: invalid notification message, must select from allowed list"
```

**What This Means:**
- Your 10DLC registration is active (good!)
- But your specific message templates aren't approved yet
- You need to get message templates approved by carriers

**How to Fix:**

### Step 1: Contact Alpine IQ Support

Email or call Alpine IQ and ask:
1. "What message templates are currently approved for our account?"
2. "How do we get new message templates approved?"
3. "Can you provide examples of approved template formats?"

### Step 2: Check Alpine IQ Dashboard

1. Log into Alpine IQ dashboard
2. Go to Campaigns → Create Campaign
3. Look for "Message Templates" or "Approved Messages"
4. These are the messages you CAN send via API

### Step 3: Submit New Templates (If Needed)

Common templates to request approval for:
- "Hi {firstName}, {storeName} has a special offer! {offerDetails}. Reply STOP to opt out."
- "Order #{orderNumber} is ready for pickup at {location}. See you soon!"
- "You've earned {points} points! Your new balance: {totalPoints} points."

## Example: Full Integration

```typescript
// In your app - send SMS to segment
import { createClient } from '@supabase/supabase-js';
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';

async function sendPromotionToGoldMembers() {
  const supabase = createClient(/* ... */);

  // 1. Get customers from YOUR database (your segmentation)
  const { data: customers } = await supabase
    .from('customers')
    .select('phone, first_name')
    .eq('loyalty_tier', 'gold')
    .gte('loyalty_points', 500);

  // 2. Send via Alpine IQ
  const alpineiq = createAlpineIQClient(/* your config */);

  const result = await alpineiq.sendBulkSMS({
    customers: customers.map(c => ({ phone: c.phone })),
    message: 'Your approved message template here', // Use approved template!
    campaignName: 'Gold Member Exclusive',
  });

  console.log(`✅ Campaign sent to ${result.recipientCount} gold members!`);
  return result.campaignId;
}
```

## Segmentation Examples

You control targeting using YOUR customer database:

```typescript
// All customers
.select('phone').eq('vendor_id', vendorId)

// Gold tier only
.select('phone').eq('loyalty_tier', 'gold')

// High spenders
.select('phone').gte('loyalty_points', 1000)

// Recent customers
.select('phone').gte('created_at', '2024-01-01')

// Inactive customers
.select('phone').lt('last_purchase_date', '2024-01-01')

// Combined filters
.select('phone')
  .eq('loyalty_tier', 'gold')
  .gte('loyalty_points', 500)
  .is('email_opt_in', true)
```

## API Methods Available

### SMS Methods:
```typescript
// Simple bulk SMS
alpineiq.sendBulkSMS({
  customers: [{ phone: '+1555...' }],
  message: 'Your message',
  campaignName: 'Campaign Name',
  sendAt: new Date('2024-12-25'), // Optional: schedule
});

// Advanced campaign creation
alpineiq.createSMSCampaign({
  campaignName: 'Flash Sale',
  messageContent: 'Approved template',
  phoneList: ['+1555...'],
  startDate: new Date(),
});
```

### Email Methods:
```typescript
// Simple bulk email
alpineiq.sendBulkEmail({
  customers: [{ email: 'user@example.com' }],
  subject: 'Subject Line',
  htmlContent: '<h1>HTML Email</h1>',
  campaignName: 'Newsletter',
});

// Advanced
alpineiq.createEmailCampaign({
  campaignName: 'Weekly Newsletter',
  subject: 'This Week at Store',
  messageContent: '<html>...</html>',
  emailList: ['user1@example.com', 'user2@example.com'],
});
```

## Next Steps

1. **Get Approved Templates** (PRIORITY)
   - Contact Alpine IQ support TODAY
   - Get list of currently approved messages
   - Request approval for your common use cases

2. **Start Using It**
   - Use the API endpoint or client methods
   - Test with small segments first
   - Monitor campaign results in Alpine IQ dashboard

3. **Track Results**
   - Campaigns saved to `marketing_campaigns` table
   - View stats via Alpine IQ dashboard
   - Use `alpineiq.getCampaignStats(campaignId)`

## While You Wait for Template Approval

Use Alpine IQ dashboard manually:
1. Create segment in dashboard
2. Create campaign in dashboard
3. Send from dashboard

Then later migrate to API once templates approved.

## Future: Migrate to Twilio/Resend

Once you want full control:
1. Register your own 10DLC with Twilio
2. No template restrictions
3. Full customization
4. Better pricing

But for now, Alpine IQ works and you're already paying for it!
