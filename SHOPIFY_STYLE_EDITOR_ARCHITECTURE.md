# Shopify-Style Live Editor - Clean Architecture

## 🎯 The Shopify Experience

### How Shopify Works:

```
1. New vendor creates store
   ↓
2. Gets default theme with placeholder content
   ↓
3. Opens "Customize" → Visual editor with live preview
   ↓
4. Left sidebar: Section editor
   Right side: Live preview of storefront
   ↓
5. Click any section → Edit panel appears
   ↓
6. Make changes → See updates in real-time
   ↓
7. Click "Save" → Changes published
```

**Key Features:**
- ✅ Split-screen (editor + live preview)
- ✅ Click section to edit
- ✅ Changes show in real-time
- ✅ Rich form controls (color pickers, image uploads, etc.)
- ✅ Drag-and-drop sections
- ✅ Add/remove sections
- ✅ Publish/unpublish

---

## 🏗️ Clean Architecture Design

### Three-Layer System:

```
┌─────────────────────────────────────────┐
│  LAYER 1: DEFAULT CONTENT TEMPLATE      │
│  (Seed data for all new vendors)        │
└─────────────────────────────────────────┘
            ↓ Cloned on vendor signup
┌─────────────────────────────────────────┐
│  LAYER 2: VENDOR CONTENT (Database)     │
│  (vendor_storefront_sections table)     │
└─────────────────────────────────────────┘
            ↓ Edited via
┌─────────────────────────────────────────┐
│  LAYER 3: LIVE VISUAL EDITOR            │
│  (Split-screen: Editor + Preview)       │
└─────────────────────────────────────────┘
```

---

## 📝 Implementation Plan

### Part 1: Default Content Template

**Create:** `lib/storefront/default-content-template.ts`

```typescript
export const DEFAULT_CONTENT_TEMPLATE = {
  home: [
    {
      section_key: 'hero',
      section_order: 1,
      is_enabled: true,
      content_data: {
        headline: 'Welcome to Your Store',
        subheadline: 'Premium products, delivered fast',
        cta_primary: { text: 'Shop Now', link: '/shop' },
        cta_secondary: { text: 'Learn More', link: '/about' },
        background_type: 'animation',
        // NEW: Section-specific styling
        background_color: '#000000',
        text_color: '#FFFFFF',
        overlay_opacity: 0.6
      }
    },
    {
      section_key: 'process',
      section_order: 2,
      is_enabled: true,
      content_data: {
        headline: 'How It Works',
        subheadline: 'Simple, fast, secure',
        steps: [
          { icon: 'leaf', title: 'Browse', description: 'Explore our premium selection' },
          { icon: 'package', title: 'Order', description: 'Quick and secure checkout' },
          { icon: 'truck', title: 'Receive', description: 'Fast, discreet delivery' }
        ],
        // NEW: Section styling
        background_color: '#0a0a0a',
        card_style: 'circular'
      }
    },
    // ... all other sections
  ],
  about: [...],
  contact: [...],
  faq: [...],
  global: [...]
};
```

**Key Addition:** Each section now has styling fields (background_color, text_color, etc.)

---

### Part 2: Enhanced Database Schema

```sql
-- Add section styling columns
ALTER TABLE vendor_storefront_sections
ADD COLUMN section_settings JSONB DEFAULT '{}'::jsonb;

-- section_settings stores:
-- {
--   "background_color": "#000000",
--   "text_color": "#FFFFFF",
--   "background_image": "url",
--   "overlay_opacity": 0.6,
--   "padding": "normal",
--   "container_width": "full",
--   "alignment": "center"
-- }
```

---

### Part 3: Live Editor UI

**Page:** `/vendor/live-editor`

