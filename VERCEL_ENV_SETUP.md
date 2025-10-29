# Vercel Environment Variables Setup

## ✅ Quick Setup (Copy & Paste)

Go to: **https://vercel.com/floradistro/whaletools/settings/environment-variables**

Click "Add New" and paste these values:

### 1. OPENAI_API_KEY
```
[Generate a new key at: https://platform.openai.com/api-keys]
```
**Environment:** Production, Preview, Development ✅

---

### 2. ALPINEIQ_API_KEY
```
U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw
```
**Environment:** Production, Preview, Development ✅

---

### 3. ALPINEIQ_API_URL
```
https://lab.alpineiq.com
```
**Environment:** Production, Preview, Development ✅

---

### 4. ALPINEIQ_USER_ID
```
3999
```
**Environment:** Production, Preview, Development ✅

---

## 🧪 Test Connection

After adding these variables, Vercel will automatically redeploy. Test the Alpine IQ connection:

```bash
curl -X POST https://your-domain.com/api/vendor/marketing/alpineiq/sync-loyalty \
  -H "x-vendor-id: cd2e1122-d511-4edb-be5d-98ef274b4baf"
```

**Expected Response:**
```json
{
  "success": true,
  "synced": 150,
  "errors": 0,
  "total": 150
}
```

## 📊 Flora Distro Store Locations (Verified)

Alpine IQ User ID 3999 has 5 locations configured:
1. **Charlotte (Monroe Road)** - Store ID: 1
2. **Blowing Rock** - Store ID: 2
3. **North Charlotte/University** - Store ID: 3
4. **Salisbury** - Store ID: 4
5. **Elizabethton, TN** - Store ID: 5

## ⚠️ Security Note

**IMPORTANT:** Generate a fresh OpenAI API key:
1. Go to: https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy it and add to Vercel dashboard
4. Keep it secure - never commit to git

## 🗄️ Database Migration

After adding environment variables, run this migration in Supabase SQL Editor:

```sql
-- File: supabase/migrations/20251029_alpine_iq_loyalty.sql

ALTER TABLE customer_loyalty
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'builtin',
ADD COLUMN IF NOT EXISTS tier_name TEXT,
ADD COLUMN IF NOT EXISTS tier_level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS lifetime_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS alpineiq_customer_id TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_provider
  ON customer_loyalty(vendor_id, provider);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_alpineiq_id
  ON customer_loyalty(alpineiq_customer_id);

ALTER TABLE customer_loyalty
ADD CONSTRAINT unique_customer_vendor_provider
  UNIQUE (customer_id, vendor_id, provider);

ALTER TABLE customer_loyalty
DROP CONSTRAINT IF EXISTS customer_loyalty_vendor_id_customer_id_key;
```

## 🚀 Update Flora Distro Vendor Record

In Supabase SQL Editor, configure Flora Distro to use Alpine IQ:

```sql
UPDATE vendors
SET
  marketing_provider = 'alpineiq',
  marketing_config = '{
    "api_key": "U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw",
    "user_id": "3999"
  }'::jsonb
WHERE id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
```

Verify it worked:
```sql
SELECT vendor_name, marketing_provider, marketing_config
FROM vendors
WHERE id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
```

## ✅ Deployment Checklist

- [ ] Add 4 environment variables to Vercel
- [ ] Wait for automatic redeployment
- [ ] Run database migration in Supabase
- [ ] Update Flora Distro vendor record
- [ ] Test loyalty sync endpoint
- [ ] Revoke exposed OpenAI key
- [ ] Generate new OpenAI key
- [ ] Update OPENAI_API_KEY in Vercel
