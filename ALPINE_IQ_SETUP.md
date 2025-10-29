# Alpine IQ Setup Guide

## ✅ What's Already Configured

### Local Development (.env.local)
```bash
ALPINEIQ_API_KEY=U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw
ALPINEIQ_API_URL=https://lab.alpineiq.com
ALPINEIQ_USER_ID=3999  # ✅ Flora Distro User ID
```

## 🔑 Step 1: Get Your Alpine IQ User ID

### Method 1: Alpine IQ Portal (Easiest)
1. Go to: https://lab.alpineiq.com/
2. Log in with your Flora Distro credentials
3. Click **Settings** (gear icon in sidebar)
4. Click **API** tab
5. Find your **4-digit User ID** (e.g., `1234`)
6. Copy it

### Method 2: API Test
Once you have a User ID, test it with:
```bash
curl -H 'X-APIKEY: U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw' \
  'https://lab.alpineiq.com/api/v1.1/stores/YOUR_USER_ID'
```

If you get stores back, the User ID is correct!

## 📝 Step 2: Update Local Environment

Edit `.env.local` and replace `YOUR_4_DIGIT_USER_ID` with your actual User ID:

```bash
# Flora Distro:
ALPINEIQ_USER_ID=3999
```

Then restart your dev server:
```bash
npm run dev
```

## ☁️ Step 3: Add to Vercel

### Option A: Vercel Dashboard (Recommended)
1. Go to: https://vercel.com/floradistro/whaletools/settings/environment-variables
2. Click "Add New" for each variable:

**OPENAI_API_KEY**
```
[Get your OpenAI key from https://platform.openai.com/api-keys]
```

**ALPINEIQ_API_KEY**
```
U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw
```

**ALPINEIQ_API_URL**
```
https://lab.alpineiq.com
```

**ALPINEIQ_USER_ID**
```
3999
```

3. Select **Production, Preview, Development** for all
4. Click **Save**

### Option B: Vercel CLI
```bash
echo "U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw" | vercel env add ALPINEIQ_API_KEY production
echo "https://lab.alpineiq.com" | vercel env add ALPINEIQ_API_URL production
echo "YOUR_USER_ID" | vercel env add ALPINEIQ_USER_ID production
echo "sk-proj-..." | vercel env add OPENAI_API_KEY production
```

## 🗄️ Step 4: Run Database Migrations

In your Supabase SQL Editor, run:
```sql
-- File: supabase/migrations/20251029_alpine_iq_loyalty.sql
```

This adds fields to track Alpine IQ sync status.

## 🧪 Step 5: Test the Integration

### Test Connection
```bash
curl -X POST http://localhost:3000/api/vendor/marketing/alpineiq/sync-loyalty \
  -H "x-vendor-id: cd2e1122-d511-4edb-be5d-98ef274b4baf"
```

**Expected Response:**
```json
{
  "success": true,
  "synced": 150,
  "errors": 0,
  "total": 150,
  "sample": [
    {
      "email": "customer@example.com",
      "points": 1250,
      "tier": "Gold"
    }
  ]
}
```

### Test API Key Directly
```bash
curl -H 'X-APIKEY: U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw' \
  'https://lab.alpineiq.com/api/v2/campaigns'
```

Should return your campaigns.

## 🚀 Step 6: Deploy to Production

After adding env vars to Vercel:

1. Push your latest changes (already pushed!)
2. Vercel will auto-deploy
3. Check deployment: https://vercel.com/floradistro/whaletools/deployments
4. Once deployed, test production sync:

```bash
curl -X POST https://your-domain.com/api/vendor/marketing/alpineiq/sync-loyalty \
  -H "x-vendor-id: cd2e1122-d511-4edb-be5d-98ef274b4baf"
```

## 📊 Available Endpoints

### Sync Loyalty Data
`POST /api/vendor/marketing/alpineiq/sync-loyalty`
- Syncs all loyalty members from Alpine IQ
- Creates/updates customer records
- Tracks points, tiers, lifetime data

### View Campaigns
`GET /api/vendor/marketing/campaigns`
- Shows all campaigns (local + Alpine IQ)

### Campaign Analytics
`GET /api/vendor/marketing/analytics`
- Combined analytics from all sources

## ⚠️ Important Notes

1. **API Rate Limits**
   - 5 requests/second
   - 120 requests/minute
   - 2000 requests/hour

2. **Security**
   - Never commit API keys to git
   - Rotate keys if exposed
   - **⚠️ REVOKE OLD OPENAI KEY** (exposed in git)

3. **Data Sync**
   - Run loyalty sync weekly
   - Customers automatically sync on orders
   - Campaign stats sync hourly via webhook

## 🆘 Troubleshooting

### "Vendor not configured for Alpine IQ"
Update vendor in Supabase:
```sql
UPDATE vendors
SET 
  marketing_provider = 'alpineiq',
  marketing_config = '{
    "api_key": "U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw",
    "user_id": "YOUR_USER_ID"
  }'::jsonb
WHERE id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
```

### "Failed to connect to Alpine IQ"
- Verify API key is correct
- Check User ID is 4 digits
- Test connection with curl command above

### "404 Not Found"
- Verify endpoint exists in code
- Check Vercel deployment logs
- Hard refresh browser cache

## 📚 Next Steps

1. ✅ Get your User ID from Alpine IQ portal
2. ✅ Update .env.local
3. ✅ Test locally
4. ✅ Add to Vercel
5. ✅ Run migrations
6. ✅ Test production sync
7. ⏳ Set up automated weekly sync (cron job)
8. ⏳ Configure campaign preview/test

---

**Need Help?**
- Alpine IQ Support: https://support.alpineiq.com/
- API Docs: https://lab.alpineiq.com/swagger
