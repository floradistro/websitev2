# Yacht Club - Multi-Vendor Marketplace

Premium multi-vendor commerce platform with AI-powered storefront generation.

## 🚀 Quick Start

### Run Development Server
```bash
npm run dev
# Visit http://localhost:3000
```

### Run AI Agent Server
```bash
cd mcp-agent
node -r dotenv/config dist/index.js
# Agent runs on http://localhost:3001
```

---

## 🏗️ Architecture

### **Main App** (Next.js 15)
- **Vendor Portal**: `/vendor/*` - Dashboard, products, inventory, analytics
- **Storefronts**: `/storefront?vendor=slug` - Customer-facing stores
- **Admin**: `/admin/*` - Platform management
- **API**: `/api/*` - REST endpoints

### **AI Agent** (Claude-powered)
- **Location**: `mcp-agent/`
- **Purpose**: Autonomous storefront generation
- **Model**: Claude Sonnet 4.5 (latest)
- **Port**: 3001

---

## 🎨 Features

### **For Vendors**:
- ✅ AI-generated storefronts (60 seconds)
- ✅ Visual component editor
- ✅ Product management
- ✅ Inventory tracking
- ✅ Order fulfillment
- ✅ Analytics dashboard

### **For Customers**:
- ✅ Beautiful vendor storefronts
- ✅ Product browsing
- ✅ Cart & checkout
- ✅ Location finder
- ✅ Reviews & ratings

### **AI Capabilities**:
- ✅ Professional copywriting
- ✅ Brand-matched design
- ✅ Smart component wiring
- ✅ Edge case handling
- ✅ Validation & testing

---

## 📊 Database

**Supabase PostgreSQL**:
- `vendors` - Vendor accounts
- `products` - Product catalog
- `vendor_storefront_sections` - Page sections
- `vendor_component_instances` - Component configs
- `orders` - Customer orders
- `inventory` - Stock levels

---

## 🤖 AI Agent Setup

### **Environment Variables** (.env.local):
```env
ANTHROPIC_API_KEY=sk-ant-...
MCP_AGENT_URL=http://localhost:3001
MCP_AGENT_SECRET=yacht-club-secret-2025
```

### **Generate Storefront**:
1. Visit `/vendor/onboard`
2. Fill form (2 minutes)
3. Click "Generate with AI"
4. Wait 60 seconds
5. Storefront is live!

---

## 📁 Key Directories

```
/app
  /vendor        - Vendor portal pages
  /admin         - Admin pages
  /api           - API routes
  /(storefront)  - Customer storefronts

/components
  /vendor        - Vendor dashboard components
  /storefront    - Storefront components
  /component-registry - Dynamic component system

/lib
  /supabase      - Database client
  /component-registry - Component renderer

/mcp-agent       - AI agent service
  /src
    agent.ts     - Claude orchestration
    validator.ts - Quality checks
    index.ts     - Express server
```

---

## 🔑 API Keys Needed

1. **Anthropic** (https://console.anthropic.com/)
   - Model: Claude Sonnet 4.5
   - Usage: AI storefront generation

2. **Supabase** (Already configured)
   - Database: PostgreSQL
   - Storage: File uploads

---

## 🛠️ Development

### **Component Editor**:
- URL: `/vendor/component-editor`
- Features: Drag & drop, live editing, visual editor
- Fixed: Unified @dnd-kit system (6x faster)

### **AI Generation**:
- Endpoint: `POST /api/vendors/generate`
- Agent: `http://localhost:3001/api/generate-storefront`
- Time: ~60 seconds per storefront
- Cost: ~$1.50 per generation

---

## 📖 Documentation

- `AGENT_SETUP_COMPLETE.md` - AI agent setup guide
- `AI_AGENT_SUCCESS.md` - Generation results
- `SETUP_INSTRUCTIONS.md` - Deployment guide
- `VENDOR_PAGES_RETHEME.md` - Vendor portal theme
- `VENDOR_OPTIMIZATION_SUMMARY.md` - Performance optimizations

---

## 🚢 Deployment

### **Main App** (Vercel):
```bash
git push origin main
# Auto-deploys to Vercel
```

### **AI Agent** (Railway):
```bash
cd mcp-agent
railway init
railway up
# Set environment variables in Railway dashboard
```

---

## ✅ What's Working

- ✅ Multi-vendor storefronts
- ✅ AI storefront generation (Claude Sonnet 4.5)
- ✅ Component editor (drag & drop, live editing)
- ✅ Vendor dashboard
- ✅ Product management
- ✅ Inventory system
- ✅ Order tracking
- ✅ Analytics

---

## 🎯 Next Steps

1. Deploy AI agent to Railway
2. Test onboarding with real vendors
3. Add custom domain support
4. Implement caching layer
5. Scale to production

Built with Next.js 15, Supabase, and Claude AI.

