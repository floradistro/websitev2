# Site Builder Architecture Analysis - Shopify, Wix, Webflow, Lovable

## 🔍 How Professional Editors Work

### SHOPIFY Theme Customizer

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│  Editor (Left Sidebar)                                  │
│  ├── Section Settings                                   │
│  ├── Form Controls                                      │
│  └── Save Button                                        │
└─────────────────────────────────────────────────────────┘
                    ↓ postMessage
┌─────────────────────────────────────────────────────────┐
│  Preview Iframe (Right Side)                            │
│  ├── Loads actual theme with ?preview=true              │
│  ├── Has special preview mode JavaScript                │
│  ├── Listens for postMessage events                     │
│  └── Updates DOM in real-time WITHOUT page refresh      │
└─────────────────────────────────────────────────────────┘
```

**Key Techniques:**

1. **Preview Mode URL Parameter**
   ```
   https://store.myshopify.com/?preview_theme_id=123&preview=true
   ```
   - Theme loads in "preview" mode
   - Doesn't save to database
   - Shows draft changes

2. **PostMessage Communication**
   ```javascript
   // Editor sends message
   iframe.contentWindow.postMessage({
     type: 'UPDATE_SETTING',
     section: 'hero',
     setting: 'headline',
     value: 'New Headline'
   }, '*');
   
   // Preview receives message
   window.addEventListener('message', (event) => {
     if (event.data.type === 'UPDATE_SETTING') {
       // Update DOM directly without refresh
       document.querySelector('.hero h1').textContent = event.data.value;
     }
   });
   ```

3. **Draft Storage**
   ```
   Shopify stores drafts in:
   - Browser sessionStorage (temporary)
   - Database draft table (when you click Save Draft)
   - Only published on explicit Publish action
   ```

4. **Section Schema**
   ```liquid
   {% schema %}
   {
     "name": "Hero",
     "settings": [
       {
         "type": "text",
         "id": "headline",
         "label": "Headline",
         "default": "Welcome"
       },
       {
         "type": "color",
         "id": "background",
         "label": "Background Color",
         "default": "#000000"
       }
     ]
   }
   {% endschema %}
   ```
   - Schema defines what's editable
   - Editor auto-generates form from schema
   - Preview renders using schema values

---

### WIX Editor

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│  Canvas (Center)                                        │
│  ├── Rendered HTML/CSS/JS                               │
│  ├── Click any element to select                        │
│  └── Contenteditable divs for text                      │
└─────────────────────────────────────────────────────────┘
                    ↑↓
┌─────────────────────────────────────────────────────────┐
│  Properties Panel (Right)                               │
│  ├── Shows selected element properties                  │
│  ├── Edit text, colors, spacing, etc.                   │
│  └── Changes update canvas INSTANTLY                    │
└─────────────────────────────────────────────────────────┘
```

**Key Techniques:**

1. **Direct DOM Manipulation**
   ```javascript
   // User types in text field
   onChange={(value) => {
     // Update canvas immediately
     document.getElementById('selected-element').textContent = value;
     
     // Update data model
     updateComponent(elementId, { text: value });
   }}
   ```

2. **Component Data Model**
   ```javascript
   components = {
     'hero-123': {
       type: 'Hero',
       props: {
         headline: 'Welcome',
         backgroundColor: '#000',
         backgroundImage: 'url.jpg'
       },
       children: []
     }
   }
   ```
   - All components in JSON structure
   - Editor updates JSON
   - Canvas re-renders from JSON

3. **No Iframe (Same Page)**
   - Canvas is div on same page
   - Direct DOM access
   - Instant updates
   - No postMessage needed

4. **Save Strategy**
   ```
   Auto-save every 2 seconds to database
   No "draft" vs "published" - always published
   Undo/redo stack in memory
   ```

---

### WEBFLOW Designer

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│  Canvas (Center) - Rendered Website                     │
│  ├── Click to select elements                           │
│  ├── Hover outlines                                     │
│  └── Inline editing for text                            │
└─────────────────────────────────────────────────────────┘
       ↑↓                ↑↓                    ↑↓
┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐
│ Navigator   │  │ Style Panel │  │ Settings Panel      │
│ (Left)      │  │ (Right)     │  │ (Right)             │
│ - Pages     │  │ - Layout    │  │ - Page settings     │
│ - Layers    │  │ - Typography│  │ - SEO               │
│ - Symbols   │  │ - Spacing   │  │ - Custom code       │
└─────────────┘  │ - Colors    │  └─────────────────────┘
                 │ - Effects   │
                 └─────────────┘
```

**Key Techniques:**

1. **Virtual DOM with Real-Time Rendering**
   ```javascript
   // Component tree
   const tree = {
     page: 'home',
     sections: [
       {
         id: 'hero-1',
         type: 'Hero',
         styles: { backgroundColor: '#000' },
         content: { headline: 'Welcome' }
       }
     ]
   };
   
   // Canvas renders from tree
   function Canvas({ tree }) {
     return (
       <div>
         {tree.sections.map(section => (
           <Section key={section.id} {...section} />
         ))}
       </div>
     );
   }
   
   // Edit updates tree → React re-renders canvas
   function updateSection(id, changes) {
     setTree(prev => ({
       ...prev,
       sections: prev.sections.map(s => 
         s.id === id ? { ...s, ...changes } : s
       )
     }));
   }
   ```

2. **Class-Based Styling (Not Inline)**
   ```javascript
   // Generate unique class per element
   .hero-abc123 {
     background-color: #000000;
     padding: 80px 20px;
   }
   
   // Update class when user edits
   updateStyles('hero-abc123', { backgroundColor: '#111' });
   // Injects new CSS into <style> tag
   ```

3. **Export to Production**
   ```
   Editor mode: Virtual DOM, live editing
   Published site: Exported static HTML/CSS/JS
   Completely separate rendering
   ```

---

### LOVABLE (AI Site Builder)

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│  AI Chat (Left)                                         │
│  "Make the hero blue"                                   │
└─────────────────────────────────────────────────────────┘
                    ↓ AI generates code
┌─────────────────────────────────────────────────────────┐
│  Live Preview (Right) - Real React Component            │
│  ├── Renders actual React components                    │
│  ├── Hot reload on code changes                         │
│  └── Navigatable (React Router)                         │
└─────────────────────────────────────────────────────────┘
```

**Key Techniques:**

1. **Component-Based (Like Us!)**
   ```javascript
   // Actual React components
   <Hero 
     headline="Welcome"
     backgroundColor="#000"
   />
   
   // AI updates props
   <Hero 
     headline="Welcome to My Site"
     backgroundColor="#1a1a1a"
   />
   ```

2. **Hot Module Replacement**
   ```
   Code changes → Hot reload → Component updates
   No full page refresh
   State preserved
   ```

3. **Single Source of Truth**
   ```
   Components defined in code
   Props/content in database or state
   Preview renders from same components as production
   ```

---

## 🎯 What We're Missing

### Our Current Approach:
```
Editor (left) → Edit content → Save to database
   ↓
Preview (iframe) → Loads /storefront?vendor=xyz
   ↓
Storefront loads from database
   ↓
Problem: Changes only show after SAVE + REFRESH
```

### What's Wrong:

1. **No Draft Mode**
   - We save directly to database
   - Preview shows published data, not draft
   - Need: Draft storage + preview mode

2. **No Real-Time Updates**
   - Iframe doesn't know about edits
   - Need: postMessage communication OR client-side preview

3. **Can't Navigate in Preview**
   - Iframe works for navigation ✅
   - But shows published content, not drafts ❌

---

## ✅ CORRECT ARCHITECTURE (Shopify Model)

### Option A: PostMessage (Best for Navigation)

