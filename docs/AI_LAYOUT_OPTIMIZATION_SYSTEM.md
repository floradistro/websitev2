# AI Layout Optimization System

**Status**: Architecture Complete, Ready for UI Implementation
**Created**: 2025-10-29
**AI Type**: Hybrid (Rule-Based + LLM)

## 🎯 Vision

An intelligent system that analyzes your store layout, TV specifications, and product catalog to automatically generate the **most optimal menu display** for each screen.

Think: *"AI Interior Designer for Digital Signage"*

---

## 🏗️ Architecture

### **Three-Layer System**

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│  Configure Display → AI Analyzes → Review Suggestions →     │
│  Apply Layout → Monitor Performance                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     AI ENGINES                              │
│                                                             │
│  ┌──────────────────┐         ┌─────────────────────┐      │
│  │  Rule-Based AI   │         │  LLM Consultant     │      │
│  │  (Fast, Free)    │ ──→     │  (Smart, Nuanced)   │      │
│  │                  │         │                     │      │
│  │ • Grid calc      │         │ • Business context  │      │
│  │ • Font scaling   │         │ • Brand awareness   │      │
│  │ • Density limits │         │ • Psychology        │      │
│  └──────────────────┘         └─────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
│                                                             │
│  • Display Profiles (screen size, distance, location)      │
│  • Product Data (count, categories, complexity)            │
│  • Business Context (goals, brand, audience)               │
│  • Performance Metrics (learning data)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### **1. tv_display_profiles**

Stores physical and contextual information about each display.

```sql
{
  device_id: uuid,

  -- Physical specs
  screen_width_inches: 55,
  screen_height_inches: 31,
  resolution_width: 1920,
  resolution_height: 1080,

  -- Context
  viewing_distance_feet: 10,
  location_type: "checkout",
  ambient_lighting: "bright",

  -- Customer behavior
  avg_dwell_time_seconds: 45,
  customer_behavior: "Quick glance while waiting in line",

  -- Business
  store_type: "dispensary",
  brand_vibe: "premium",
  target_audience: "medical patients",
  business_goals: ["increase high-margin sales", "educate customers"]
}
```

### **2. ai_layout_recommendations**

Stores AI-generated layout suggestions.

```sql
{
  id: uuid,
  device_id: uuid,
  ai_type: "rule_based" | "llm" | "hybrid",

  recommended_layout: {
    displayMode: "dense",
    gridColumns: 4,
    gridRows: 3,
    typography: {...},
    spacing: {...},
    contentStrategy: {...}
  },

  confidence_score: 87,
  reasoning: ["List of AI decisions..."],
  alternatives: [...],
  customization_tips: [...],

  was_applied: true,
  user_feedback: "modified"
}
```

### **3. ai_layout_performance**

Tracks how well AI recommendations perform (for learning).

```sql
{
  recommendation_id: uuid,
  avg_view_time_seconds: 38.5,
  interaction_rate: 12.3,
  measured_from: "2025-01-01",
  measured_to: "2025-01-07"
}
```

---

## 🤖 AI Engines

### **Engine 1: Rule-Based Optimizer** (Always On, Free)

**File**: `lib/ai/layout-optimizer.ts`

**What it does**:
1. Calculates minimum readable font size based on viewing distance
2. Determines optimal grid layout (columns × rows)
3. Decides dense vs carousel mode
4. Scales typography based on product density
5. Provides detailed reasoning for decisions

**Example Output**:
```json
{
  "displayMode": "dense",
  "gridColumns": 4,
  "gridRows": 3,
  "productsPerPage": 12,
  "typography": {
    "productNameSize": 22,
    "priceSize": 36,
    "detailsSize": 16
  },
  "reasoning": [
    "Minimum readable font: 24px (viewing distance: 10ft)",
    "45 products fit comfortably - using dense mode",
    "Optimal grid: 4x3 (12 products per page)",
    "Confidence: 92%"
  ]
}
```

**Key Algorithms**:
- Font Size: `1 inch of letter height per 10 feet viewing distance`
- Max Products: `(screen height / card height) × (screen width / min card width)`
- Grid: Balanced for aspect ratio + location type adjustments
- Confidence: Deducts points for extreme densities or edge cases

---

### **Engine 2: LLM Consultant** (Optional, Claude API)

**File**: `lib/ai/llm-layout-consultant.ts`

**What it does**:
1. Takes rule-based suggestion as starting point
2. Analyzes business context and brand positioning
3. Considers customer psychology
4. Provides nuanced recommendations
5. Offers 2-3 alternative layouts
6. Gives customization tips

**Example Prompt to Claude**:
```
You're a digital signage designer for a premium medical dispensary.

Display: 55" TV, 10ft viewing distance, checkout area
Products: 45 items, tiered pricing, 3 active promotions
Brand: Premium, medical patients, educational focus
Goals: Increase high-margin sales, educate customers

Rule-based AI suggests: 4x3 grid, dense mode, 22px fonts

Your task: Optimize for this specific context...
```

**Example Output**:
```json
{
  "recommendation": {
    "gridColumns": 3,
    "gridRows": 4,
    "typography": {
      "productNameSize": 26,
      "priceSize": 42
    }
  },
  "reasoning": "For a premium medical brand at checkout, prioritize readability over density. 3x4 grid allows larger fonts, emphasizing professionalism. Medical patients appreciate clear, educational layouts over flashy dense grids.",
  "alternatives": [
    {
      "name": "High-Margin Focus",
      "description": "Show only top 8 premium products with detailed info"
    }
  ],
  "customizationTips": [
    "Add strain type icons for medical patients",
    "Use CBD/THC ratio prominently",
    "Consider adding educational content about terpenes"
  ]
}
```

