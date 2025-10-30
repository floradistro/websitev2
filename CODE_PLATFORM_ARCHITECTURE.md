# Code Platform Architecture

## Overview

The Code Platform is an **AI-powered app development platform** that allows vendors to build custom applications using natural language. It's the evolution of the Storefront Builder, enabling creation of:

- Customer-facing storefronts
- Admin panels
- Customer portals
- Mobile apps
- Analytics dashboards
- Custom applications

All apps are connected to the same backend database and use AI (Claude Sonnet 4.5) to generate and modify code.

---

## Architecture Model

### Multi-Repo + Single Deployment (IP Protected)

```
┌─────────────────────────────────────────────────────────┐
│     GITHUB: Separate Repos (YOU own, vendor has NO access)
├─────────────────────────────────────────────────────────┤
│  yourplatform/vendor-a-storefront                       │
│  yourplatform/vendor-a-admin-panel                      │
│  yourplatform/vendor-b-customer-portal                  │
│  ... (separate repo per app)                            │
└─────────────────────────────────────────────────────────┘
              ↓ GitHub Actions sync
┌─────────────────────────────────────────────────────────┐
│     GITHUB: Deployment Monorepo                         │
├─────────────────────────────────────────────────────────┤
│  yourplatform/apps-deployment                           │
│  ├── apps/                                              │
│  │   ├── vendor-a-storefront/   ← synced               │
│  │   ├── vendor-a-admin-panel/  ← synced               │
│  │   └── vendor-b-customer-portal/ ← synced            │
│  └── shared/                                            │
│      └── components/ ← your core platform               │
└─────────────────────────────────────────────────────────┘
              ↓ Single deployment
┌─────────────────────────────────────────────────────────┐
│     VERCEL: One Deployment                              │
│  - Serves all apps                                      │
│  - Dynamic routing                                      │
│  - Shared infrastructure                                │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Separate repos per app** - Full isolation, git history
2. **Vendor has ZERO GitHub access** - IP protected
3. **Single deployment** - Efficient, low cost
4. **AI-powered editing** - Anthropic API (not Claude Code product)
5. **Shared database** - Multi-tenant Supabase with RLS

---

## User Experience

### Vendor Journey

```
1. Vendor Dashboard → Clicks "Code" app
   ↓
2. Sees list of their apps (or empty state)
   ↓
3. Clicks "Create New App"
   ↓
4. Selects template (storefront, admin, mobile, etc.)
   ↓
5. Enters app name & description
   ↓
6. AI Editor opens with:
   - Live preview (left)
   - AI chat (right)
   ↓
7. Vendor types: "Add a dark mode toggle"
   ↓
8. AI responds with code changes
   ↓
9. Preview updates automatically
   ↓
10. Vendor clicks "Publish to Production"
    ↓
