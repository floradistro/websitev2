# 🎯 Complete Implementation Plan - Lovable-Style AI Builder

## Current Status

✅ **AI Code Generation** - Claude Sonnet 4.5 writes actual React code  
✅ **Database** - `storefront_files` table stores code  
✅ **API Endpoints** - Generate code, save to DB  
✅ **UI** - 3-column builder (chat, code, preview)  
⏳ **Dynamic Rendering** - Need to execute DB code in preview  

---

## The Challenge: Rendering Database Code

The **hardest part** is making the storefront app (port 3002) dynamically execute React code from the database.

### Current Flow:
1. AI generates code → ✅ Working
2. Saves to database → ✅ Working
3. UI shows code → ✅ Working
4. Preview renders → ❌ **Still using static template**

### What We Need:
Make step 4 actually execute the AI-generated code!

---

## Solution Options

### Option A: Server-Side Eval (Quick but Limited)
```typescript
// Dynamically import and render
const DynamicPage = ({ code }: { code: string }) => {
  const Component = eval(`(${code})`);
  return <Component />;
};
```

**Pros:** Simple, works immediately  
**Cons:** Security risk, eval is dangerous  

### Option B: Sandboxed Preview (Lovable's Way)
```typescript
// Use iframe with sandboxed environment
<iframe 
  srcDoc={`
    <!DOCTYPE html>
    <html>
      <head>
        <script type="module">
          ${compiledCode}
        </script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `}
/>
```

**Pros:** Secure, isolated  
**Cons:** Need to bundle React, Tailwind  

### Option C: Write to Disk + Hot Reload (Simplest for MVP)
```typescript
// When AI generates code:
1. Save to database ✅
2. ALSO write to /tmp/storefront-{id}/ folder
3. Next.js hot reload picks it up
4. Preview updates automatically
```

**Pros:** Uses Next.js built-in features  
**Cons:** File system dependency  

### Option D: Deploy Each Preview (Production-Ready)
```typescript
// Each time AI generates code:
1. Save to database
2. Create temporary Vercel deployment
3. Preview URL: preview-{storefront-id}.yachtclub.com
4. When happy → promote to production
```

**Pros:** True preview, production-like  
**Cons:** Slower, Vercel API limits  

---

## Recommended Approach: Hybrid

### Phase 1: **Write to Disk** (Today - 1 hour)
- AI generates code
- Save to database
- ALSO write to `storefront-app/generated/{storefront-id}/`
- Storefront app reads from that folder
- Use Next.js dynamic routes

### Phase 2: **Sandboxed Preview** (Next Week)
- Build iframe sandbox
- Compile code client-side
- No disk needed

### Phase 3: **Production Deploy** (When Ready)
- Deploy to Vercel
- Real URLs for each vendor

---

## Quick Implementation (Option C)

Let me show you the **fastest working solution**:

```typescript
// 1. When AI generates code:
async function saveGeneratedCode(storefrontId, files) {
  // Save to database
  await saveToDatabase(storefrontId, files);
  
  // ALSO write to disk for preview
  const outputPath = `/tmp/storefront-${storefrontId}`;
  for (const [path, content] of Object.entries(files)) {
    fs.writeFileSync(`${outputPath}/${path}`, content);
  }
  
  // Trigger hot reload
  touchFile(`${outputPath}/app/layout.tsx`);
}

// 2. Storefront app dynamically imports:
// app/[storefront]/page.tsx
export default async function DynamicStorefront({ params }) {
  const { storefront } = params;
  
  // Check if AI-generated version exists
  const customPath = `/tmp/storefront-${storefront}/app/page.tsx`;
  
  if (fs.existsSync(customPath)) {
    const CustomPage = await import(customPath);
    return <CustomPage.default />;
  }
  
  // Fall back to default
  return <DefaultStorefront />;
}
```

---

## Even Simpler: Component Registry

Store components as strings, compile on-demand:

```typescript
// lib/dynamic-component.tsx
export function DynamicComponent({ code }: { code: string }) {
  'use client';
  
  const Component = useMemo(() => {
    // Compile the code string into a React component
    const fn = new Function('React', `
      ${code}
      return Component;
    `);
    return fn(React);
  }, [code]);
  
  return <Component />;
}

// Then in preview:
<DynamicComponent code={files['components/Hero.tsx']} />
```

---

## What I Recommend NOW

**Let's do the FASTEST proof of concept:**

1. ✅ **AI generates code** (working)
2. ✅ **Shows in UI** (working)
3. ✅ **Manual copy/paste** to test

Then iterate to auto-preview.

**OR** - Show the AI-generated code in the preview area instead of iframe, with syntax highlighting. Let vendor **see the code being built** - that's powerful enough for MVP!

---

Want me to implement:
- **Option 1:** File system approach (preview works automatically)
- **Option 2:** Show code in preview panel (super fast to implement)
- **Option 3:** Build iframe sandbox (most like Lovable)

Which direction? 🎯

