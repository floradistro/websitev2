# Sentry Monitoring & Error Tracking Guide

**Last Updated:** November 8, 2025
**Status:** Production Ready
**Platform:** Next.js + Sentry (Next.js SDK)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration](#configuration)
3. [Exception Tracking](#exception-tracking)
4. [Performance Monitoring](#performance-monitoring)
5. [Structured Logging](#structured-logging)
6. [Critical Operations](#critical-operations)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

```bash
# Install Sentry for Next.js (already done during onboarding)
npx @sentry/wizard@latest -i nextjs
```

### Basic Usage

```typescript
import * as Sentry from "@sentry/nextjs";

// Capture an exception
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// Track performance
Sentry.startSpan({ op: "task", name: "Important Task" }, () => {
  doWork();
});

// Structured logging
const { logger } = Sentry;
logger.info("User action completed", { userId: "123" });
```

---

## Configuration

### File Locations

| Environment         | File                        | Purpose                    |
| ------------------- | --------------------------- | -------------------------- |
| Client (Browser)    | `instrumentation-client.ts` | Browser error tracking     |
| Server (API Routes) | `sentry.server.config.ts`   | Server-side error tracking |
| Edge (Middleware)   | `sentry.edge.config.ts`     | Edge runtime tracking      |

### Production Configuration

**File:** `sentry.server.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // DSN from environment variable (secure)
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tag
  environment: process.env.NODE_ENV,

  // Enable structured logging
  _experiments: {
    enableLogs: true,
  },

  // Performance monitoring sample rate
  // 10% in production (reduce costs), 100% in development
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Integrations
  integrations: [
    // Automatic console logging
    Sentry.consoleLoggingIntegration({
      levels: ["warn", "error"], // Only warn and error in production
    }),
  ],

  // Security: Strip PII before sending
  beforeSend(event, hint) {
    // Remove cookies (may contain auth tokens)
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.["authorization"];
      delete event.request.headers?.["cookie"];
    }

    // Remove customer email from user context
    if (event.user?.email) {
      event.user.email = undefined;
      event.user.id = hashUserId(event.user.id); // Hash user IDs
    }

    return event;
  },

  // Tag all events with vendor context
  beforeSendTransaction(event) {
    const vendorId = event.contexts?.vendor?.id;
    if (vendorId) {
      event.tags = {
        ...event.tags,
        vendor_id: vendorId,
        environment: process.env.NODE_ENV,
      };
    }
    return event;
  },

  // Ignore known errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded", // Benign browser error
    "Non-Error promise rejection captured", // Usually user cancellations
    /NEXT_NOT_FOUND/, // Next.js 404s
  ],
});
```

### Environment Variables

Add to `.env.local`:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token # For source maps
SENTRY_ORG=whaletools
SENTRY_PROJECT=pos
```

---

## Exception Tracking

### Basic Exception Capture

```typescript
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error; // Re-throw to handle locally
}
```

### With Context (Recommended)

```typescript
try {
  await processPayment(data);
} catch (error) {
  Sentry.captureException(error, {
    // Tags for filtering/grouping
    tags: {
      component: "payment",
      severity: "critical",
      vendor_id: vendorId,
    },

    // Additional context data
    contexts: {
      payment: {
        amount: data.amount,
        currency: "USD",
        payment_method: data.method,
      },
      vendor: {
        id: vendorId,
        name: vendorName,
      },
    },

    // Breadcrumbs (what happened before the error)
    // Automatically tracked by Sentry, but you can add custom ones
    level: "error",
  });

  // Show user-friendly error
  throw new Error("Payment processing failed. Please try again.");
}
```

### API Route Example

```typescript
// app/api/vendor/products/route.ts
import { requireVendor } from "@/lib/auth/middleware";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;

    const { data, error } = await supabase.from("products").select("*").eq("vendor_id", vendorId);

    if (error) throw error;

    return NextResponse.json({ success: true, products: data });
  } catch (error) {
    // Log to Sentry with context
    Sentry.captureException(error, {
      tags: {
        endpoint: "/api/vendor/products",
        method: "GET",
        vendor_id: vendorId,
      },
      contexts: {
        request: {
          url: request.url,
          method: request.method,
        },
      },
    });

    // Return user-friendly error
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
```

---

## Performance Monitoring

### Tracking User Interactions

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';

function CheckoutButton({ cart, onCheckout }) {
  const handleCheckout = () => {
    Sentry.startSpan(
      {
        op: 'ui.click',
        name: 'Checkout Button Click',
      },
      (span) => {
        // Add meaningful attributes
        span.setAttribute('cart_total', cart.total);
        span.setAttribute('item_count', cart.items.length);
        span.setAttribute('has_discounts', cart.discounts.length > 0);

        // Perform the action
        onCheckout();
      }
    );
  };

  return <button onClick={handleCheckout}>Checkout</button>;
}
```

### Tracking API Calls

```typescript
async function fetchProducts(vendorId: string) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: "GET /api/supabase/products",
    },
    async (span) => {
      // Add request context
      span.setAttribute("vendor_id", vendorId);

      const startTime = performance.now();

      const response = await fetch(`/api/supabase/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const duration = performance.now() - startTime;

      // Add response metrics
      span.setAttribute("duration_ms", duration);
      span.setAttribute("status", response.status);

      const data = await response.json();
      span.setAttribute("product_count", data.products.length);

      return data;
    },
  );
}
```

### Tracking Database Queries

```typescript
async function getInventoryWithTracking(productId: string, locationId: string) {
  return Sentry.startSpan(
    {
      op: "db.query",
      name: "Get Inventory",
    },
    async (span) => {
      span.setAttribute("product_id", productId);
      span.setAttribute("location_id", locationId);

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("product_id", productId)
        .eq("location_id", locationId)
        .single();

      if (error) {
        span.setAttribute("error", true);
        Sentry.captureException(error);
        throw error;
      }

      span.setAttribute("quantity", data.quantity);
      return data;
    },
  );
}
```

### Nested Spans (Parent-Child)

```typescript
async function processOrderWithTracking(orderId: string) {
  return Sentry.startSpan(
    {
      op: "order.process",
      name: "Process Order",
    },
    async (parentSpan) => {
      parentSpan.setAttribute("order_id", orderId);

      // Child span 1: Validate order
      const order = await Sentry.startSpan(
        { op: "order.validate", name: "Validate Order" },
        async () => validateOrder(orderId),
      );

      // Child span 2: Process payment
      const payment = await Sentry.startSpan(
        { op: "payment.process", name: "Process Payment" },
        async () => processPayment(order),
      );

      // Child span 3: Update inventory
      await Sentry.startSpan({ op: "inventory.update", name: "Update Inventory" }, async () =>
        updateInventory(order.items),
      );

      parentSpan.setAttribute("total_amount", order.total);
      parentSpan.setAttribute("payment_status", payment.status);

      return { order, payment };
    },
  );
}
```

---

## Structured Logging

### Logger Setup

```typescript
import * as Sentry from "@sentry/nextjs";

const { logger } = Sentry;

// Now use logger.{level} throughout your code
```

### Log Levels

| Level   | Use Case                     | Example                      |
| ------- | ---------------------------- | ---------------------------- |
| `trace` | Detailed debugging           | Database connection details  |
| `debug` | Development info             | Cache hits/misses            |
| `info`  | Normal operations            | User logged in, order placed |
| `warn`  | Potential issues             | Rate limit approaching       |
| `error` | Errors that can be recovered | Failed to send email         |
| `fatal` | Critical failures            | Database unavailable         |

### Examples

```typescript
// Trace (only in development)
logger.trace("Database connection initiated", {
  host: dbConfig.host,
  pool_size: dbConfig.poolSize,
});

// Debug (cache monitoring)
logger.debug(logger.fmt`Cache miss for product: ${productId}`, {
  vendor_id: vendorId,
  cache_key: cacheKey,
});

// Info (normal operations)
logger.info("Order fulfilled successfully", {
  order_id: orderId,
  vendor_id: vendorId,
  location_id: locationId,
  total_amount: total,
  items_count: items.length,
});

// Warn (potential issues)
logger.warn("Rate limit approaching threshold", {
  endpoint: "/api/vendor/products",
  vendor_id: vendorId,
  current_rate: 280,
  limit: 300,
  threshold_percent: 93,
});

// Error (recoverable errors)
logger.error("Failed to send order confirmation email", {
  order_id: orderId,
  customer_email: email,
  error: error.message,
  retry_count: retryCount,
});

// Fatal (critical failures)
logger.fatal("Database connection pool exhausted", {
  database: "postgres",
  active_connections: 100,
  max_connections: 100,
  queue_size: 50,
});
```

### Using Template Literals

Use `logger.fmt` for dynamic values:

```typescript
// ✅ CORRECT: Use logger.fmt template literal
logger.info(logger.fmt`User ${userId} completed checkout for $${total}`);

// ❌ WRONG: String interpolation loses structured data
logger.info(`User ${userId} completed checkout for $${total}`);

// ✅ BEST: Use both template + structured data
logger.info(logger.fmt`User ${userId} completed checkout`, {
  user_id: userId,
  total_amount: total,
  item_count: items.length,
});
```

---

## Critical Operations

### 1. Payment Processing

**Always track payment operations with full context:**

```typescript
async function processPayment(data: PaymentData) {
  return Sentry.startSpan(
    {
      op: "payment.process",
      name: "Process Payment",
    },
    async (span) => {
      try {
        // Add payment context
        span.setAttribute("amount", data.amount);
        span.setAttribute("payment_method", data.method);
        span.setAttribute("vendor_id", data.vendorId);
        span.setAttribute("terminal_id", data.terminalId);

        // Process payment
        const result = await paymentProcessor.charge(data);

        // Track success metrics
        span.setAttribute("transaction_id", result.transactionId);
        span.setAttribute("status", result.status);

        logger.info("Payment processed successfully", {
          transaction_id: result.transactionId,
          amount: data.amount,
          vendor_id: data.vendorId,
        });

        return result;
      } catch (error) {
        // Critical error - capture with full context
        Sentry.captureException(error, {
          tags: {
            component: "payment",
            severity: "critical",
            vendor_id: data.vendorId,
          },
          contexts: {
            payment: {
              amount: data.amount,
              payment_method: data.method,
              terminal_id: data.terminalId,
            },
          },
        });

        logger.error("Payment processing failed", {
          error: error.message,
          amount: data.amount,
          vendor_id: data.vendorId,
        });

        throw error;
      }
    },
  );
}
```

### 2. Order Fulfillment

```typescript
async function fulfillOrder(orderId: string, locationId: string) {
  return Sentry.startSpan(
    {
      op: "order.fulfill",
      name: "Fulfill Order",
    },
    async (span) => {
      span.setAttribute("order_id", orderId);
      span.setAttribute("location_id", locationId);

      try {
        // Call atomic fulfillment function
        const result = await supabase.rpc("fulfill_order_atomically", {
          p_order_id: orderId,
          p_location_id: locationId,
        });

        if (result.error) throw result.error;

        logger.info("Order fulfilled successfully", {
          order_id: orderId,
          location_id: locationId,
          transaction_id: result.data.transaction_id,
        });

        return result.data;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: "order_fulfillment",
            severity: "high",
          },
          contexts: {
            order: { id: orderId, location_id: locationId },
          },
        });

        logger.error("Order fulfillment failed", {
          order_id: orderId,
          error: error.message,
        });

        throw error;
      }
    },
  );
}
```

### 3. Inventory Adjustments

```typescript
async function adjustInventory(
  productId: string,
  locationId: string,
  adjustment: number,
  reason: string,
) {
  return Sentry.startSpan(
    {
      op: "inventory.adjust",
      name: "Adjust Inventory",
    },
    async (span) => {
      span.setAttribute("product_id", productId);
      span.setAttribute("location_id", locationId);
      span.setAttribute("adjustment", adjustment);

      try {
        const { data: current } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("product_id", productId)
          .eq("location_id", locationId)
          .single();

        const oldQuantity = current?.quantity || 0;
        const newQuantity = oldQuantity + adjustment;

        // Update inventory
        await supabase
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("product_id", productId)
          .eq("location_id", locationId);

        // Log the change
        logger.info("Inventory adjusted", {
          product_id: productId,
          location_id: locationId,
          old_quantity: oldQuantity,
          new_quantity: newQuantity,
          adjustment,
          reason,
        });

        // Alert on anomalies
        if (Math.abs(adjustment) > 100) {
          logger.warn("Large inventory adjustment detected", {
            product_id: productId,
            adjustment,
            reason,
          });
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { component: "inventory" },
          contexts: {
            inventory: {
              product_id: productId,
              location_id: locationId,
              adjustment,
            },
          },
        });
        throw error;
      }
    },
  );
}
```

### 4. Authentication Events

```typescript
// Successful login
logger.info("User logged in successfully", {
  user_id: user.id,
  email: hashEmail(user.email), // Hash PII
  role: user.role,
  vendor_id: user.vendor_id,
});

