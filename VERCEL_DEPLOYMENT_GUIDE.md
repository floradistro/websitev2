# Vercel Deployment Guide - Marketing & AI Features

## Required Environment Variables

Add these to your Vercel project settings:

### OpenAI (Required for AI features)
```bash
OPENAI_API_KEY=sk-proj-...your-new-key...
```

### Alpine IQ (Required for Flora Distro)
```bash
ALPINEIQ_API_KEY=your-alpineiq-api-key
ALPINEIQ_API_URL=https://api.alpineiq.com
ALPINEIQ_LOCATION_ID=your-location-id
```

### Supabase (Already configured)
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Email/SMS Providers (Optional - for sending campaigns)
```bash
# SendGrid for Email
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@floradistro.com

# Twilio for SMS
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Deployment Steps

### 1. Add Environment Variables to Vercel

```bash
# Using Vercel CLI
vercel env add OPENAI_API_KEY
vercel env add ALPINEIQ_API_KEY
vercel env add ALPINEIQ_API_URL
vercel env add ALPINEIQ_LOCATION_ID

# Or via Vercel Dashboard:
# https://vercel.com/your-org/your-project/settings/environment-variables
```

### 2. Trigger Deployment

```bash
# Option A: Push to main (auto-deploys)
git push origin main

# Option B: Manual deploy via CLI
vercel --prod

# Option C: Via Vercel Dashboard
# Go to Deployments → Click "Redeploy"
```

### 3. Verify New Routes

After deployment, test these endpoints:

```bash
# AI Routes
https://your-domain.com/api/ai/generate-kpi
https://your-domain.com/api/ai/optimize-layout

# Marketing Routes
https://your-domain.com/api/vendor/marketing/stats
https://your-domain.com/api/vendor/marketing/sms/generate
https://your-domain.com/api/vendor/marketing/email/generate

# Alpine IQ Routes
https://your-domain.com/api/webhooks/alpineiq
```

### 4. Run Database Migrations

```bash
# Connect to your production Supabase
# Run these migrations in order:
supabase/migrations/20251029_marketing_system.sql
supabase/migrations/20251029_ai_layout_system.sql
supabase/migrations/20251029_custom_kpi_widgets.sql
supabase/migrations/20251029_display_groups.sql
supabase/migrations/20251029_vendor_media_library.sql
```

## New Features Deployed

### Marketing Hub (`/vendor/marketing`)
- ✅ Email campaign builder with AI generation
- ✅ SMS campaign builder (160-char optimized)
- ✅ Customer segmentation engine
- ✅ Automation rules
- ✅ Campaign analytics

### AI Features (`/vendor/dashboard`)
- ✅ AI KPI widget creator
- ✅ Layout optimizer for TV displays
- ✅ Category recommender

### Alpine IQ Integration
- ✅ Bidirectional customer sync
- ✅ Order sync for loyalty points
- ✅ Campaign webhook receiver
- ⏳ **Loyalty data sync (in progress)**
- ⏳ **Campaign preview/test (in progress)**

## Troubleshooting

### Issue: 404 on new routes
**Solution**: Hard refresh browser cache or wait 1-2 minutes for CDN propagation

### Issue: AI generation fails
**Solution**: Verify `OPENAI_API_KEY` is set in Vercel env vars

### Issue: Alpine IQ sync not working
**Solution**: Check Alpine IQ credentials and webhook URL

### Issue: Function timeout
**Solution**: AI/Marketing routes now have 60s timeout (updated in vercel.json)

## Monitoring

Check logs in Vercel Dashboard:
```
https://vercel.com/your-org/your-project/deployments
```

Look for:
- Marketing API calls
- AI generation requests
- Alpine IQ webhook events
- Any 500 errors

## Next Steps

1. ✅ Update vercel.json (done)
2. ⏳ Add Alpine IQ campaign preview
3. ⏳ Add test campaign sending
4. ⏳ Sync Flora Distro loyalty data
5. ⏳ Configure SendGrid/Twilio for production sending