```
┌──────────────────────────────────────────────────────┐
│  [← Back] [Preview] [Save] [Publish]                │
├────────────────┬─────────────────────────────────────┤
│  EDITOR        │  LIVE PREVIEW                       │
│  (Left 30%)    │  (Right 70%)                        │
│                │                                      │
│ 📄 Pages       │  ┌──────────────────────────────┐  │
│  • Home ✓      │  │  [Your Storefront Preview]   │  │
│  • About       │  │                              │  │
│  • Contact     │  │  [Fresh. Fast. Fire.]       │  │
│  • FAQ         │  │  Same day shipping...        │  │
│                │  │  [Shop now] [Learn more]     │  │
│ 📦 Sections    │  │                              │  │
│  ┌───────────┐ │  │  ← Click to edit             │  │
│  │ Hero      │ │  └──────────────────────────────┘  │
│  │ [Edit]    │ │                                      │
│  └───────────┘ │  ┌──────────────────────────────┐  │
│  ┌───────────┐ │  │  Order before 2PM            │  │
│  │ Process   │ │  │  [○ Browse][○ Order][○ Ship] │  │
│  │ [Edit]    │ │  │                              │  │
│  └───────────┘ │  │  ← Click to edit             │  │
│                │  └──────────────────────────────┘  │
│ When Hero     │                                      │
│ selected:     │  ┌──────────────────────────────┐  │
│ ┌───────────┐ │  │  Visit us in person          │  │
│ │Headline   │ │  │  [Location cards]            │  │
│ │[_______]  │ │  │                              │  │
│ │           │ │  │  ← Click to edit             │  │
│ │Subheadline│ │  └──────────────────────────────┘  │
│ │[_______]  │ │                                      │
│ │           │ │                                      │
│ │Background │ │                                      │
│ │[⬛ #000]  │ │                                      │
│ │           │ │                                      │
│ │[Save]     │ │                                      │
│ └───────────┘ │                                      │
└────────────────┴─────────────────────────────────────┘
```

---

## 🔧 Clean Implementation

### Step 1: Default Content on Vendor Signup

**Automatic trigger when vendor is created:**

```typescript
// app/api/vendor/register/route.ts

export async function POST(request: NextRequest) {
  // ... create vendor account ...
  
  // AUTO-INITIALIZE CONTENT
  await initializeDefaultContent(vendor.id, vendor.store_name);
  
  return { success: true, vendor };
}

async function initializeDefaultContent(vendorId: string, vendorName: string) {
  const template = DEFAULT_CONTENT_TEMPLATE;
  
  // Insert all default sections
  const sections = [];
  
  for (const [pageType, pageSections] of Object.entries(template)) {
    pageSections.forEach(section => {
      sections.push({
        vendor_id: vendorId,
        page_type: pageType,
        section_key: section.section_key,
        section_order: section.section_order,
        is_enabled: section.is_enabled,
        content_data: personalizeContent(section.content_data, vendorName),
        section_settings: section.section_settings || {}
      });
    });
  }
  
  await supabase.from('vendor_storefront_sections').insert(sections);
}

function personalizeContent(content: any, vendorName: string) {
  // Simple personalization
  let str = JSON.stringify(content);
  str = str.replace(/Your Store/g, vendorName);
  str = str.replace(/our store/g, `${vendorName}`);
  return JSON.parse(str);
}
```

**Result:** Every new vendor gets professional default content instantly!

---

### Step 2: Live Editor Component

**Create:** `/vendor/live-editor`