// Failed login
logger.warn("Authentication failed", {
  email: hashEmail(email), // Hash PII
  reason: "invalid_credentials",
  ip_address: request.ip,
  user_agent: request.headers.get("user-agent"),
});

// Suspicious activity
if (failedAttempts > 5) {
  logger.error("Multiple failed login attempts detected", {
    email: hashEmail(email),
    failed_attempts: failedAttempts,
    ip_address: request.ip,
    time_window: "5 minutes",
  });

  Sentry.captureMessage("Potential brute force attack", {
    level: "warning",
    tags: { component: "auth", security: "high" },
  });
}
```

### 5. Pricing Calculations

```typescript
async function calculatePriceWithTracking(product: Product, promotions: Promotion[]) {
  return Sentry.startSpan(
    {
      op: "pricing.calculate",
      name: "Calculate Product Price",
    },
    async (span) => {
      span.setAttribute("product_id", product.id);
      span.setAttribute("regular_price", product.regular_price);
      span.setAttribute("promotion_count", promotions.length);

      const result = calculatePrice(product, promotions);

      // Track pricing metrics
      span.setAttribute("final_price", result.finalPrice);
      span.setAttribute("savings", result.savings);
      span.setAttribute("discount_applied", result.savings > 0);

      if (result.appliedPromotion) {
        span.setAttribute("promotion_id", result.appliedPromotion.id);
        span.setAttribute("promotion_type", result.appliedPromotion.promotion_type);
      }

      // Alert on unusual discounts
      if (result.discountPercentage > 50) {
        logger.warn("High discount percentage applied", {
          product_id: product.id,
          regular_price: product.regular_price,
          final_price: result.finalPrice,
          discount_percent: result.discountPercentage,
          promotion_id: result.appliedPromotion?.id,
        });
      }

      return result;
    },
  );
}
```

---

## Best Practices

### 1. Always Add Context to Errors

```typescript
// ❌ BAD: No context
Sentry.captureException(error);

