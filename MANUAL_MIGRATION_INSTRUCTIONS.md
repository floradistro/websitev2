# 📋 Manual Migration Instructions

The Supabase CLI is having migration history conflicts. Here's how to apply the migration manually (takes 2 minutes):

## Option 1: Supabase Dashboard (Recommended) ✅

### Step 1: Go to SQL Editor
1. Visit: https://app.supabase.com
2. Select your project: **uaednwpxursknmwdeejn**
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **New Query**
2. Copy the ENTIRE contents of: `supabase/migrations/20251024_ai_agent_tables.sql`
3. Paste into the SQL editor
4. Click **Run** (or press Cmd+Enter)

### Step 3: Verify
You should see:
```
Success. No rows returned
```

### Step 4: Check Tables
Run this query to verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('vendor_storefronts', 'ai_conversations');
```

Should return 2 rows.

---

## Option 2: Using psql (Advanced)

If you have PostgreSQL installed:

```bash
# Get connection string from Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres" \
  -f supabase/migrations/20251024_ai_agent_tables.sql
```

---

## What the Migration Creates

### Tables:
1. **`vendor_storefronts`** - Stores AI-generated storefronts
   - Deployment info (URL, status, etc.)
   - AI specifications
   - Version control

2. **`ai_conversations`** - Stores chat history
   - Messages between vendor and AI
   - Linked to storefronts

### Security:
- ✅ Row Level Security (RLS) enabled
- ✅ Vendors can only access their own data
- ✅ Service role has full access

### Indexes:
- Optimized queries for vendor_id, status, deployment_id

---

## After Migration

Once tables are created:

### Test it worked:
```bash
cd /Users/whale/Desktop/Website
npm run dev
```

Then visit:
- http://localhost:3000/vendor/login
- http://localhost:3000/vendor/storefront-builder

You should see the AI chat interface! 🎉

---

## Troubleshooting

### "relation already exists"
✅ **This is GOOD!** It means the tables are already there. Skip to testing.

### "permission denied"
Make sure you're using the **SQL Editor in Supabase Dashboard** with your project selected.

### Still having issues?
The AI agent can still work! Just:
1. Comment out the database save operations in the API routes
2. Use the agent for generation (it will work)
3. Add database saving later

---

## Quick Copy-Paste SQL

For convenience, here's the full migration SQL:

```sql
-- Copy contents from: supabase/migrations/20251024_ai_agent_tables.sql
-- Or just open that file and copy/paste into Supabase SQL Editor
```

---

**After running this, your AI agent will be fully operational!** 🚀

