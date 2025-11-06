# Alpine IQ - Final Recommendation & Reality Check

## The Hard Truth

After extensive testing of the Alpine IQ API, here's what we discovered:

### ❌ What DOESN'T Work via API:
- **Creating SMS campaigns** with custom message content
- **Sending campaigns** programmatically
- **Updating existing campaigns**
- **Triggering campaign sends**

### ✅ What DOES Work via API:
- Reading campaign data/stats
- Syncing customer data
- Managing loyalty points
- Creating/managing audiences
- Viewing order history

## Why This Limitation Exists

**10DLC Compliance Requirements:**
- All marketing SMS must use carrier-approved templates
- Templates must be validated through Alpine IQ dashboard UI
- This is a **regulatory requirement**, not a technical limitation
- Alpine IQ restricts API to ensure compliance

## Your Question: "Can we create a default campaign and switch the link?"

**Answer: NO** - We tested:
- ❌ PUT/PATCH to update campaigns → 405 Method Not Allowed
- ❌ Trigger endpoints → 405 Method Not Allowed
- ❌ Send endpoints → 405 Method Not Allowed
- ❌ Clone endpoints → Don't exist

**The API is intentionally read-only for campaign operations.**

## What You CAN Actually Do

### Option 1: Hybrid Approach (RECOMMENDED)

**Use YOUR app for segmentation + Alpine dashboard for sending**

```
┌─────────────────────────────────────────────────────────────┐
│ YOUR APP (Supabase + Next.js)                               │
│                                                              │
│ 1. Segment customers:                                       │
│    - Gold tier members                                      │
│    - High spenders                                          │
│    - Recent purchasers                                      │
│    - Custom segments                                        │
│                                                              │
│ 2. Sync to Alpine IQ via API:                               │
│    - Create custom audience                                 │
│    - Upload customer contact info                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ ALPINE IQ DASHBOARD                                         │
│                                                              │
│ 1. Select your custom audience                              │
│ 2. Choose approved message template                         │
│ 3. Add landing page HTML                                    │
│ 4. Schedule and send                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ YOUR APP (Track Results)                                    │
│                                                              │
│ - Monitor campaign stats via API                            │
│ - Track clicks and conversions                              │
│ - Update customer engagement metrics                        │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// app/vendor/marketing/segments/page.tsx

export default function SegmentsPage() {
  const [segment, setSegment] = useState('gold_tier');

  async function syncToAlpineIQ() {
    // 1. Get customers from YOUR database
    const { data: customers } = await supabase
      .from('customers')
      .select('phone, first_name, email')
      .eq('vendor_id', vendorId)
      .eq('loyalty_tier', segment);

    // 2. Create audience in Alpine IQ
    const phoneNumbers = customers.map(c => c.phone);

    const alpineiq = createAlpineIQClient({
      apiKey: process.env.ALPINE_IQ_API_KEY!,
      userId: process.env.ALPINE_IQ_USER_ID!,
    });

    // Sync customers to Alpine IQ
    for (const customer of customers) {
      await alpineiq.createOrUpdateCustomer({
        email: customer.email,
        phone: customer.phone,
        firstName: customer.first_name,
      });
    }

    // Create custom audience
    const audience = await alpineiq.createAudienceFromPhones({
      name: `${segment.toUpperCase()} - ${new Date().toLocaleDateString()}`,
      phoneNumbers: phoneNumbers,
    });

    alert(`✅ Synced ${customers.length} customers to Alpine IQ!
Audience ID: ${audience.audienceId}

Now go to Alpine IQ dashboard to send campaign:
1. Create SMS Campaign
2. Select audience: ${segment}
3. Choose template and send`);
  }

  return (
    <div>
      <h1>Customer Segments</h1>

      <select value={segment} onChange={e => setSegment(e.target.value)}>
        <option value="gold_tier">Gold Tier (High Value)</option>
        <option value="new_customers">New Customers (< 30 days)</option>
        <option value="inactive">Inactive (> 90 days)</option>
      </select>

      <button onClick={syncToAlpineIQ}>
        Sync to Alpine IQ & Create Audience
      </button>

      <p>After syncing, go to Alpine IQ dashboard to send campaign</p>
    </div>
  );
}
```

### Option 2: Export CSV (Simpler)

**Build a simple export feature:**

