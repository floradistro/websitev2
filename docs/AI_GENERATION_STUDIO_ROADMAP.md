# AI Generation Studio - Complete Roadmap

## Vision

Build a professional-grade AI image generation system with enterprise features: prompt templates, batch generation, style presets, and intelligent tuning.

---

## Phase 1: Prompt Templates Library ✅ (Start Here)

### Database Schema

```sql
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  category VARCHAR(50), -- 'product', 'marketing', 'social', 'brand'
  style VARCHAR(50), -- 'cartoon', 'realistic', 'minimalist', 'luxury', etc.
  parameters JSONB, -- { size, quality, style_strength, etc. }
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_templates_vendor ON prompt_templates(vendor_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
```

### Features

- **Template Library UI** - Grid view of saved templates
- **Template Editor** - Create/edit templates with live preview
- **Variable System** - Use `{product_name}`, `{style}`, `{background}` placeholders
- **Public Templates** - Pre-built templates from WhaleTools team
- **Usage Tracking** - Track which templates work best

### API Endpoints

- `GET /api/vendor/media/prompt-templates` - List all templates
- `POST /api/vendor/media/prompt-templates` - Create new template
- `PUT /api/vendor/media/prompt-templates/[id]` - Update template
- `DELETE /api/vendor/media/prompt-templates/[id]` - Delete template
- `GET /api/vendor/media/prompt-templates/public` - Get public templates

---

## Phase 2: Batch Generation System

### Database Schema

```sql
CREATE TABLE generation_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id),
  template_id UUID REFERENCES prompt_templates(id),
  name VARCHAR(255),
  status VARCHAR(50), -- 'pending', 'processing', 'completed', 'failed'
  total_images INTEGER,
  completed_images INTEGER DEFAULT 0,
  failed_images INTEGER DEFAULT 0,
  config JSONB, -- batch settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES generation_batches(id),
  vendor_id UUID REFERENCES vendors(id),
  prompt TEXT NOT NULL,
  status VARCHAR(50), -- 'pending', 'processing', 'completed', 'failed'
  result_url TEXT,
  error_message TEXT,
  parameters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_generation_queue_batch ON generation_queue(batch_id);
CREATE INDEX idx_generation_queue_status ON generation_queue(status);
```

### Features

- **Batch Creator** - Generate multiple images from one template
- **CSV Import** - Upload CSV with product names → auto-generate prompts
- **Queue Dashboard** - Real-time progress tracking
- **Background Processing** - Process generations in background queue
- **Retry Logic** - Auto-retry failed generations
- **Cost Tracking** - Track OpenAI API costs per batch

### API Endpoints

- `POST /api/vendor/media/generate/batch` - Start batch generation
- `GET /api/vendor/media/generate/batch/[id]` - Get batch status
- `POST /api/vendor/media/generate/batch/[id]/retry` - Retry failed items
- `DELETE /api/vendor/media/generate/batch/[id]` - Cancel batch

---

## Phase 3: Prompt Tuning Interface

### Features

- **Parameter Controls** - Sliders for style strength, creativity, detail level
- **A/B Testing** - Generate 2-4 variations with different parameters
- **Prompt Analyzer** - AI suggests improvements to prompts
- **Negative Prompts** - Specify what NOT to include
- **Seed Control** - Use seeds for reproducible results
- **Quality Presets** - Standard/HD/Ultra presets

### UI Components

```
PromptTuningPanel/
├── ParameterSliders.tsx - Style, creativity, detail controls
├── NegativePromptInput.tsx - Exclusions
├── VariationGenerator.tsx - A/B test interface
├── PromptAnalyzer.tsx - AI suggestions
└── PresetSelector.tsx - Quick quality presets
```

### API Endpoints

- `POST /api/vendor/media/analyze-prompt` - Get AI suggestions for prompt
- `POST /api/vendor/media/generate/variations` - Generate A/B test variations

---

## Phase 4: Style Presets Library

### Database Schema

