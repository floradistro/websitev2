# Alpine IQ Integration Analysis

## Executive Summary

After thorough analysis of Alpine IQ's API, we've discovered that **Alpine IQ does NOT provide direct SMS/email sending APIs**. They are a **campaign management platform** where you create campaigns in their web dashboard, and they handle the actual message delivery.

---

## Current Integration (What We're Syncing)

### ✅ What We Currently Sync TO Alpine IQ:

1. **Customer Data**
   - Email, phone, name, birthdate
   - Synced on customer creation/update
   - Used for loyalty program enrollment

2. **Order Data**
   - Complete order details with line items
   - Synced after order completion
   - Used for automatic loyalty points calculation

3. **Loyalty Points**
   - Automatically tracked by Alpine IQ based on orders
   - Can be manually adjusted via API

### ❌ What Alpine IQ Does NOT Provide:

1. **Direct SMS Sending API** - No endpoint exists
2. **Direct Email Sending API** - No endpoint exists
3. **Campaign Creation API** - Must use web dashboard
4. **Programmatic Message Sending** - Not supported

---

## How Alpine IQ Actually Works

```
┌─────────────────┐
│  Your System    │
│  (Customers &   │
│   Orders)       │
└────────┬────────┘
         │ API Sync
         │ (customers, orders)
         ▼
┌─────────────────┐
│  Alpine IQ      │
│  Platform       │
└────────┬────────┘
         │
         ├──► Web Dashboard (You create campaigns here)
         │
         ├──► Audience Management (Built-in segmentation)
         │
         └──► Message Delivery (They send SMS/Email)
                     │
                     ▼
              Customer's Phone/Email
```

---

## API Capabilities (Confirmed via Testing)

### ✅ What Their API DOES Provide:

```typescript
// Customer Management
alpineiq.upsertCustomer()          // Create/update customer
alpineiq.lookupCustomerByPhone()   // Find customer
alpineiq.lookupCustomerByEmail()   // Find customer
alpineiq.searchCustomers()         // Search

// Loyalty
alpineiq.getLoyaltyConfig()        // Get loyalty program settings
alpineiq.getLoyaltyStatus()        // Get customer points/tier
alpineiq.adjustLoyaltyPoints()     // Manual point adjustment

// Orders
alpineiq.createSale()              // Sync order for points

// Campaigns (READ ONLY)
alpineiq.getCampaigns()            // View past campaigns
alpineiq.getCampaignStats()        // View campaign metrics

// Audiences
alpineiq.getAudiences()            // List segments
alpineiq.getAudienceMembers()      // Get segment members

// Opt-In
alpineiq.setEmailOptIn()           // Manage email consent
alpineiq.setSMSOptIn()             // Manage SMS consent
alpineiq.getOptInStatus()          // Check consent status
```

### ❌ What Their API Does NOT Provide:

```typescript
// THESE DO NOT EXIST:
alpineiq.sendSMS()                 // ❌ Not available
alpineiq.sendEmail()               // ❌ Not available
alpineiq.createCampaign()          // ❌ Not available
alpineiq.sendCampaign()            // ❌ Not available
alpineiq.scheduleMessage()         // ❌ Not available
```

---

## Simplified Integration Strategy

### Option 1: Minimal Alpine IQ Usage (Recommended)

**Use Alpine IQ ONLY for:**
- Loyalty points tracking (automatic from orders)
- Campaign creation in their web dashboard
- Compliance & opt-in management

**Use Our Own System for:**
- Customer segmentation (we have the data)
- Campaign targeting logic
- Direct SMS via **Twilio**
- Direct Email via **Resend** or **SendGrid**

### Option 2: Hybrid Approach

**Alpine IQ:**
- Sync customers & orders (keep doing this)
- Use their dashboard for marketing campaigns
- Benefit from their compliance features

**Our System:**
- Build segments based on our data
- Export customer lists
- Create audiences in Alpine IQ via API
- Let Alpine IQ handle message delivery

### Option 3: Full Replacement

**Replace Alpine IQ with:**
- **Twilio** for SMS
- **Resend** for Email
- **Our own loyalty system** (already built)
- Custom campaign builder (if needed)

---

## Cost-Benefit Analysis

