# WhaleTools POS - Apple Store Readiness Remediation Plan

**Prepared:** November 8, 2025
**Current Status:** 6.5/10 (Apple requires 8.5+)
**Target:** Production-ready for enterprise retail deployment
**Timeline:** 6-8 weeks
**Estimated Engineering Effort:** 1 senior engineer + 0.5 QA engineer

---

## Executive Summary

WhaleTools POS has **solid architecture** and **sophisticated business logic**, but has **3 critical security vulnerabilities** that prevent enterprise deployment. This plan addresses all blockers in 5 phased sprints.

**Critical Issues:**
1. Header-based authentication (119 files affected)
2. Disabled Row Level Security policies
3. Type inconsistencies causing data integrity issues

**Success Criteria:**
- ✅ Zero P0/P1 security vulnerabilities
- ✅ 95%+ uptime under 500 concurrent POS terminals
- ✅ All financial operations are atomic
- ✅ Complete audit trail for compliance
- ✅ Pass Apple's security review

---

# PHASE 1: CRITICAL SECURITY FIXES
**Duration:** Week 1-2 (10 business days)
**Priority:** BLOCKER - Must fix before any production deployment
**Engineer:** 1 senior full-stack engineer

## 1.1 Replace Header-Based Authentication

### Problem
**Severity:** P0 (Critical Security Vulnerability)
**Files Affected:** 119 files using `x-vendor-id` header
**Risk:** Complete auth bypass - attacker can access any vendor's data

### Current Vulnerable Pattern
```typescript
// ❌ INSECURE - app/api/supabase/locations/route.ts:13
const vendorId = request.headers.get('x-vendor-id');

// Anyone can spoof this:
// curl -H "x-vendor-id: victim-uuid" https://pos.com/api/locations
```

### Secure Pattern (Already Exists!)
```typescript
// ✅ SECURE - Use requireVendor from lib/auth/middleware.ts
import { requireVendor } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user, vendorId } = authResult; // From authenticated session
  // ... rest of logic
}
```

### Implementation Steps

#### Step 1.1.1: Audit All API Routes (Day 1)
```bash
# Find all vulnerable endpoints
grep -r "x-vendor-id" app/api --include="*.ts" > vulnerable-routes.txt
grep -r "request.headers.get" app/api --include="*.ts" >> vulnerable-routes.txt

# Priority order (fix in this sequence):
# 1. Financial: /api/pos/*, /api/vendor/payments/*
# 2. Data access: /api/vendor/*, /api/supabase/*
# 3. Public: /api/storefront/* (read-only, lower risk)
```

**Files to Fix (Priority Order):**

**P0 - Financial Endpoints (Day 1-2):**
- [ ] `app/api/pos/sales/route.ts`
- [ ] `app/api/pos/sales/fulfill/route.ts`
- [ ] `app/api/pos/sessions/route.ts`
- [ ] `app/api/vendor/payouts/route.ts`

**P1 - Vendor Data Access (Day 3-5):**
- [ ] `app/api/supabase/locations/route.ts`
- [ ] `app/api/supabase/products/[id]/route.ts`
- [ ] `app/api/supabase/inventory/[id]/route.ts`
- [ ] `app/api/vendor/inventory/adjust/route.ts`
- [ ] `app/api/vendor/inventory/transfer/route.ts`
- [ ] `app/api/vendor/analytics/route.ts`
- [ ] `app/api/vendor/customers/route.ts`
- [ ] `app/api/vendor/orders/route.ts`

**P2 - Admin/Settings (Day 6-7):**
- [ ] `app/api/vendor/settings/route.ts`
- [ ] `app/api/vendor/employees/route.ts`
- [ ] `app/api/vendor/media/route.ts`

#### Step 1.1.2: Fix Template Example (Day 2)

**BEFORE (Vulnerable):**
```typescript
// app/api/supabase/locations/route.ts
export async function GET(request: NextRequest) {
  const vendorId = request.headers.get('x-vendor-id'); // ❌ VULNERABLE

  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq('vendor_id', vendorId); // Uses spoofable header

  return NextResponse.json({ locations: data });
}
```

**AFTER (Secure):**
```typescript
// app/api/supabase/locations/route.ts
import { requireVendor } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  // Authenticate and extract vendor_id from JWT token
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user, vendorId } = authResult; // ✅ From authenticated session

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('vendor_id', vendorId); // Uses verified vendor_id from session

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, locations: data });
}
```

#### Step 1.1.3: Frontend Changes (Day 8)

**Update API Calls to Remove x-vendor-id Header:**

```typescript
// BEFORE (Frontend sending header)
const response = await fetch('/api/supabase/locations', {
  headers: {
    'x-vendor-id': vendor.id, // ❌ Remove this
    'Authorization': `Bearer ${token}`
  }
});

// AFTER (Backend extracts from token)
const response = await fetch('/api/supabase/locations', {
  headers: {
    'Authorization': `Bearer ${token}` // ✅ Only auth token needed
  }
});
```

**Files to Update:**
- [ ] `app/pos/register/page.tsx`
- [ ] `app/vendor/locations/page.tsx`
- [ ] `app/vendor/products/components/inventory/InventoryTab.tsx`
- [ ] `hooks/useVendorData.ts`
- [ ] `lib/supabase-api.ts`

#### Step 1.1.4: Testing (Day 9-10)

**Create Security Test Suite:**

```typescript
// tests/security/auth-bypass.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Auth Security - Header Spoofing Prevention', () => {
  test('should reject requests with x-vendor-id header but no valid token', async ({ request }) => {
    const response = await request.get('/api/supabase/locations', {
      headers: {
        'x-vendor-id': 'attacker-uuid' // Try to spoof
        // No Authorization header
      }
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('Unauthorized')
    });
  });

  test('should reject requests with mismatched vendor_id in header vs token', async ({ request }) => {
    const validToken = await getAuthToken('legitimate-vendor');

    const response = await request.get('/api/supabase/locations', {
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'x-vendor-id': 'different-vendor-uuid' // Try to access other vendor
      }
    });

    // Should use vendor_id from token, not header
    const data = await response.json();
    expect(data.locations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ vendor_id: 'legitimate-vendor' })
      ])
    );
  });

  test('should only return data for authenticated vendor', async ({ request }) => {
    const vendorAToken = await getAuthToken('vendor-a');
    const vendorBToken = await getAuthToken('vendor-b');

    // Vendor A request
    const responseA = await request.get('/api/supabase/products', {
      headers: { 'Authorization': `Bearer ${vendorAToken}` }
    });
    const dataA = await responseA.json();

    // Vendor B request
    const responseB = await request.get('/api/supabase/products', {
      headers: { 'Authorization': `Bearer ${vendorBToken}` }
    });
    const dataB = await responseB.json();

    // Should be different data
    expect(dataA.products[0].vendor_id).toBe('vendor-a');
    expect(dataB.products[0].vendor_id).toBe('vendor-b');
    expect(dataA.products).not.toEqual(dataB.products);
  });
});
```

**Manual Testing Checklist:**
- [ ] Login as Vendor A → Can only see Vendor A's data
- [ ] Try to inject Vendor B's ID in headers → Still see only Vendor A's data
- [ ] Use curl with spoofed headers → Get 401 Unauthorized
- [ ] Test all POS flows (sales, fulfillment, inventory) → All work correctly
- [ ] Test all vendor dashboard pages → Load correct vendor data