```sql
CREATE TABLE style_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_prompt_suffix TEXT, -- Appended to all prompts
  parameters JSONB, -- Default DALL-E parameters
  example_images TEXT[], -- URLs to example outputs
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Built-in Styles

1. **Cartoon/Anime** - "in vibrant cartoon style, bold outlines, playful colors"
2. **Photorealistic** - "professional product photography, studio lighting, 8K resolution"
3. **Minimalist** - "clean minimalist design, simple shapes, white background"
4. **Luxury** - "premium luxury aesthetic, gold accents, elegant composition"
5. **Retro** - "vintage 80s style, neon colors, retro aesthetic"
6. **Neon/Cyberpunk** - "neon lights, cyberpunk aesthetic, futuristic"
7. **Hand Drawn** - "hand-drawn illustration, watercolor style, artistic"
8. **3D Render** - "3D rendered, octane render, photorealistic materials"

### Features

- **Style Gallery** - Visual preview of each style
- **Custom Styles** - Save your own style presets
- **Style Mixing** - Combine 2+ styles (50% cartoon + 50% luxury)
- **Apply to Batch** - Use style across entire batch

---

## Phase 5: Smart Features

### Auto-Enhance Prompts

- Analyze product name → auto-generate enhanced prompt
- "Blue Dream" → "Blue Dream cannabis flower, macro photography, trichomes visible, purple hues, professional studio lighting"

### Prompt History

- Track all prompts used
- "Generate Similar" button on successful images
- Learn from what works

### Cost Optimization

- Estimate cost before batch generation
- Smart caching (avoid re-generating identical prompts)
- Bulk discounts tracking

### Template Marketplace

- Share templates with other vendors
- Rate/review templates
- Popular templates leaderboard

---

## Phase 6: Advanced Queue System

### Features

- **Priority Queue** - Urgent generations go first
- **Scheduled Generation** - Schedule batches for off-peak hours
- **Webhooks** - Notify when batch completes
- **Rate Limiting** - Respect OpenAI rate limits automatically
- **Parallel Processing** - Process multiple images simultaneously
- **Progress Notifications** - Real-time notifications

### Queue Dashboard

```
QueueDashboard/
├── ActiveJobs.tsx - Currently processing
├── CompletedJobs.tsx - Finished batches
├── FailedJobs.tsx - Errors to review
├── ScheduledJobs.tsx - Upcoming batches
└── QueueStats.tsx - Processing speed, costs, success rate
```

---

## Phase 7: Integration Features

### Product Integration

- **Auto-Generate on Product Create** - Option to generate image when adding product
- **Bulk Product Generation** - Select 50 products → generate images for all
- **Smart Naming** - Auto-save as `{product-name}-ai-generated.png`

### Template Variables

```
Available variables:
{product_name} - Product name
{category} - Product category
{strain_type} - Indica/Sativa/Hybrid
{brand_name} - Vendor brand
{custom_1} - Custom field 1
{custom_2} - Custom field 2
```

### Auto-Linking

- Generated image → auto-link to product
- Smart matching (if prompt contains product name)

---

## UI/UX Design

### Main Studio Page (`/vendor/media/studio`)

```
┌─────────────────────────────────────────┐
│  AI Generation Studio                   │
├─────────────────────────────────────────┤
│                                         │
│  [Templates] [Batch Gen] [Queue] [Styles]│
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │  Template 1  │  │  Template 2  │   │
│  │  "Product    │  │  "Social     │   │
│  │  Photo"      │  │  Media"      │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  Quick Actions:                         │
│  [Generate Single] [Start Batch]        │
│  [Import CSV] [View Queue]              │
│                                         │
└─────────────────────────────────────────┘
```

### Template Editor

```
┌─────────────────────────────────────────┐
│  Edit Template                    [Save]│
├─────────────────────────────────────────┤
│  Name: Product Photography              │
│  Category: [Product ▼]                  │
│  Style: [Realistic ▼]                   │
│                                         │
│  Prompt:                                │
│  ┌─────────────────────────────────────┐│
│  │ {product_name} cannabis flower,     ││
│  │ professional studio photography,    ││
│  │ white background, macro detail      ││
│  └─────────────────────────────────────┘│
│                                         │
│  Parameters:                            │
│  Size: [1024x1024 ▼]                   │
│  Quality: [●────────] Standard          │
│  Style Strength: [─────●───] 70%        │
│                                         │
│  [Test Generate] [Save Template]        │
└─────────────────────────────────────────┘
```

### Batch Generator

```
┌─────────────────────────────────────────┐
│  Batch Generation                       │
├─────────────────────────────────────────┤
│  Template: [Product Photo ▼]           │
│  Style: [Cartoon ▼]                    │
│                                         │
│  Input Method:                          │
│  ○ Product List   ● CSV Upload          │
│                                         │
│  [Upload CSV] products.csv              │
│  Preview: 50 products found             │
│                                         │
│  Estimated Cost: $2.50 (50 × $0.05)    │
│  Estimated Time: 8 minutes              │
│                                         │
│  [Start Batch Generation]               │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### Tech Stack

- **Frontend**: React, TypeScript, Tailwind
- **Backend**: Next.js API Routes
- **Queue**: Simple JSON queue in database (or Redis for scale)
- **AI**: OpenAI DALL-E 3 API
- **Storage**: Supabase Storage

### Performance Optimizations

- Generate thumbnails on upload
- Cache successful prompts
- Lazy load template library
- Virtual scrolling for large batches
- Background processing with status polling

### Error Handling

- Graceful OpenAI API failures
- Retry logic (3 attempts)
- Detailed error messages
- Cost tracking even on failures

---

## Success Metrics

### Usage

- Templates created per vendor
- Batch generations per week
- Success rate (generated / attempted)
- Average images per batch

### Quality

- Manual rating system (⭐⭐⭐⭐⭐)
- Re-generation rate (low = good quality)
- Template usage count

### Cost

- Average cost per image
- Total monthly AI spend
- Cost per successful generation

---

## Rollout Plan

### Week 1-2: Phase 1 (Templates)

- Database schema
- Template CRUD API
- Template library UI
- Public templates (10 pre-built)

### Week 3: Phase 2 (Batch Generation)

- Batch database schema
- Queue system
- Batch UI
- CSV import

### Week 4: Phase 3 (Tuning)

- Parameter controls
- A/B testing
- Prompt analyzer

### Week 5: Phase 4 (Styles)

- Style presets
- Style library UI
- Style mixing

### Week 6-7: Phase 5-6 (Smart Features + Queue)

- Auto-enhance
- Queue dashboard
- Advanced features

### Week 8: Phase 7 (Integration)

- Product integration
- Auto-linking
- Polish & testing

---

## Current Status

✅ Basic AI generation (single image)
✅ Media library integration
⬜ Prompt templates
⬜ Batch generation
⬜ Prompt tuning
⬜ Style presets
⬜ Queue system
⬜ Product integration

---

**Let's build the future of AI-powered media generation! 🚀**
