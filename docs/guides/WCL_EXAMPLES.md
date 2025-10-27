# WCL Examples Cookbook

**Real-world examples of WhaleTools Component Language in action**

---

## 📋 Table of Contents

1. [Basic Components](#basic-components)
2. [Data Fetching](#data-fetching)
3. [Quantum Rendering](#quantum-rendering)
4. [Morphing Components](#morphing-components)
5. [E-commerce Patterns](#e-commerce-patterns)
6. [Advanced Patterns](#advanced-patterns)
7. [AI-Optimized Components](#ai-optimized-components)

---

## 🎯 Basic Components

### **Simple Display Component**

```wcl
component WelcomeMessage {
  props {
    userName: String = "Guest"
    isVIP: Boolean = false
  }
  
  render {
    <div class="welcome">
      <h1>Welcome, {userName}!</h1>
      {isVIP && <Badge>VIP Member</Badge>}
    </div>
  }
}
```

**Generates:**
- Complete TypeScript component
- Prop validation
- Conditional rendering
- Type safety

### **Component with State**

```wcl
component Counter {
  state {
    count: Number = 0
  }
  
  render {
    <div>
      <span>Count: {count}</span>
      <button onClick={() => count++}>Increment</button>
      <button onClick={() => count = 0}>Reset</button>
    </div>
  }
}
```

---

## 🔄 Data Fetching

### **Basic Fetch**

```wcl
component ProductList {
  data {
    products = fetch("/api/products") @cache(5m)
  }
  
  render {
    <div class="grid">
      {products.map(p => <ProductCard product={p} />)}
    </div>
  }
}
```

### **Dependent Fetches**

```wcl
component ProductDetail {
  props {
    productId: String
  }
  
  data {
    product = fetch(`/api/products/${productId}`)
    reviews = fetch(`/api/products/${productId}/reviews`) @depends(product)
    related = fetch(`/api/products/${product.category}/related`) @depends(product)
  }
  
  render {
    <div>
      <ProductInfo data={product} />
      <ReviewSection reviews={reviews} />
      <RelatedProducts items={related} />
    </div>
  }
}
```

### **Real-time Data**

```wcl
component LiveInventory {
  data {
    inventory = stream("/api/inventory/live") {
      @websocket
      @reconnect(true)
      @buffer(100)
    }
  }
  
  render {
    <div class="live-feed">
      {inventory.map(item => (
        <InventoryItem 
          item={item} 
          pulse={item.isNew}
        />
      ))}
    </div>
  }
}
```

---

## ⚡ Quantum Rendering

### **Device-Based Quantum States**

```wcl
component AdaptiveNavigation {
  render {
    quantum {
      state Mobile when user.device === "mobile" {
        <MobileNav>
          <Hamburger />
          <Logo compact />
          <CartIcon />
        </MobileNav>
      }
      
      state Tablet when user.device === "tablet" {
        <TabletNav>
          <Logo />
          <SearchBar />
          <UserMenu condensed />
        </TabletNav>
      }
      
      state Desktop when user.device === "desktop" {
        <DesktopNav>
          <Logo />
          <MegaMenu />
          <SearchBar expanded />
          <UserMenu />
          <CartDrawer />
        </DesktopNav>
      }
      
      collapse after 5s or on navigation
    }
  }
}
```

### **Behavior-Based Quantum States**

```wcl
component SmartHero {
  data {
    featured = fetch("/api/featured")
    deals = fetch("/api/deals")
  }
  
  render {
    quantum {
      state FirstTime when user.visits === 1 {
        <Hero size="large">
          <h1>Welcome to WhaleTools!</h1>
          <p>Get 20% off your first order</p>
          <OnboardingVideo />
          <Button primary>Start Shopping</Button>
        </Hero>
      }
      
      state Returning when user.visits > 1 {
        <Hero size="medium">
          <h1>Welcome Back!</h1>
          <RecentlyViewed limit={3} />
          <Button>Continue Shopping</Button>
        </Hero>
      }
      
      state HighIntent when user.cartAbandoned {
        <Hero urgent>
          <h1>Complete Your Order!</h1>
          <AbandonedCart />
          <Countdown minutes={10} />
          <Button urgent>Checkout Now - 10% Off</Button>
        </Hero>
      }
      
      collapse {
        after 10s
        or when user.scrollDepth > 20
        or when cart.modified
      }
    }
  }
}
```

### **A/B Testing with Quantum**

```wcl
component CheckoutFlow {
  @ab_test("checkout_optimization_q4")
  
  render {
    quantum {
      state Control {
        <TraditionalCheckout />
      }
      
      state VariantA {
        <OnePageCheckout />
      }
      
      state VariantB {
        <SteppedCheckout 
          showProgress 
          autoSave 
        />
      }
      
      state VariantC {
        <ExpressCheckout 
          prefillEnabled 
          guestAllowed 
        />
      }
      
      collapse {
        after user.completes_purchase
        track conversion_rate
        report to analytics
      }
    }
  }
}
```

---

## 🔄 Morphing Components

### **Scroll-Based Morphing**

```wcl
component MorphingProductGrid {
  data {
    products = fetch("/api/products")
  }
  
  state {
    viewMode: Enum["grid", "list", "compact"] = "grid"
  }
  
  render {
    <ProductDisplay mode={viewMode}>
      {products}
    </ProductDisplay>
  }
  
  morph {
    when user.scrollSpeed > 100px/s {
      transition viewMode to "compact" with animation.smooth
    }
    
    when user.scrollSpeed < 20px/s {
      transition viewMode to "grid" with animation.fade
    }
    
    when user.dwellTime > 30s {
      enhance with details
    }
  }
}
```

### **Interaction-Based Morphing**

```wcl
component SmartSearch {
  state {
    mode: Enum["minimal", "expanded", "advanced"] = "minimal"
  }
  
  render {
    <SearchInterface mode={mode} />
  }
  
  morph {
    when input.focused {
      transition to "expanded" immediately
    }
    
    when results.count > 100 {
      transition to "advanced" 
      add filters
      add sorting
    }
    
    when user.types "help" {
      transform to support_chat
    }
  }
}
```

### **Time-Based Morphing**

```wcl
component PromoBanner {
  render {
    <Banner />
  }
  
  morph {
    when time.elapsed(5s) {
      add subtle_animation
    }
    
    when time.elapsed(10s) and not user.interacted {
      increase prominence by 20%
    }
    
    when time.elapsed(30s) {
      minimize to corner
    }
    
    when sale.ends_in < 1h {
      add urgency_pulse
      change color to red
    }
  }
}
```

---

## 🛍️ E-commerce Patterns

### **Smart Product Card**

```wcl
component SmartProductCard {
  props {
    product: Product
  }
  
  state {
    imageIndex: Number = 0
    showQuickView: Boolean = false
  }
  
  computed {
    discount = product.comparePrice 
      ? (product.comparePrice - product.price) / product.comparePrice 
      : 0
    
    isOnSale = discount > 0
    isLowStock = product.inventory < 5
    isNew = product.createdAt > Date.now() - 7.days
  }
  
  render {
    quantum {
      state Default {
        <Card>
          <Image src={product.images[imageIndex]} />
          {isOnSale && <Badge>-{discount * 100}%</Badge>}
          {isNew && <Badge>New</Badge>}
          {isLowStock && <Badge urgent>Only {product.inventory} left</Badge>}
          <Title>{product.name}</Title>
          <Price value={product.price} compare={product.comparePrice} />
          <AddToCart product={product} />
        </Card>
      }
      
      state Hover when user.hovering {
        <Card elevated>
          <ImageGallery 
            images={product.images} 
            autoPlay 
          />
          <QuickActions>
            <AddToCart instant />
            <AddToWishlist />
            <QuickView />
          </QuickActions>
        </Card>
      }
    }
  }
  
  morph {
    when user.viewedMultipleTimes(3) {
      highlight with glow
    }
    
    when product.inventory === 1 {
      add urgency_shake
    }
  }
}
```

### **Smart Cart**

```wcl
component SmartCart {
  data {
    cart = fetch("/api/cart") @realtime
    shipping = fetch("/api/shipping/estimate") @depends(cart)
    promos = fetch("/api/promos/applicable") @depends(cart)
  }
  
  computed {
    subtotal = cart.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    )
    
    savings = promos.reduce((sum, promo) => 
      sum + promo.discount, 0
    )
    
    total = subtotal + shipping.cost - savings
    
    freeShippingThreshold = 50
    toFreeShipping = Math.max(0, freeShippingThreshold - subtotal)
  }
  
  render {
    <CartContainer>
      {cart.items.map(item => (
        <CartItem item={item} editable />
      ))}
      
      {toFreeShipping > 0 && (
        <FreeShippingBar 
          current={subtotal} 
          threshold={freeShippingThreshold}
        >
          Add ${toFreeShipping} for free shipping!
        </FreeShippingBar>
      )}
      
      <CartSummary>
        <Row label="Subtotal" value={subtotal} />
        {savings > 0 && <Row label="Savings" value={-savings} highlight />}
        <Row label="Shipping" value={shipping.cost} />
        <Row label="Total" value={total} bold />
      </CartSummary>
      
      <CheckoutButton 
        disabled={cart.items.length === 0}
        urgent={cart.hasLimitedItems}
      />
    </CartContainer>
  }
  
  morph {
    when cart.abandoned after 1h {
      add recovery_incentive(10%)
    }
    
    when user.removes_item {
      show undo_option for 5s
    }
  }
}
```

### **Checkout with Validation**

```wcl
component SmartCheckout {
  props {
    cart: Cart
  }
  
  state {
    step: Enum["shipping", "payment", "review"] = "shipping"
    shippingData: ShippingAddress = {}
    paymentData: PaymentInfo = {}
    errors: Map<String, String> = {}
  }
  
  validation {
    shippingData {
      email: Email required
      firstName: String required min(2)
      lastName: String required min(2)
      address: String required
      city: String required
      zip: String required pattern("[0-9]{5}")
      phone: Phone optional
    }
    
    paymentData {
      cardNumber: CreditCard required
      expiry: ExpiryDate required
      cvv: CVV required
      billingZip: String required
    }
  }
  
  effects {
    when shippingData.zip.changes {
      validateAddress(shippingData)
      calculateTax(shippingData.zip)
    }
    
    when paymentData.cardNumber.changes {
      detectCardType(paymentData.cardNumber)
    }
  }
  
  render {
    <CheckoutForm>
      {step === "shipping" && (
        <ShippingForm 
          data={shippingData}
          errors={errors}
          onContinue={() => step = "payment"}
        />
      )}
      
      {step === "payment" && (
        <PaymentForm
          data={paymentData}
          errors={errors}
          onBack={() => step = "shipping"}
          onContinue={() => step = "review"}
        />
      )}
      
      {step === "review" && (
        <OrderReview
          cart={cart}
          shipping={shippingData}
          payment={paymentData}
          onBack={() => step = "payment"}
          onSubmit={submitOrder}
        />
      )}
      
      <ProgressIndicator 
        steps={["shipping", "payment", "review"]}
        current={step}
      />
    </CheckoutForm>
  }
}
```

---

## 🚀 Advanced Patterns

### **Infinite Scroll with Virtualization**

```wcl
component InfiniteProductFeed {
  data {
    products = paginate("/api/products") {
      @page_size(20)
      @prefetch_next
      @virtualize(height: 200)
    }
  }
  
  render {
    <VirtualScroll 
      items={products}
      itemHeight={200}
      buffer={5}
      onEndReached={products.loadMore}
    >
      {(product) => <ProductCard product={product} />}
    </VirtualScroll>
  }
  
  optimize {
    lazy load images
    recycle dom nodes
    throttle scroll events to 60fps
  }
}
```

### **Collaborative Filtering**

```wcl
component RecommendationEngine {
  @learn_from_all_users
  @share_patterns
  
  data {
    userHistory = fetch("/api/user/history")
    allPatterns = fetch("/api/ml/patterns") @cache(1h)
  }
  
  computed {
    recommendations = ML.collaborativeFilter(
      userHistory,
      allPatterns,
      limit: 10
    )
    
    confidence = recommendations.map(r => r.score)
  }
  
  render {
    quantum {
      state HighConfidence when confidence.avg > 0.8 {
        <div>
          <h2>Recommended for You</h2>
          <ProductGrid items={recommendations} />
        </div>
      }
      
      state LowConfidence when confidence.avg < 0.5 {
        <div>
          <h2>Popular Products</h2>
          <ProductGrid items={popular} />
        </div>
      }
      
      state Learning {
        <div>
          <h2>Discover Something New</h2>
          <ExploratoryGrid />
        </div>
      }
    }
  }
}
```

### **Real-time Collaboration**

```wcl
component LiveShopping {
  data {
    stream = websocket("/api/live-shopping") {
      @auto_reconnect
      @heartbeat(30s)
    }
    
    viewers = stream.viewers
    host = stream.host
    product = stream.current_product
    chat = stream.chat_messages
  }
  
  state {
    myBid: Number = 0
    isWatching: Boolean = true
  }
  
  render {
    <LiveContainer>
      <VideoFeed src={stream.video_url} />
      
      <ViewerCount>
        <Icon.Users />
        {viewers.length} watching
      </ViewerCount>
      
      <ProductShowcase 
        product={product}
        highlight={stream.highlighting}
      />
      
      <ChatPanel messages={chat} />
      
      {stream.auction_active && (
        <BidInterface
          currentBid={stream.highest_bid}
          myBid={myBid}
          onBid={(amount) => stream.send({ bid: amount })}
        />
      )}
    </LiveContainer>
  }
  
  morph {
    when stream.flash_sale {
      add urgency_pulse to BuyButton
      show countdown_timer
    }
    
    when viewers.length > 100 {
      minimize chat
      expand video
    }
  }
}
```

---

## 🤖 AI-Optimized Components

### **Self-Optimizing Hero**

```wcl
component AIHero {
  @ai_optimizable
  @track_all_interactions
  @report_to_collective
  
  props {
    vendorId: String
  }
  
  data {
    content = fetch(`/api/ai/hero-content/${vendorId}`)
    performance = fetch(`/api/analytics/hero-performance`)
  }
  
  render {
    quantum {
      // AI generates these states based on performance data
      @ai_generated
      state A { /* AI CONTENT */ }
      state B { /* AI CONTENT */ }
      state C { /* AI CONTENT */ }
      
      collapse {
        using ai_optimizer
        maximize conversion_rate
        min_observations 100
      }
    }
  }
  
  optimize {
    @ai_tune_weekly
    @share_learnings
  }
}
```

### **Predictive Preloader**

```wcl
component PredictiveNav {
  @predict_user_path
  
  data {
    currentPage = window.location
    userHistory = fetch("/api/user/navigation-history")
    predictions = ML.predictNextPage(currentPage, userHistory)
  }
  
  effects {
    when predictions.confidence > 0.7 {
      prefetch(predictions.mostLikely)
      prerender(predictions.mostLikely)
    }
    
    when predictions.includes(product_page) {
      warmCache(product_images)
    }
  }
  
  render {
    <Navigation>
      {links.map(link => (
        <NavLink 
          href={link.url}
          prefetch={predictions.includes(link.url)}
          priority={predictions.getPriority(link.url)}
        >
          {link.label}
        </NavLink>
      ))}
    </Navigation>
  }
}
```

### **Sentiment-Aware Support**

```wcl
component SmartSupport {
  @analyze_sentiment
  
  state {
    userMood: Enum["happy", "neutral", "frustrated"] = "neutral"
    escalationLevel: Number = 0
  }
  
  effects {
    when user.types {
      userMood = ML.detectSentiment(user.input)
    }
    
    when userMood === "frustrated" {
      escalationLevel++
      if (escalationLevel > 2) {
        escalateToHuman()
      }
    }
  }
  
  render {
    quantum {
      state Happy when userMood === "happy" {
        <ChatBot 
          tone="friendly"
          suggestions={commonQuestions}
        />
      }
      
      state Frustrated when userMood === "frustrated" {
        <div>
          <Alert>We understand your frustration</Alert>
          <ChatBot 
            tone="empathetic"
            showHumanOption
          />
          {escalationLevel > 1 && <CallButton>Speak to Human</CallButton>}
        </div>
      }
    }
  }
}
```

---

## 📚 Common Patterns Reference

### **Loading States**
```wcl
// Automatic with data fetching
data { items = fetch("/api/items") }
// Generates loading state automatically
```

### **Error Handling**
```wcl
// Automatic with data fetching
data { 
  items = fetch("/api/items") {
    @retry(3)
    @fallback([])
  }
}
```

### **Caching**
```wcl
data { 
  items = fetch("/api/items") {
    @cache(5m)          // Time-based
    @stale_while_revalidate  // Background refresh
  }
}
```

### **Real-time Updates**
```wcl
data {
  items = stream("/api/items") {
    @websocket
    @auto_reconnect
  }
}
```

### **Accessibility**
```wcl
@aria_compliant
@wcag_aa
component AccessibleForm {
  // Automatic ARIA labels
  // Automatic keyboard navigation
  // Automatic screen reader support
}
```

---

**These examples showcase the power of WCL - write less, do more, perform better!** 🚀