// ✅ GOOD: With context
Sentry.captureException(error, {
  tags: { component: "payment", vendor_id: vendorId },
  contexts: { payment: { amount, method } },
});
```

### 2. Use Meaningful Span Names

```typescript
// ❌ BAD: Generic names
Sentry.startSpan({ op: 'function', name: 'doWork' }, ...);

// ✅ GOOD: Descriptive names
Sentry.startSpan({ op: 'order.fulfill', name: 'Fulfill Order' }, ...);
```

### 3. Don't Log Sensitive Data

```typescript
// ❌ BAD: Logging PII
logger.info("User login", {
  email: user.email, // Don't log real email!
  password: password, // NEVER log passwords!
});

// ✅ GOOD: Hash or omit PII
logger.info("User login", {
  user_id: user.id,
  email_hash: hashEmail(user.email), // Hash email
  role: user.role,
});
```

### 4. Set Appropriate Log Levels

```typescript
// ❌ BAD: Everything is "error"
logger.error("User clicked button"); // Not an error!

// ✅ GOOD: Use correct levels
logger.info("User clicked button"); // Normal event
logger.warn("Rate limit at 90%"); // Potential issue
logger.error("Payment failed"); // Actual error
```

### 5. Add Breadcrumbs for Context

```typescript
Sentry.addBreadcrumb({
  category: "cart",
  message: "Item added to cart",
  level: "info",
  data: {
    product_id: productId,
    quantity: 1,
    price: price,
  },
});

