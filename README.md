# WhaleTools - Multi-Vendor Marketplace Platform

Premium AI-powered multi-vendor commerce platform with living, adaptive storefronts.

**Platform:** WhaleTools  
**Master Vendor:** Yacht Club

---

## 🚀 **Quick Start**

### **Run Development Server**
```bash
npm run dev
# Visit http://localhost:3000
```

### **Run AI Agent Server**
```bash
cd mcp-agent
node -r dotenv/config dist/index.js
# Agent runs on http://localhost:3001
```

---

## 📚 **Documentation**

**All documentation has been organized in the `/docs` folder:**

👉 **[START HERE: Complete Documentation →](docs/README.md)**

### **Quick Links:**
- **[The Vision](docs/evolution/THE_VISION_SUMMARY.md)** - What we're building (⭐ Read this first)
- **[Evolution Plan](docs/evolution/WHALETOOLS_EVOLUTION_PLAN.md)** - 6-month roadmap to living platform
- **[Implementation Guide](docs/evolution/IMPLEMENTATION_GUIDE.md)** - Step-by-step execution
- **[Master Index](docs/evolution/MASTER_INDEX.md)** - Complete documentation navigation

### **For Developers:**
- **[Smart Components Guide](docs/architecture/SMART_COMPONENT_GUIDE.md)** - Component system reference
- **[Platform Architecture](docs/architecture/WHALETOOLS_PLATFORM.md)** - Technical overview
- **[Setup Instructions](docs/guides/SETUP_INSTRUCTIONS.md)** - Initial setup

---

## 🏗️ **Architecture**

### **Main App** (Next.js 15)
- **Vendor Portal**: `/vendor/*` - Dashboard, products, inventory, analytics
- **Storefronts**: `/storefront?vendor=slug` - Customer-facing stores
- **Admin**: `/admin/*` - Platform management
- **API**: `/api/*` - REST endpoints

### **AI Agent** (Claude-powered)
- **Location**: `mcp-agent/`
- **Purpose**: Autonomous storefront generation & optimization
- **Model**: Claude Sonnet 4.5 (latest)

---

## 🎨 **Key Features**

### **For Vendors:**
- ✅ AI-generated storefronts (60 seconds)
- ✅ Component-based visual editor
- ✅ Real-time layout optimization
- ✅ Smart components with auto-configuration
- ✅ Analytics dashboard

### **For Customers:**
- ✅ Personalized storefronts (adaptive UI)
- ✅ Fast performance (<100ms)
- ✅ Progressive rendering
- ✅ Real-time updates

### **AI Capabilities:**
- ✅ Layout optimization (real-time)
- ✅ Component generation (on-demand)
- ✅ A/B testing (autonomous)
- ✅ Sentiment analysis (adaptive)
- ✅ Collective intelligence (cross-vendor learning)

---

## 📊 **Database**

**Supabase PostgreSQL:**
```bash
# Direct access
psql "postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres"
```

**Key Tables:**
- `vendors` - Vendor accounts
- `products` - Product catalog
- `component_templates` - Component registry
- `vendor_component_instances` - Per-vendor component configs
- `page_sections` - Page structure
- `smart_component_cache` - Performance caching

**Key Vendor IDs:**
- Flora Distro: `cd2e1122-d511-4edb-be5d-98ef274b4baf`

---

## 🛠️ **Development**

### **Component System:**
```bash
# Generate new smart component
npm run generate:smart-component

# Register component in database
npm run db:register ComponentName
```

### **Directory Structure:**
```
/app                    - Next.js pages
  /(storefront)        - Customer storefronts
  /vendor              - Vendor portal
  /admin               - Admin dashboard
  /api                 - API routes

/components            - React components
  /component-registry  - Dynamic component system
    /smart             - Smart components (AI-powered)
    /atomic            - Basic UI elements
    /composite         - Composed components

/lib                   - Core utilities
  /supabase            - Database client
  /component-registry  - Component renderer
  /ai                  - AI engines (layout, generation)
  /matrix              - Advanced systems (quantum, neural)

/docs                  - Documentation (organized)
  /evolution           - Evolution plan & vision
  /architecture        - Technical architecture
  /guides              - How-to guides
  /archive             - Historical docs

/mcp-agent            - AI agent service
```

---

## 🎯 **The Vision**

WhaleTools is evolving from a static platform into **the world's first living, AI-powered commerce organism.**

### **What Makes It Special:**
- **Living Components** - Adapt in real-time based on user behavior
- **AI Layout Engine** - Automatically optimizes for conversions
- **Quantum Rendering** - Tests multiple layouts, shows best one
- **Section Portals** - Components morph like living organisms
- **Collective Intelligence** - Every vendor makes the platform smarter

### **6-Month Roadmap:**
1. **Phase 1-2:** Foundation + Component Evolution
2. **Phase 3:** AI Orchestration  
3. **Phase 4:** Global Scale (edge, multi-region)
4. **Phase 5:** Advanced AI
5. **Phase 6:** The Matrix ✨

**[Read the full vision →](docs/evolution/THE_VISION_SUMMARY.md)**

---

## 🔑 **API Keys Needed**

1. **Anthropic** (https://console.anthropic.com/)
   - Model: Claude Sonnet 4.5
   - Usage: AI storefront generation & optimization

2. **Supabase** (Already configured)
   - Database: PostgreSQL
   - Storage: File uploads
   - Realtime: Component updates

3. **Upstash Redis** (Optional - for Phase 1)
   - Caching: Edge cache layer
   - Performance: 50x faster cache hits

---

## 📖 **Additional Documentation**

### **In `/docs` folder:**
- Evolution plan (6 phases)
- Implementation guide (week-by-week)
- Architecture overview
- Component system docs
- Setup guides
- API reference

### **Quick Commands:**
```bash
# Development
npm run dev                          # Start dev server (port 3000)
npm run build                        # Build for production
npm run start                        # Start production server

# Components
npm run generate:smart-component     # Generate new component
npm run db:register <ComponentName>  # Register in database

# Database
psql "postgresql://..." -c "SELECT ..." # Run SQL query
```

---

## 🚢 **Deployment**

### **Main App** (Vercel):
```bash
git push origin main
# Auto-deploys to Vercel
```

### **AI Agent** (Railway):
```bash
cd mcp-agent
railway up
# Set env vars in Railway dashboard
```

---

## ✅ **What's Working**

- ✅ Multi-vendor storefronts
- ✅ Component registry system (database-driven UI)
- ✅ Smart components (auto-configured)
- ✅ AI agent (Claude Sonnet 4.5)
- ✅ Vendor dashboard
- ✅ Product management
- ✅ Real-time updates
- ✅ Analytics

---

## 🎯 **Next Steps**

1. **[Read the Vision](docs/evolution/THE_VISION_SUMMARY.md)** - Understand what we're building
2. **[Review Evolution Plan](docs/evolution/WHALETOOLS_EVOLUTION_PLAN.md)** - See the roadmap
3. **[Start Implementation](docs/evolution/IMPLEMENTATION_GUIDE.md)** - Begin Phase 1

**Full documentation:** [docs/README.md](docs/README.md)

---

## 📛 **Branding Structure**

**WhaleTools** is the platform infrastructure.  
**Yacht Club** is the master vendor account (demo/reference implementation).  
**Vendors** (like Flora Distro) create their own branded storefronts on WhaleTools.

[Learn more about platform naming →](docs/architecture/PLATFORM_NAMING.md)

---

**Built with Next.js 15, Supabase, Claude AI, and TypeScript.**

**WhaleTools: The future of multi-vendor e-commerce.** 🐋⚡

