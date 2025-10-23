# 🚀 Modern AI Code Generation - The Lovable Way

## How Lovable/v0.dev Actually Works

### ❌ OLD WAY (What we had):
- AI generates theme specs (JSON)
- Apply CSS variables to template
- Limited customization

### ✅ NEW WAY (Lovable-style):
- AI writes actual React/Next.js code
- Each prompt builds on previous code
- Fully editable, iterative
- Complete site generation

---

## Architecture: Code-First Generation

```
┌──────────────────────────────────────────────────────────────┐
│  USER PROMPT: "Add a hero section with my logo"             │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  CLAUDE SONNET 4.5                                           │
│  - Reads existing code from database                         │
│  - Generates/modifies React components                       │
│  - Returns complete .tsx files                               │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  STORE IN DATABASE                                           │
│  storefront_files:                                           │
│    - app/page.tsx         → "export default function..."     │
│    - components/Hero.tsx  → "export function Hero()..."      │
│    - app/globals.css      → ":root { --primary..."          │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  LIVE PREVIEW SERVER                                         │
│  - Reads files from database                                 │
│  - Renders in memory (no disk writes)                        │
│  - Hot reload on changes                                     │
└────────────────────────────┬─────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  VENDOR SEES LIVE PREVIEW                                    │
│  - Updates in real-time                                      │
│  - Can iterate with more prompts                             │
│  - When happy → Deploy                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Table: `storefront_files`

```sql
CREATE TABLE storefront_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID REFERENCES vendor_storefronts(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- File info
  file_path TEXT NOT NULL,              -- e.g., "app/page.tsx"
  file_content TEXT NOT NULL,           -- Actual code
  file_type TEXT,                       -- "tsx", "css", "json"
  
  -- Version control
  version INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES storefront_files(id),
  
  -- Metadata
  created_by_prompt TEXT,               -- The prompt that created/modified this
  ai_explanation TEXT,                  -- What the AI did
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(storefront_id, file_path, version)
);

CREATE INDEX storefront_files_storefront_idx ON storefront_files(storefront_id);
CREATE INDEX storefront_files_path_idx ON storefront_files(file_path);
```

---

## AI Prompt Engineering

### System Prompt for Code Generation

```typescript
const CODE_GENERATION_PROMPT = `You are an expert Next.js/React developer building custom vendor storefronts.

CONTEXT:
- Vendor sells cannabis products via Yacht Club platform
- Products loaded from Supabase (already configured)
- Use Next.js 14 App Router + TypeScript + Tailwind CSS
- Must be production-ready, mobile-responsive, accessible

CURRENT FILES:
{{existingFiles}}

USER REQUEST:
{{userMessage}}

YOUR TASK:
1. Analyze what needs to be created/modified
2. Write/update the necessary files
3. Ensure code integrates with existing files
4. Use Supabase for product data (already set up)

RESPONSE FORMAT:
Return JSON with files to create/update:

{
  "explanation": "I've added a hero section with...",
  "files": [
    {
      "path": "app/page.tsx",
      "content": "export default function HomePage() {...}",
      "action": "update",
      "reasoning": "Modified to add hero section"
    },
    {
      "path": "components/Hero.tsx",
      "content": "export function Hero() {...}",
      "action": "create",
      "reasoning": "New hero component with vendor logo"
    }
  ],
  "nextSuggestions": [
    "Add a product grid",
    "Create a navigation menu",
    "Add a contact form"
  ]
}

RULES:
- Always use TypeScript
- Use Tailwind for styling
- Keep components small and reusable
- Use async/await for Supabase queries
- Follow Next.js 14 best practices
- Make it look professional and modern
- NEVER use mock data - only real Supabase data
`;
```

---

## Implementation

### 1. Enhanced API Endpoint

**File: `app/api/ai-agent/generate-code/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  const vendorId = request.headers.get('x-vendor-id');
  const { message, storefrontId } = await request.json();
  
  const supabase = getServiceSupabase();
  
  // Get existing files for this storefront
  const { data: existingFiles } = await supabase
    .from('storefront_files')
    .select('file_path, file_content')
    .eq('storefront_id', storefrontId)
    .order('version', { ascending: false });
  
  // Build context of existing files
  const filesContext = existingFiles?.map(f => 
    `// ${f.file_path}\n${f.file_content}`
  ).join('\n\n---\n\n') || 'No files yet. Start from scratch.';
  
  // Call Claude Sonnet 4.5
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: CODE_GENERATION_PROMPT.replace('{{existingFiles}}', filesContext),
    messages: [{
      role: 'user',
      content: message,
    }],
  });
  
  const aiResponse = JSON.parse(response.content[0].text);
  
  // Save generated files to database
  for (const file of aiResponse.files) {
    // Get current version
    const { data: existing } = await supabase
      .from('storefront_files')
      .select('version')
      .eq('storefront_id', storefrontId)
      .eq('file_path', file.path)
      .order('version', { ascending: false })
      .limit(1)
      .single();
    
    const newVersion = (existing?.version || 0) + 1;
    
    // Insert new version
    await supabase.from('storefront_files').insert({
      storefront_id: storefrontId,
      vendor_id: vendorId,
      file_path: file.path,
      file_content: file.content,
      file_type: file.path.endsWith('.tsx') ? 'tsx' : 
                 file.path.endsWith('.css') ? 'css' : 'other',
      version: newVersion,
      created_by_prompt: message,
      ai_explanation: file.reasoning,
    });
  }
  
  return NextResponse.json({
    success: true,
    explanation: aiResponse.explanation,
    filesModified: aiResponse.files.length,
    nextSuggestions: aiResponse.nextSuggestions,
  });
}
```

---

## 2. Virtual File System for Preview

The preview server reads files from database, not disk:

**File: `storefront-app/lib/virtual-fs.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