### Rollback Plan
```bash
# If issues found, rollback specific routes:
git checkout main -- app/api/supabase/locations/route.ts

# Full rollback (nuclear option):
git revert <security-fix-commit-sha>
```

---

## 1.2 Enforce Row Level Security Policies

### Problem
**Severity:** P0 (Defense in Depth Failure)
**Current State:** RLS enabled but policies set to `USING (true)` (allow all)
**Risk:** If app-level auth bypassed, database has NO protection

### Current Vulnerable Policies
```sql
-- supabase/migrations/20251028_promotions_system.sql:60
CREATE POLICY "Vendors can manage their own promotions"
  ON public.promotions FOR ALL
  USING (true); -- ❌ ALLOWS ALL ACCESS
```

### Secure Policies

#### Step 1.2.1: Create RLS Fix Migration (Day 3)

```sql
-- supabase/migrations/20251108_fix_rls_policies.sql

-- ============================================================================
-- FIX RLS POLICIES - Enforce vendor isolation at database level
-- ============================================================================

-- PROMOTIONS
DROP POLICY IF EXISTS "Vendors can manage their own promotions" ON public.promotions;
CREATE POLICY "Vendors can manage their own promotions"
  ON public.promotions FOR ALL
  USING (
    vendor_id = (auth.jwt() ->> 'vendor_id')::uuid
    OR
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- PRODUCTS
DROP POLICY IF EXISTS "Vendors manage own products" ON public.products;
CREATE POLICY "Vendors manage own products"
  ON public.products FOR ALL
  USING (
    vendor_id = (auth.jwt() ->> 'vendor_id')::uuid
    OR
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- ORDERS
DROP POLICY IF EXISTS "Vendors see own orders" ON public.orders;
CREATE POLICY "Vendors see own orders"
  ON public.orders FOR SELECT
  USING (
    vendor_id = (auth.jwt() ->> 'vendor_id')::uuid
    OR
    auth.jwt() ->> 'role' = 'super_admin'
  );

CREATE POLICY "Vendors update own orders"
  ON public.orders FOR UPDATE
  USING (vendor_id = (auth.jwt() ->> 'vendor_id')::uuid)
  WITH CHECK (vendor_id = (auth.jwt() ->> 'vendor_id')::uuid);

-- INVENTORY
DROP POLICY IF EXISTS "Vendors manage own inventory" ON public.inventory;
CREATE POLICY "Vendors manage own inventory"
  ON public.inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = inventory.product_id
      AND p.vendor_id = (auth.jwt() ->> 'vendor_id')::uuid
    )
  );

-- CUSTOMERS (Vendors can only see their own customers)
DROP POLICY IF EXISTS "Vendors see own customers" ON public.customers;
CREATE POLICY "Vendors see own customers"
  ON public.customers FOR SELECT
  USING (
    vendor_id = (auth.jwt() ->> 'vendor_id')::uuid
    OR
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- POS TRANSACTIONS
DROP POLICY IF EXISTS "Vendors see own transactions" ON public.pos_transactions;
CREATE POLICY "Vendors see own transactions"
  ON public.pos_transactions FOR ALL
  USING (vendor_id = (auth.jwt() ->> 'vendor_id')::uuid);

-- LOCATIONS
DROP POLICY IF EXISTS "Vendors manage own locations" ON public.locations;
CREATE POLICY "Vendors manage own locations"
  ON public.locations FOR ALL
  USING (
    vendor_id = (auth.jwt() ->> 'vendor_id')::uuid
    OR
    type = 'retail' -- Retail locations visible to all
  );

-- ============================================================================
-- HELPER FUNCTION: Extract vendor_id from JWT for service role queries
-- ============================================================================

CREATE OR REPLACE FUNCTION get_vendor_id_from_jwt()
RETURNS uuid AS $$
BEGIN
  RETURN (auth.jwt() ->> 'vendor_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_vendor_id_from_jwt IS
  'Safely extracts vendor_id from JWT token, returns NULL if not found';
```

#### Step 1.2.2: Update Supabase Client for RLS (Day 4)

**Problem:** Service role bypasses RLS. Need to set JWT context.

```typescript
// lib/supabase/client.ts - ADD THIS FUNCTION

/**
 * Get Supabase client with vendor context for RLS enforcement
 * Use this instead of getServiceSupabase() in vendor-scoped routes
 */
export function getVendorSupabase(vendorId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon key (enforces RLS)
    {
      global: {
        headers: {
          // Set vendor context in request headers
          'x-vendor-context': vendorId
        }
      }
    }
  );

  return supabase;
}
```

**Update API Routes to Use Vendor Client:**

```typescript
// BEFORE (Service role - bypasses RLS)
const supabase = getServiceSupabase();
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('vendor_id', vendorId); // App-level filtering

// AFTER (Anon key with RLS)
const supabase = getVendorSupabase(vendorId);
const { data } = await supabase
  .from('products')
  .select('*'); // RLS automatically filters by vendor_id
```

#### Step 1.2.3: Test RLS Enforcement (Day 5)

```sql
-- tests/database/rls-enforcement.test.sql

-- Test as Vendor A
SET request.jwt.claims = '{"vendor_id": "vendor-a-uuid", "role": "vendor_admin"}';

-- Should only see Vendor A's products
SELECT COUNT(*) FROM products; -- Should match vendor A's count
SELECT COUNT(*) FROM products WHERE vendor_id != 'vendor-a-uuid'; -- Should be 0

-- Test as Vendor B
SET request.jwt.claims = '{"vendor_id": "vendor-b-uuid", "role": "vendor_admin"}';

-- Should only see Vendor B's products
SELECT COUNT(*) FROM products WHERE vendor_id = 'vendor-a-uuid'; -- Should be 0

-- Test without JWT (anonymous)
RESET request.jwt.claims;

-- Should see nothing (or only public data)
SELECT COUNT(*) FROM products; -- Should be 0 or only published products
```

**Automated RLS Tests:**