### Alpine IQ Pros:
- ✅ Already integrated
- ✅ Handles compliance (TCPA, CAN-SPAM)
- ✅ Campaign management UI
- ✅ Loyalty program features
- ✅ Historical campaign data

### Alpine IQ Cons:
- ❌ No direct API control over messaging
- ❌ Must use their web dashboard for campaigns
- ❌ Can't programmatically send messages
- ❌ Limited customization
- ❌ Monthly cost for features we don't fully utilize

---

## Recommended Approach

### Phase 1: Keep Alpine IQ, Add Direct Messaging (Immediate)

1. **Keep current Alpine IQ integration:**
   - Continue syncing customers & orders
   - Use for loyalty point tracking
   - Use dashboard for scheduled marketing campaigns

2. **Add Twilio for SMS:**
   - Direct API control
   - Programmatic sending
   - Custom logic & timing
   - Our own segmentation

3. **Add Resend for Email:**
   - Direct API control
   - Custom email templates
   - Better deliverability tracking
   - Lower cost per email

### Phase 2: Evaluate Replacement (Later)

After 3-6 months, evaluate:
- Are we using Alpine IQ's campaign features?
- Cost comparison: Alpine IQ vs Twilio+Resend
- Do we need their compliance features?
- Can we fully self-manage loyalty?

---

## Code Changes Needed

### 1. Remove Unnecessary Alpine IQ Sync

Currently syncing: Customers, Orders, Loyalty Points

```typescript
// KEEP:
- Order sync (for loyalty points)
- Customer sync (for opt-in status)

// CAN REMOVE:
- Wallet pass generation (we built our own)
- Complex audience sync (we'll segment locally)
```

### 2. Add Twilio Integration

```typescript
// New file: lib/messaging/twilio-client.ts
export class TwilioClient {
  async sendSMS(to: string, message: string): Promise<void>
  async sendBulkSMS(recipients: Array<{phone: string, message: string}>): Promise<void>
  async getDeliveryStatus(messageId: string): Promise<any>
}
```

### 3. Add Resend Integration

```typescript
// New file: lib/messaging/resend-client.ts
export class ResendClient {
  async sendEmail(to: string, subject: string, html: string): Promise<void>
  async sendBulkEmail(recipients: Array<{email: string, ...}>): Promise<void>
  async sendTemplateEmail(template: string, data: any): Promise<void>
}
```

### 4. Unified Messaging Service

```typescript
// lib/messaging/index.ts
export class MessagingService {
  private twilio: TwilioClient;
  private resend: ResendClient;
  private alpineiq: AlpineIQClient; // For opt-in checks

  async sendSMS(customerId: string, message: string): Promise<void> {
    // Check opt-in status via Alpine IQ
    // Send via Twilio
    // Log in our database
  }

  async sendEmail(customerId: string, subject: string, html: string): Promise<void> {
    // Check opt-in status
    // Send via Resend
    // Log in our database
  }

  async sendCampaign(campaign: {
    name: string;
    segment: string;
    message: string;
    type: 'sms' | 'email';
  }): Promise<void> {
    // Get customers from segment
    // Check opt-in status for each
    // Send via appropriate service
    // Track results
  }
}
```

---

## Next Steps

1. ✅ **Analysis Complete** - Understanding of Alpine IQ capabilities
2. ⏳ **Decision Needed** - Which approach to take?
3. ⏳ **Implementation** - Based on chosen approach
4. ⏳ **Testing** - Verify new messaging works
5. ⏳ **Migration** - Gradually shift away from Alpine IQ (if decided)

---

## Questions to Answer

1. **Do we want to keep using Alpine IQ dashboard for campaigns?**
   - If YES → Keep integration, add Twilio/Resend for programmatic needs
   - If NO → Plan full replacement

2. **What's the monthly cost of Alpine IQ?**
   - Compare to: Twilio ($0.0079/SMS) + Resend ($20/mo for 50k emails)

3. **Do we need Alpine IQ's compliance features?**
   - TCPA compliance for SMS
   - CAN-SPAM compliance for email
   - Or can we handle this ourselves?

4. **How often do we need programmatic messaging vs scheduled campaigns?**
   - High frequency → Need direct API (Twilio/Resend)
   - Low frequency → Alpine IQ dashboard is fine