export class VirtualFileSystem {
  private cache: Map<string, string> = new Map();
  
  constructor(
    private storefrontId: string,
    private supabase: ReturnType<typeof createClient>
  ) {}
  
  async readFile(filePath: string): Promise<string | null> {
    // Check cache first
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }
    
    // Get latest version from database
    const { data } = await this.supabase
      .from('storefront_files')
      .select('file_content')
      .eq('storefront_id', this.storefrontId)
      .eq('file_path', filePath)
      .order('version', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      this.cache.set(filePath, data.file_content);
      return data.file_content;
    }
    
    return null;
  }
  
  async getAllFiles(): Promise<Record<string, string>> {
    const { data } = await this.supabase
      .from('storefront_files')
      .select('file_path, file_content')
      .eq('storefront_id', this.storefrontId)
      .order('version', { ascending: false });
    
    const files: Record<string, string> = {};
    const seen = new Set();
    
    // Get latest version of each file
    for (const file of data || []) {
      if (!seen.has(file.file_path)) {
        files[file.file_path] = file.file_content;
        seen.add(file.file_path);
      }
    }
    
    return files;
  }
}
```

---

## 3. Code Editor UI (Like v0.dev)

**Updated Builder UI:**

```typescript
// app/vendor/storefront-builder/page.tsx
export default function StorefrontBuilder() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState('app/page.tsx');
  const [previewKey, setPreviewKey] = useState(0);
  
  async function handleAIPrompt(message: string) {
    const response = await fetch('/api/ai-agent/generate-code', {
      method: 'POST',
      headers: {
        'x-vendor-id': vendor.id,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        storefrontId: currentStorefront.id,
      }),
    });
    
    const result = await response.json();
    
    // Reload files from database
    const updatedFiles = await fetch(`/api/ai-agent/files/${currentStorefront.id}`);
    setFiles(await updatedFiles.json());
    
    // Trigger preview reload
    setPreviewKey(prev => prev + 1);
    
    // Show AI's explanation
    addMessage({
      role: 'assistant',
      content: result.explanation,
    });
  }
  
  return (
    <div className="grid grid-cols-3 gap-4 h-screen">
      {/* Chat - 1/3 */}
      <div className="col-span-1">
        {/* AI chat interface */}
      </div>
      
      {/* Code Editor - 1/3 */}
      <div className="col-span-1">
        <div className="flex flex-col h-full">
          {/* File tabs */}
          <div className="flex gap-2 overflow-x-auto border-b">
            {Object.keys(files).map(path => (
              <button
                key={path}
                onClick={() => setSelectedFile(path)}
                className={selectedFile === path ? 'bg-white/10' : ''}
              >
                {path.split('/').pop()}
              </button>
            ))}
          </div>
          
          {/* Code viewer */}
          <div className="flex-1 overflow-auto">
            <pre className="p-4 text-xs">
              <code>{files[selectedFile]}</code>
            </pre>
          </div>
        </div>
      </div>
      
      {/* Live Preview - 1/3 */}
      <div className="col-span-1">
        <iframe
          key={previewKey}
          src={`http://localhost:3002?storefront=${currentStorefront.id}`}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
```

---

## 4. Example AI Interactions

### Iteration 1: "Create a hero section"
```typescript
// AI generates:
{
  "files": [
    {
      "path": "app/page.tsx",
      "content": `
export default function HomePage() {
  return (
    <div>
      <Hero />
      <ProductGrid />
    </div>
  );
}`,
      "action": "update"
    },
    {
      "path": "components/Hero.tsx",
      "content": `
export function Hero() {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
      <h1 className="text-8xl font-bold text-white">Flora Distro</h1>
    </div>
  );
}`,
      "action": "create"
    }
  ]
}
```

### Iteration 2: "Make the hero have a video background"
```typescript
// AI modifies existing Hero.tsx:
{
  "files": [
    {
      "path": "components/Hero.tsx",
      "content": `
export function Hero() {
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover">
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>
      <div className="relative z-10">
        <h1 className="text-8xl font-bold text-white">Flora Distro</h1>
      </div>
    </div>
  );
}`,
      "action": "update"
    }
  ]
}
```

### Iteration 3: "Add a product carousel below the hero"
```typescript
// AI creates new component:
{
  "files": [
    {
      "path": "components/ProductCarousel.tsx",
      "content": `
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function ProductCarousel() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    async function load() {
      const vendorId = process.env.NEXT_PUBLIC_VENDOR_ID;
      const { data } = await supabase
        .from('products')
        .eq('vendor_id', vendorId)
        .eq('status', 'published')
        .limit(6);
      setProducts(data || []);
    }
    load();
  }, []);
  
  return (
    <div className="flex gap-4 overflow-x-auto">
      {products.map(p => (
        <div key={p.id} className="min-w-[300px]">
          <img src={p.featured_image} />
          <h3>{p.name}</h3>
          <p>\${p.price}</p>
        </div>
      ))}
    </div>
  );
}`,
      "action": "create"
    },
    {
      "path": "app/page.tsx",
      "content": `
import { Hero } from '@/components/Hero';
import { ProductCarousel } from '@/components/ProductCarousel';

export default function HomePage() {
  return (
    <div>
      <Hero />
      <ProductCarousel />
    </div>
  );
}`,
      "action": "update"
    }
  ]
}
```

---

## 5. Clean Implementation Steps

### Step 1: Create `storefront_files` Table (5 min)

```sql
CREATE TABLE IF NOT EXISTS public.storefront_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES public.vendor_storefronts(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  file_path TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_type TEXT,
  
  version INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES public.storefront_files(id),
  
  created_by_prompt TEXT,
  ai_explanation TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(storefront_id, file_path, version)
);

CREATE INDEX storefront_files_storefront_idx ON public.storefront_files(storefront_id);
CREATE INDEX storefront_files_vendor_idx ON public.storefront_files(vendor_id);
CREATE INDEX storefront_files_path_idx ON public.storefront_files(file_path);

ALTER TABLE public.storefront_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage own files"
  ON public.storefront_files FOR ALL
  USING (vendor_id::text = auth.uid()::text);

GRANT ALL ON public.storefront_files TO authenticated, service_role;
```

### Step 2: Update AI Prompt (10 min)

Make Claude generate actual code, not just specs.

### Step 3: File Rendering API (20 min)

```typescript
// app/api/ai-agent/files/[storefrontId]/route.ts
export async function GET(request, { params }) {
  const { storefrontId } = params;
  
  const { data: files } = await supabase
    .from('storefront_files')
    .select('file_path, file_content')
    .eq('storefront_id', storefrontId);
  
  return NextResponse.json(
    files.reduce((acc, f) => ({
      ...acc,
      [f.file_path]: f.file_content
    }), {})
  );
}
```

### Step 4: Dynamic Preview Server (30 min)

Modify storefront app to load files from database:

```typescript
// storefront-app/app/page.tsx
export default async function DynamicPage() {
  const storefrontId = searchParams.get('storefront');
  
  if (storefrontId) {
    // Load code from database
    const files = await loadStorefrontFiles(storefrontId);
    
    // Dynamically render the code
    const PageComponent = await compileComponent(files['app/page.tsx']);
    return <PageComponent />;
  }
  
  // Default vendor storefront
  return <DefaultStorefront />;
}
```

### Step 5: Code Editor UI (1 hour)

Add Monaco Editor for viewing/editing code:

```bash
npm install @monaco-editor/react
```

```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="100%"
  defaultLanguage="typescript"
  value={files[selectedFile]}
  theme="vs-dark"
  options={{
    readOnly: true, // Or allow editing
    minimap: { enabled: false },
  }}
/>
```

---

## 6. The Lovable Flow

### User Journey:

**Prompt 1:** "Create a cannabis storefront with a dark theme"
→ AI generates: `page.tsx`, `layout.tsx`, `globals.css`, `Hero.tsx`

**Prompt 2:** "Add a product grid showing our flower"
→ AI generates: `ProductGrid.tsx`, updates `page.tsx`

**Prompt 3:** "Make the hero section have parallax scrolling"
→ AI updates: `Hero.tsx` with parallax logic

**Prompt 4:** "Add a navigation menu with cart icon"
→ AI generates: `Navigation.tsx`, `Cart.tsx`, updates `layout.tsx`

**Prompt 5:** "Deploy it"
→ System writes files to disk, deploys to Vercel

### Result: Fully custom site built conversationally!

---

## 7. Advantages of This Approach

✅ **True AI Coding** - Not just themes, actual code
✅ **Iterative** - Each prompt builds on previous
✅ **Editable** - Vendor can see/modify code
✅ **Version Control** - Every change tracked
✅ **No Limits** - Can build anything
✅ **Production Ready** - Real Next.js code

---

## 8. Quick Win: Hybrid Approach

Start simple, add complexity:

### Phase 1: Code Generation (Now)
- AI generates React components
- Store in database
- Show in editor

### Phase 2: Live Preview (Week 1)
- Render database files in preview
- Hot reload on changes

### Phase 3: Full IDE (Week 2)
- Monaco code editor
- File tree navigation
- Multi-file editing

### Phase 4: Deploy (Week 3)
- Write files to disk
- Push to GitHub
- Deploy to Vercel

---

## 9. Simplified Start (Today)

**MVP in 2 hours:**

1. ✅ Add `storefront_files` table
2. ✅ Update AI prompt to generate code
3. ✅ Store code in database
4. ✅ Show code in chat response
5. ✅ Manual copy/paste to deploy

**This proves the concept!**

Then iterate:
- Add code editor
- Add file preview
- Add live rendering
- Add auto-deploy

---

## 10. Example of Final Product

Vendor chats:
```
"Build me a premium cannabis storefront like Apple's website. 
Clean, minimalist, with a hero video and product grid. 
Use my brand colors: deep purple and gold."
```

AI builds:
- `app/page.tsx` - Main page layout
- `app/layout.tsx` - Root with fonts
- `components/Hero.tsx` - Video hero
- `components/ProductGrid.tsx` - Grid with Supabase
- `components/Navigation.tsx` - Header nav
- `components/Footer.tsx` - Footer
- `app/globals.css` - Purple/gold theme
- `lib/supabase.ts` - Data fetching

All iteratively, building on each previous file!

---

**This is the modern way. Let's build it!** 🚀