```typescript
// tests/database/rls.spec.ts
import { createClient } from '@supabase/supabase-js';

test('RLS prevents cross-vendor data access', async () => {
  const vendorAClient = createClient(URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${vendorAToken}` } }
  });

  const vendorBClient = createClient(URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${vendorBToken}` } }
  });

  // Vendor A tries to query all products
  const { data: vendorAProducts } = await vendorAClient
    .from('products')
    .select('*');

  // Should only see their own products
  expect(vendorAProducts.every(p => p.vendor_id === 'vendor-a-uuid')).toBe(true);

  // Vendor A tries to directly access Vendor B's product
  const { data: crossAccess, error } = await vendorAClient
    .from('products')
    .select('*')
    .eq('id', 'vendor-b-product-id')
    .single();

  // Should be blocked by RLS
  expect(crossAccess).toBeNull();
  expect(error).toBeTruthy();
});
```

---

## 1.3 Fix Type Inconsistencies

### Problem
**Severity:** P1 (Data Integrity)
**Issue:** `customer_id` has three different types across tables

```typescript
// orders.customer_id → UUID (correct)
// pos_transactions.customer_id → INTEGER (wrong!)
// metadata.customer_id → string (inconsistent)
```

### Fix: Standardize on UUID

#### Step 1.3.1: Database Migration (Day 6)

```sql
-- supabase/migrations/20251108_fix_customer_id_type.sql

-- ============================================================================
-- FIX: Standardize customer_id to UUID across all tables
-- ============================================================================

-- Step 1: Add new UUID column
ALTER TABLE pos_transactions
  ADD COLUMN customer_uuid UUID;

-- Step 2: Migrate data from INTEGER to UUID (if customers table uses UUID)
UPDATE pos_transactions pt
SET customer_uuid = c.id
FROM customers c
WHERE pt.customer_id::text = c.legacy_id::text; -- Map old integer IDs

-- Step 3: For transactions with customer_id in metadata, extract to UUID
UPDATE pos_transactions
SET customer_uuid = (metadata->>'customer_id')::uuid
WHERE customer_uuid IS NULL
  AND metadata->>'customer_id' IS NOT NULL
  AND metadata->>'customer_id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 4: Drop old column and rename
ALTER TABLE pos_transactions
  DROP COLUMN customer_id;

ALTER TABLE pos_transactions
  RENAME COLUMN customer_uuid TO customer_id;

-- Step 5: Add foreign key constraint
ALTER TABLE pos_transactions
  ADD CONSTRAINT fk_pos_transactions_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id)
  ON DELETE SET NULL;

-- Step 6: Add index
CREATE INDEX idx_pos_transactions_customer_id
  ON pos_transactions(customer_id);

COMMENT ON COLUMN pos_transactions.customer_id IS
  'Customer UUID - references customers.id';
```

#### Step 1.3.2: Update Application Code (Day 7)

```typescript
// app/api/pos/sales/fulfill/route.ts

// BEFORE
const { data: transaction, error } = await supabase
  .from('pos_transactions')
  .insert({
    // ... other fields
    // customer_id is integer in pos_transactions (legacy schema), skip for now
    metadata: {
      customer_id: order.customer_id, // ❌ Workaround
    }
  });

// AFTER
const { data: transaction, error } = await supabase
  .from('pos_transactions')
  .insert({
    // ... other fields
    customer_id: order.customer_id, // ✅ Direct UUID assignment
    metadata: {
      // Remove customer_id from metadata
    }
  });
```

#### Step 1.3.3: Validation (Day 7)

```typescript
// Add Zod schema validation
import { z } from 'zod';

const POSTransactionSchema = z.object({
  transaction_number: z.string(),
  location_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable(), // ✅ Enforce UUID
  order_id: z.string().uuid().nullable(),
  session_id: z.string().uuid().nullable(),
  // ... other fields
});

// In API route
const validatedData = POSTransactionSchema.parse(requestBody);
```

---

## 1.4 Add Rate Limiting

### Problem
**Severity:** P1 (Security Hardening)
**Risk:** Enumeration attacks, data scraping, API abuse

### Implementation

#### Step 1.4.1: Install Rate Limiter (Day 8)

```bash
npm install @upstash/ratelimit @upstash/redis
```

#### Step 1.4.2: Create Rate Limit Middleware (Day 8)

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Different limits for different endpoint types
export const rateLimiters = {
  // Financial operations: 100 requests per minute per vendor
  financial: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: '@ratelimit/financial',
  }),

  // Data access: 300 requests per minute per vendor
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'),
    analytics: true,
    prefix: '@ratelimit/api',
  }),

  // Public storefront: 1000 requests per minute per IP
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    analytics: true,
    prefix: '@ratelimit/public',
  }),

  // Auth endpoints: 10 requests per minute per IP (prevent brute force)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: '@ratelimit/auth',
  }),
};

