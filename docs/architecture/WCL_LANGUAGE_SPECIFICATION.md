# WhaleTools Component Language (WCL) Specification

**The Domain-Specific Language for Living E-commerce Components**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Language Syntax](#language-syntax)
4. [Type System](#type-system)
5. [Quantum Rendering](#quantum-rendering)
6. [Compiler Architecture](#compiler-architecture)
7. [Runtime Behavior](#runtime-behavior)
8. [Implementation Roadmap](#implementation-roadmap)

---

## 🎯 Overview

**WCL (WhaleTools Component Language)** is a domain-specific language designed specifically for creating living, self-optimizing e-commerce components that can morph, adapt, and evolve in real-time.

### **Why WCL Exists**

Traditional approaches require 200+ lines of boilerplate for production-ready components. WCL reduces this to 5-10 lines while adding capabilities impossible in standard React:

```wcl
// 5 lines of WCL
component ProductGrid {
  data { products = fetch("/api/products") @cache(5m) }
  render { <Grid items={products} /> }
}
```

This generates 200+ lines of production TypeScript with:
- ✅ Error handling
- ✅ Loading states  
- ✅ Retry logic
- ✅ Caching
- ✅ Performance monitoring
- ✅ Analytics tracking
- ✅ Accessibility
- ✅ Mobile optimization

### **Unique Capabilities**

| Feature | Traditional React | WCL |
|---------|------------------|-----|
| Lines of code | 200+ | 5-10 |
| Quantum rendering | Impossible | Built-in |
| Hot morphing | Complex | Native |
| AI generation | Error-prone | Perfect |
| Performance | Manual optimization | Automatic |
| Learning | Static | Self-improving |

---

## 🧬 Core Concepts

### **1. Living Components**

Components in WCL are **living entities** that can:
- Adapt to user behavior in real-time
- Morph their structure without page refresh
- Learn from interactions
- Share intelligence across vendors

### **2. Quantum States**

Components can exist in multiple states simultaneously:

```wcl
quantum {
  state A when user.firstVisit { <HeroLarge /> }
  state B when user.returning { <HeroCompact /> }
  state C when user.highIntent { <HeroUrgent /> }
}
```

The runtime renders ALL states, tracks user behavior, and collapses to the best-performing state.

### **3. Domain Intelligence**

WCL understands e-commerce concepts natively:

```wcl
props {
  product: Product  // Full type with 30+ fields
  cart: Cart       // Includes subtotal, tax, shipping
  user: User       // PII handling built-in
}
```

### **4. Collective Learning**

Components share learnings across the platform:

```wcl
@learn_from_all_vendors
@share_optimizations
component CheckoutFlow {
  // Automatically uses best-performing checkout pattern
}
```

---

## 📝 Language Syntax

### **Component Definition**

```wcl
component ComponentName {
  // Metadata annotations
  @version("1.0.0")
  @category("smart")
  @ai_optimizable
  
  // Property definitions
  props {
    propName: Type = defaultValue {
      @validation_rule
      @ai_mutable
    }
  }
  
  // Data fetching
  data {
    dataName = fetch("endpoint") {
      @cache(duration)
      @retry(attempts)
      @stream
    }
  }
  
  // State management
  state {
    stateName: Type = initialValue
  }
  
  // Computed values
  computed {
    computedName = expression
  }
  
  // Effects
  effects {
    when condition {
      action
    }
  }
  
  // Render logic
  render {
    // Quantum states or template
  }
  
  // Morphing rules
  morph {
    when condition after duration {
      transition to stateX
    }
  }
  
  // Optimization directives
  optimize {
    prefetch when hover
    lazy load images
    virtualize lists > 50
  }
}
```

### **Grammar (EBNF)**

```ebnf
component_definition ::= 'component' identifier '{' 
                          component_body 
                        '}'

component_body ::= metadata* 
                   props_block? 
                   data_block? 
                   state_block?
                   computed_block?
                   effects_block?
                   render_block 
                   morph_block?
                   optimize_block?

props_block ::= 'props' '{' prop_definition* '}'

prop_definition ::= identifier ':' type_expression 
                    ('=' default_value)? 
                    ('{' annotation* '}')?

data_block ::= 'data' '{' data_fetcher* '}'

data_fetcher ::= identifier '=' 'fetch' '(' string_literal ')' 
                 ('{' fetch_option* '}')?

render_block ::= 'render' '{' 
                   (quantum_block | template_expression) 
                   morph_block? 
                 '}'

quantum_block ::= 'quantum' '{' quantum_state+ '}'

quantum_state ::= 'state' identifier 'when' condition_expression 
                  '{' template_expression '}'
```

---

## 🎨 Type System

### **Built-in Types**

```wcl
// Primitive types
String              // Text values
Number              // Numeric values  
Boolean             // true/false
Date                // Date/time values

// E-commerce types
Product {           // Product entity
  id: String
  name: String
  price: Money
  inventory: Integer
  // ... 20+ more fields
}

Cart {              // Shopping cart
  items: CartItem[]
  subtotal: Money
  tax: Money
  shipping: Money
  total: Money
}

User {              // User context
  id: String
  email: Email     // Validated email
  preferences: Preferences
  behavior: Behavior
}

Money {             // Currency handling
  amount: Decimal
  currency: Currency
  format(): String
}

// Collection types
Array<T>            // Lists
Map<K, V>           // Key-value pairs
Set<T>              // Unique values

// Special types
Enum[...values]     // Enumeration
Optional<T>         // Nullable type
Range(min..max)     // Numeric range
```

### **Custom Types**

```wcl
type OrderStatus = Enum["pending", "processing", "shipped", "delivered"]

type ShippingAddress {
  street: String
  city: String
  state: String
  zip: String @pattern("[0-9]{5}")
  country: String = "US"
}
```

---

## ⚡ Quantum Rendering

### **Concept**

Quantum rendering allows components to exist in multiple states simultaneously until "observed" (user interaction), then collapses to the optimal state.

### **Implementation**

**⚠️ CRITICAL: Quantum States are for BEHAVIOR, NOT screen size**

```wcl
component AdaptiveHero {
  data {
    user = fetch("/api/user/context")
  }
  
  render {
    quantum {
      // ✅ CORRECT: Behavioral states
      state FirstVisit when user.visits == 1 {
        <div className="py-16 sm:py-20 px-4 sm:px-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black">WELCOME</h1>
          <p className="text-lg sm:text-xl text-white/60">Get 20% off your first order</p>
          <button className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl">SHOP NOW</button>
        </div>
      }
      
      state Returning when user.visits > 1 {
        <div className="py-16 sm:py-20 px-4 sm:px-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black">WELCOME BACK</h1>
          <p className="text-lg sm:text-xl text-white/60">Continue where you left off</p>
          <button className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl">YOUR FAVORITES</button>
        </div>
      }
      
      state HighIntent when user.cartAbandoned {
        <div className="py-16 sm:py-20 px-4 sm:px-6 bg-red-900/20">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-red-500">COMPLETE ORDER</h1>
          <p className="text-lg sm:text-xl text-white/60">10% off if you checkout now</p>
          <button className="bg-red-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl animate-pulse">CHECKOUT NOW</button>
        </div>
      }
      
      // Collapse rules
      collapse {
        after 10s              // Time-based
        or after 5 clicks      // Interaction-based
        or when cart.added     // Event-based
      }
    }
  }
}

// ❌ WRONG: Don't use quantum for screen sizes
// Use Tailwind responsive utilities instead:
// text-4xl sm:text-6xl md:text-7xl
// grid-cols-1 md:grid-cols-2 lg:grid-cols-3
// py-12 sm:py-16 md:py-20
```

### **Runtime Behavior**

1. **Parallel Rendering**: All states render in shadow DOM
2. **Initial Display**: Show most likely state based on context
3. **Observation**: Track user interactions across all states
4. **Measurement**: Calculate performance metrics per state
5. **Collapse**: Transition to best-performing state
6. **Learning**: Report results to collective intelligence

---

## 🏗️ Compiler Architecture

### **Pipeline Overview**

```
WCL Source → Lexer → Parser → AST → Transformer → TypeScript → Build
```

### **Compilation Phases**

#### **Phase 1: Lexical Analysis**
```javascript
// Input
component ProductGrid {
  data { products = fetch("/api/products") }
}

// Token stream
[
  {type: "COMPONENT", value: "component"},
  {type: "IDENTIFIER", value: "ProductGrid"},
  {type: "OPEN_BRACE", value: "{"},
  // ...
]
```

#### **Phase 2: Parsing**
```javascript
// AST
{
  type: "Component",
  name: "ProductGrid",
  dataBlock: {
    fetchers: [{
      name: "products",
      endpoint: "/api/products"
    }]
  }
}
```

#### **Phase 3: Transformation**
```javascript
// TypeScript output
export function ProductGrid({ vendorId }) {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', vendorId],
    queryFn: () => fetch('/api/products'),
    // ... auto-generated configuration
  });
  
  // ... rest of generated code
}
```

### **Compiler Optimizations**

- **Dead code elimination**: Remove unused quantum states
- **Bundling optimization**: Split code at quantum boundaries
- **Prefetch injection**: Add link prefetching automatically
- **Image optimization**: Convert to next/image automatically

---

## ⚙️ Runtime Behavior

### **Component Lifecycle**

```wcl
lifecycle {
  onMount {
    // Prefetch likely next states
    prefetch(quantum.states.probable)
    // Start performance tracking
    performance.mark('component-start')
  }
  
  onRender {
    // Track render performance
    performance.measure('render-time')
  }
  
  onInteraction {
    // Record user behavior
    analytics.track(event)
    // Check morph conditions
    checkMorphTriggers()
  }
  
  onUnmount {
    // Report learnings
    collectiveIntelligence.report(metrics)
  }
}
```

### **Hot Morphing**

Components can transform in real-time:

```wcl
morph {
  // Condition-based morphing
  when user.scrollSpeed > 100 {
    simplify()  // Reduce complexity for fast scrollers
  }
  
  when user.dwellTime > 30s {
    expand()    // Show more options for engaged users
  }
  
  when user.frustration.detected {
    transition to helpfulMode with animation.smooth
  }
}
```

### **Performance Guarantees**

WCL enforces performance constraints:

```wcl
@performance {
  max_render_time: 100ms
  max_query_count: 3
  max_bundle_size: 50kb
  required_lighthouse_score: 90
}
```

---

## 📊 Implementation Roadmap

### **Phase 1: Foundation (Weeks 1-2)**

**Goal**: Basic transpiler for data fetching

```wcl
// Support this initially
component Simple {
  data { items = fetch("/api/items") }
  render { <List items={items} /> }
}
```

**Deliverables**:
- ✅ Lexer for basic syntax
- ✅ Parser for simple components
- ✅ Transpiler to React/TypeScript
- ✅ CLI tool for compilation

### **Phase 2: Quantum States (Weeks 3-4)**

**Goal**: Add parallel state rendering

```wcl
// Add quantum support
quantum {
  state A when condition { template }
  state B when condition { template }
}
```

**Deliverables**:
- ✅ Quantum renderer implementation
- ✅ State tracking system
- ✅ Collapse algorithm
- ✅ Performance metrics

### **Phase 3: Type System (Weeks 5-6)**

**Goal**: Rich e-commerce types

```wcl
// Full type support
props {
  product: Product
  cart: Cart
  user: User
}
```

**Deliverables**:
- ✅ Type definitions
- ✅ Type checking
- ✅ Auto-completion
- ✅ Validation

### **Phase 4: Morphing (Weeks 7-8)**

**Goal**: Real-time component transformation

```wcl
// Morphing rules
morph {
  when condition after delay {
    action
  }
}
```

**Deliverables**:
- ✅ Morph engine
- ✅ Transition animations
- ✅ State management
- ✅ Event system

### **Phase 5: AI Integration (Weeks 9-10)**

**Goal**: Claude generates WCL

```wcl
@ai_generated
@optimized_for("conversion")
component AIComponent {
  // Claude writes this
}
```

**Deliverables**:
- ✅ WCL training dataset
- ✅ Claude fine-tuning
- ✅ Validation system
- ✅ Generation API

### **Phase 6: Developer Tools (Weeks 11-12)**

**Goal**: Amazing developer experience

**Deliverables**:
- ✅ VS Code extension
- ✅ Syntax highlighting
- ✅ IntelliSense
- ✅ Debugger
- ✅ Hot reload
- ✅ Error messages

---

## 🎯 Success Metrics

### **Technical Metrics**
- Component creation time: -90%
- Lines of code: -95%
- Bundle size: -40%
- Render performance: +50%
- Error rate: -80%

### **Business Metrics**
- Developer productivity: 10x
- Vendor onboarding: 1 week → 1 hour
- Conversion rate: +20-40%
- Platform stickiness: 95%+
- Competitive moat: 2-3 years

---

## 🚀 Getting Started

### **Installation** (Future)
```bash
npm install -g @whaletools/wcl
```

### **Create First Component**
```bash
wcl create ProductGrid
```

### **Compile to TypeScript**
```bash
wcl compile
```

### **Watch Mode**
```bash
wcl watch
```

---

## 📚 Additional Resources

- [WCL Implementation Guide](../guides/WCL_IMPLEMENTATION.md)
- [WCL Examples](../guides/WCL_EXAMPLES.md)
- [Migration from React](../guides/WCL_MIGRATION.md)
- [Quantum Rendering Deep Dive](./QUANTUM_RENDERING.md)
- [Evolution Plan Integration](../evolution/WCL_EVOLUTION.md)

---

**WCL: The future of e-commerce development. Components that think, learn, and evolve.** 🐋⚡
