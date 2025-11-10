# WhaleTools AI Agent (MCP)

Autonomous storefront generation service using Claude for the WhaleTools platform.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
E2B_API_KEY=e2b_xxxxx
SUPABASE_URL=https://db.uaednwpxursknmwdeejn.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
MCP_AGENT_SECRET=your-secret-key
PORT=3001
```

### 3. Run Locally

```bash
npm run dev
```

### 4. Test

```bash
curl -X POST http://localhost:3001/api/generate-storefront \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "test-id",
    "vendorData": {
      "store_name": "Test Store",
      "slug": "test-store",
      "vendor_type": "retail"
    }
  }'
```

## Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up

# Set environment variables in Railway dashboard
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set SUPABASE_URL=https://...
railway variables set SUPABASE_SERVICE_KEY=eyJ...
railway variables set MCP_AGENT_SECRET=your-secret

# Get URL
railway domain
```

## Architecture

```
Next.js App → Agent Server → Claude API → Database
                  ↓
              Validation
                  ↓
              Testing
                  ↓
           Success/Failure
```

## API Endpoints

### POST /api/generate-storefront

Generate a complete storefront for a vendor.

**Request**:

```json
{
  "vendorId": "uuid",
  "vendorData": {
    "store_name": "Flora Distro",
    "slug": "flora-distro",
    "vendor_type": "cannabis",
    "store_tagline": "Premium cannabis delivered"
  }
}
```

**Response**:

```json
{
  "success": true,
  "vendorId": "uuid",
  "sectionsCreated": 8,
  "componentsCreated": 45,
  "storefrontUrl": "https://whaletools.com/storefront?vendor=flora-distro",
  "logs": ["..."]
}
```

### GET /health

Health check endpoint.

## How It Works

1. Receives vendor data
2. Enriches with database info (product count, locations, etc.)
3. Claude designs optimal storefront layout
4. Validates design (ensures it will work)
5. Inserts sections and components into Supabase
6. Returns success with URL

## Cost

- ~$1-2 per storefront generation
- Claude API usage (bulk of cost)
- E2B sandbox execution
- Minimal compute costs