// Later, if an error occurs, Sentry will show this breadcrumb
// in the error context, helping you understand what led to the error
```

### 6. Use Fingerprinting for Grouping

```typescript
Sentry.captureException(error, {
  // Custom fingerprinting to group related errors
  fingerprint: ["payment-processor-timeout", vendorId],
});

// Without this, each timeout might create a separate issue
// With fingerprinting, they're grouped together
```

---

## Troubleshooting

### Events Not Appearing in Sentry

1. **Check DSN is set:**

   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Verify initialization:**
   - Check `sentry.server.config.ts` exists
   - Check `instrumentation-client.ts` exists
   - Ensure `Sentry.init()` is called

3. **Check sample rate:**

   ```typescript
   // If tracesSampleRate is too low, you might not see events
   tracesSampleRate: 1.0, // 100% for testing
   ```

4. **Look for console errors:**
   ```
   [Sentry] Error: Invalid DSN
   [Sentry] Event dropped due to beforeSend callback
   ```

### Source Maps Not Working

1. **Verify auth token:**

   ```bash
   echo $SENTRY_AUTH_TOKEN
   ```

2. **Check build output:**

   ```bash
   npm run build
   # Should see: "Uploading source maps to Sentry"
   ```

3. **Verify sentry.properties exists:**
   ```
   defaults.url=https://sentry.io/
   defaults.org=whaletools
   defaults.project=pos
   ```

### Performance Overhead

If Sentry is causing performance issues:

1. **Lower sample rate:**

   ```typescript
   tracesSampleRate: 0.1, // Only sample 10% of transactions
   ```

2. **Reduce breadcrumb size:**

   ```typescript
   maxBreadcrumbs: 50, // Default is 100
   ```

3. **Filter out noisy events:**
   ```typescript
   ignoreErrors: [
     'ResizeObserver loop limit exceeded',
     /Non-Error promise rejection/,
   ],
   ```

---

## Quick Reference

### Common Operations

```typescript
import * as Sentry from "@sentry/nextjs";
const { logger } = Sentry;

