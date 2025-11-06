# Vendor Deployment Architecture Migration

## What Changed

We've migrated from a **multi-tenant monorepo** to **isolated Vercel projects** for vendor storefronts.

### Old Architecture (Deprecated ❌)
```
Vendor pushes to their repo
  ↓
Platform syncs vendor code into main repo
  ↓
Platform commits to main branch
  ↓
Entire platform + all vendor code rebuilds
  ↓
One broken vendor = entire platform broken
```

**Problems:**
- ❌ Vendor code committed to platform git history
- ❌ Vendor bugs broke platform builds
- ❌ Security risk (vendor code runs in platform)
- ❌ Deployment coupling (one vendor affects everyone)
- ❌ Doesn't scale (repo grows with each vendor)

### New Architecture (Current ✅)
```
Vendor pushes to their repo
  ↓
GitHub triggers Vercel deployment
  ↓
Only their project rebuilds
  ↓
Their site updates, platform unaffected
```

**Benefits:**
- ✅ Complete isolation - vendor bugs don't affect platform
- ✅ Independent deployments - push triggers only your deploy
- ✅ Scalable - works for 10 or 10,000 vendors
- ✅ Secure - vendor code never touches platform
- ✅ Fast - only your site rebuilds, not entire platform

---

## Migration Guide

### For Existing Vendors

If you're currently using the old sync-and-deploy system:

1. **Your GitHub repo stays the same** - no code changes needed
2. **Call the new endpoint once** to create your Vercel project:
   ```bash
   POST /api/vendor/website/create-vercel-project
   ```
3. **That's it!** From now on, just push to your GitHub repo

### Creating a New Storefront

**Step 1: Create Your Storefront Repo**
```bash
POST /api/vendor/website/create
```

This creates a GitHub repo with your storefront template.

**Step 2: Create Your Vercel Project**
```bash
POST /api/vendor/website/create-vercel-project
```

This:
- Creates an isolated Vercel project for you
- Connects it to your GitHub repo
- Configures environment variables
- Adds your custom domain (if configured)
- Triggers first deployment

**Step 3: Deploy Updates**
```bash
# Just push to your repo!
git push origin main

# Vercel auto-deploys your changes
# No API calls needed
```

---

## API Reference

### Create Vercel Project

**Endpoint:** `POST /api/vendor/website/create-vercel-project`

**Authentication:** Requires vendor JWT token

**Prerequisites:**
- Must have a GitHub repository created
- Repository must be configured in vendor settings

**Response:**
```json
{
  "success": true,
  "message": "Vercel project created successfully",
  "project": {
    "id": "prj_abc123",
    "name": "floradistro-storefront",
    "url": "https://floradistro-storefront.vercel.app"
  },
  "customDomain": "shop.floradistro.com",
  "customDomainAdded": true,
  "nextSteps": [
    "Your storefront is deploying now",
    "Visit https://floradistro-storefront.vercel.app to see the deployment progress",
    "Once deployed, your custom domain shop.floradistro.com will be live",
    "Push to your GitHub repo to trigger new deployments"
  ]
}
```

**Error Responses:**
- `400` - GitHub repository not configured
- `400` - Vercel project already exists
- `404` - Vendor not found
- `500` - Vercel API error

---

## Environment Variables

Your Vercel project automatically gets these environment variables:

### Platform Connection
- `NEXT_PUBLIC_PLATFORM_API_URL` - Platform API for products, orders, etc.
- `NEXT_PUBLIC_VENDOR_ID` - Your vendor ID
- `NEXT_PUBLIC_VENDOR_SLUG` - Your vendor slug

### Database Connection
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key (read-only)

---

## Architecture Diagram

### Old (Monorepo)
```
┌─────────────────────────────────────┐
│        Platform Git Repo            │
│  ┌─────────────────────────────┐   │
│  │  Main App Code              │   │
│  ├─────────────────────────────┤   │
│  │  Vendor A Templates  ←───┐  │   │
│  │  Vendor B Templates  ←───┼──┼── Synced from vendor repos
│  │  Vendor C Templates  ←───┘  │   │
│  └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ↓
      One Vercel Deployment
      (Builds everything)
```

### New (Separate Projects)
```
Platform Repo          Vendor A Repo       Vendor B Repo
     ↓                      ↓                   ↓
Platform Deploy       Vendor A Deploy     Vendor B Deploy
(whaletools.app)      (vendora.com)       (vendorb.com)

✅ Isolated          ✅ Isolated         ✅ Isolated
✅ Fast builds       ✅ Fast builds      ✅ Fast builds
✅ No interference   ✅ No interference  ✅ No interference
```

---

## FAQs

### Q: Do I need to change my code?
**A:** No! Your storefront code stays exactly the same.

### Q: What happens to my custom domain?
**A:** It's automatically configured on your new Vercel project.

### Q: Can I still use the old sync-and-deploy endpoint?
**A:** No, it returns `410 Gone`. Migrate to the new system.

### Q: How do I trigger deployments now?
**A:** Just push to your GitHub repo. Vercel automatically deploys.

### Q: What if my build fails?
**A:** Only your site is affected. The platform and other vendors are unaffected.

### Q: Can I see deployment logs?
**A:** Yes, at `https://vercel.com/your-project-name`

### Q: How much does this cost?
**A:** Each Vercel project is free for personal/hobby use. Pro plans available.

---

## Troubleshooting

### "GitHub repository not configured"
- Make sure you've called `/api/vendor/website/create` first
- Check your vendor settings have `github_repo_name` set

### "Vercel project already exists"
- You can only create one Vercel project per vendor
- Check your vendor settings for `vercel_project_id`
- Your project is already set up - just push to your repo!

### "Vercel API error"
- Check that `VERCEL_TOKEN` environment variable is set on the platform
- Verify the token has permissions to create projects
- Check Vercel API limits haven't been exceeded

---

## What Happened to the Old System?

The old `sync-and-deploy` endpoint (`POST /api/vendor/website/sync-and-deploy`) has been **permanently removed**.

It now returns:
```json
{
  "error": "This endpoint is deprecated",
  "message": "The monorepo sync architecture has been replaced with separate Vercel projects",
  "migration": {
    "oldFlow": "Sync vendor code → Commit to main → Deploy entire platform",
    "newFlow": "Push to your repo → Deploy only your project",
    "action": "Use POST /api/vendor/website/create-vercel-project to create your isolated project"
  }
}
```

---

## Need Help?

- Check the [Vercel Docs](https://vercel.com/docs)
- Contact platform support
- Review your project logs at `vercel.com`
