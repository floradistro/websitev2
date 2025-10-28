# Pre-Production Cleanup Checklist

**Generated:** October 28, 2025
**Status:** In Progress
**Production Readiness Score:** 7/10

---

## 🔴 CRITICAL - Before Public Launch

### 1. API Key Security
- [ ] Verify `.env.local` is NOT in git history
  ```bash
  git log --all --full-history -- .env.local
  ```
- [ ] Rotate all API keys before launch:
  - [ ] ANTHROPIC_API_KEY (appears 3 times - remove duplicates)
  - [ ] EXA_API_KEY
  - [ ] VERCEL_TOKEN
  - [ ] MCP_AGENT_SECRET
- [ ] Move all keys to Vercel Environment Variables
- [ ] Test with new keys in staging

**Effort:** 1 hour
**Risk:** CRITICAL

---

### 2. Console.log Cleanup (1,460+ occurrences)

**Top Priority Files:**
- [ ] `/app/storefront-builder/page.tsx` - 108 console logs
- [ ] `/app/vendor/tv-menus/page.tsx` - 49 console logs
- [ ] `/app/tv-display/page.tsx` - 33 console logs
- [ ] `/lib/ai/visual-analyzer.ts` - 38 console logs
- [ ] `/lib/scheduled-tasks.ts` - 29 console logs

**Strategy:**
- Replace debug logs with logger wrapper (`/lib/logger.ts`)
- Keep critical error logs
- Remove development/test logs

**Effort:** 4-6 hours
**Risk:** HIGH (potential data leaks)

---

## 🟡 HIGH PRIORITY - This Week

### 3. Scripts Directory Cleanup (63 files)

**DELETE - Redundant Migration Scripts:**
- [ ] `/scripts/apply-migration-direct.js`
- [ ] `/scripts/apply-migration-simple.js`
- [ ] `/scripts/run-migration-direct.js`
- [ ] `/scripts/run-migration-stepbystep.js`
- [ ] `/scripts/run-simple-migration.js`
- [ ] `/scripts/auto-migrate.js`

**KEEP:** `/scripts/run-migration.ts` (primary)

**MOVE TO /tests/manual/:**
- [ ] `test-wholesale-system.js`
- [ ] `test-wholesale-direct.js`
- [ ] `test-tv-system.ts`
- [ ] `test-device-registration.ts`
- [ ] `test-sku-scanning.js`
- [ ] `test-low-stock-notifications.js`
- [ ] `comprehensive-po-test.js`
- [ ] `real-world-scenarios-test.js`

**ARCHIVE - One-time Scripts:**
- [ ] `add-theme-*.js/ts` files
- [ ] `fix-*.js/ts` files (if fixes applied)
- [ ] `create-*.js/ts` files (if data created)

**Effort:** 2-3 hours

---

### 4. Hardcoded Credentials Audit

**Manual Review Required:**
- [ ] `/app/api/vendor/media/enhance/route.ts`
- [ ] `/app/api/vendor/media/bulk-enhance/route.ts`
- [ ] `/app/api/vendor/media/add-background/route.ts`
- [ ] `/app/api/google-reviews/route.ts`

**Effort:** 30 minutes
**Risk:** MEDIUM

---

### 5. Test Routes Security

**Add Auth or Remove:**
- [ ] `/pos-test`
- [ ] `/pos-register-test`
- [ ] Any other `-test` routes

**Effort:** 1 hour
**Risk:** MEDIUM

---

## 🟢 MEDIUM PRIORITY - Before Launch

### 6. TODO/FIXME Resolution

**Files with TODOs (15 total):**

**App Directory:**
- [ ] `/app/vendor/settings/page.tsx`
- [ ] `/app/vendor/purchase-orders/page.tsx`
- [ ] `/app/pos/register/page.tsx`
- [ ] `/app/vendor/orders/page.tsx`
- [ ] `/app/(storefront)/storefront/cart/page.tsx`
- [ ] `/app/api/newsletter/route.ts`

**Components:**
- [ ] `/components/component-registry/pos/POSCart.tsx`
- [ ] `/components/component-registry/pos/POSReceipt.tsx`
- [ ] `/components/component-registry/atomic/Icon.tsx`
- [ ] `/components/storefront/ProductDetail.tsx`

