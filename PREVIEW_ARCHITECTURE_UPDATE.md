# Preview Architecture - Simplified Approach

## The Problem
Fly.io machines created via the Machines API all share the same hostname. 
We can't give each app its own `preview-{appId}.fly.dev` URL.

## The Solution
**Multi-tenant base runtime** - One Fly.io machine serves ALL apps

### How It Works

1. **Single Base Runtime**
   - One Fly.io app: `whaletools-preview-runtime.fly.dev`
   - One machine running Next.js dev server
   - Serves multiple apps simultaneously

2. **App Identification via Query Param**
   - Each app loads: `https://whaletools-preview-runtime.fly.dev?appId=xxx`
   - Runtime reads appId from query
   - File-sync-daemon fetches files for that specific appId
   - Next.js serves the correct app

3. **File Management**
   - Files stored in `/app-{appId}/` directories
   - Each app has isolated file space
   - File-sync-daemon syncs to correct directory

### Benefits
- ✅ Much simpler (no Machines API needed!)
- ✅ Cheaper (one machine instead of N machines)
- ✅ Faster (no machine provisioning time)
- ✅ Instant preview (just load iframe with appId param)

### Tradeoffs
- Apps share one dev server (but that's fine for preview)
- Resource limits shared (acceptable for reasonable usage)

## Implementation
No need for provision-preview endpoint - just use the base runtime directly!