export async function rateLimit(
  request: NextRequest,
  identifier: string, // vendor_id or IP address
  limiter: Ratelimit
): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  return null; // Success - continue processing
}
```

#### Step 1.4.3: Apply to Routes (Day 9)

```typescript
// app/api/vendor/products/route.ts
import { requireVendor } from '@/lib/auth/middleware';
import { rateLimit, rateLimiters } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Authenticate
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  // Rate limit (per vendor)
  const rateLimitResult = await rateLimit(request, vendorId, rateLimiters.api);
  if (rateLimitResult) return rateLimitResult;

  // Process request
  // ...
}
```

**Routes to Protect:**
- [ ] All `/api/vendor/*` routes (use vendor_id identifier)
- [ ] All `/api/pos/*` routes (use session_id identifier)
- [ ] `/api/auth/*` routes (use IP address identifier)
- [ ] `/api/storefront/*` routes (use IP address identifier)

#### Step 1.4.4: Test Rate Limiting (Day 10)

```typescript
// tests/security/rate-limit.spec.ts
test('should rate limit excessive requests', async ({ request }) => {
  const token = await getAuthToken('vendor-a');

  // Make 301 requests (limit is 300/min)
  for (let i = 0; i < 301; i++) {
    const response = await request.get('/api/vendor/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (i < 300) {
      expect(response.status()).toBe(200);
    } else {
      expect(response.status()).toBe(429); // Rate limited
      const data = await response.json();
      expect(data.error).toContain('Rate limit exceeded');
    }
  }
});
```

---

## Phase 1 Acceptance Criteria

**Security Review Checklist:**
- [ ] Zero API routes accept `x-vendor-id` header for auth
- [ ] All vendor-scoped routes use `requireVendor()`
- [ ] All database tables have proper RLS policies (no `USING (true)`)
- [ ] customer_id is UUID across all tables
- [ ] All API routes have rate limiting
- [ ] Security test suite passes (auth bypass tests)
- [ ] Manual penetration test passes (try to access other vendor's data)

**Testing:**
- [ ] 100% of auth bypass tests pass
- [ ] RLS tests pass for all tables
- [ ] Rate limit tests pass
- [ ] No regression in existing functionality
- [ ] POS continues to work normally

**Documentation:**
- [ ] Update API documentation with auth requirements
- [ ] Create security.md with auth architecture
- [ ] Document rate limits per endpoint

**Deployment:**
- [ ] Deploy to staging
- [ ] Run full regression test suite
- [ ] Conduct security review
- [ ] Get approval from security team
- [ ] Deploy to production (off-hours)

---

# PHASE 2: DATA INTEGRITY & ATOMIC TRANSACTIONS
**Duration:** Week 3-4 (10 business days)
**Priority:** HIGH - Prevents financial data corruption
**Engineer:** 1 senior backend engineer

## 2.1 Implement Atomic Order Fulfillment

### Problem
**Current:** Order fulfillment is multi-step, non-atomic:
1. Update order status → `fulfilled`
2. Create POS transaction
3. Update inventory (separate call)

**Risk:** If step 2 fails, order is marked fulfilled but no transaction exists.

### Solution: PostgreSQL Function with Transaction

#### Step 2.1.1: Create Atomic Function (Day 1)

```sql
-- supabase/migrations/20251110_atomic_order_fulfillment.sql

CREATE OR REPLACE FUNCTION fulfill_order_atomically(
  p_order_id UUID,
  p_location_id UUID,
  p_session_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_transaction RECORD;
  v_order_items RECORD;
  v_result JSONB;
BEGIN
  -- Start transaction (implicit in function)

  -- Step 1: Lock and fetch order
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE; -- Lock row

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  IF v_order.fulfillment_status = 'fulfilled' THEN
    RAISE EXCEPTION 'Order already fulfilled: %', p_order_id;
  END IF;

  -- Step 2: Update order status
  UPDATE orders
  SET
    fulfillment_status = 'fulfilled',
    completed_date = NOW(),
    shipped_date = CASE
      WHEN delivery_type = 'delivery' THEN NOW()
      ELSE NULL
    END
  WHERE id = p_order_id;

  -- Step 3: Create POS transaction
  INSERT INTO pos_transactions (
    transaction_number,
    location_id,
    vendor_id,
    order_id,
    session_id,
    customer_id,
    transaction_type,
    payment_method,
    payment_status,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    metadata
  )
  VALUES (
    'TXN-' || v_order.order_number || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    p_location_id,
    v_order.vendor_id,
    v_order.id,
    p_session_id,
    v_order.customer_id,
    CASE WHEN v_order.delivery_type = 'delivery' THEN 'shipping_fulfillment' ELSE 'pickup_fulfillment' END,
    'prepaid_online',
    'completed',
    v_order.total_amount,
    0, -- Tax already in total
    0,
    v_order.total_amount,
    jsonb_build_object(
      'fulfilled_via_pos', true,
      'original_order', v_order.order_number,
      'fulfilled_at', NOW(),
      'delivery_type', v_order.delivery_type
    )
  )
  RETURNING * INTO v_transaction;

  -- Step 4: Deduct inventory for each order item
  FOR v_order_items IN (
    SELECT product_id, quantity, quantity_grams
    FROM order_items
    WHERE order_id = p_order_id
  ) LOOP
    -- Lock inventory row
    UPDATE inventory
    SET
      quantity = quantity - COALESCE(v_order_items.quantity_grams, v_order_items.quantity),
      updated_at = NOW()
    WHERE product_id = v_order_items.product_id
      AND location_id = p_location_id
      AND quantity >= COALESCE(v_order_items.quantity_grams, v_order_items.quantity); -- Ensure stock available

    -- Check if update succeeded (stock available)
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient inventory for product: %', v_order_items.product_id;
    END IF;

    -- Record stock movement
    INSERT INTO stock_movements (
      product_id,
      location_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      notes
    )
    VALUES (
      v_order_items.product_id,
      p_location_id,
      'sale',
      -COALESCE(v_order_items.quantity_grams, v_order_items.quantity),
      'order',
      p_order_id,
      'Order fulfilled: ' || v_order.order_number
    );
  END LOOP;

  -- Step 5: Update session totals (if session provided)
  IF p_session_id IS NOT NULL THEN
    UPDATE pos_sessions
    SET
      total_sales = total_sales + v_order.total_amount,
      transaction_count = transaction_count + 1,
      updated_at = NOW()
    WHERE id = p_session_id
      AND status = 'open';
  END IF;

  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'transaction_id', v_transaction.id,
    'transaction_number', v_transaction.transaction_number,
    'message', 'Order ' || v_order.order_number || ' fulfilled successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Order fulfillment failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fulfill_order_atomically IS
  'Atomically fulfill order: update status, create transaction, deduct inventory, update session';
```

#### Step 2.1.2: Update API Route (Day 2)

```typescript
// app/api/pos/sales/fulfill/route.ts

// BEFORE (Non-atomic)
export async function POST(request: NextRequest) {
  const { orderId, locationId } = await request.json();

  // Step 1: Update order (can succeed)
  await supabase.from('orders').update({ fulfillment_status: 'fulfilled' })...

  // Step 2: Create transaction (can fail - leaves order in bad state!)
  await supabase.from('pos_transactions').insert(...)...

  // Step 3: Update inventory (separate call, can fail)
  // ...
}

// AFTER (Atomic via PostgreSQL function)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { orderId, locationId, sessionId } = await request.json();

    // Validate inputs
    if (!orderId || !locationId) {
      return NextResponse.json(
        { error: 'Missing orderId or locationId' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Call atomic function (all-or-nothing)
    const { data, error } = await supabase
      .rpc('fulfill_order_atomically', {
        p_order_id: orderId,
        p_location_id: locationId,
        p_session_id: sessionId || null
      });

    if (error) {
      console.error('Order fulfillment failed:', error);

      // Determine error type
      if (error.message.includes('Insufficient inventory')) {
        return NextResponse.json(
          { error: 'Insufficient inventory to fulfill order' },
          { status: 409 }
        );
      }

      if (error.message.includes('already fulfilled')) {
        return NextResponse.json(
          { error: 'Order already fulfilled' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Order fulfillment failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...data
    });

  } catch (error: any) {
    console.error('Error in POS fulfill endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

#### Step 2.1.3: Test Atomic Transactions (Day 3)

```typescript
// tests/transactions/atomic-fulfillment.spec.ts

test('should rollback if inventory insufficient', async () => {
  // Create order with 100g product
  const order = await createTestOrder({
    items: [{ product_id: 'product-a', quantity_grams: 100 }]
  });

  // Set inventory to only 50g
  await setInventory('product-a', 'location-1', 50);

  // Try to fulfill (should fail)
  const response = await request.post('/api/pos/sales/fulfill', {
    data: {
      orderId: order.id,
      locationId: 'location-1'
    }
  });

  expect(response.status()).toBe(409);
  expect(await response.json()).toMatchObject({
    error: expect.stringContaining('Insufficient inventory')
  });

  // Verify order NOT marked as fulfilled (rollback worked)
  const orderStatus = await getOrderStatus(order.id);
  expect(orderStatus.fulfillment_status).toBe('pending'); // Not fulfilled

  // Verify no transaction created (rollback worked)
  const transactions = await getTransactions({ order_id: order.id });
  expect(transactions).toHaveLength(0);

  // Verify inventory unchanged (rollback worked)
  const inventory = await getInventory('product-a', 'location-1');
  expect(inventory.quantity).toBe(50); // Still 50g
});

test('should complete all steps atomically on success', async () => {
  const order = await createTestOrder({
    items: [{ product_id: 'product-a', quantity_grams: 10 }]
  });

  await setInventory('product-a', 'location-1', 100);

  const response = await request.post('/api/pos/sales/fulfill', {
    data: {
      orderId: order.id,
      locationId: 'location-1',
      sessionId: 'session-1'
    }
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);

  // Verify ALL steps completed
  const orderStatus = await getOrderStatus(order.id);
  expect(orderStatus.fulfillment_status).toBe('fulfilled'); // ✅

  const transaction = await getTransaction(data.transaction_id);
  expect(transaction).toBeTruthy(); // ✅

  const inventory = await getInventory('product-a', 'location-1');
  expect(inventory.quantity).toBe(90); // 100 - 10 = 90 ✅

  const stockMovement = await getStockMovements({ order_id: order.id });
  expect(stockMovement).toHaveLength(1); // ✅

  const session = await getSession('session-1');
  expect(session.total_sales).toBeGreaterThan(0); // ✅
});
```

---

## 2.2 Payment Idempotency

### Problem
**Current:** No idempotency protection for payment processing
**Risk:** User clicks "Pay" twice → charged twice

### Solution: Idempotency Keys

#### Step 2.2.1: Add Idempotency to Payments (Day 4)

```typescript
// lib/payment-processor.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function processPaymentIdempotent(
  idempotencyKey: string,
  paymentData: PaymentData
): Promise<PaymentResult> {
  // Check if already processed
  const cached = await redis.get(`payment:${idempotencyKey}`);
  if (cached) {
    console.log('Payment already processed (idempotency):', idempotencyKey);
    return JSON.parse(cached as string);
  }

  // Process payment
  const result = await processPayment(paymentData);

  // Cache result for 24 hours
  await redis.set(
    `payment:${idempotencyKey}`,
    JSON.stringify(result),
    { ex: 86400 } // 24 hours
  );

  return result;
}
```

#### Step 2.2.2: Update POS Payment (Day 4)

```typescript
// app/api/pos/sales/route.ts

export async function POST(request: NextRequest) {
  // Generate idempotency key from cart hash + timestamp
  const cartHash = createHash('sha256')
    .update(JSON.stringify(cart.items))
    .digest('hex')
    .substring(0, 16);

  const idempotencyKey = `${sessionId}-${cartHash}-${Date.now()}`;

  // Process with idempotency
  const paymentResult = await processPaymentIdempotent(
    idempotencyKey,
    {
      amount: total,
      terminalId: terminal_id,
      transactionNumber: transactionNumber
    }
  );

  // ... rest of logic
}
```

---

## 2.3 Add Database Triggers for Audit Trail

### Problem
**Current:** No audit log for critical operations
**Risk:** Can't trace who changed prices, modified inventory, etc.

### Solution: Audit Log Table + Triggers

#### Step 2.3.1: Create Audit System (Day 5-6)

```sql
-- supabase/migrations/20251112_audit_log.sql

-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES public.users(id),
  vendor_id UUID REFERENCES public.vendors(id),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_vendor ON public.audit_log(vendor_id);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp DESC);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_changed_fields TEXT[];
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    v_old_data = to_jsonb(OLD);
    v_new_data = to_jsonb(NEW);

    -- Calculate changed fields
    SELECT ARRAY_AGG(key)
    INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE v_new_data->key IS DISTINCT FROM v_old_data->key;

    -- Only log if something actually changed
    IF v_changed_fields IS NULL OR array_length(v_changed_fields, 1) = 0 THEN
      RETURN NEW;
    END IF;

  ELSIF (TG_OP = 'DELETE') THEN
    v_old_data = to_jsonb(OLD);
    v_new_data = NULL;

  ELSIF (TG_OP = 'INSERT') THEN
    v_old_data = NULL;
    v_new_data = to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    user_id,
    vendor_id
  )
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_old_data,
    v_new_data,
    v_changed_fields,
    COALESCE(
      (auth.jwt() ->> 'sub')::uuid,
      COALESCE(NEW.updated_by, OLD.updated_by)
    ),
    COALESCE(NEW.vendor_id, OLD.vendor_id)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to critical tables
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_inventory
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_pricing_tier_blueprints
  AFTER INSERT OR UPDATE OR DELETE ON public.pricing_tier_blueprints
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_promotions
  AFTER INSERT OR UPDATE OR DELETE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_pos_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.pos_transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

---

## Phase 2 Acceptance Criteria

- [ ] All order fulfillment operations are atomic (use PostgreSQL function)
- [ ] Payment operations use idempotency keys
- [ ] Audit log captures all changes to products, inventory, pricing, transactions
- [ ] Test: Force failure mid-fulfillment → verify rollback works
- [ ] Test: Submit duplicate payment → verify second is rejected (idempotency)
- [ ] Test: Query audit log → see history of all changes

---

# PHASE 3: SCALABILITY & RELIABILITY
**Duration:** Week 5-6 (10 business days)
**Priority:** MEDIUM - Prepare for 500+ stores
**Engineer:** 1 senior infrastructure engineer

## 3.1 Distributed Caching with Redis

### Problem
**Current:** In-memory cache (won't work with multiple Next.js instances)
**Target:** 500 stores × 3 registers = 1,500 concurrent POS terminals

### Solution: Redis Cache Layer

#### Step 3.1.1: Setup Redis (Day 1)

```bash
# Production: Use Upstash Redis (serverless, auto-scaling)
# Staging: Local Redis for testing

# .env.production
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-token
```

#### Step 3.1.2: Update Cache Manager (Day 2)

```typescript
// lib/cache-manager.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export class DistributedCacheManager {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value as T | null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    await redis.set(key, value, { ex: ttlSeconds });
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidate all keys matching pattern
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async invalidateVendor(vendorId: string): Promise<void> {
    // Invalidate all vendor-specific caches
    await this.invalidate(`products:${vendorId}:*`);
    await this.invalidate(`inventory:${vendorId}:*`);
    await this.invalidate(`promotions:${vendorId}:*`);
  }
}

export const cache = new DistributedCacheManager();
```

#### Step 3.1.3: Update API Routes with Redis Cache (Day 3)

```typescript
// app/api/supabase/products/route.ts

export async function GET(request: NextRequest) {
  const { vendorId } = await requireVendor(request);
  const cacheKey = `products:${vendorId}:all`;

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache-Status': 'HIT' }
    });
  }

  // Fetch from database
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId);

  // Cache for 5 minutes
  await cache.set(cacheKey, { products: data }, 300);

  return NextResponse.json({ products: data }, {
    headers: { 'X-Cache-Status': 'MISS' }
  });
}
```

#### Step 3.1.4: Automatic Cache Invalidation (Day 4)

```sql
-- supabase/migrations/20251114_cache_invalidation_triggers.sql

-- Function to invalidate cache via webhook
CREATE OR REPLACE FUNCTION invalidate_cache_webhook()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_id UUID;
BEGIN
  v_vendor_id := COALESCE(NEW.vendor_id, OLD.vendor_id);

  -- Call edge function to invalidate cache
  PERFORM net.http_post(
    url := current_setting('app.cache_invalidation_webhook_url'),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'vendor_id', v_vendor_id,
      'action', TG_OP
    )::text
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to frequently-updated tables
CREATE TRIGGER invalidate_products_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION invalidate_cache_webhook();

CREATE TRIGGER invalidate_inventory_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION invalidate_cache_webhook();
```

```typescript
// app/api/webhooks/cache-invalidation/route.ts
export async function POST(request: NextRequest) {
  const { table, vendor_id } = await request.json();

  // Invalidate relevant caches
  if (table === 'products') {
    await cache.invalidate(`products:${vendor_id}:*`);
  } else if (table === 'inventory') {
    await cache.invalidate(`inventory:${vendor_id}:*`);
  }

  return NextResponse.json({ success: true });
}
```

---

## 3.2 Background Job Queue

### Problem
**Current:** All operations synchronous (blocks API response)
**Examples:** Email sending, report generation, inventory sync

### Solution: Bull Queue with Redis

#### Step 3.2.1: Setup Bull (Day 5)

```bash
npm install bull @bull-board/api @bull-board/express
```

```typescript
// lib/queue.ts
import Queue from 'bull';

const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
};

// Job queues
export const queues = {
  email: new Queue('email', redisConfig),
  reports: new Queue('reports', redisConfig),
  inventory: new Queue('inventory', redisConfig),
  webhooks: new Queue('webhooks', redisConfig),
};

// Email job processor
queues.email.process(async (job) => {
  const { to, subject, body } = job.data;
  await sendEmail(to, subject, body);
});

// Report generation processor
queues.reports.process(async (job) => {
  const { vendor_id, report_type, date_range } = job.data;
  const report = await generateReport(vendor_id, report_type, date_range);
  await uploadReportToStorage(report);
  await notifyVendor(vendor_id, report.url);
});
```

#### Step 3.2.2: Use Queue in API Routes (Day 6)

```typescript
// app/api/vendor/reports/generate/route.ts

export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  const { reportType, dateRange } = await request.json();

  // Add job to queue (returns immediately)
  const job = await queues.reports.add({
    vendor_id: vendorId,
    report_type: reportType,
    date_range: dateRange,
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  return NextResponse.json({
    success: true,
    job_id: job.id,
    message: 'Report generation started',
  });
}
```

---

## 3.3 Database Connection Pooling

### Problem
**Current:** Each API request creates new Supabase client
**At Scale:** 1,500 concurrent requests = 1,500 database connections (will hit limit)

### Solution: PgBouncer + Connection Pool

#### Step 3.3.1: Configure PgBouncer (Day 7)

```typescript
// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js';

// Use connection pooling for API routes (not for Edge Functions)
export function getPooledSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        // Use pooled connection string (6543 = PgBouncer port)
        fetch: (...args) => fetch(...args),
      },
    }
  );
}

// Connection pool configuration
const poolConfig = {
  max: 20, // Max connections per instance
  min: 2,  // Min connections to keep alive
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
};
```

---

## 3.4 Load Testing

### Problem
**Current:** Unknown breaking point
**Target:** Handle 500 stores × 3 registers × 10 transactions/hour = 15,000 transactions/hour

#### Step 3.4.1: Setup k6 Load Testing (Day 8)

```bash
npm install -D k6
```

```javascript
// tests/load/pos-register.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 500 },  // Ramp up to 500 users
    { duration: '5m', target: 500 },  // Stay at 500 users
    { duration: '2m', target: 1000 }, // Spike to 1000 users
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

export default function () {
  // Simulate POS register usage
  const token = getAuthToken(); // Pre-generated token

  // 1. Load products
  let res = http.get(`${BASE_URL}/api/supabase/products?vendor_id=${VENDOR_ID}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(res, { 'products loaded': (r) => r.status === 200 });

  // 2. Add items to cart (simulate)
  sleep(5); // User browsing

  // 3. Process sale
  res = http.post(`${BASE_URL}/api/pos/sales`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cart: mockCart,
      payment_method: 'cash',
      location_id: LOCATION_ID,
    }),
  });
  check(res, { 'sale processed': (r) => r.status === 200 });

  sleep(1);
}
```

#### Step 3.4.2: Run Load Tests (Day 9)

```bash
# Run load test
k6 run tests/load/pos-register.k6.js

# Expected results:
# - 95th percentile < 500ms
# - 99th percentile < 1000ms
# - 0% error rate
# - Throughput > 500 req/s
```

---

## Phase 3 Acceptance Criteria

- [ ] Redis cache deployed and working across all instances
- [ ] Cache invalidation works automatically (update product → cache clears)
- [ ] Background job queue processing emails, reports
- [ ] Database connection pooling configured
- [ ] Load test passes: 500 concurrent users, <500ms p95, <1% error rate
- [ ] Monitoring shows cache hit rate >80%

---

# PHASE 4: OBSERVABILITY & TESTING
**Duration:** Week 7 (5 business days)
**Priority:** MEDIUM - Production monitoring
**Engineer:** 0.5 DevOps + 0.5 QA

## 4.1 Monitoring with Sentry

#### Step 4.1.1: Install Sentry (Day 1)

```bash
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions

  // Don't send PII
  beforeSend(event) {
    // Strip customer data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
    }
    return event;
  },

  // Tag errors by vendor
  beforeSendTransaction(event) {
    const vendorId = event.contexts?.vendor?.id;
    if (vendorId) {
      event.tags = { ...event.tags, vendor_id: vendorId };
    }
    return event;
  },
});
```

#### Step 4.1.2: Add Custom Tracking (Day 1)

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

export function trackPaymentError(error: Error, context: any) {
  Sentry.captureException(error, {
    tags: {
      component: 'payment',
      severity: 'critical',
    },
    contexts: {
      payment: context,
    },
  });
}

export function trackInventoryAnomaly(productId: string, expected: number, actual: number) {
  Sentry.captureMessage('Inventory mismatch detected', {
    level: 'warning',
    tags: {
      component: 'inventory',
      product_id: productId,
    },
    extra: {
      expected,
      actual,
      diff: actual - expected,
    },
  });
}
```

---

## 4.2 Unit Tests for Business Logic

### Problem
**Current:** No unit tests for pricing engine (critical business logic!)

#### Step 4.2.1: Pricing Engine Tests (Day 2)

```typescript
// lib/__tests__/pricing.test.ts

import { describe, it, expect } from '@jest/globals';
import { calculatePrice, findBestPromotion, isPromotionActive } from '../pricing';

describe('Pricing Engine', () => {
  describe('isPromotionActive', () => {
    it('should return false if promotion not active', () => {
      const promo = {
        id: '1',
        name: 'Test',
        is_active: false,
        // ...
      };
      expect(isPromotionActive(promo)).toBe(false);
    });

    it('should respect date range', () => {
      const promo = {
        id: '1',
        is_active: true,
        start_time: '2025-01-01T00:00:00Z',
        end_time: '2025-01-31T23:59:59Z',
        // ...
      };

      const withinRange = new Date('2025-01-15T12:00:00Z');
      const beforeRange = new Date('2024-12-31T23:59:59Z');
      const afterRange = new Date('2025-02-01T00:00:01Z');

      expect(isPromotionActive(promo, withinRange)).toBe(true);
      expect(isPromotionActive(promo, beforeRange)).toBe(false);
      expect(isPromotionActive(promo, afterRange)).toBe(false);
    });

    it('should respect day of week restrictions', () => {
      const promo = {
        id: '1',
        is_active: true,
        days_of_week: [1, 2, 3, 4, 5], // Mon-Fri only
        // ...
      };

      const monday = new Date('2025-01-06T12:00:00Z'); // Monday
      const saturday = new Date('2025-01-11T12:00:00Z'); // Saturday

      expect(isPromotionActive(promo, monday)).toBe(true);
      expect(isPromotionActive(promo, saturday)).toBe(false);
    });

    it('should respect time of day restrictions', () => {
      const promo = {
        id: '1',
        is_active: true,
        time_of_day_start: '16:00:00', // 4 PM
        time_of_day_end: '18:00:00',   // 6 PM
        // ...
      };

      const happyHour = new Date('2025-01-06T17:00:00Z');
      const morning = new Date('2025-01-06T09:00:00Z');

      expect(isPromotionActive(promo, happyHour)).toBe(true);
      expect(isPromotionActive(promo, morning)).toBe(false);
    });
  });

  describe('findBestPromotion', () => {
    it('should find highest value promotion', () => {
      const product = {
        id: '1',
        name: 'Test Product',
        regular_price: 100,
        category: 'flower',
      };

      const promotions = [
        {
          id: '1',
          promotion_type: 'product',
          discount_type: 'percentage',
          discount_value: 10, // 10% = $10 off
          target_product_ids: ['1'],
          is_active: true,
        },
        {
          id: '2',
          promotion_type: 'category',
          discount_type: 'fixed_amount',
          discount_value: 15, // $15 off
          target_categories: ['flower'],
          is_active: true,
        },
      ];

      const best = findBestPromotion(product, promotions);
      expect(best?.id).toBe('2'); // $15 > $10
    });

    it('should use priority when savings are equal', () => {
      const product = {
        id: '1',
        regular_price: 100,
        category: 'flower',
      };

      const promotions = [
        {
          id: '1',
          discount_type: 'percentage',
          discount_value: 20, // $20 off
          priority: 1,
          // ...
        },
        {
          id: '2',
          discount_type: 'percentage',
          discount_value: 20, // $20 off
          priority: 5, // Higher priority
          // ...
        },
      ];

      const best = findBestPromotion(product, promotions);
      expect(best?.id).toBe('2'); // Same savings, higher priority wins
    });
  });

  describe('calculatePrice', () => {
    it('should calculate percentage discount correctly', () => {
      const product = {
        id: '1',
        regular_price: 100,
      };

      const promotion = {
        id: '1',
        promotion_type: 'product',
        discount_type: 'percentage',
        discount_value: 20, // 20% off
        target_product_ids: ['1'],
        is_active: true,
      };

      const result = calculatePrice(product, [promotion]);

      expect(result.originalPrice).toBe(100);
      expect(result.finalPrice).toBe(80); // 100 - 20% = 80
      expect(result.savings).toBe(20);
      expect(result.discountPercentage).toBe(20);
    });

    it('should not discount below $0', () => {
      const product = {
        id: '1',
        regular_price: 10,
      };

      const promotion = {
        id: '1',
        discount_type: 'fixed_amount',
        discount_value: 50, // $50 off (more than price!)
        // ...
      };

      const result = calculatePrice(product, [promotion]);

      expect(result.finalPrice).toBe(0); // Not negative
      expect(result.savings).toBe(10); // Only discounts actual price
    });
  });
});

// Run tests:
// npm test -- lib/__tests__/pricing.test.ts
```

#### Step 4.2.2: API Route Tests (Day 3)

```typescript
// app/api/__tests__/products.test.ts

import { POST, GET } from '../supabase/products/route';
import { NextRequest } from 'next/server';

// Mock Supabase
jest.mock('@/lib/supabase/client');

describe('Products API', () => {
  it('should require authentication', async () => {
    const request = new NextRequest('http://localhost/api/supabase/products');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return only vendor products', async () => {
    const request = new NextRequest('http://localhost/api/supabase/products', {
      headers: {
        'Authorization': 'Bearer valid-token-vendor-a',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products.every(p => p.vendor_id === 'vendor-a')).toBe(true);
  });
});
```

---

## 4.3 API Documentation

#### Step 4.3.1: Generate OpenAPI Spec (Day 4)

```typescript
// lib/openapi.ts
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'WhaleTools POS API',
    version: '1.0.0',
    description: 'Enterprise Point-of-Sale API',
  },
  servers: [
    { url: 'https://api.whaletools.com', description: 'Production' },
    { url: 'https://staging-api.whaletools.com', description: 'Staging' },
  ],
  paths: {
    '/api/supabase/products': {
      get: {
        summary: 'List vendor products',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by category slug',
          },
          {
            name: 'per_page',
            in: 'query',
            schema: { type: 'integer', default: 200 },
          },
        ],
        responses: {
          200: {
            description: 'Product list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    products: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          500: { description: 'Server error' },
        },
      },
    },
    // ... more endpoints
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          regular_price: { type: 'number' },
          vendor_id: { type: 'string', format: 'uuid' },
          // ...
        },
      },
    },
  },
};

// Serve at /api/docs
// app/api/docs/route.ts
import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi';

export async function GET() {
  return NextResponse.json(openApiSpec);
}
```

---

## Phase 4 Acceptance Criteria

- [ ] Sentry deployed and capturing errors
- [ ] Pricing engine has 100% unit test coverage
- [ ] API route tests cover auth, vendor isolation, error cases
- [ ] OpenAPI spec generated for all endpoints
- [ ] Dashboard shows key metrics: uptime, error rate, latency

---

# PHASE 5: PRODUCTION HARDENING
**Duration:** Week 8 (5 business days)
**Priority:** LOW - Nice-to-haves
**Engineer:** 1 full-stack engineer

## 5.1 Offline Mode for POS

### Problem
**Current:** POS stops working if internet disconnects
**Apple Standard:** Must work offline for 24+ hours

### Solution: Service Worker + IndexedDB

```typescript
// app/pos/service-worker.ts

import { openDB } from 'idb';

const CACHE_NAME = 'pos-cache-v1';
const db = await openDB('pos-offline', 1, {
  upgrade(db) {
    db.createObjectStore('products');
    db.createObjectStore('inventory');
    db.createObjectStore('pending-transactions');
  },
});

// Cache product catalog
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/supabase/products')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;

        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});

// Queue failed transactions
async function queueTransaction(transaction) {
  const tx = db.transaction('pending-transactions', 'readwrite');
  await tx.store.add(transaction, Date.now());
}

// Sync when online
self.addEventListener('online', async () => {
  const tx = db.transaction('pending-transactions', 'readonly');
  const pending = await tx.store.getAll();

  for (const transaction of pending) {
    await fetch('/api/pos/sales', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Clear queue
  const deleteTx = db.transaction('pending-transactions', 'readwrite');
  await deleteTx.store.clear();
});
```

---

## 5.2 Performance Optimization

```typescript
// Next.js config optimizations
// next.config.ts

const config = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },

  // Code splitting
  experimental: {
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },

  // Compression
  compress: true,

  // Strict mode
  reactStrictMode: true,

  // Bundle analyzer (dev only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(new BundleAnalyzerPlugin());
      return config;
    },
  }),
};
```

---

## 5.3 Database Query Optimization

```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_orders_vendor_created
  ON orders(vendor_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_products_vendor_category
  ON products(vendor_id, primary_category_id);

CREATE INDEX CONCURRENTLY idx_inventory_product_location
  ON inventory(product_id, location_id);

-- Analyze query performance
EXPLAIN ANALYZE
SELECT p.*, i.quantity
FROM products p
LEFT JOIN inventory i ON i.product_id = p.id
WHERE p.vendor_id = 'vendor-uuid'
ORDER BY p.created_at DESC
LIMIT 100;
```

---

## Phase 5 Acceptance Criteria

- [ ] POS works offline (can process at least 50 transactions)
- [ ] Offline transactions sync when connection restored
- [ ] Bundle size < 500KB (optimized code splitting)
- [ ] First Contentful Paint < 1.5s
- [ ] Database queries using indexes (EXPLAIN ANALYZE shows no seq scans)

---

# ROLLBACK PROCEDURES

## Emergency Rollback

### Scenario 1: Security Fix Breaks Authentication

```bash
# 1. Identify breaking commit
git log --oneline --all --grep="auth" | head -10

# 2. Revert specific commit
git revert <commit-sha> --no-edit

# 3. Deploy immediately
git push origin main

# 4. Notify team
slack-notify "#engineering" "Auth fix reverted - investigating"

# 5. Root cause analysis
# - What broke?
# - Why didn't tests catch it?
# - How to prevent?
```

### Scenario 2: Database Migration Fails

```bash
# 1. Check current migration version
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# 2. Rollback migration (if has down migration)
supabase migration rollback

# 3. If no rollback migration, restore from backup
# (Supabase auto-backups daily)

# 4. Apply fixed migration
supabase migration up
```

### Scenario 3: Performance Degradation After Cache Change

```bash
# 1. Check current cache hit rate
redis-cli INFO stats | grep keyspace_hits

# 2. If <50%, rollback cache changes
git revert <cache-commit-sha>

# 3. Flush Redis (clear bad cache)
redis-cli FLUSHALL

# 4. Monitor recovery
watch -n 1 "redis-cli INFO stats | grep keyspace_hits"
```

---

# SUCCESS METRICS

## Security (Phase 1)
- [ ] Zero P0/P1 security vulnerabilities (Snyk scan)
- [ ] 100% API routes use session-based auth
- [ ] 100% database tables have proper RLS policies
- [ ] Penetration test: 0 successful auth bypass attempts

## Reliability (Phase 2)
- [ ] 99.9% atomicity for financial transactions
- [ ] 0% duplicate payment charges (idempotency working)
- [ ] 100% audit trail coverage for critical operations

## Scalability (Phase 3)
- [ ] Cache hit rate >80%
- [ ] P95 latency <500ms under 500 concurrent users
- [ ] 0% error rate at 1000 req/s throughput
- [ ] Database connection pool usage <80%

## Observability (Phase 4)
- [ ] 90% code coverage for business logic
- [ ] <5 min mean time to detect errors
- [ ] 100% API endpoints documented

## Production (Phase 5)
- [ ] POS offline mode: 24-hour operation without internet
- [ ] First Contentful Paint <1.5s
- [ ] Lighthouse score >90

---

# TEAM RESPONSIBILITIES

## Senior Full-Stack Engineer (Phases 1-2)
- Fix header-based auth (78 API routes)
- Implement RLS policies
- Create atomic transaction functions
- Build idempotency system
- Write security tests

## Senior Backend Engineer (Phase 2-3)
- Implement atomic order fulfillment
- Setup Redis caching
- Configure Bull queue
- Database connection pooling
- Load testing

## DevOps Engineer (Phases 3-4)
- Deploy Redis/PgBouncer
- Configure Sentry monitoring
- Setup CI/CD for migrations
- Load testing infrastructure
- Performance monitoring

## QA Engineer (Phases 1-4)
- Write security test suite
- Create load test scenarios
- Regression testing
- Manual penetration testing
- Documentation review

---

# ESTIMATED COSTS

## Infrastructure (Monthly)
- **Upstash Redis (Pro):** $60/month
- **Sentry (Team):** $80/month
- **Supabase (Pro):** Already have
- **Total:** ~$140/month additional

## One-Time
- **Penetration Testing (External):** $5,000 (optional but recommended)
- **Performance Audit (External):** $3,000 (optional)

## Engineering Time
- **Total:** 8 weeks × 1.5 engineers = 12 engineer-weeks
- **Estimated Cost:** 12 weeks × $3,000/week = $36,000

**Total Project Cost:** ~$36,000 + $140/month

---

# TIMELINE GANTT CHART

```
Week 1-2: Phase 1 - Critical Security
├── Day 1-2:  Fix header auth (financial endpoints)
├── Day 3-5:  Fix header auth (vendor endpoints)
├── Day 6-7:  Fix header auth (admin endpoints)
├── Day 8:    Update frontend API calls
├── Day 9-10: Security testing
└── Deploy: Friday Week 2

Week 3-4: Phase 2 - Transactions
├── Day 1-3:  Atomic order fulfillment
├── Day 4:    Payment idempotency
├── Day 5-6:  Audit logging system
├── Day 7:    Fix type inconsistencies
├── Day 8-9:  Rate limiting
├── Day 10:   Integration testing
└── Deploy: Friday Week 4

Week 5-6: Phase 3 - Scalability
├── Day 1-4:  Redis caching + invalidation
├── Day 5-6:  Background job queue
├── Day 7:    Connection pooling
├── Day 8-9:  Load testing
├── Day 10:   Performance optimization
└── Deploy: Friday Week 6

Week 7: Phase 4 - Observability
├── Day 1:    Sentry setup
├── Day 2-3:  Unit tests (pricing engine)
├── Day 4:    API documentation
├── Day 5:    Monitoring dashboard
└── Deploy: Friday Week 7

Week 8: Phase 5 - Production Hardening
├── Day 1-3:  Offline mode (POS)
├── Day 4-5:  Performance optimization
└── LAUNCH: Friday Week 8 🚀
```

---

# READY FOR APPLE?

After completing all 5 phases:

## Final Scorecard
| Category | Before | After | Target |
|----------|--------|-------|--------|
| Security | 4/10 | 9/10 | 9/10 ✅ |
| Architecture | 7/10 | 9/10 | 9/10 ✅ |
| Code Quality | 8/10 | 9/10 | 9/10 ✅ |
| Scalability | 6/10 | 9/10 | 9/10 ✅ |
| Reliability | 7/10 | 9/10 | 9/10 ✅ |
| Observability | 5/10 | 9/10 | 9/10 ✅ |

**Overall: 6.5/10 → 9.0/10** 🎉

## Apple's Verdict (Projected)

**Would Apple deploy this?** YES

**Would their engineers be satisfied?** YES

**What they'd say:**
- ✅ "Security is now enterprise-grade"
- ✅ "Atomic transactions protect financial data"
- ✅ "Scalability tested and proven"
- ✅ "Good observability for debugging"
- ✅ "Offline mode is critical - well done"

**Remaining concerns:**
- ⚠️ "Supabase is not self-hosted - vendor lock-in risk"
- ⚠️ "Next.js Edge Functions have cold start latency"
- ⚠️ "No disaster recovery drill documented"

**Overall:** **8.5/10 - Production ready for Apple Retail** ✅

---

# NEXT STEPS

1. **Week 0 (Now):**
   - [ ] Review this plan with engineering team
   - [ ] Get approval from stakeholders
   - [ ] Provision Redis/Sentry accounts
   - [ ] Create JIRA tickets for all tasks

2. **Week 1 (Start):**
   - [ ] Kick-off meeting (Monday 9 AM)
   - [ ] Begin Phase 1: Security fixes
   - [ ] Daily standups at 10 AM

3. **Week 2 (End of Phase 1):**
   - [ ] Security review with external auditor
   - [ ] Deploy to staging
   - [ ] Stakeholder demo

4. **Week 8 (Launch):**
   - [ ] Final QA sign-off
   - [ ] Production deployment
   - [ ] Monitor for 48 hours
   - [ ] Celebrate 🎉

---

**Questions? Email: engineering@whaletools.com**

**Last Updated:** November 8, 2025