```typescript
"use client";

import { useState, useEffect } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { Save, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

export default function LiveEditor() {
  const { vendor } = useVendorAuth();
  const [selectedPage, setSelectedPage] = useState('home');
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSections();
    setPreviewUrl(`/storefront?vendor=${vendor?.slug}&preview=true`);
  }, [selectedPage]);

  async function loadSections() {
    const vendorId = localStorage.getItem('vendor_id');
    const res = await fetch(`/api/vendor/content?page_type=${selectedPage}&vendor_id=${vendorId}`);
    const data = await res.json();
    if (data.success) setSections(data.sections);
  }

  async function saveSection(section: any) {
    setIsSaving(true);
    const vendorId = localStorage.getItem('vendor_id');
    await fetch(`/api/vendor/content?vendor_id=${vendorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(section)
    });
    setIsSaving(false);
    
    // Trigger preview refresh
    document.getElementById('preview-iframe')?.contentWindow?.location.reload();
  }

  function updateSectionContent(field: string, value: any) {
    if (!selectedSection) return;
    
    setSelectedSection({
      ...selectedSection,
      content_data: {
        ...selectedSection.content_data,
        [field]: value
      }
    });
    
    // Update sections array
    setSections(sections.map(s => 
      s.id === selectedSection.id 
        ? { ...selectedSection, content_data: { ...selectedSection.content_data, [field]: value }}
        : s
    ));
  }

  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      {/* Left Sidebar - Editor */}
      <div className="w-[400px] border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h1 className="text-white text-xl font-bold mb-2">Customize Storefront</h1>
          <div className="flex gap-2">
            <button
              onClick={() => saveSection(selectedSection)}
              disabled={isSaving || !selectedSection}
              className="flex-1 bg-white text-black px-4 py-2 rounded text-sm hover:bg-white/90 disabled:opacity-50"
            >
              <Save size={14} className="inline mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="border border-white/20 text-white px-4 py-2 rounded text-sm hover:border-white/40">
              Publish
            </button>
          </div>
        </div>

        {/* Page Selector */}
        <div className="p-4 border-b border-white/10">
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded"
          >
            <option value="home">Home Page</option>
            <option value="about">About Page</option>
            <option value="contact">Contact Page</option>
            <option value="faq">FAQ Page</option>
          </select>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={() => setSelectedSection(section)}
              className={`p-3 border rounded cursor-pointer transition-all ${
                selectedSection?.id === section.id
                  ? 'bg-white/10 border-white/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm font-medium capitalize">
                  {section.section_key.replace('_', ' ')}
                </span>
                <EyeOff size={14} className="text-white/40" />
              </div>
              <span className="text-white/40 text-xs">
                {section.content_data.headline || 'Section'}
              </span>
            </div>
          ))}
        </div>

        {/* Section Editor Panel */}
        {selectedSection && (
          <div className="border-t border-white/10 p-4 max-h-[50vh] overflow-y-auto">
            <h3 className="text-white font-medium mb-4 capitalize">
              Edit {selectedSection.section_key.replace('_', ' ')}
            </h3>
            
            {/* Hero Section Editor */}
            {selectedSection.section_key === 'hero' && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/80 text-xs block mb-1">Headline</label>
                  <input
                    type="text"
                    value={selectedSection.content_data.headline || ''}
                    onChange={(e) => updateSectionContent('headline', e.target.value)}
                    className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-white/80 text-xs block mb-1">Subheadline</label>
                  <textarea
                    value={selectedSection.content_data.subheadline || ''}
                    onChange={(e) => updateSectionContent('subheadline', e.target.value)}
                    rows={2}
                    className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="text-white/80 text-xs block mb-1">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedSection.content_data.background_color || '#000000'}
                      onChange={(e) => updateSectionContent('background_color', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedSection.content_data.background_color || '#000000'}
                      onChange={(e) => updateSectionContent('background_color', e.target.value)}
                      className="flex-1 bg-black border border-white/20 text-white px-3 py-2 rounded text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/80 text-xs block mb-1">Overlay Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedSection.content_data.overlay_opacity || 0.6}
                    onChange={(e) => updateSectionContent('overlay_opacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-white/40 text-xs">
                    {((selectedSection.content_data.overlay_opacity || 0.6) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side - Live Preview */}
      <div className="flex-1 flex flex-col bg-neutral-900">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-white/60 text-sm">Preview</span>
          <div className="flex gap-2">
            <button className="text-white/60 hover:text-white text-xs px-3 py-1 border border-white/20 rounded">
              Desktop
            </button>
            <button className="text-white/60 hover:text-white text-xs px-3 py-1">
              Mobile
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <iframe
            id="preview-iframe"
            src={previewUrl}
            className="w-full h-full bg-white rounded-lg shadow-2xl"
            title="Storefront Preview"
          />
        </div>
      </div>
    </div>
  );
}
```

---

### Part 4: Real-Time Preview System

**Two Options:**

#### Option A: PostMessage Communication (Shopify's Approach)
```typescript
// In Live Editor
const iframe = document.getElementById('preview-iframe');
iframe.contentWindow.postMessage({
  type: 'UPDATE_SECTION',
  section_key: 'hero',
  content_data: { headline: 'New Headline' }
}, '*');

// In Storefront
window.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_SECTION') {
    // Update React state
    updateSection(event.data.section_key, event.data.content_data);
  }
});
```

#### Option B: URL Query Params (Simpler)
```typescript
// Store draft changes in localStorage or database
localStorage.setItem('draft_sections', JSON.stringify(sections));

// Preview loads draft if in preview mode
const sections = previewMode 
  ? JSON.parse(localStorage.getItem('draft_sections'))
  : await getVendorPageSections(vendorId, pageType);
```

**Recommendation: Option B (simpler, more reliable)**

---

### Part 5: Section-Level Styling

**Enhanced Content Schema:**

```typescript
interface SectionContent {
  // Content fields (existing)
  headline?: string;
  subheadline?: string;
  paragraphs?: string[];
  // ... other content
  
  // NEW: Styling fields
  background_color?: string;
  background_image?: string;
  background_gradient?: string;
  text_color?: string;
  overlay_opacity?: number;
  padding?: 'none' | 'small' | 'normal' | 'large';
  container_width?: 'narrow' | 'normal' | 'wide' | 'full';
  alignment?: 'left' | 'center' | 'right';
}
```

**Components use these settings:**

```typescript
export function HeroSection({ content, ... }) {
  const backgroundColor = content.background_color || '#000000';
  const textColor = content.text_color || '#FFFFFF';
  const overlayOpacity = content.overlay_opacity || 0.6;
  
  return (
    <div 
      className="relative min-h-[85vh]"
      style={{ backgroundColor }}
    >
      <div 
        className="absolute inset-0 backdrop-blur-xl"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
      />
      <div className="relative z-10" style={{ color: textColor }}>
        <h1>{content.headline}</h1>
        {/* ... */}
      </div>
    </div>
  );
}
```

---

## 🎨 Rich Editor Controls

### Control Types Needed:

1. **Text Input** - Headlines, short text
2. **Text Area** - Paragraphs, descriptions
3. **Rich Text Editor** - Formatted content (bold, italic, links)
4. **Color Picker** - Backgrounds, text colors
5. **Image Upload** - Hero backgrounds, section images
6. **Icon Picker** - Process steps, features
7. **Range Slider** - Opacity, spacing, sizing
8. **Toggle Switch** - Enable/disable features
9. **Dropdown** - Alignment, container width, padding
10. **Array Editor** - Add/remove items (process steps, FAQ items)

### Example: Process Steps Editor

```typescript
<ArrayEditor
  label="Process Steps"
  items={content.steps}
  onChange={(steps) => updateContent('steps', steps)}
  renderItem={(step, index) => (
    <div className="border border-white/10 p-4 rounded mb-2">
      <IconPicker
        value={step.icon}
        onChange={(icon) => updateStep(index, 'icon', icon)}
      />
      <TextInput
        label="Title"
        value={step.title}
        onChange={(val) => updateStep(index, 'title', val)}
      />
      <TextArea
        label="Description"
        value={step.description}
        onChange={(val) => updateStep(index, 'description', val)}
      />
      <button onClick={() => removeStep(index)}>
        <Trash2 size={14} /> Remove
      </button>
    </div>
  )}
  onAdd={() => addStep()}
/>
```

---

## 📁 Clean File Structure

```
app/vendor/
├── live-editor/
│   └── page.tsx                    ← Main live editor UI

components/vendor/
├── editors/                         ← Section-specific editors
│   ├── HeroEditor.tsx
│   ├── ProcessEditor.tsx
│   ├── AboutStoryEditor.tsx
│   └── ... (one per section type)
│
├── editor-controls/                 ← Reusable form controls
│   ├── TextInput.tsx
│   ├── TextArea.tsx
│   ├── RichTextEditor.tsx
│   ├── ColorPicker.tsx
│   ├── ImageUpload.tsx
│   ├── IconPicker.tsx
│   ├── RangeSlider.tsx
│   ├── ToggleSwitch.tsx
│   ├── Dropdown.tsx
│   └── ArrayEditor.tsx
│
└── LivePreview.tsx                  ← Preview iframe wrapper

lib/storefront/
├── default-content-template.ts      ← Default content for all vendors
├── content-api.ts                   ← Content CRUD (existing)
└── content-personalizer.ts          ← AI/simple rewording

hooks/
└── useLivePreview.ts                ← Real-time preview updates
```

---

## 🔄 Data Flow

### Editing Flow:
```
1. Vendor opens Live Editor
   ↓
2. Loads sections from database
   ↓
3. Vendor clicks "Hero" section
   ↓
4. Editor panel shows Hero-specific controls
   ↓
5. Vendor changes headline
   ↓
6. Change updates local state
   ↓
7. Preview iframe receives update (postMessage or refresh)
   ↓
8. Preview shows new headline in real-time
   ↓
9. Vendor clicks "Save"
   ↓
10. POST to /api/vendor/content
   ↓
11. Database updated
   ↓
12. Live storefront gets update on next visit
```

---

## 🎯 Shopify Parity Features

### Must-Have (Shopify Standard):

1. **✅ Split-screen editor**
   - Editor left, preview right
   - Real-time updates
   - Mobile/desktop preview toggle

2. **✅ Section library**
   - Add sections from library
   - Drag to reorder
   - Toggle visibility
   - Delete sections

3. **✅ Rich controls**
   - Color pickers for everything
   - Image uploads
   - Font selection
   - Spacing controls

4. **✅ Save states**
   - Draft mode (preview only)
   - Publish (goes live)
   - Revert to published
   - Version history (future)

5. **✅ Presets**
   - Section presets (pre-configured sections)
   - Color scheme presets
   - Layout presets
   - One-click apply

---

## 🚀 Implementation Priority

### IMMEDIATE (This Week):

1. **Create default content template** (1 day)
   - Define all default sections
   - Placeholder content
   - Default styling values

2. **Auto-initialize on vendor signup** (1 day)
   - Hook into registration flow
   - Clone default content
   - Personalize with vendor name

3. **Build live editor UI skeleton** (2 days)
   - Split-screen layout
   - Section list
   - Preview iframe
   - Basic save functionality

4. **Create rich editor controls** (2 days)
   - TextInput, TextArea
   - ColorPicker
   - ImageUpload
   - RangeSlider

### SHORT TERM (Next 2 Weeks):

5. **Section-specific editors** (5 days)
   - Hero editor
   - Process editor
   - About story editor
   - FAQ editor

6. **Real-time preview** (2 days)
   - PostMessage communication
   - Live updates without page refresh
   - Smooth animations

7. **Publish/Draft system** (2 days)
   - Draft mode (vendors can preview)
   - Publish (goes live)
   - Revert functionality

---

## ✅ Success Criteria

A vendor should be able to:

1. **Sign up** → Get professional storefront in < 5 minutes ✅
2. **Open editor** → See split-screen with their store ✅
3. **Click section** → Rich editor appears ✅
4. **Change headline** → See update in preview instantly ✅
5. **Change colors** → See new colors in preview ✅
6. **Upload image** → Background changes in preview ✅
7. **Save** → Changes go live on their domain ✅
8. **Switch templates** → All content/customization persists ✅

**This matches Shopify's experience exactly!**

---

## 🎉 NEXT IMMEDIATE STEPS

### To implement this week:

1. Create `lib/storefront/default-content-template.ts` with complete default content
2. Modify vendor registration to auto-initialize content
3. Build `/vendor/live-editor` page with split-screen UI
4. Create basic editor controls (text, color, image)
5. Implement section-specific editors (hero, process)
6. Add real-time preview updates
7. Test end-to-end flow

**Estimated: 5-7 days to complete Shopify-style live editor!**

This gives you the cleanest, most scalable architecture for visual content editing.

