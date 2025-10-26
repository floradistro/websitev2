# Platform Naming & Branding Guide

**For AI Agents: READ THIS FIRST**

---

## 🎯 Critical Clarification

### **WhaleTools** = The Platform
The entire multi-vendor marketplace infrastructure, component system, and AI tools.

### **Yacht Club** = A Vendor Account
The master/demo vendor account used for showcasing the platform. NOT the platform itself.

---

## 📛 Correct Usage

### ✅ DO SAY:
- "WhaleTools platform"
- "Building on WhaleTools"
- "WhaleTools component system"
- "WhaleTools marketplace"
- "Yacht Club vendor account"
- "Yacht Club is the master vendor on WhaleTools"

### ❌ DON'T SAY:
- "Yacht Club platform"
- "Yacht Club project"
- "Building Yacht Club"
- "Yacht Club marketplace"

---

## 🏗️ Architecture Naming

```
┌─────────────────────────────────────┐
│      WHALETOOLS PLATFORM            │  ← Platform infrastructure
│  (Component System + AI + Database) │
└─────────────────────────────────────┘
              │
     ┌────────┴────────┐
     │                 │
┌────▼─────┐   ┌───────▼──────┐
│  YACHT   │   │ FLORA DISTRO │         ← Vendor accounts
│  CLUB    │   │ (Wilson's)   │
│ (Master) │   │              │
└──────────┘   └──────────────┘
```

---

## 📁 File References

When referencing in documentation:
- ✅ "WhaleTools Design System"
- ✅ "WhaleTools luxury theme"
- ✅ "WhaleTools component registry"
- ✅ "Yacht Club vendor dashboard"
- ✅ "Yacht Club storefront" (referring to the specific vendor's store)

---

## 🎨 Branding Hierarchy

1. **WhaleTools** (Platform)
   - Design system name: WhaleTools
   - Component prefix: `Smart` (e.g., `SmartHeader`)
   - Base utilities: `SmartContainers`, `SmartTypography`
   - Theme: Pure black, font-black (900), rounded-2xl

2. **Yacht Club** (Master Vendor)
   - Status: Demo/reference vendor
   - Purpose: Platform showcase
   - URL: `/storefront?vendor=yacht-club`
   - Database: Just another `vendor` record

3. **Other Vendors** (Flora Distro, etc.)
   - Status: Individual tenant accounts
   - Each gets isolated data
   - Each gets custom storefront
   - Each uses WhaleTools component system

---

## 💬 When Talking to Users

### About the Platform:
"WhaleTools is a multi-vendor marketplace platform with AI-powered storefront generation and a component-based architecture."

### About Yacht Club:
"Yacht Club is the master vendor account on WhaleTools, used for demos and platform showcasing."

### About the System:
"Vendors create storefronts on WhaleTools using the Smart Component System, which renders pages from database-configured components."

---

## 🗄️ Database References

```sql
-- Yacht Club is just a vendor record:
SELECT * FROM vendors WHERE slug = 'yacht-club';

-- It's not the platform itself
-- The platform is the entire infrastructure
```

---

## 🔧 Code Comments

```typescript
// ✅ CORRECT:
// WhaleTools Smart Component System
// Part of the WhaleTools platform
// Used by Yacht Club and other vendors

// ❌ INCORRECT:
// Yacht Club component system
// Part of the Yacht Club platform
```

---

## 📊 External Communication

### Pitch Deck:
"**WhaleTools** - AI-Powered Multi-Vendor Marketplace Platform"

### Investor Materials:
"WhaleTools enables brands to launch customized e-commerce storefronts using our component-based system. Yacht Club serves as our reference implementation."

### Marketing:
"Launch your luxury storefront on WhaleTools in 60 seconds with AI"

---

## 🎯 Summary for AI Agents

When you see references to "Yacht Club project" or "building Yacht Club", interpret as:
- **Platform:** WhaleTools
- **Demo vendor:** Yacht Club

Always refer to the platform as **WhaleTools** in your responses and documentation updates.

---

**Last Updated:** October 26, 2025