---

## 🔌 API Endpoints

### **POST /api/ai/optimize-layout**

Generate AI recommendations for a display.

```javascript
// Request
{
  "deviceId": "uuid",
  "menuId": "uuid",
  "vendorId": "uuid",
  "useLLM": true  // Optional, defaults to false
}

// Response
{
  "success": true,
  "recommendation": {
    "aiType": "hybrid",
    "layout": {...},
    "reasoning": [...],
    "alternatives": [...],
    "customizationTips": [...],
    "confidence": 87
  },
  "recommendationId": "uuid",
  "applySuggestion": {
    "endpoint": "/api/ai/apply-layout",
    "payload": {...}
  }
}
```

### **POST /api/ai/apply-layout**

Apply a recommendation to a menu.

```javascript
// Request
{
  "recommendationId": "uuid",
  "menuId": "uuid",
  "modifications": null  // Or user tweaks
}

// Response
{
  "success": true,
  "menu": {...},
  "message": "AI layout applied successfully"
}
```

---

## 🎨 User Experience Flow

### **Step 1: Configure Display**

Vendor goes to TV Menu dashboard → "Configure Display Settings" modal:

```
┌─────────────────────────────────────────┐
│  Configure Display: Checkout TV #1     │
├─────────────────────────────────────────┤
│  Screen Size: [55] inches              │
│  Resolution: [1920 x 1080]  ▼          │
│  Viewing Distance: [10] feet           │
│  Location: [Checkout Counter]  ▼       │
│  Lighting: [Bright]  ▼                 │
│                                         │
│  Customer typically:                   │
│  [Quick glance while waiting]          │
│                                         │
│  Business goals:                       │
│  ☑ Increase high-margin sales          │
│  ☑ Educate customers                   │
│  ☐ Clear old inventory                 │
│                                         │
│     [Cancel]  [Save & Optimize]  ←─ AI! │
└─────────────────────────────────────────┘
```

### **Step 2: AI Analyzes & Suggests**

Loading animation → AI recommendation modal:

```
┌───────────────────────────────────────────┐
│  🤖 AI Layout Recommendation              │
├───────────────────────────────────────────┤
│  Confidence: ████████░░ 87%               │
│                                           │
│  Recommended Layout:                      │
│  • Grid: 4×3 (12 products per page)       │
│  • Mode: Dense (all products visible)     │
│  • Font: 22px product names               │
│                                           │
│  Why this layout?                         │
│  ✓ Viewing distance optimal for 22px     │
│  ✓ All 45 products fit comfortably       │
│  ✓ Checkout = quick scanning preferred   │
│                                           │
│  💡 Pro Tips:                             │
│  • Emphasize high-margin products         │
│  • Add THC/CBD ratio badges               │
│                                           │
│     [See Alternatives]                    │
│     [Decline]  [Apply Layout]             │
└───────────────────────────────────────────┘
```

### **Step 3: Live Preview**

Immediately see changes on display + option to tweak.

---

## 🚀 Implementation Roadmap

### **Phase 1: Foundation** (Week 1)
- ✅ Rule-based AI engine (`LayoutOptimizer`)
- ✅ LLM consultant (`LLMLayoutConsultant`)
- ✅ Database schema
- ✅ API endpoints
- ⬜ **UI for display configuration**
- ⬜ **UI for viewing AI recommendations**

### **Phase 2: Integration** (Week 2)
- ⬜ Apply recommendations to menu config
- ⬜ Dynamic CSS generation from AI layout
- ⬜ TV display rendering updates
- ⬜ A/B testing framework

### **Phase 3: Learning** (Week 3)
- ⬜ Performance tracking
- ⬜ User feedback collection
- ⬜ ML model to learn from successful layouts
- ⬜ Auto-optimization suggestions

### **Phase 4: Advanced** (Future)
- ⬜ Computer vision: Upload store photo → AI detects TV placement
- ⬜ Multi-zone displays (split screen layouts)
- ⬜ Dynamic content prioritization based on inventory
- ⬜ Seasonal/time-of-day layout switching

---

## 💡 Key Insights

### **Why This Works**

1. **Physics-Based**: Uses actual viewing distance math (not guesses)
2. **Context-Aware**: Checkout ≠ Entrance ≠ Waiting area
3. **Business-Aligned**: Optimizes for YOUR goals, not generic "best practices"
4. **Hybrid Intelligence**: Fast rule-based + nuanced LLM
5. **Learning System**: Gets smarter from vendor feedback

### **Competitive Advantage**

- **Spotify**: AI playlists for music
- **WhaleTools**: AI layouts for digital signage

This is a **killer feature** that no other digital signage platform has.

---

## 📝 Next Steps

1. **Run migration**: `supabase migration up`
2. **Install Anthropic SDK**: `npm install @anthropic-ai/sdk`
3. **Add ANTHROPIC_API_KEY** to `.env.local`
4. **Build UI components** for display configuration
5. **Test with real store data**

---

## 🎯 Success Metrics

- **Vendor Time Saved**: 30 min manual setup → 2 min AI setup
- **Layout Quality**: 90%+ vendors accept AI suggestions
- **Performance**: Layouts show 20%+ better engagement
- **Confidence**: AI reaches 85%+ confidence on recommendations

---

**This is absolutely possible and will blow vendors' minds.** 🚀