```
┌─────────────────────────────────────────────────────────┐
│  EDITOR                                                 │
│  User types: "New Headline"                             │
│      ↓                                                   │
│  updateSectionContent('headline', 'New Headline')       │
│      ↓                                                   │
│  Store in local state (not database yet)                │
│      ↓                                                   │
│  iframe.contentWindow.postMessage({                     │
│    type: 'UPDATE_SECTION',                              │
│    section: 'hero',                                     │
│    field: 'headline',                                   │
│    value: 'New Headline'                                │
│  })                                                      │
└─────────────────────────────────────────────────────────┘
                    ↓ postMessage
┌─────────────────────────────────────────────────────────┐
│  PREVIEW (Iframe)                                       │
│  window.addEventListener('message', (e) => {            │
│    if (e.data.type === 'UPDATE_SECTION') {             │
│      // Update React state                              │
│      setSections(prev => prev.map(s =>                  │
│        s.key === e.data.section                         │
│          ? { ...s, [e.data.field]: e.data.value }       │
│          : s                                             │
│      ));                                                 │
│      // React re-renders with new value                 │
│    }                                                     │
│  })                                                      │
│                                                          │
│  Result: Updates INSTANTLY, can still navigate          │
└─────────────────────────────────────────────────────────┘
```

### Option B: Client-Side Preview (Best for Speed)

```
┌─────────────────────────────────────────────────────────┐
│  EDITOR + PREVIEW (Same React App)                      │
│                                                          │
│  const [sections, setSections] = useState([...]);       │
│                                                          │
│  Left: Editor                                            │
│  ├── onChange → setSections(...)                        │
│  └── Instant state update                               │
│                                                          │
│  Right: Preview Component                               │
│  ├── <StorefrontPreview sections={sections} />          │
│  └── Re-renders automatically (React)                   │
│                                                          │
│  Problem: Can't navigate to other pages                 │
│  Solution: React Router in preview pane                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 RECOMMENDED FIX (Hybrid Approach)

### Architecture:

```
┌─────────────────────────────────────────────────────────┐
│  DRAFT STORAGE SYSTEM                                   │
│                                                          │
│  1. User edits in editor                                │
│  2. Changes stored in:                                  │
│     - React state (instant UI updates)                  │
│     - localStorage (persist across refreshes)           │
│     - Draft table in database (optional)                │
│  3. Preview mode checks:                                │
│     - URL has ?preview=true                             │
│     - Load from localStorage/draft table                │
│     - Fall back to published content                    │
│  4. Save button:                                        │
│     - Commits draft → published database                │
│     - Clears draft storage                              │
└─────────────────────────────────────────────────────────┘
```

### Implementation:

**Step 1: Preview Mode in Storefront**

```typescript
// app/(storefront)/storefront/page.tsx

export default async function StorefrontHomePage({ searchParams }) {
  const isPreviewMode = searchParams?.preview === 'true';
  const vendorId = await getVendorFromHeaders();
  
  let sections;
  
  if (isPreviewMode && typeof window !== 'undefined') {
    // PREVIEW MODE: Load from localStorage
    const draftSections = localStorage.getItem('draft_sections');
    sections = draftSections 
      ? JSON.parse(draftSections).filter(s => s.page_type === 'home')
      : await getVendorPageSections(vendorId, 'home');
  } else {
    // LIVE MODE: Load from database
    sections = await getVendorPageSections(vendorId, 'home');
  }
  
  return <StorefrontHomeClient sections={sections} ... />;
}
```

**Step 2: Real-Time Updates via PostMessage**

```typescript
// Editor
function updateSectionContent(field, value) {
  // Update local state
  const updated = { ...selectedSection, content_data: { ...content, [field]: value }};
  setSelectedSection(updated);
  setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
  
  // Store in localStorage for preview
  localStorage.setItem('draft_sections', JSON.stringify(sections));
  
  // Tell iframe to reload (picks up localStorage changes)
  const iframe = document.getElementById('preview-iframe');
  iframe.contentWindow.postMessage({ type: 'RELOAD_DRAFT' }, '*');
}

// Preview
window.addEventListener('message', (event) => {
  if (event.data.type === 'RELOAD_DRAFT') {
    window.location.reload(); // Picks up new localStorage data
  }
});
```

**Step 3: Save to Database**

```typescript
// When user clicks Save
async function save() {
  // Write drafts to published database
  for (const section of sections) {
    await fetch('/api/vendor/content', {
      method: 'POST',
      body: JSON.stringify(section)
    });
  }
  
  // Clear draft
  localStorage.removeItem('draft_sections');
  setHasUnsavedChanges(false);
  
  // Reload preview (now shows published data)
  refreshPreview();
}
```

---

## 🔧 WHY CURRENT APPROACH DOESN'T WORK

### Problem 1: No Draft State
```
Current:
  Edit → Shows in editor
  Preview → Shows published database data
  Result: Preview doesn't update until Save + Refresh

