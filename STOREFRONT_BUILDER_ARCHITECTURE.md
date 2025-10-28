# 🏗️ Storefront Builder vs Component Editor - Architecture Explained

## You Have TWO Different Systems

### 1. **Component Editor** (`/vendor/component-editor`) 
**Purpose:** Visual page builder for vendor storefronts

**How it works:**
- Database-driven (components stored in `vendor_component_instances`)
- Drag & drop interface
- Edit props visually (text, colors, images)
- Works across **multiple pages** (home, shop, about, footer, etc.)
- Changes saved to database → rendered via `ComponentBasedPageRenderer`
- **INCREMENTAL**: Edit existing components, add/remove components
- **PRODUCTION**: This is what vendors use to build their live storefronts

**Pages you can edit:**
```
├── Home (/storefront)
├── Shop (/storefront/shop)
├── About (/storefront/about)
├── Contact (/storefront/contact)
├── FAQ (/storefront/faq)
├── Lab Results (/storefront/lab-results)
├── Shipping (/storefront/shipping)
├── Returns (/storefront/returns)
├── Privacy (/storefront/privacy)
└── Terms (/storefront/terms)
```

**Technology:**
- iframe-based preview
- postMessage communication
- Database persistence
- Smart Component System (auto-wired props)

---

### 2. **Storefront Builder** (`/storefront-builder`) - THIS IS WHAT YOU'RE USING
**Purpose:** AI-powered React component code generator/editor

**How it works:**
- Code-based (raw React/TSX components)
- AI generates/modifies code
- Visual preview of generated component
- Works on **SINGLE COMPONENTS** (not full pages)
- Code displayed in editor → preview rendered
- **REPLACEMENT**: Each AI generation creates NEW code (can send existing code to modify)
- **DEVELOPMENT**: This is for creating/prototyping custom components

**What it's for:**
- Creating NEW smart components
- Prototyping designs
- Learning/experimenting with AI
- Generating components from screenshots
- Testing design ideas

**Technology:**
- Claude Sonnet AI
- Playwright (screenshot tool)
- React component sandbox
- Exa (design research)

---

## Your Questions Answered

### ❓ "Can I edit the site or does it just spit out completely new code every time?"

**Answer:** It depends which tool you're using:

1. **Component Editor (Production):**
   - ✅ **Incremental editing** - Click a component, edit its props, save
   - ✅ **Persistent progress** - All changes saved to database
   - ✅ **Multi-page** - Edit any page in your storefront
   - ✅ **Live on site** - Changes reflect immediately on public URL

2. **Storefront Builder (Development):**
   - ⚠️ **Replacement by default** - AI generates fresh code each time
   - ✅ **Can modify existing** - Send your current code + prompt (e.g., "change hero color to blue")
   - ❌ **Single component only** - Not for full pages
   - ❌ **Not saved** - Code exists only in the editor until you deploy it

**How to make Storefront Builder edit incrementally:**
```typescript
// Current code in editor
const code = `export default function Hero() { ... }`;

// Send to AI with modification prompt
AI: "Change the headline to 'Welcome'"
→ AI receives your code + prompt
→ AI modifies the code
→ Returns updated code (preserves structure, only changes headline)
```

This is what `isEditingExisting` flag does - it tells Claude to modify, not replace.

---

### ❓ "How do we edit footer, shop pages, etc?"

**Answer:** Use the **Component Editor**, not Storefront Builder!

**Component Editor:**
```bash
# Access it at:
http://localhost:3000/vendor/component-editor

# 1. Select page from dropdown (footer is on every page)
# 2. Click component in preview
# 3. Edit props in right panel
# 4. Save
```

**How pages work:**
- Each page (home, shop, about) has **sections**
- Each section has **component instances**
- Footer is a component that appears on all pages
- Shop page has product grid components
- About page has about components

**To edit footer specifically:**
1. Go to Component Editor
2. Select any page (footer is global)
3. Scroll to footer in preview
4. Click footer component
5. Edit properties (social links, copyright, etc.)
6. Save → Updates on all pages

---

### ❓ "How do we make this do the entire site?"

**Answer:** You don't use Storefront Builder for that!

**The RIGHT tool for full site editing:**
```
Component Editor → Multi-page, database-driven, visual editor
```

**What Storefront Builder IS good for:**
- Creating a NEW component (e.g., "SmartProductShowcase")
- Testing screenshot analysis (scrape competitor sites)
- Prototyping a complex component before adding to component library
- AI-assisted React coding

**Workflow to add new component to site:**
```
1. Use Storefront Builder → Generate component code
2. Test it in preview
3. Copy code → Save as new Smart Component (e.g., smart_product_showcase.tsx)
4. Register in component registry
5. Add to database (vendor_component_instances)
6. Now available in Component Editor for all pages
```

---

## Quick Comparison Table

| Feature | Component Editor | Storefront Builder |
|---------|------------------|-------------------|
| **Purpose** | Build live storefronts | Prototype components |
| **Pages** | All pages | Single component |
| **Editing** | Incremental (edit props) | Code generation/modification |
| **Storage** | Database | Temporary (in editor) |
| **Interface** | Visual drag & drop | Code + AI chat |
| **Output** | Live website | React component code |
| **Users** | Vendors (non-technical) | Developers/designers |
| **AI** | No | Yes (Claude) |

---

## Fixing Your Timeout Issue

The 120s timeout you're seeing suggests:

1. **API isn't responding at all** - Let me add better error logging
2. **Stream not starting** - Need to send immediate heartbeat
3. **Silent failure** - Something crashing without error

I'll fix this now by adding comprehensive logging and an immediate response test.

---

## Recommendation

**For your use case (editing moonwater site):**

If you want to:
- **Build entire pages** → Use Component Editor
- **Test AI screenshot scraping** → Use Storefront Builder (what you're doing)
- **Create custom components from scratch** → Use Storefront Builder
- **Edit existing site content** → Use Component Editor

The manual screenshot feature you requested IS in Storefront Builder (for prototyping).
But for production site editing, you'd use the Component Editor.

---

Let me now fix the timeout issue so you can at least test the screenshot feature! 🔧