11. App deployed, live URL provided
```

### What Vendor Sees

**Dashboard (/vendor/apps):**
- Existing apps grid
- "Code" app tile

**Code Platform (/vendor/code):**
- List of apps they've created
- Status, deployment URL, edit buttons
- "Create New App" button

**New App (/vendor/code/new):**
- Template selection (6 types)
- App details form
- "Create App" button

**AI Editor (/vendor/code/[appId]):**
- Split screen:
  - Left: Live preview iframe
  - Right: AI chat interface
- Top bar: App name, "View Live", "Publish" button
- Messages show files changed

### What Vendor CANNOT Do

- ❌ Access GitHub
- ❌ Download source code
- ❌ See other vendors' code
- ❌ Clone repositories
- ❌ Bypass your platform

---

## Technical Implementation

### Frontend Pages

**1. /vendor/code/page.tsx** - App list
- Shows all apps vendor created
- Status badges (draft, deployed, etc.)
- Edit/delete actions
- Empty state

**2. /vendor/code/new/page.tsx** - Create app
- Template selection grid
- App details form
- Creates app + repo

**3. /vendor/code/[appId]/page.tsx** - AI Editor
- Live preview iframe
- AI chat interface
- Publish button
- Real-time updates

### Backend APIs

**1. /api/vendor/apps**
- GET: List apps for vendor
- POST: Create new app

**2. /api/vendor/apps/[appId]**
- GET: Get single app
- DELETE: Soft delete app

**3. /api/vendor/apps/[appId]/publish**
- POST: Deploy to production

**4. /api/vendor/ai-edit**
- POST: Process AI instruction
- Calls Anthropic API
- Commits to GitHub
- Returns changes

### Database Schema

**vendor_apps:**
```sql
id, vendor_id, name, slug, app_type, description,
github_repo, deployment_url, status, is_active,
created_at, updated_at
```

**vendor_app_sessions:**
```sql
id, app_id, vendor_id, started_at, ended_at,
ai_tokens_used, ai_cost_usd, commits_made
```

**vendor_ai_usage:**
```sql
id, vendor_id, app_id, model, input_tokens,
output_tokens, cost_usd, instruction, created_at
```

**app_templates:**
```sql
id, name, slug, app_type, description,
preview_image, github_template_repo, is_active,
features, required_subscription_tier
```

---

## AI Integration

### Using Anthropic API (Not Claude Code Product)

**Why Anthropic API directly:**
- ✅ You control the UI (white-labeled)
- ✅ Vendor stays in your platform
- ✅ No GitHub access needed for vendor
- ✅ You control prompts/context
- ✅ Track usage/costs
- ✅ IP protected

**How it works:**

```typescript
// Vendor types instruction in chat
"Add a dark mode toggle"

// Frontend sends to your API
POST /api/vendor/ai-edit
{
  appId: "...",
  vendorId: "...",
  instruction: "Add a dark mode toggle",
  conversationHistory: [...]
}

// Your backend calls Anthropic API
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: `You are an expert developer building a ${app.app_type}...`,
  messages: [
    ...conversationHistory,
    { role: 'user', content: instruction }
  ]
})

// Extract code from response
// Commit to GitHub via your bot
// Return success to frontend

// Frontend shows changes
// Preview auto-refreshes
```

### Cost Management

**Pricing (Claude Sonnet 4.5):**
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens

**Typical session:**
- 20K input + 5K output = $0.135

**100 vendors × 10 edits/month:**
- Cost: ~$135/month
- Revenue (at $199/mo premium): $19,900/month
- Profit margin: 99.3%

**Usage tracking:**
- Logged in `vendor_ai_usage` table
- Can set limits per vendor
- Can charge per-usage or unlimited

---

## Deployment Pipeline

### TODO: Complete Implementation

**Current state:** Skeleton is built, needs:

1. **GitHub Integration:**
```typescript
// app/api/vendor/apps/route.ts - POST
// After creating app record:

// Create GitHub repo from template
const octokit = new Octokit({ auth: process.env.GITHUB_BOT_TOKEN })

const repo = await octokit.repos.createUsingTemplate({
  template_owner: 'yourplatform',
  template_repo: `template-${app_type}`,
  owner: 'yourplatform',
  name: `${vendor.slug}-${app.slug}`,
  private: true
})

// Update app record with repo name
await supabase.from('vendor_apps')
  .update({ github_repo: repo.full_name })
  .eq('id', app.id)
```

2. **Vercel Integration:**
```typescript
// Create Vercel project linked to repo
const vercelResponse = await fetch('https://api.vercel.com/v9/projects', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: `${vendor.slug}-${app.slug}`,
    gitRepository: {
      type: 'github',
      repo: repo.full_name
    },
    framework: 'nextjs',
    environmentVariables: [
      { key: 'VENDOR_ID', value: vendor.id },
      { key: 'SUPABASE_URL', value: process.env.SUPABASE_URL },
      { key: 'SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY }
    ]
  })
})

const project = await vercelResponse.json()

// Update app with deployment URL
await supabase.from('vendor_apps')
  .update({ deployment_url: project.url })
  .eq('id', app.id)
```

3. **AI Code Editing:**
```typescript
// app/api/vendor/ai-edit/route.ts
// After getting AI response:

// Parse code blocks from response
const codeBlocks = extractCodeBlocks(assistantMessage)