Needed:
  Edit → Updates draft state
  Preview → Shows draft state
  Save → Commits draft to published
```

### Problem 2: Preview Mode Not Implemented
```
Current:
  /storefront?vendor=flora-distro
  → Always loads from database
  → Ignores unsaved edits

Needed:
  /storefront?vendor=flora-distro&preview=true
  → Loads from localStorage/draft storage
  → Shows unsaved edits
```

### Problem 3: No Communication Layer
```
Current:
  Editor and Preview are disconnected
  No way to tell preview to update
  
Needed:
  postMessage OR shared React state
  Editor tells preview when to refresh
```

---

## ✅ CORRECT IMPLEMENTATION

### Approach 1: Client-Side Preview (Fastest, But Limited Navigation)

**Architecture:**
```typescript
// Single React app, shared state

function LiveEditor() {
  const [sections, setSections] = useState([]);
  
  return (
    <div className="flex">
      {/* Editor */}
      <div className="w-[400px]">
        <input 
          value={sections.hero.headline}
          onChange={(e) => {
            // Update state → Preview re-renders INSTANTLY
            setSections(prev => ({
              ...prev,
              hero: { ...prev.hero, headline: e.target.value }
            }));
          }}
        />
      </div>
      
      {/* Preview (Same React Tree) */}
      <div className="flex-1">
        <HeroSection content={sections.hero} />
        {/* Instant updates because React re-renders */}
      </div>
    </div>
  );
}
```

**Pros:**
- ✅ Instant updates (React re-renders)
- ✅ No latency
- ✅ Simple implementation

**Cons:**
- ❌ Hard to implement navigation between pages
- ❌ Need to manually handle routing

---

### Approach 2: Iframe + LocalStorage (Most Flexible)

**Architecture:**
```typescript
// Editor
function LiveEditor() {
  const [sections, setSections] = useState([]);
  
  function updateContent(field, value) {
    // Update state
    setSections(prev => ...);
    
    // Store draft
    localStorage.setItem('draft_sections', JSON.stringify(sections));
    
    // Force iframe reload
    const iframe = document.getElementById('preview');
    iframe.src = iframe.src + '&r=' + Date.now();
  }
}

// Storefront (in iframe)
function StorefrontPage() {
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
  
  let sections;
  if (isPreview) {
    // Load from localStorage (draft)
    const draft = localStorage.getItem('draft_sections');
    sections = draft ? JSON.parse(draft) : await fetchFromDatabase();
  } else {
    // Load from database (published)
    sections = await fetchFromDatabase();
  }
  
  return <Storefront sections={sections} />;
}
```

**Pros:**
- ✅ Full navigation works
- ✅ Real site in iframe
- ✅ Can test all pages

**Cons:**
- ❌ Reload needed to see changes (500-1000ms latency)
- ❌ Not truly "instant"

---

### Approach 3: Iframe + PostMessage (Shopify's Way)

**Architecture:**
```typescript
// Editor
function LiveEditor() {
  const [sections, setSections] = useState([]);
  
  function updateContent(field, value) {
    // Update local state
    setSections(prev => ...);
    
    // Send to iframe
    iframe.contentWindow.postMessage({
      type: 'UPDATE_CONTENT',
      section: 'hero',
      field: 'headline',
      value: 'New Text'
    }, '*');
  }
}