```typescript
// app/vendor/marketing/export/page.tsx

export default function ExportCustomersPage() {
  async function exportToCSV(segment: string) {
    const { data: customers } = await supabase
      .from('customers')
      .select('phone, first_name, email')
      .eq('vendor_id', vendorId)
      .eq('loyalty_tier', segment);

    // Convert to CSV
    const csv = [
      'Phone,First Name,Email',
      ...customers.map(c => `${c.phone},${c.first_name},${c.email}`)
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${segment}-customers-${Date.now()}.csv`;
    a.click();
  }

  return (
    <div>
      <h1>Export Customers for Alpine IQ</h1>

      <button onClick={() => exportToCSV('gold')}>
        Export Gold Tier
      </button>

      <button onClick={() => exportToCSV('all')}>
        Export All Customers
      </button>

      <ol>
        <li>Click export button</li>
        <li>Open Alpine IQ dashboard</li>
        <li>Upload CSV to create audience</li>
        <li>Create and send campaign</li>
      </ol>
    </div>
  );
}
```

### Option 3: Replace Alpine IQ (Long-term)

**For full programmatic control, migrate to:**

**Twilio** (SMS) + **Resend** (Email)

**Pros:**
- ✅ Full API control
- ✅ No template restrictions (after 10DLC approval)
- ✅ Better pricing
- ✅ Transactional + marketing messages
- ✅ Dynamic content

**Cons:**
- ❌ Requires 10DLC registration (1-6 weeks)
- ❌ You manage compliance
- ❌ Initial setup effort

**Timeline:**
- Week 1: Set up Twilio + Resend accounts
- Week 1-6: Wait for 10DLC approval
- Week 2-6: Build messaging infrastructure
- Week 6+: Full programmatic control

**Costs:**
- Twilio: $0.0079/SMS + $4/mo per number
- Resend: $20/mo (50,000 emails)
- **Total: ~$25/mo + usage**

Compare to Alpine IQ monthly cost to determine if worth it.

## Recommended Immediate Action

### Build This in Your App:

1. **Customer Segments UI** (`/vendor/marketing/segments`)
   - Show customer counts per segment
   - Preview segment criteria
   - One-click sync to Alpine IQ

2. **CSV Export** (`/vendor/marketing/export`)
   - Export any segment to CSV
   - Upload to Alpine dashboard

3. **Campaign Tracker** (`/vendor/marketing/campaigns`)
   - View Alpine IQ campaigns via API
   - Show stats (sent, clicks, conversions)
   - Track ROI

4. **Instructions Page** (`/vendor/marketing/how-to`)
   - Step-by-step guide for using Alpine dashboard
   - Screenshots and workflow
   - Best practices

### Sample Workflow:

```
Monday 9am:
  → You: Open your app
  → You: Go to /vendor/marketing/segments
  → You: Select "Gold Tier Members"
  → You: Click "Sync to Alpine IQ"
  → App: Creates audience in Alpine IQ
  → App: Shows message: "Synced 150 customers! Go to Alpine dashboard"

Monday 9:05am:
  → You: Open Alpine IQ dashboard
  → You: Create New Campaign → SMS
  → You: Select audience: "Gold Tier Members"
  → You: Select template: "Special offer! {{landingPage}}"
  → You: Add landing HTML: "<h1>25% Off Today!</h1>"
  → You: Schedule for 10am
  → You: Click Send

Monday 10am:
  → Alpine IQ: Sends SMS to 150 customers

Monday 2pm:
  → You: Check /vendor/marketing/campaigns
  → App: Shows campaign stats via API
  → You: See: 150 sent, 45 clicks (30% CTR)
```

## Bottom Line

**You cannot create/send campaigns via Alpine IQ API.**

This is by design for 10DLC compliance.

**Your best options:**
1. **Short-term:** Use hybrid approach (your app for segmentation, dashboard for sending)
2. **Long-term:** Migrate to Twilio + Resend for full control

**What I've built for you:**
- ✅ Alpine IQ client with all working API methods
- ✅ Customer/audience sync capabilities
- ✅ Campaign stats tracking
- ✅ Complete documentation

**What you need to build:**
- Segments UI for easy customer selection
- One-click sync to Alpine IQ
- Campaign tracker dashboard
- (Optional) CSV export for manual upload

**Time investment:**
- Hybrid approach: 1-2 days to build UI
- Twilio migration: 1-2 weeks + 4-6 weeks for approval