// Capture exception
Sentry.captureException(error, { tags: { component: 'payment' } });

// Capture message
Sentry.captureMessage('User hit rate limit', { level: 'warning' });

// Track performance
Sentry.startSpan({ op: 'task', name: 'My Task' }, () => doWork());

// Structured logging
logger.info("Event happened", { key: "value" });

// Add breadcrumb
Sentry.addBreadcrumb({ message: 'User action', data: { ... } });

// Set user context
Sentry.setUser({ id: userId, vendor_id: vendorId });

// Set tag
Sentry.setTag('vendor_id', vendorId);

// Set context
Sentry.setContext('cart', { items: 5, total: 99.99 });
```

### Useful Sentry Queries

**In Sentry dashboard:**

```
# All payment errors for a vendor
tags.vendor_id:cd2e1122-d511-4edb-be5d-98ef274b4baf AND tags.component:payment

# Errors in production only
environment:production level:error

# Slow API calls (>1 second)
transaction.op:http.server transaction.duration:>1000

# Failed authentication attempts
message:"Authentication failed"
```

---

## Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Remediation Plan:** `/APPLE_STORE_REMEDIATION_PLAN.md` (Phase 4: Observability)
- **Cursor Rules:** `/.cursorrules` (Sentry section)
- **Support:** engineering@whaletools.com

---

**Remember:** Good monitoring is the difference between knowing your system is broken and finding out from customers. Track everything that matters, but don't spam yourself with noise.
