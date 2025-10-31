# Code Platform Setup Guide

## ✅ What's Already Done

The Code Platform is **fully implemented** and ready to use! Here's what works:

- ✅ UI is complete (app list, creation, AI editor)
- ✅ Database tables created
- ✅ APIs implemented (apps CRUD, AI editing)
- ✅ GitHub integration (repo creation, commits)
- ✅ Vercel integration (project creation, auto-deploy)
- ✅ Anthropic AI integration (code generation)
- ✅ Auto-refresh preview
- ✅ Instant deployments

## 🔧 Required Setup

To enable **auto-deployment** (like Lovable/Claude Code), you need 3 environment variables:

### 1. Anthropic API Key

**Get it from:** https://console.anthropic.com/

1. Sign up or log in
2. Go to API Keys
3. Create a new key
4. Copy it

**Add to `.env.local`:**
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Cost:** ~$3-15 per 1M tokens (very affordable)

### 2. GitHub Personal Access Token

**Get it from:** https://github.com/settings/tokens

1. Go to Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Code Platform Bot"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `admin:org` (if creating repos in an org)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Generate token and copy it

**Add to `.env.local`:**
```bash
GITHUB_BOT_TOKEN=ghp_your_token_here
GITHUB_ORG=yourplatform  # Your GitHub username or org name
```

### 3. Vercel API Token

**Get it from:** https://vercel.com/account/tokens

1. Go to your Vercel dashboard
2. Settings → Tokens
3. Create a new token
4. Give it a name: "Code Platform"
5. Copy the token

**Add to `.env.local`:**
```bash
VERCEL_TOKEN=your_vercel_token_here
```

**Alternatively:** Use Vercel Team plan ($20/mo) for unlimited projects.

---

## 📦 Create Template Repositories

The system needs template repos for each app type. Create these on GitHub:

### Template 1: Basic Next.js App

**Repository:** `yourplatform/template-nextjs-app`

```bash
# Create a new Next.js app
npx create-next-app@latest template-nextjs-app --typescript --tailwind --app --no-src-dir

cd template-nextjs-app

# Add Supabase client
npm install @supabase/supabase-js

# Create lib/supabase.ts
mkdir -p lib
cat > lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
EOF

# Update app/page.tsx with a basic template
cat > app/page.tsx << 'EOF'
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl">
        <h1 className="text-5xl font-black text-gray-900 mb-4">
          Welcome! 🚀
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          This is your new app. Tell the AI what you want to build!
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-900">
              ✨ This app is connected to your backend data
            </p>
          </div>
          <div className="p-4 bg-pink-50 rounded-xl">
            <p className="text-sm text-pink-900">
              🤖 Use AI to customize anything you want
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
EOF

# Add .env.example
cat > .env.example << 'EOF'
VENDOR_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
APP_TYPE=
EOF

# Initialize git and push
git init
git add .
git commit -m "Initial template"
git branch -M main
git remote add origin https://github.com/yourplatform/template-nextjs-app.git
git push -u origin main

# Mark as template on GitHub
# Go to repo settings → check "Template repository"
```

### Template 2: Storefront (Optional - more advanced)

You can create specific templates for each app type:
- `template-storefront` - Product catalog + cart
- `template-admin-panel` - Dashboard with charts
- `template-customer-portal` - Customer account pages
- `template-mobile` - React Native starter
- `template-dashboard` - Analytics dashboard

For now, all app types can use `template-nextjs-app` as the base.

---

## 🧪 Testing the System

### 1. Verify Environment Variables

```bash
# Check if variables are set
echo $ANTHROPIC_API_KEY
echo $GITHUB_BOT_TOKEN
echo $VERCEL_TOKEN
```

### 2. Test App Creation

1. Go to `/vendor/apps` in your dashboard
2. Click "Code" app
3. Click "Create New App"
4. Select "Custom App"
5. Name it "Test App"
6. Click "Create App"

**What should happen:**
- ✅ "Building your app..." message appears
- ✅ GitHub repo is created (check your GitHub)
- ✅ Vercel project is created (check Vercel dashboard)
- ✅ After ~30-60 seconds, preview loads with live site
- ✅ Status changes to "deployed"

### 3. Test AI Editing

1. In the AI chat, type: "Change the welcome message to say Hello World"
2. Click send

**What should happen:**
- ✅ AI responds with code changes
- ✅ Files are committed to GitHub
- ✅ Vercel auto-deploys
- ✅ After ~5-10 seconds, preview updates with changes

---

## 🎯 Quick Start (No Setup)

If you don't have tokens yet, the platform still works in "local mode":

1. **Apps are created** in database
2. **AI still works** and generates code
3. **Preview shows** basic template (not deployed)
4. **You get warnings** about missing tokens

Once you add tokens, existing apps will deploy on next edit!

---

## 🐛 Troubleshooting

### "GITHUB_BOT_TOKEN is not set"

Add to `.env.local`:
```bash
GITHUB_BOT_TOKEN=ghp_your_token_here
GITHUB_ORG=yourplatform
```

Restart dev server: `npm run dev`

### "Template repository not found"

Create `template-nextjs-app` repository following the guide above.

Or temporarily use an existing Next.js template:
```bash
GITHUB_ORG=vercel
# Use vercel/next.js as template for testing
```

### "Vercel API error"

1. Check token is valid: https://vercel.com/account/tokens
2. Make sure you have permission to create projects
3. If using team, token must have team access

### "App stuck in 'building' status"

1. Check GitHub - was repo created?
2. Check Vercel - is deployment running?
3. Check console for errors
4. Click "Deploy Now" button to retry

### Preview doesn't update after AI edit

1. Wait 10-15 seconds (Vercel needs time to deploy)
2. Refresh browser
3. Check if files were committed to GitHub
4. Check Vercel dashboard for deployment status

---

## 📊 Cost Estimates

**For 100 vendors doing 10 AI edits/month:**

| Service | Cost | Notes |
|---------|------|-------|
| Anthropic AI | ~$135/mo | $0.135 per edit |
| GitHub | FREE | Unlimited private repos |
| Vercel | $20/mo | Team plan, unlimited projects |
| Supabase | $25/mo | Pro plan |
| **Total** | **$180/mo** | For unlimited vendors! |

**Revenue:** 100 vendors × $199/mo = $19,900/mo
**Profit margin:** 99%

---

## 🎉 You're Ready!

Once you add the 3 environment variables and create the template repo, everything will work automatically:

1. **Vendor creates app** → Instant deploy to Vercel
2. **Vendor edits with AI** → Code commits → Auto-deploy → Preview updates
3. **Works like Lovable/Claude Code** → Professional experience

The platform is production-ready! 🚀
