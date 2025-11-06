# How Alpine IQ Templates ACTUALLY Work

## Your Question: "How does it validate we used a template if we copy/paste it?"

**Perfect question!** Here's the complete answer:

## The Validation System

```
┌─────────────────────────────────────────────────────────────────┐
│ ALPINE IQ SERVER (Their Database)                               │
│                                                                  │
│ Approved Templates for User 3999:                               │
│   ✅ "Flash sale alert! Click here: {link}"                     │
│   ✅ "New products available! {link}"                           │
│   ✅ "Hi {firstName}, special offer for you: {link}"            │
│   ✅ "Order ready for pickup. Reply STOP to opt out."           │
│                                                                  │
│ (These were approved by carriers during 10DLC registration)     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ YOU CALL API WITH:                                              │
│                                                                  │
│ POST /api/v2/campaign                                           │
│ {                                                                │
│   "messageContent": "Flash sale alert! Click here: {link}"      │
│   "phoneList": ["+15551234567"]                                 │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ ALPINE IQ VALIDATES:                                            │
│                                                                  │
│ 1. Check: Is "Flash sale alert! Click here: {link}"            │
│           in the approved list for user 3999?                   │
│                                                                  │
│ 2. Result: ✅ YES → Create campaign                             │
│           ❌ NO  → Return 10DLC error                           │
└─────────────────────────────────────────────────────────────────┘
```

## How You Copy/Paste Ensures Match

### Step 1: Alpine IQ Dashboard Shows Approved Templates

When you log into Alpine IQ dashboard and go to create a campaign, you'll see something like:

```
┌─────────────────────────────────────────────┐
│ Select Message Template:                    │
│                                              │
│ [ Flash sale alert! Click here: {link}  ▼] │
│                                              │
│ Options:                                     │
│   • Flash sale alert! Click here: {link}    │
│   • New products available! {link}          │
│   • Hi {firstName}, special offer: {link}   │
│   • Order ready for pickup. Reply STOP...   │
└─────────────────────────────────────────────┘
```

### Step 2: You Copy EXACT Text to Your Code

```typescript
// lib/marketing/alpine-templates.ts

export const ALPINE_APPROVED_TEMPLATES = {
  FLASH_SALE: {
    // Copied EXACTLY from dropdown above ↑
    message: 'Flash sale alert! Click here: {link}',
    description: 'Flash sale template',
  },
};
```

### Step 3: API Call Uses Same Text

```typescript
await alpineiq.createSMSCampaign({
  messageContent: ALPINE_APPROVED_TEMPLATES.FLASH_SALE.message,
  // ↑ This sends "Flash sale alert! Click here: {link}"
  phoneList: ['+15551234567'],
});
```

### Step 4: Alpine IQ Validates

```javascript
// What happens on Alpine IQ server:

const receivedMessage = "Flash sale alert! Click here: {link}";
const approvedTemplates = [
  "Flash sale alert! Click here: {link}",  // ← EXACT MATCH! ✅
  "New products available! {link}",
  "Hi {firstName}, special offer: {link}",
];

if (approvedTemplates.includes(receivedMessage)) {
  // ✅ Create campaign
  return { success: true, campaignId: "123456" };
} else {
  // ❌ Reject
  return { error: "invalid 10dlc: invalid notification message" };
}
```

## Why This System Exists

### The Problem It Solves:
- **Carriers (AT&T, Verizon, T-Mobile)** don't want spam
- **10DLC regulations** require pre-approved message templates
- **Alpine IQ** manages the approval process for you
- **Approved templates** are stored in Alpine IQ's database

### Why Templates Aren't in the API:
1. **Security:** Can't be modified or bypassed
2. **Compliance:** Ensures only approved messages are sent
3. **Centralization:** Alpine IQ manages carrier relationships

## The Real Workflow

### 1. Initial Setup (Done Once)
```
You → Alpine IQ Support: "I need these message templates approved"
Alpine IQ → Carriers: "Please approve these templates for customer X"
Carriers → Alpine IQ: "Approved!" (takes 1-6 weeks)
Alpine IQ → Their Database: Stores approved templates for your user ID
```

### 2. Viewing Templates (In Dashboard)
```
You → Log into lab.alpineiq.com
Dashboard → Shows dropdown with approved templates
You → Copy exact text
```