// Storefront (in iframe)
function Storefront() {
  const [sections, setSections] = useState(initialSections);
  
  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'UPDATE_CONTENT') {
        // Update React state → Re-render INSTANTLY
        setSections(prev => prev.map(s =>
          s.key === event.data.section
            ? { ...s, [event.data.field]: event.data.value }
            : s
        ));
      }
    });
  }, []);
  
  return <div>{/* Render sections */}</div>;
}
```

**Pros:**
- ✅ Instant updates (no reload)
- ✅ Full navigation works
- ✅ Real site in iframe
- ✅ Best of both worlds

**Cons:**
- 🟡 More complex (need message handling)
- 🟡 Need to make storefront components listen to messages

---

## 🎯 WHAT WE NEED TO DO

### IMMEDIATE FIX (Option 2: LocalStorage + Reload)

**Changes Needed:**

1. **Add Preview Mode Support to Storefront**
   ```typescript
   // StorefrontHomeClient needs to check for draft content
   useEffect(() => {
     const isPreview = window.location.search.includes('preview=true');
     if (isPreview) {
       const draft = localStorage.getItem('draft_sections_home');
       if (draft) {
         // Use draft content instead of database
         setContentSections(JSON.parse(draft));
       }
     }
   }, []);
   ```

2. **Editor Saves to LocalStorage**
   ```typescript
   function updateSectionContent(field, value) {
     const updated = { ...selectedSection, content_data: { ...content, [field]: value }};
     setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
     
     // Save to localStorage immediately
     const homeSections = sections.filter(s => s.page_type === 'home');
     localStorage.setItem('draft_sections_home', JSON.stringify(homeSections));
     
     // Reload iframe after 500ms
     debounce(() => refreshPreview(), 500);
   }
   ```

3. **Make All Pages Preview-Aware**
   - Home page checks localStorage
   - About page checks localStorage
   - Shop page checks localStorage
   - All pages support ?preview=true mode

---

### BETTER FIX (Option 3: PostMessage)

**Changes Needed:**

1. **Make Storefront Components Listen**
   ```typescript
   // Wrap storefront in message listener
   export function StorefrontWithLiveEdit({ initialSections, ... }) {
     const [sections, setSections] = useState(initialSections);
     
     useEffect(() => {
       window.addEventListener('message', (e) => {
         if (e.data.type === 'UPDATE_SECTION') {
           setSections(prev => prev.map(s =>
             s.section_key === e.data.section_key
               ? { ...s, content_data: { ...s.content_data, [e.data.field]: e.data.value }}
               : s
           ));
         }
       });
     }, []);
     
     return <StorefrontHome sections={sections} ... />;
   }
   ```

2. **Editor Sends Messages**
   ```typescript
   function updateSectionContent(field, value) {
     // Update local state
     setSelectedSection(updated);
     
     // Send to iframe
     const iframe = document.getElementById('preview-iframe');
     iframe.contentWindow.postMessage({
       type: 'UPDATE_SECTION',
       section_key: selectedSection.section_key,
       field: field,
       value: value
     }, '*');
     
     // Instant update, no reload!
   }
   ```

---

## 🚀 RECOMMENDED SOLUTION

### Use **Approach 2 (LocalStorage)** First (Simpler)

Then upgrade to **Approach 3 (PostMessage)** for true instant updates.

**Why this order:**
1. LocalStorage is easier (2 hours)
2. Gets preview working correctly
3. PostMessage is more complex (1 day)
4. Adds instant updates later

**Implementation:**
1. Add preview mode to all storefront pages (check localStorage)
2. Editor saves drafts to localStorage
3. Preview loads from localStorage when ?preview=true
4. Navigate works, see drafts on all pages
5. Later: Add postMessage for instant updates

---

## 📊 COMPARISON

| Feature | Our Current | Shopify | Wix | Webflow | Lovable |
|---------|-------------|---------|-----|---------|---------|
| Split-screen | ✅ | ✅ | ❌ | ❌ | ✅ |
| Full navigation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Instant updates | ❌ | ✅ | ✅ | ✅ | ✅ |
| Draft mode | ❌ | ✅ | ✅ | ✅ | ✅ |
| Real-time preview | ❌ | ✅ | ✅ | ✅ | ✅ |

**We need:** Draft mode + Real-time preview updates

---

## 🎯 NEXT STEPS

Want me to implement:

**Option A (Quick - 2 hours):**
- Add localStorage draft storage
- Make storefront check localStorage in preview mode
- 500ms debounced iframe refresh
- Full navigation ✅
- ~500ms latency for updates

**Option B (Better - 1 day):**
- Add postMessage communication
- Make storefront listen to messages
- Update React state on messages
- Full navigation ✅
- Instant updates (0ms latency) ✅

Which would you prefer?

