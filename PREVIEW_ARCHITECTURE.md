# Preview Architecture - Separate Fly.io Apps

## Overview
Each vendor app gets its own isolated Fly.io App for instant preview, similar to how Lovable handles previews.

## Architecture

### 1. Base Runtime Image
- **Location**: `https://github.com/floradistro/WhaleTools-Preview-Runtime`
- **Purpose**: Docker image with Next.js dev server + file-sync-daemon
- **Deployed to**: `whaletools-preview-runtime.fly.dev` (reference machine)

### 2. Per-App Provisioning
When a vendor opens the code editor:

1. **Check for existing preview**
   - If `preview_url` exists → use it
   - If preview is sleeping → wake it up
   - If no preview → provision new one

2. **Provision new Fly.io App**
   - Create new Fly.io App: `preview-{appId}.fly.dev`
   - Deploy base runtime image to new app
   - Configure with app-specific env vars:
     ```bash
     APP_ID={appId}
     API_URL=https://yacht club.vip
     API_KEY={service_role_key}
     ```
   - App gets unique URL with automatic HTTPS

3. **File Sync**
   - File-sync-daemon polls `/api/vendor/apps/{appId}/files` every 3s
   - Downloads files to container filesystem
   - Next.js HMR detects changes and hot-reloads instantly
   - Changes appear in preview within seconds

### 3. Auto-Stop for Cost Optimization
- Fly.io auto-stops machines after idle period
- **Stopped machine cost**: $0.18/month
- **Running machine cost**: $2/month
- Auto-wake when user visits preview URL

## Cost Analysis

### At Scale:
- **50 apps**: ~$9/month (all stopped) + running costs as needed
- **500 apps**: ~$90/month (all stopped) + running costs as needed
- **5,000 apps**: ~$900/month (all stopped) + running costs as needed

### Typical Usage:
- Most apps idle most of the time
- Only active when vendor is actively editing
- Auto-stop after 5-10 minutes of inactivity
- **Estimated real cost**: 10-20% of apps running at any time

## Why Separate Apps vs Multi-Tenant?

### ✅ Separate Apps Advantages:
1. **Isolation**: Each app fully isolated, crashes don't affect others
2. **Scalability**: Fly.io handles scaling automatically
3. **Simplicity**: Standard Next.js deployment, no complex routing
4. **Unique URLs**: Each app has its own subdomain
5. **Resource allocation**: Each app gets dedicated CPU/memory
6. **Auto-stop**: Individual apps stop when idle (saves costs)

### ❌ Multi-Tenant Disadvantages:
1. **Complex implementation**: Need custom routing/file serving
2. **Resource contention**: All apps share one machine
3. **Single point of failure**: One crash affects all apps
4. **Hard to debug**: Difficult to isolate issues per app
5. **Scaling challenges**: Need complex load balancing as apps grow

## Implementation Files

### Backend:
- `/app/api/vendor/apps/[appId]/provision-preview/route.ts` - Provisions new Fly.io app
- `/app/api/vendor/apps/[appId]/files/route.ts` - Serves files to sync daemon
- `/app/api/vendor/apps/[appId]/wake-preview/route.ts` - Wakes sleeping machines
- `/app/api/vendor/apps/[appId]/activity/route.ts` - Tracks activity for auto-stop

### Frontend:
- `/app/vendor/code/[appId]/page.tsx` - Code editor with preview iframe
  - Auto-provisions preview on page load
  - Auto-wakes sleeping machines
  - Displays instant preview with HMR

### Preview Runtime:
- `/tmp/preview-runtime/Dockerfile` - Base runtime image
- `/tmp/preview-runtime/file-sync-daemon.js` - File synchronization
- `/tmp/preview-runtime/package.json` - Dependencies
- `/tmp/preview-runtime/fly.toml` - Fly.io configuration

## Flow

1. **Vendor opens code editor**
   ```
   GET /vendor/code/{appId}
   → Checks if preview exists
   → If not: POST /api/vendor/apps/{appId}/provision-preview
   ```

2. **Provision creates Fly.io app**
   ```
   1. Create new Fly.io App: preview-{appId}.fly.dev
   2. Get base runtime image from whaletools-preview-runtime
   3. Deploy machine to new app
   4. Wait for machine to start
   5. Return preview URL
   ```

3. **AI generates code**
   ```
   POST /api/vendor/ai-edit
   → Claude generates code
   → Files saved to app_files table
   → AI returns list of changed files
   ```

4. **File sync (automatic)**
   ```
   File-sync-daemon (runs in container):
   → Polls /api/vendor/apps/{appId}/files every 3s
   → Downloads changed files
   → Writes to disk
   → Next.js HMR detects changes
   → Preview updates instantly
   ```

5. **Preview renders**
   ```
   Iframe loads: https://preview-{appId}.fly.dev
   → Next.js dev server serves app
   → HMR enabled for instant updates
   → Changes visible within 1-2 seconds
   ```

## Key Benefits

1. **Instant Updates**: Changes appear in preview within seconds (vs 30-60s for Vercel)
2. **Isolated**: Each app runs independently
3. **Cost-Effective**: Auto-stop keeps costs low ($0.18/month per idle app)
4. **Scalable**: Fly.io handles scaling automatically
5. **Simple**: Standard Next.js deployment pattern
6. **Reliable**: Isolated apps mean one crash doesn't affect others

## Future Optimizations

1. **Auto-delete**: Remove apps inactive for 30+ days
2. **Resource limits**: Adjust CPU/memory based on app complexity
3. **Regional deployment**: Deploy closer to users for lower latency
4. **Preview sharing**: Allow vendors to share preview URLs with team
