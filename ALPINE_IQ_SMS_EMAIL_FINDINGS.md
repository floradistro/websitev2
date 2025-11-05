# Alpine IQ SMS/Email Findings - CRITICAL UPDATE

## ✅ ALPINE IQ **DOES** HAVE CAMPAIGN CREATION API!

### What We Discovered:

The `/api/v2/campaign` endpoint **EXISTS and WORKS** for creating campaigns programmatically!

### Required Fields:

```javascript
{
  campaignName: string,           // Name of the campaign
  campaignType: 'TEXT' | 'EMAIL', // Type
  messageContent: string,          // The actual message
  userId: string,                  // Your Alpine IQ user ID
  startDate: number,               // Unix timestamp (seconds)

  // ONE OF THE FOLLOWING (recipient targeting):
  phoneList: string[],             // Array of phone numbers
  emailList: string[],             // Array of emails
  contactIDs: string[],            // Array of Alpine IQ contact IDs
  audienceId: string               // Or use a pre-defined audience
}
```

### **CRITICAL LIMITATION DISCOVERED:**

```
Error: "invalid 10dlc: invalid notification message,
must select from allowed list"
```

**What this means:**
- Alpine IQ has **10DLC compliance restrictions**
- You can only send messages from a **pre-approved template list**
- This is due to carrier regulations (AT&T, Verizon, T-Mobile)
- Custom messages require carrier approval process

---

## What Is 10DLC?

**10DLC** = 10-Digit Long Code (the phone number SMS is sent from)

### The Problem:
- Carriers (AT&T/Verizon/T-Mobile) require **registration** for business messaging
- Each message template must be **pre-approved** by carriers
- This prevents spam and ensures compliance
- Approval can take 1-6 weeks

### Two Options:

#### Option 1: Use Alpine IQ's Pre-Approved Templates
- Fastest option
- Limited customization
- Must work within approved message formats

#### Option 2: Register Your Own 10DLC Campaign
- Full control over messaging
- Requires carrier approval (1-6 weeks)
- Costs: ~$4/mo per number + $10-15 registration fee
- Can use with Twilio directly

---

## Alpine IQ SMS/Email Capabilities - FINAL ANSWER

### ✅ What You CAN Do:

1. **Create Campaigns via API**
   ```javascript
   POST /api/v2/campaign
   {
     campaignName: 'Flash Sale Alert',
     campaignType: 'TEXT',
     messageContent: '[APPROVED_TEMPLATE_ID]', // Must use approved template
     userId: '3999',
     startDate: Math.floor(Date.now() / 1000) + 3600,
     phoneList: ['+15551234567', '+15559876543']
   }
   ```

2. **Send to Custom Phone/Email Lists**
   - You segment customers in YOUR database
   - Pass phone numbers/emails to Alpine IQ
   - They handle delivery

3. **Send to Alpine IQ Audiences**
   - Create audiences via API or dashboard
   - Target by audience ID

4. **Schedule Campaigns**
   - Set startDate for future delivery
   - Automate timing

### ❌ What You CANNOT Do (Without Carrier Approval):

1. **Send Custom Message Content**
   - Must use pre-approved templates
   - Cannot dynamically generate messages
   - Limited personalization

2. **Immediate Custom Messaging**
   - Transactional messages need approval
   - Cannot send "Your order is ready" without template

---

## Recommended Strategy - UPDATED

### Option A: Work Within Alpine IQ Limitations

**For:**
- Scheduled marketing campaigns
- Bulk announcements
- Simple notifications

**How:**
1. Get list of approved message templates from Alpine IQ
2. Use API to create campaigns with approved templates
3. Segment customers in your database
4. Pass customer lists to Alpine IQ API
5. Let Alpine IQ handle delivery

**Pros:**
- ✅ Compliance handled by Alpine IQ
- ✅ Works immediately
- ✅ No carrier registration needed

**Cons:**
- ❌ Limited message customization
- ❌ Must use their templates
- ❌ Slower for dynamic messages

---

### Option B: Replace with Twilio + Resend (RECOMMENDED)

**For:**
- Custom message content
- Transactional messaging
- Dynamic personalization
- Full control

**How:**
1. **Register 10DLC Campaign with Twilio**
   - Takes 1-6 weeks
   - One-time setup
   - ~$19 total cost

2. **Set up Resend for Email**
   - Instant setup
   - $20/mo for 50,000 emails
   - Custom templates

3. **Build in your app:**
   ```javascript
   // Transactional SMS
   await twilio.sendSMS(customer.phone, `Hi ${customer.name}! Your order #${orderId} is ready for pickup.`);

   // Marketing campaign
   const segment = await db.customers.where('loyalty_tier', 'gold').get();
   await twilio.sendBulkSMS(
     segment.map(c => ({
       to: c.phone,
       message: `Exclusive Gold Member Sale! 25% off today only.`
     }))
   );
   ```

**Pros:**
- ✅ Full message customization
- ✅ Dynamic content
- ✅ Transactional messages
- ✅ Better pricing ($0.0079/SMS)
- ✅ Complete API control

**Cons:**
- ❌ Requires 10DLC registration (1-6 weeks)
- ❌ You manage compliance
- ❌ Initial setup effort

---

### Option C: Hybrid (Best of Both Worlds)

**Alpine IQ for:**
- Scheduled marketing campaigns (approved templates)
- Loyalty point notifications
- Compliance management

**Twilio + Resend for:**
- Transactional messages (order ready, etc.)
- Custom campaigns
- Dynamic personalization

**Implementation:**
```javascript
// Transactional (Twilio)
if (message.type === 'transactional') {
  await twilio.sendSMS(customer.phone, message.content);
}

// Marketing (Alpine IQ)
if (message.type === 'marketing') {
  await alpineiq.createCampaign({
    messageContent: getApprovedTemplateId(message.intent),
    phoneList: [customer.phone]
  });
}
```

---

## Next Steps

1. **Contact Alpine IQ Support**
   - Request list of approved message templates
   - Ask about template approval process
   - Get documentation for campaign API

2. **If Using Alpine IQ:**
   - Get template IDs
   - Test campaign creation with approved templates
   - Build integration layer

3. **If Replacing:**
   - Register 10DLC with Twilio
   - Set up Resend account
   - Build messaging service layer
   - Phase out Alpine IQ

4. **If Hybrid:**
   - Do both above
   - Route messages based on type
   - Gradual migration

---

## Cost Comparison

### Alpine IQ:
- Unknown monthly fee (check your invoice)
- Includes compliance
- Limited flexibility

### Twilio + Resend:
- Twilio: $0.0079/SMS (~$79 for 10,000 texts)
- Resend: $20/mo (50,000 emails)
- 10DLC registration: $4/mo per number
- **Total: ~$24/mo + usage**

### Break-even:
If Alpine IQ costs more than $24/mo, Twilio+Resend is cheaper AND more flexible.

---

## My Recommendation

**Replace Alpine IQ with Twilio + Resend**

**Why:**
1. You already have your own loyalty system
2. You need custom message content
3. You want transactional messaging
4. Better cost-per-message
5. Full API control
6. No template restrictions after 10DLC approval

**Timeline:**
- Week 1: Set up Twilio + Resend accounts
- Week 1-6: Wait for 10DLC approval
- Week 2-6: Build messaging service (while waiting)
- Week 6: Cut over from Alpine IQ
- Week 7+: Cancel Alpine IQ subscription

**ROI:**
- Save money on per-message costs
- Gain flexibility for custom messages
- Enable transactional messaging
- Better customer experience