### 3. Using Templates (Via API)
```
Your Code → Sends exact template text in API call
Alpine IQ Server → Checks if text matches approved list
If Match → Creates campaign ✅
If No Match → Returns 10DLC error ❌
```

## Current Situation

### Test Results:
All test messages were **rejected** because:
- ❌ "Hey! Check out our awesome sale today!"
- ❌ "Special offer! {link}"
- ❌ "Flash sale alert! {link}"
- ❌ "Your order is ready for pickup. Reply STOP to opt out."

**None of these are in your approved list.**

### What This Means:
1. You have **specific approved templates** in Alpine IQ system
2. They are **different** from the examples I tested
3. You **must** check the dashboard to see the exact text

## How to Find Your Approved Templates

### Method 1: Dashboard UI (Easiest)
1. Go to https://lab.alpineiq.com
2. Navigate to: **Campaigns** → **Create Campaign** → **SMS/Text**
3. Look for one of these:
   - "Select Template" dropdown
   - "Message Template" field
   - "Approved Messages" section
   - Pre-filled message box with options
4. **Copy the EXACT text** (character-for-character)

### Method 2: Ask Alpine IQ Support
- Email: support@alpineiq.com
- Request: "Please provide list of approved 10DLC message templates for user ID 3999"
- They can send you the complete list

### Method 3: Check Past Successful Campaigns
- Look at campaigns you created successfully in the dashboard
- The message text that worked is an approved template

## What to Look For

Your approved templates will look something like:

```
✅ "[Brand] New products in stock! Check them out: {link} Reply STOP to end"
✅ "Hi {firstName}! Exclusive offer waiting for you at [Brand]: {link}"
✅ "Your [Brand] order #{orderNum} is ready! Visit us at {location}. Text STOP to opt out"
```

Key characteristics:
- May include your **brand name**
- Will have **{placeholders}** like {link}, {firstName}, {storeName}
- Must include **opt-out text** like "Reply STOP" or "Text STOP to opt out"
- Are **very specific** to your registration

## Once You Have Your Templates

### Update Your Code:

```typescript
// lib/marketing/alpine-templates.ts

export const ALPINE_APPROVED_TEMPLATES = {
  FLASH_SALE: {
    // Replace with YOUR actual approved template
    message: '[Your Brand] New products in stock! Check them out: {link} Reply STOP to end',
    description: 'Flash sale with landing page',
    requiresLandingPage: true,
  },

  PERSONALIZED_OFFER: {
    message: 'Hi {firstName}! Exclusive offer waiting for you at [Your Brand]: {link}',
    description: 'Personalized offer',
    requiresLandingPage: true,
  },

  ORDER_READY: {
    message: 'Your [Your Brand] order #{orderNum} is ready! Visit us at {location}. Text STOP to opt out',
    description: 'Order pickup notification',
    requiresLandingPage: false,
  },
};
```

### Test It:

```typescript
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';
import { ALPINE_APPROVED_TEMPLATES } from '@/lib/marketing/alpine-templates';

async function test() {
  const alpineiq = createAlpineIQClient({
    apiKey: process.env.ALPINE_IQ_API_KEY!,
    userId: process.env.ALPINE_IQ_USER_ID!,
  });

  // Test with YOUR actual approved template
  const result = await alpineiq.createSMSCampaign({
    campaignName: 'Test Campaign',
    messageContent: ALPINE_APPROVED_TEMPLATES.FLASH_SALE.message,
    landingHTML: '<h1>Test</h1>',
    phoneList: ['+1YOUR_PHONE_NUMBER'], // Your actual phone
    startDate: new Date(Date.now() + 1800000),
  });

  console.log('✅ Campaign created:', result.campaignId);
}

test();
```

If this works → Your template is correct! ✅
If this fails → Copy the exact text again from dashboard

## Summary

**Your original question:** "How does it validate we used a template if we copy/paste it?"

**Answer:**
1. Alpine IQ stores approved templates in **their database** (server-side)
2. When you call the API with `messageContent: "Some text"`
3. Alpine IQ checks if `"Some text"` **exactly matches** an approved template
4. If match → Campaign created ✅
5. If no match → 10DLC error ❌

**Why copy/paste:**
- Dashboard shows you what's in Alpine IQ's database
- You copy it so your API call sends **the same text**
- This ensures **exact string match** during validation

**Next step:**
- Open Alpine IQ dashboard
- Find the template dropdown/selector
- Copy your actual approved templates
- Update `alpine-templates.ts` with real text
- Test again!
