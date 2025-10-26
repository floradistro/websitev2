# 🤖 Cursor AI Agent Resources

This directory contains persistent documentation and configuration for AI agents working on this project across multiple sessions.

---

## 📁 Files in This Directory

### `.cursorrules`
**Project-level rules for Cursor AI**
- Auto-loaded by Cursor at the start of every session
- Contains coding standards, design system rules, and common tasks
- **AI agents should follow these rules strictly**

### `SMART_COMPONENT_GUIDE.md`
**Quick reference for the Smart Component System**
- Complete component architecture overview
- Code templates and examples
- Database connection strings
- Design system standards
- Existing component reference
- **Read this first when starting component work**

### `db-config.sh`
**Database connection configuration**
- Supabase credentials
- Helper functions for psql commands
- Environment variables

### `SUPABASE_ACCESS.md`
**Database access documentation**
- Connection details
- Schema information
- Common queries

---

## 🚀 For AI Agents

When starting a new session:

1. **Check `.cursorrules`** - Loaded automatically by Cursor
2. **Read `SMART_COMPONENT_GUIDE.md`** - If working with components
3. **Use database directly** - Credentials are in `db-config.sh`

---

## 🎯 Quick Access

### Most Important Files:
```
.cursor/
├── .cursorrules                    ← START HERE
├── SMART_COMPONENT_GUIDE.md        ← Component work
├── db-config.sh                    ← Database access
└── SUPABASE_ACCESS.md              ← Database docs
```

### Project-Level Docs:
```
/
├── SMART_COMPONENT_SYSTEM.md       ← Full architecture
├── ANIMATION_SYSTEM.md             ← Animation library
├── lib/smart-component-base.tsx    ← Base utilities
├── scripts/smart-component-generator.ts  ← Component generator
└── components/component-registry/  ← All components
```

---

## 🔄 Persistence Mechanism

1. **`.cursorrules`** → Loaded automatically by Cursor IDE
2. **`.cursor/` directory** → Version controlled, persists in repo
3. **Memories** → Stored in Cursor's memory system
4. **Documentation files** → Always available in repo

This ensures AI agents have consistent context across:
- ✅ Different chat sessions
- ✅ Different computers
- ✅ Different AI models
- ✅ Project collaborators

---

## 📝 Maintenance

### Adding New Persistent Info:
1. Add to `.cursorrules` for rules/standards
2. Add to `SMART_COMPONENT_GUIDE.md` for component templates
3. Update memories using `update_memory` tool
4. Document in main project docs (e.g., `SMART_COMPONENT_SYSTEM.md`)

### Updating Existing Info:
1. Edit the relevant file in `.cursor/`
2. Update corresponding memory (if applicable)
3. Commit to git

---

**Last Updated:** October 2025