**Lib:**
- [ ] `/lib/logger.ts`
- [ ] `/lib/monitoring.ts`
- [ ] `/lib/analytics.ts`

**Action:** Review each, create GitHub issues for important ones, remove stale ones

**Effort:** 2-3 hours

---

### 7. Code Cleanup

- [ ] Run ESLint with auto-fix for unused imports
  ```bash
  npm run lint -- --fix
  ```
- [ ] Remove large commented code blocks
- [ ] Review and clean up debug code

**Effort:** 2 hours

---

## 📚 DOCUMENTATION TASKS

### Pre-Launch Docs
- [ ] Create `CONTRIBUTING.md`
- [ ] Create `DEPLOYMENT.md`
- [ ] Create `SECURITY.md`
- [ ] Create `API_REFERENCE.md` or OpenAPI/Swagger docs

**Effort:** 4-6 hours

---

## 🔧 POST-LAUNCH REFACTORING

### Large File Refactoring (1-2 weeks)

**Priority Files:**
1. [ ] `/app/storefront-builder/page.tsx` - 117KB (2,612 lines)
   - Split into 5-6 smaller components
   - Extract state management
   - Move utilities to /lib

2. [ ] `/app/vendor/tv-menus/page.tsx` - 54KB (1,312 lines)
   - Extract form sections
   - Create reusable menu components

3. [ ] `/components/vendor/ComponentInstanceEditor.tsx` - 59KB (1,378 lines)
   - Break into sub-editors
   - Extract property editors

4. [ ] `/app/vendor/component-editor/page.tsx` - 1,308 lines
5. [ ] `/app/vendor/products/new/NewProductClient.tsx` - 1,265 lines
6. [ ] `/app/admin/products/page.tsx` - 956 lines

**Strategy:** Post-launch incremental refactoring (1 file per week)

---

## ✅ COMPLETED

- [x] Git cleanup - removed `page-old.tsx` backup file (Oct 28, 2025)
- [x] Fixed TypeScript errors (Oct 28, 2025)
- [x] Removed WCL system (Oct 28, 2025)
- [x] Added test infrastructure (Playwright)

---

## 📊 PROGRESS TRACKER

### Week 1 (Launch Prep)
- **Day 1:** API key rotation + console.log cleanup
- **Day 2:** Scripts cleanup + hardcoded credentials audit
- **Day 3:** Test routes security + TODO review
- **Day 4:** ESLint fixes + code cleanup
- **Day 5:** Documentation + final testing

### Week 2+ (Post-Launch)
- **Ongoing:** File refactoring (1 large file per week)
- **Ongoing:** API documentation
- **Ongoing:** Code quality improvements

---

## 🎯 LAUNCH READINESS CRITERIA

**Must Complete Before Launch:**
- [ ] All CRITICAL tasks (Section 1-2)
- [ ] All HIGH PRIORITY tasks (Section 3-5)
- [ ] Final security audit
- [ ] Load testing
- [ ] Backup/rollback plan documented

**Recommended Before Launch:**
- [ ] MEDIUM PRIORITY tasks (Section 6-7)
- [ ] Basic documentation complete
- [ ] Monitoring/alerting configured

**Can Do After Launch:**
- [ ] POST-LAUNCH refactoring
- [ ] Comprehensive API docs
- [ ] Advanced monitoring

---

## 📝 NOTES

### Security Verification Commands
```bash
# Check .env not in git
git log --all --full-history -- .env.local

# Find console.log statements
grep -r "console.log" app/ components/ lib/ | wc -l

# Find hardcoded strings that look like keys
grep -r "sk-" app/ components/ lib/
grep -r "api[_-]key" app/ components/ lib/
```

### Useful Cleanup Commands
```bash
# Remove all console.log (be careful!)
find app/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' '/console\.log/d'

# Find large files
find app/ components/ -type f -exec wc -l {} \; | sort -rn | head -20

# Find TODO comments
grep -r "TODO\|FIXME" app/ components/ lib/
```

---

**Last Updated:** October 28, 2025
**Next Review:** Before production launch
**Owner:** Development Team
