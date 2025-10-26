# MCP Agent Setup - Complete ✅

## Overview
The MCP (Model Context Protocol) Agent is a Docker-based AI service that **automatically generates complete vendor storefronts** using Claude Sonnet 4.5. It's fully operational and ready to use.

## What It Does
1. **Analyzes** vendor data (business type, products, locations)
2. **Designs** a professional storefront layout (7-8 sections)
3. **Writes** compelling, non-generic copy
4. **Generates** 40-80 components per storefront
5. **Inserts** everything into Supabase
6. **Returns** a live storefront URL

## Current Status
✅ **Running on Docker**: `localhost:3001`  
✅ **Claude API**: Connected (Sonnet 4.5)  
✅ **Supabase**: Connected (uaednwpxursknmwdeejn)  
✅ **Tested**: Flora Distro successfully generated  

## Configuration

### Environment Variables (.env)
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SUPABASE_URL=https://your_project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_PASSWORD=your_password_here
MCP_AGENT_SECRET=your_secret_key_here
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,https://yachtclub.com
```

## API Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### Generate Storefront
```bash
curl -X POST http://localhost:3001/api/generate-storefront \
  -H "Authorization: Bearer yacht-club-secret-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "cd2e1122-d511-4edb-be5d-98ef274b4baf",
    "vendorData": {
      "store_name": "Flora Distro",
      "slug": "flora-distro",
      "vendor_type": "cannabis",
      "store_tagline": "Premium cannabis delivered fast and discreet"
    }
  }'
```

### Response Example
```json
{
  "success": true,
  "vendorId": "cd2e1122-d511-4edb-be5d-98ef274b4baf",
  "sectionsCreated": 7,
  "componentsCreated": 50,
  "storefrontUrl": "https://yachtclub.com/storefront?vendor=flora-distro",
  "logs": ["🤖 Starting AI generation...", "✅ Created 7 sections", ...]
}
```

## Docker Commands

### View Status
```bash
docker ps | grep yacht-club-agent
```

### View Logs
```bash
docker logs yacht-club-agent --tail 100
docker logs yacht-club-agent -f  # Follow in real-time
```

### Restart
```bash
docker stop yacht-club-agent
docker rm yacht-club-agent
docker run -d --name yacht-club-agent -p 3001:3001 --env-file mcp-agent/.env yacht-club-agent
```

### Rebuild After Code Changes
```bash
cd mcp-agent
docker build -t yacht-club-agent .
docker stop yacht-club-agent && docker rm yacht-club-agent
docker run -d --name yacht-club-agent -p 3001:3001 --env-file .env yacht-club-agent
```

## Architecture

### Component Registry
The agent knows about all available components:
- **Smart Components**: Auto-wire to database (smart_product_grid, smart_locations, smart_reviews)
- **Basic Components**: text, image, button, spacer, divider
- **Sections**: hero, featured_products, process, locations, reviews, about_story, shipping_badges, footer

### Design Guidelines
Agent follows vendor-specific design patterns:
- **Cannabis**: Professional, trustworthy, medical-grade (greens, lab results, discreet packaging)
- **Restaurant**: Appetizing, warm, inviting (warm colors, ambiance, reservations)
- **Retail**: Clean, modern, trustworthy (brand colors, shipping, returns)

### Validation & Auto-Fix
1. Claude generates design
2. Validator checks for errors (missing hero, placeholder text, invalid components)
3. If errors found, Claude fixes them
4. Auto-fix handles remaining issues
5. Insert to database

## Cost & Performance
- **Cost per storefront**: ~$0.50-1.50 (Claude API usage)
- **Generation time**: 15-30 seconds
- **Quality**: Professional, conversion-optimized, no generic text

## Integration with Next.js App

### Create API Route (Next Step)
```typescript
// app/api/admin/generate-vendor-storefront/route.ts
export async function POST(request: Request) {
  const { vendorId } = await request.json();
  
  const response = await fetch('http://localhost:3001/api/generate-storefront', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer yacht-club-secret-key-2025',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      vendorId,
      vendorData: { /* fetch from DB */ }
    })
  });
  
  return Response.json(await response.json());
}
```

### Admin UI Button
Add a "Generate Storefront" button in the admin vendor management page that calls the API.

## Notes

### Claude Code vs Anthropic SDK
- **Claude Code**: CLI tool for interactive coding workflows (NOT needed here)
- **Anthropic SDK**: What we're using - programmatic API access for autonomous generation
- The Dockerfile originally had `@anthropic-ai/claude-code` but we removed it (unnecessary)

### Why Docker?
- Isolated environment
- Consistent deployment
- Easy to scale (can run multiple instances)
- Works on Railway/Render/any container platform

### Database Access
- Uses Supabase JS Client (not direct psql)
- Service role key for full access
- Batches component inserts (50 at a time)
- Handles errors gracefully

## Tested & Verified ✅
- [x] Docker container running on port 3001
- [x] Health check responding
- [x] Authentication working
- [x] Claude API connected (Sonnet 4.5)
- [x] Supabase connected (REST API)
- [x] Full storefront generation (Flora Distro)
- [x] 7 sections created
- [x] 98 components inserted
- [x] Professional copy generated
- [x] Smart components included (smart_testimonials, smart_location_map, etc.)
- [x] Component validation working
- [x] Auto-fix handling errors
- [x] All components match database registry

## Next Steps
1. Create Next.js API route to trigger agent
2. Add "Generate Storefront" button in admin UI
3. Consider deploying to Railway/Render for production
4. Add webhooks for status updates
5. Create vendor onboarding flow with auto-generation