// Commit each file to GitHub
for (const block of codeBlocks) {
  await octokit.repos.createOrUpdateFileContents({
    owner: 'yourplatform',
    repo: app.github_repo,
    path: block.filePath,
    message: `AI Edit: ${instruction}`,
    content: Buffer.from(block.content).toString('base64'),
    committer: {
      name: 'YourPlatform AI',
      email: 'ai@yourplatform.com'
    }
  })
}

// Vercel auto-deploys via webhook
```

4. **Template Repositories:**
Create these template repos:
- `yourplatform/template-storefront`
- `yourplatform/template-admin-panel`
- `yourplatform/template-customer-portal`
- `yourplatform/template-mobile`
- `yourplatform/template-dashboard`
- `yourplatform/template-custom`

Each should have:
- Next.js 15 app
- Pre-configured Supabase client
- Shared components from your platform
- Environment variables for VENDOR_ID

---

## IP Protection Strategy

### How Vendor Can't Steal Code

**1. No GitHub Access:**
- Repos are private
- Only your bot account can access
- Vendor never sees GitHub

**2. Your Bot Makes Commits:**
```javascript
committer: {
  name: 'YourPlatform AI',
  email: 'ai@yourplatform.com'
}
```

**3. Core Platform Stays Separate:**
```
Apps can import from shared:
import { SmartProductGrid } from '@/shared/components'

But shared code is NOT in vendor repos
It's in deployment monorepo only
```

**4. Runtime Validation:**
```typescript
// In shared components:
export async function validateEnvironment() {
  if (!process.env.VERCEL_URL?.includes('yourplatform.vercel.app')) {
    throw new Error('Unauthorized deployment')
  }
}
```

**5. License Headers:**
```typescript
/**
 * @license PROPRIETARY
 * Copyright (c) 2025 YourPlatform Inc.
 * Unauthorized use prohibited.
 */
```

---

## Next Steps to Complete

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create template repositories for each app type
- [ ] Set up GitHub App with bot token
- [ ] Configure Vercel API access
- [ ] Test repo creation flow

### Phase 2: GitHub Integration (Week 2)
- [ ] Implement repo creation on app create
- [ ] Implement commit logic in AI edit API
- [ ] Set up GitHub Actions for sync
- [ ] Test end-to-end code changes

### Phase 3: Vercel Integration (Week 3)
- [ ] Implement Vercel project creation
- [ ] Configure environment variables
- [ ] Set up webhooks for auto-deploy
- [ ] Test deployment pipeline

### Phase 4: AI Refinement (Week 4)
- [ ] Improve prompt engineering
- [ ] Add code parsing logic
- [ ] Add file tree UI
- [ ] Add preview refresh logic

### Phase 5: Polish & Launch (Week 5-6)
- [ ] Add usage limits/billing
- [ ] Create documentation for vendors
- [ ] Add error handling
- [ ] Beta test with 3-5 vendors

---

## Files Created

### Frontend:
- `components/admin/AppsGrid.tsx` - Added "Code" app
- `app/vendor/code/page.tsx` - App list
- `app/vendor/code/new/page.tsx` - Create new app
- `app/vendor/code/[appId]/page.tsx` - AI editor

### Backend:
- `app/api/vendor/apps/route.ts` - List/create apps
- `app/api/vendor/apps/[appId]/route.ts` - Get/delete app
- `app/api/vendor/apps/[appId]/publish/route.ts` - Publish app
- `app/api/vendor/ai-edit/route.ts` - AI code editing

### Database:
- `supabase/migrations/20251030_code_platform.sql` - All tables

---

## Summary

**What Works Now:**
- ✅ UI is complete and functional
- ✅ Database schema created
- ✅ API routes scaffolded
- ✅ AI integration ready (Anthropic API)

**What Needs Implementation:**
- ⏳ GitHub repo creation
- ⏳ Vercel deployment automation
- ⏳ Code commit logic
- ⏳ Template repositories

**Timeline:** 4-6 weeks to full production

**This is a platform-as-a-service (PaaS) product that will:**
- Differentiate you from competitors
- Unlock premium pricing ($199-499/mo)
- Enable unlimited vendor customization
- Maintain IP protection
- Scale efficiently

You've just built the foundation for a revolutionary cannabis commerce platform! 🚀
