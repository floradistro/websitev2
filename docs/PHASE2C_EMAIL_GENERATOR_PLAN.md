# Phase 2C: Email Generator Refactoring Plan

**Target File:** `lib/marketing/email-generator.ts`
**Current Size:** 478 lines
**Imports:** 1 file only (`app/api/vendor/marketing/email/generate/route.ts`)
**Risk Level:** 🟢 LOW (only 1 importing file, clear structure)

---

## 📋 Analysis

### Current Structure

```typescript
lib/marketing/email-generator.ts (478 lines)
├── EmailGenerationParams interface
├── GeneratedEmail interface
├── EmailGenerator class (main logic)
│   ├── generateCampaign() - Main entry point
│   ├── generateContent() - AI content generation
│   ├── buildPrompt() - Prompt building (LARGEST - ~150 lines)
│   ├── buildHTML() - HTML template (LARGE - ~200 lines)
│   ├── stripHTML() - Utility
│   └── generateVariants() - A/B testing
└── createEmailGenerator() - Factory function
```

### Single Import Point

```typescript
// ONLY importing file:
app / api / vendor / marketing / email / generate / route.ts;
imports: createEmailGenerator;
```

---

## 🎯 Refactoring Strategy

### Split Into 4 Modules

```
lib/marketing/email-generator/
├── index.ts (20 lines)          # Main exports + backward compatibility
├── types.ts (40 lines)          # Interfaces & types
├── generator.ts (150 lines)     # Core EmailGenerator class
├── prompts.ts (120 lines)       # AI prompt templates
├── templates.ts (150 lines)     # HTML email templates
└── utils.ts (20 lines)          # Helper functions
```

---

## 📝 Detailed Plan

### Step 1: Create Directory Structure

```bash
mkdir -p lib/marketing/email-generator
```

### Step 2: Extract Types (40 lines)

**File:** `lib/marketing/email-generator/types.ts`

- EmailGenerationParams interface
- GeneratedEmail interface
- Campaign type definitions
- Any internal types

### Step 3: Extract Prompt Templates (120 lines)

**File:** `lib/marketing/email-generator/prompts.ts`

- buildPrompt() method → buildEmailPrompt() function
- All campaign type templates (welcome, new_product, sale, etc.)
- Prompt building logic

### Step 4: Extract HTML Templates (150 lines)

**File:** `lib/marketing/email-generator/templates.ts`

- buildHTML() method → buildEmailHTML() function
- All HTML template strings
- Styling logic
- Color/branding utilities

### Step 5: Extract Utilities (20 lines)

**File:** `lib/marketing/email-generator/utils.ts`

- stripHTML() function
- Any other utility functions

### Step 6: Create Core Generator (150 lines)

**File:** `lib/marketing/email-generator/generator.ts`

```typescript
import type { EmailGenerationParams, GeneratedEmail } from "./types";
import { buildEmailPrompt } from "./prompts";
import { buildEmailHTML } from "./templates";
import { stripHTML } from "./utils";

export class EmailGenerator {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateCampaign(params: EmailGenerationParams): Promise<GeneratedEmail> {
    const content = await this.generateContent(params);
    const html = buildEmailHTML(params, content);
    const plainText = stripHTML(content.body);
    // ... rest of logic
  }

  private async generateContent(params: EmailGenerationParams) {
    const prompt = buildEmailPrompt(params);
    // ... OpenAI call
  }

  async generateVariants(params: EmailGenerationParams, count: number) {
    // ... variants logic
  }
}
```

### Step 7: Create Main Index (20 lines)

**File:** `lib/marketing/email-generator/index.ts`

```typescript
// Export all types
export type { EmailGenerationParams, GeneratedEmail } from "./types";

// Export main class
export { EmailGenerator } from "./generator";

// Export factory function (backward compatibility)
export function createEmailGenerator(openAIKey?: string): EmailGenerator {
  const apiKey = openAIKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key required");
  return new EmailGenerator(apiKey);
}
```

### Step 8: Update Original File (17 lines)

**File:** `lib/marketing/email-generator.ts`

```typescript
/**
 * AI-Powered Email Template Generator - BACKWARD COMPATIBILITY LAYER
 *
 * This file maintains backward compatibility by re-exporting from the refactored structure.
 * The original 478-line file has been split into organized modules in lib/marketing/email-generator/
 *
 * All existing imports will continue to work:
 * import { createEmailGenerator, EmailGenerator } from '@/lib/marketing/email-generator'
 */

export * from "./email-generator/index";
```

### Step 9: Create Backup

```bash
cp lib/marketing/email-generator.ts lib/marketing/email-generator.ts.backup
```

---

## ✅ Safety Checklist

- [ ] Create backup of original file
- [ ] Only 1 importing file to verify
- [ ] Extract types first (no logic)
- [ ] Extract utilities (pure functions)
- [ ] Extract templates (pure functions)
- [ ] Extract prompts (pure functions)
- [ ] Update core generator class
- [ ] Create main index with re-exports
- [ ] Update original file to re-export
- [ ] Verify TypeScript compilation
- [ ] Test the single importing file
- [ ] Create Playwright test for email generation API

---

## 🧪 Testing Strategy

### Test File to Create

```typescript
// tests/email-generator-refactoring.spec.ts

test("email generator still exports correctly", () => {
  // Verify exports work
});

test("email generation API endpoint works", ({ request }) => {
  // Test /api/vendor/marketing/email/generate
});

test("backward compatibility maintained", () => {
  // Verify old imports still work
});

test("factory function works", () => {
  // Test createEmailGenerator()
});
```

---

## 📊 Expected Results

### File Size Reduction

```
Before: 478 lines (1 file)
After:  Max 150 lines per file (6 files)
Reduction: 69% per file
```

### Imports to Verify

```
Only 1 file: app/api/vendor/marketing/email/generate/route.ts
```

### Benefits

- ✅ Easier to maintain (each file has single responsibility)
- ✅ Easier to test (pure functions in prompts/templates)
- ✅ Easier to extend (add new templates without touching generator)
- ✅ 100% backward compatible
- ✅ Zero risk (only 1 importing file)

---

## 🚨 Risk Mitigation

### Low Risk Because:

1. **Single Import:** Only 1 file uses this module
2. **Clear Structure:** Class-based, easy to split
3. **Pure Functions:** Most logic is stateless (prompts, templates)
4. **Backup Created:** Can rollback instantly
5. **TypeScript Safety:** Compiler will catch any errors

### Rollback Plan

```bash
# If anything goes wrong:
mv lib/marketing/email-generator.ts.backup lib/marketing/email-generator.ts
rm -rf lib/marketing/email-generator/
```

---

## 📋 Execution Order

1. Create backup ✅
2. Create directory structure ✅
3. Extract types.ts (no logic, safest)
4. Extract utils.ts (pure functions)
5. Extract templates.ts (pure functions)
6. Extract prompts.ts (pure functions)
7. Create generator.ts (main class)
8. Create index.ts (exports)
9. Update original .ts file (re-export)
10. Run TypeScript check
11. Test importing file
12. Create Playwright tests
13. Verify all tests pass
14. Document completion

---

## ✅ Approval Required

**Before proceeding, confirm:**

- [ ] User approves this plan
- [ ] Backup will be created first
- [ ] Only proceed if TypeScript validates
- [ ] Stop immediately if any errors occur
- [ ] Test thoroughly before marking complete

---

**Estimated Time:** 15-20 minutes
**Risk Level:** 🟢 LOW
**Breaking Change Risk:** 🟢 MINIMAL (only 1 importing file)

---

_Ready to proceed with user approval._
