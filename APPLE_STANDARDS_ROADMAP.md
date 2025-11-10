# 🍎 Apple Engineering Standards - 4 Phase Remediation Plan

**Project:** WhaleTools Cannabis Operations Platform
**Current Grade:** C+ (72/100)
**Target Grade:** A (90+/100)
**Timeline:** 8 weeks (2 weeks per phase)
**Estimated Effort:** 320 engineer-hours

---

## PROGRESS TRACKING

| Phase | Status | Completion | Critical Items | Start Date | End Date |
|-------|--------|------------|----------------|------------|----------|
| Phase 1: Critical Fixes | 🔴 Not Started | 0% | 15 items | TBD | TBD |
| Phase 2: Type Safety | 🔴 Not Started | 0% | 12 items | TBD | TBD |
| Phase 3: Performance | 🔴 Not Started | 0% | 10 items | TBD | TBD |
| Phase 4: Testing & Docs | 🔴 Not Started | 0% | 8 items | TBD | TBD |

**Overall Progress:** 0/45 items (0%)

---

# PHASE 1: CRITICAL FIXES & SECURITY (Week 1-2)

**Goal:** Fix all P0 blocking issues that would prevent production deployment
**Success Criteria:** No critical security vulnerabilities, all silent failures logged
**Estimated Effort:** 80 hours

## 1.1 Security Vulnerabilities (P0 - BLOCKING) 🚨

### Task 1.1.1: Remove Database Credentials from Source Code
**Priority:** P0 - CRITICAL
**Effort:** 2 hours
**Files Affected:**
- `.env.local` (rotate credentials)
- `tests/*.spec.ts` (remove hardcoded passwords)
- Git history (BFG repo cleaner)

**Implementation:**
```bash
# 1. Rotate Supabase database password immediately
# Go to Supabase Dashboard → Settings → Database → Reset Password

# 2. Update .env.local with new password
SUPABASE_DB_PASSWORD=<new-secure-password>

# 3. Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Update test scripts to use env vars
```

**Validation:**
- [ ] Database password rotated in Supabase
- [ ] `.env.local` updated
- [ ] All test scripts use `process.env.SUPABASE_DB_PASSWORD`
- [ ] Git history cleaned
- [ ] `.gitignore` includes `.env.local`

---

### Task 1.1.2: Fix CORS Wildcard Fallback
**Priority:** P0 - CRITICAL
**Effort:** 1 hour
**Files Affected:** `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`

**Current Code (BAD):**
```typescript
const origin = request.headers.get("origin") || "*";
```

**Fixed Code:**
```typescript
const ALLOWED_ORIGINS = [
  'https://yachtclub.vip',
  'https://www.yachtclub.vip',
  'http://localhost:3000',
  'https://localhost:3443',
];

const origin = request.headers.get("origin");
const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
```

**Validation:**
- [ ] CORS whitelist defined
- [ ] Tests verify rejection of unknown origins
- [ ] All auth endpoints updated

---

### Task 1.1.3: Stop Error Message Leakage
**Priority:** P0 - CRITICAL
**Effort:** 3 hours
**Files Affected:** All `app/api/**/*.ts` files

**Pattern to Find:**
```bash
grep -r "details: String(error)" app/api/
grep -r "error.message" app/api/
```

**Fix Pattern:**
```typescript
// ❌ BAD - Leaks internal details
return NextResponse.json({
  error: err.message,
  details: String(error)
}, { status: 500 });

// ✅ GOOD - Generic message, detailed server logs
logger.error("Domain verification failed", error, {
  domain,
  vendorId,
  timestamp: new Date().toISOString()
});

return NextResponse.json({
  error: "Domain verification failed. Please try again or contact support."
}, { status: 500 });
```

**Validation:**
- [ ] No error stack traces in API responses
- [ ] All errors logged with full context server-side
- [ ] User-friendly error messages only

---

## 1.2 Error Handling (P0 - BLOCKING) 🛑

### Task 1.2.1: Fix All Empty Catch Blocks
**Priority:** P0 - CRITICAL
**Effort:** 4 hours
**Files Affected:**
- `app/api/vendor/media/upscale/route.ts:351`
- `app/api/vendor/website/verify-domain/route.ts:76,86,95`

**Find all empty catch blocks:**
```bash
grep -A1 "} catch" app/**/*.ts | grep -B1 "^\s*}$"
```

**Fix Pattern:**
```typescript
// ❌ BAD
try {
  await cleanup();
} catch (cleanupError) {
  // Silent failure
}

// ✅ GOOD
try {
  await cleanup();
} catch (cleanupError) {
  logger.warn("Cleanup failed but continuing", cleanupError, {
    operation: 'file-cleanup',
    fileCount: files.length
  });
}
```

**Validation:**
- [ ] All catch blocks have logging
- [ ] Critical errors re-throw
- [ ] Non-critical errors logged as warnings

---

### Task 1.2.2: Add .catch() to Promise Chains
**Priority:** P0 - CRITICAL
**Effort:** 2 hours
**Files Affected:** `hooks/useProduct.tsx:5`

**Current Code (BAD):**
```typescript
const fetcher = (url: string) => fetch(url).then((res) => res.json());
```

**Fixed Code:**
```typescript
const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    logger.error("Fetch failed", error, { url });
    throw error; // Re-throw for SWR to handle
  }
};
```

**Validation:**
- [ ] All fetch calls have error handling
- [ ] Network errors logged
- [ ] UI shows error state

---

### Task 1.2.3: Fix Duplicate Condition in api-handler.ts
**Priority:** P1 - HIGH
**Effort:** 0.5 hours
**Files Affected:** `lib/api-handler.ts:34-42`

**Current Code (BAD):**
```typescript
if (process.env.NODE_ENV === "development") {
  if (process.env.NODE_ENV === "development") { // Duplicate!
    logger.error("[API Error]", { ... });
  }
}
```

**Fixed Code:**
```typescript
if (process.env.NODE_ENV === "development") {
  logger.error("[API Error]", {
    message: err.message,
    stack: err.stack,
    endpoint
  });
}
```

**Validation:**
- [ ] Duplicate condition removed
- [ ] Error logging works in dev mode

---

## 1.3 Input Validation (P0 - BLOCKING) 🔒

### Task 1.3.1: Add Zod Validation to Auth Endpoints
**Priority:** P0 - CRITICAL
**Effort:** 6 hours
**Files Affected:**
- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/update-profile/route.ts`

**Create validation schemas:**
```typescript
// lib/validation/auth.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/, 'Invalid name'),
  lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/, 'Invalid name'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required'),
});
```

**Implementation:**
```typescript
// app/api/auth/register/route.ts
import { registerSchema } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validated = registerSchema.parse(body);

    // Use validated data (guaranteed to be correct type)
    const { email, password, firstName, lastName } = validated;

    // ... rest of registration logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      }, { status: 400 });
    }
    // Handle other errors...
  }
}
```

**Validation:**
- [ ] All auth endpoints have Zod schemas
- [ ] Email format validated
- [ ] Password strength enforced
- [ ] XSS protection via input sanitization
- [ ] Error messages show which field failed

---

### Task 1.3.2: Add Input Validation to Product Endpoints
**Priority:** P1 - HIGH
**Effort:** 8 hours
**Files Affected:** `app/api/vendor/products/update/route.ts`

**Create product validation schema:**
```typescript
// lib/validation/product.ts
import { z } from 'zod';

export const productUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  regular_price: z.number().positive().max(999999.99).optional(),
  sale_price: z.number().positive().max(999999.99).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  category_ids: z.array(z.string().uuid()).max(10).optional(),
}).refine(data => {
  // Sale price must be less than regular price
  if (data.sale_price && data.regular_price) {
    return data.sale_price < data.regular_price;
  }
  return true;
}, {
  message: "Sale price must be less than regular price"
});
```

**Validation:**
- [ ] Product update validated
- [ ] Price validation enforced
- [ ] Stock quantity validated
- [ ] Category IDs are UUIDs

---

## 1.4 Memory Leaks (P0 - BLOCKING) 🧠

### Task 1.4.1: Fix usePrefetch Memory Leak
**Priority:** P0 - CRITICAL
**Effort:** 1 hour
**Files Affected:** `hooks/usePrefetch.tsx:35-47`

**Current Code (BAD):**
```typescript
export function useLinkPrefetch(href: string) {
  const { prefetchRoute } = usePrefetch();
  let timeoutId: NodeJS.Timeout; // ❌ Wrong scope!

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => { prefetchRoute(href); }, 50);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  return { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave };
}
```

**Fixed Code:**
```typescript
export function useLinkPrefetch(href: string) {
  const { prefetchRoute } = usePrefetch();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      prefetchRoute(href);
    }, 50);
  }, [href, prefetchRoute]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave };
}
```

**Validation:**
- [ ] Timeout uses useRef
- [ ] Cleanup on unmount
- [ ] No memory leaks in Chrome DevTools profiler

---

## 1.5 Infrastructure Setup (P1 - HIGH) 🔧

### Task 1.5.1: Configure Redis for Caching
**Priority:** P1 - HIGH
**Effort:** 4 hours
**Files Affected:** New files + `.env.local`

**Update .env.local:**
```bash
# Redis Configuration (Redis Cloud)
REDIS_URL=redis://default:m96bgOFhtGnN2ClA1h3z5SyexKmBLfda@redis-10383.c13.us-east-1-3.ec2.redns.redis-cloud.com:10383
REDIS_HOST=redis-10383.c13.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=10383
REDIS_PASSWORD=m96bgOFhtGnN2ClA1h3z5SyexKmBLfda
```

**Create Redis client:**
```typescript
// lib/redis-client.ts
import { Redis } from '@upstash/redis';
import { logger } from './logger';

const redisClient = new Redis({
  url: process.env.REDIS_URL || '',
  token: process.env.REDIS_PASSWORD || '',
});

export class CacheService {
  private static instance: CacheService;
  private redis: Redis;

  private constructor() {
    this.redis = redisClient;
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value as T | null;
    } catch (error) {
      logger.error('Redis GET failed', error, { key });
      return null; // Fail gracefully
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        await this.redis.set(key, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      logger.error('Redis SET failed', error, { key });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL failed', error, { key });
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      // Use SCAN to find matching keys
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error('Redis pattern invalidation failed', error, { pattern });
      return 0;
    }
  }
}

export const cache = CacheService.getInstance();
```

**Validation:**
- [ ] Redis client connected
- [ ] Cache methods tested
- [ ] Fail gracefully if Redis down

---

### Task 1.5.2: Add Rate Limiting to API Routes
**Priority:** P1 - HIGH
**Effort:** 6 hours
**Files Affected:** All `app/api/**/*.ts`

**Create rate limiter:**
```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_PASSWORD!,
});

// Different rate limits for different endpoint types
export const rateLimiters = {
  // Auth endpoints - 5 requests per minute
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // API endpoints - 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // AI endpoints - 20 requests per minute (expensive)
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit:ai',
  }),
};

export async function checkRateLimit(
  request: NextRequest,
  type: keyof typeof rateLimiters = 'api'
): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const { success, limit, reset, remaining } = await rateLimiters[type].limit(ip);

  if (!success) {
    logger.warn('Rate limit exceeded', { ip, type, limit, reset });
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // Allow request
}
```

**Usage in API routes:**
```typescript
export async function POST(request: NextRequest) {
  // Check rate limit first
  const rateLimitResponse = await checkRateLimit(request, 'auth');
  if (rateLimitResponse) return rateLimitResponse;

  // Continue with request handling...
}
```

**Validation:**
- [ ] Rate limiting on auth endpoints
- [ ] Rate limiting on AI endpoints
- [ ] Proper HTTP 429 responses
- [ ] Retry-After headers set

---

## 1.6 Phase 1 Deliverables Checklist

**Before moving to Phase 2, all items must be complete:**

- [ ] **Security**
  - [ ] Database credentials rotated and removed from git
  - [ ] CORS whitelist implemented (no wildcards)
  - [ ] No error stack traces in API responses

- [ ] **Error Handling**
  - [ ] All empty catch blocks fixed
  - [ ] All promise chains have error handling
  - [ ] Duplicate conditions removed

- [ ] **Validation**
  - [ ] Zod schemas for auth endpoints
  - [ ] Zod schemas for product endpoints
  - [ ] Input sanitization implemented

- [ ] **Memory & Performance**
  - [ ] usePrefetch memory leak fixed
  - [ ] Redis client configured and tested
  - [ ] Rate limiting on critical endpoints

- [ ] **Testing**
  - [ ] All fixes have unit tests
  - [ ] Security tests passing
  - [ ] No regression in existing functionality

**Phase 1 Success Metrics:**
- ✅ Zero P0 security vulnerabilities
- ✅ Zero silent error failures
- ✅ All API inputs validated
- ✅ Rate limiting functional
- ✅ Redis cache operational

---

# PHASE 2: TYPE SAFETY & ERROR HANDLING (Week 3-4)

**Goal:** Eliminate all `any` types and implement comprehensive error handling
**Success Criteria:** TypeScript strict mode with 0 errors, no `any` types
**Estimated Effort:** 80 hours

## 2.1 Type Safety Improvements (P1 - HIGH) 📐

### Task 2.1.1: Replace All `any` Types with Proper Types
**Priority:** P1 - HIGH
**Effort:** 16 hours
**Files Affected:** 20+ files

**Find all `any` types:**
```bash
grep -r ": any" app/ lib/ hooks/ components/ | wc -l
```

**Create proper types:**
```typescript
// types/prediction.ts
export interface PredictionResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// app/api/vendor/media/upscale/route.ts
// ❌ OLD
async function pollPrediction(predictionId: string, maxAttempts = 60): Promise<any> {
  const results: any[] = [];
  const errors: any[] = [];
}

// ✅ NEW
async function pollPrediction(
  predictionId: string,
  maxAttempts = 60
): Promise<PredictionResponse> {
  const results: PredictionResponse[] = [];
  const errors: Error[] = [];
}
```

**Priority files to fix:**
1. `app/api/vendor/media/upscale/route.ts` - Prediction types
2. `lib/realtime-inventory.ts` - Inventory event types
3. `app/api/products/route.ts` - Product mapping types
4. `app/api/supabase/products/[id]/route.ts` - Product categories

**Validation:**
- [ ] `grep -r ": any" app/ lib/ hooks/` returns 0 results
- [ ] TypeScript compiles with strict: true
- [ ] No type errors in VSCode

---

### Task 2.1.2: Create Comprehensive Type Definitions
**Priority:** P1 - HIGH
**Effort:** 12 hours

**Create missing type files:**
```typescript
// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface FilterParams {
  search?: string;
  categoryId?: string;
  vendorId?: string;
  status?: string;
}

// types/inventory.ts (fix existing)
export interface InventoryRecord {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  cost: number;
  updated_at: string;
}

export interface InventoryChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  old?: InventoryRecord;
  new?: InventoryRecord;
  timestamp: string;
}

// types/product.ts (enhance existing)
export interface ProductPricingTier {
  id: string;
  name: string;
  quantity: number;
  price: number;
  discount_percentage?: number;
}

export interface ProductWithPricing extends Product {
  pricing_tiers: ProductPricingTier[];
  pricing_mode: 'standard' | 'tiered' | 'blueprint';
  pricing_blueprint_id?: string;
}
```

**Validation:**
- [ ] All major entities have type definitions
- [ ] API responses properly typed
- [ ] No implicit `any` in codebase

---

### Task 2.1.3: Fix Unsafe Type Assertions
**Priority:** P1 - HIGH
**Effort:** 8 hours

**Find unsafe assertions:**
```bash
grep -r "as any" app/ lib/ hooks/
grep -r ": any" app/ lib/ hooks/
```

**Pattern to fix:**
```typescript
// ❌ BAD - Assumes structure without validation
const productsWithPricing = (productsResult.data || []).map((product: any) => {
  const pricingData = product.pricing_data || {};
  return {
    ...product,
    pricingTiers: pricingData.tiers || []
  };
});

// ✅ GOOD - Validate with Zod
import { z } from 'zod';

const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  pricing_data: z.object({
    tiers: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      price: z.number()
    })).optional()
  }).optional()
});

const productsWithPricing = (productsResult.data || []).map(product => {
  const validated = productSchema.parse(product);
  return {
    ...validated,
    pricingTiers: validated.pricing_data?.tiers || []
  };
});
```

**Validation:**
- [ ] All type assertions justified or removed
- [ ] Runtime validation with Zod where needed
- [ ] No `as any` in codebase

---

## 2.2 Comprehensive Error Boundaries (P1 - HIGH) 🛡️

### Task 2.2.1: Create Global Error Boundary
**Priority:** P1 - HIGH
**Effort:** 4 hours

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'global'
    });

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
              Something went wrong
            </h3>
            <p className="mt-2 text-sm text-gray-600 text-center">
              We've been notified and are working to fix the issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Add to layout:**
```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Validation:**
- [ ] Error boundary wraps entire app
- [ ] Errors logged to Sentry
- [ ] User sees friendly error message
- [ ] Reload button works

---

### Task 2.2.2: Add API Error Wrapper
**Priority:** P1 - HIGH
**Effort:** 4 hours

**Create reusable API wrapper:**
```typescript
// lib/api-wrapper.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from './logger';

export interface ApiHandlerOptions<TBody = any, TResponse = any> {
  bodySchema?: z.ZodSchema<TBody>;
  requireAuth?: boolean;
  rateLimit?: 'auth' | 'api' | 'ai';
  handler: (req: NextRequest, body: TBody) => Promise<TResponse>;
}

export function apiHandler<TBody = any, TResponse = any>(
  options: ApiHandlerOptions<TBody, TResponse>
) {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    const endpoint = request.nextUrl.pathname;

    try {
      // 1. Rate limiting
      if (options.rateLimit) {
        const rateLimitResponse = await checkRateLimit(request, options.rateLimit);
        if (rateLimitResponse) return rateLimitResponse;
      }

      // 2. Authentication
      if (options.requireAuth) {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) return authResult;
      }

      // 3. Body validation
      let body: TBody | undefined;
      if (options.bodySchema) {
        const rawBody = await request.json();
        body = options.bodySchema.parse(rawBody);
      }

      // 4. Execute handler
      const result = await options.handler(request, body as TBody);

      // 5. Log success
      logger.measure(`API ${endpoint}`, startTime);

      return NextResponse.json({ success: true, data: result });

    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        logger.warn('Validation failed', { endpoint, errors: error.errors });
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        );
      }

      // Handle other errors
      logger.error(`API error: ${endpoint}`, error, {
        endpoint,
        duration: Date.now() - startTime
      });

      return NextResponse.json(
        {
          success: false,
          error: process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error'
        },
        { status: 500 }
      );
    }
  };
}
```

**Usage example:**
```typescript
// app/api/vendor/products/update/route.ts
import { apiHandler } from '@/lib/api-wrapper';
import { productUpdateSchema } from '@/lib/validation/product';

export const POST = apiHandler({
  bodySchema: productUpdateSchema,
  requireAuth: true,
  rateLimit: 'api',
  handler: async (request, body) => {
    // body is now typed and validated!
    const { name, sku, price } = body;

    // Your business logic here
    const updated = await updateProduct(body);

    return updated;
  }
});
```

**Validation:**
- [ ] API wrapper handles all error cases
- [ ] Validation errors user-friendly
- [ ] Performance logged
- [ ] Auth checked automatically

---

## 2.3 React Hook Error Handling (P1 - HIGH) ⚛️

### Task 2.3.1: Fix useVendorData Error Handling
**Priority:** P1 - HIGH
**Effort:** 3 hours
**Files Affected:** `hooks/useVendorData.ts`

**Add error states:**
```typescript
export function useVendorData<T>(
  endpoint: string,
  options?: UseVendorDataOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);

      options?.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      logger.error('useVendorData fetch failed', error, { endpoint });
      options?.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, options]);

  return { data, isLoading, error, refetch: fetchData };
}
```

**Validation:**
- [ ] Error state exposed
- [ ] Loading state accurate
- [ ] Errors logged
- [ ] onError callback works

---

## 2.4 Database Schema Management (P0 - CRITICAL) 📊

### Task 2.4.1: Create Database Migration System
**Priority:** P0 - CRITICAL
**Effort:** 8 hours

**Current Issue:** ZERO migration files in `supabase/migrations/`

**Solution: Export existing schema**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref uaednwpxursknmwdeejn

# Pull existing schema
supabase db pull

# This creates migration files in supabase/migrations/
```

**Create migration template:**
```sql
-- supabase/migrations/20250110_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (example - replace with actual schema)
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own data"
  ON vendors FOR SELECT
  USING (auth.uid() = id);

-- Add indexes
CREATE INDEX idx_vendors_slug ON vendors(slug);
CREATE INDEX idx_vendors_email ON vendors(email);
```

**Create migration runner:**
```typescript
// scripts/run-migrations.ts
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigrations() {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');

    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error(`Migration ${file} failed:`, error);
      process.exit(1);
    }

    console.log(`✓ ${file} completed`);
  }

  console.log('All migrations completed successfully');
}

runMigrations();
```

**Validation:**
- [ ] Schema exported from production
- [ ] Migration files in version control
- [ ] Migration runner tested
- [ ] Documentation updated

---

## 2.5 Phase 2 Deliverables Checklist

- [ ] **Type Safety**
  - [ ] All `any` types replaced (0 remaining)
  - [ ] Proper type definitions created
  - [ ] Unsafe assertions removed
  - [ ] TypeScript strict mode enabled

- [ ] **Error Handling**
  - [ ] Global error boundary implemented
  - [ ] API error wrapper created
  - [ ] Hook error states added
  - [ ] All errors logged with context

- [ ] **Database**
  - [ ] Schema exported to migrations
  - [ ] Migration system implemented
  - [ ] Migration runner tested
  - [ ] Schema documented

- [ ] **Testing**
  - [ ] Type safety verified (tsc --noEmit)
  - [ ] Error boundaries tested
  - [ ] Migration rollback tested
  - [ ] No regressions

**Phase 2 Success Metrics:**
- ✅ 0 `any` types in codebase
- ✅ TypeScript strict mode with 0 errors
- ✅ All API routes use error wrapper
- ✅ Database migrations in version control
- ✅ Error boundaries catch all React errors

---

# PHASE 3: PERFORMANCE & CACHING (Week 5-6)

**Goal:** Optimize database queries, implement caching, fix N+1 queries
**Success Criteria:** <100ms API response times, zero N+1 queries
**Estimated Effort:** 80 hours

## 3.1 Middleware Performance (P0 - CRITICAL) ⚡

### Task 3.1.1: Add Redis Caching to Domain Lookups
**Priority:** P0 - CRITICAL
**Effort:** 6 hours
**Files Affected:** `middleware.ts:128-134`

**Current Issue:** Database hit on EVERY request

**Solution:**
```typescript
// middleware.ts
import { cache } from '@/lib/redis-client';

const DOMAIN_CACHE_TTL = 300; // 5 minutes

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0];

  // Check cache first
  const cacheKey = `domain:${domain}`;
  let domainRecord = await cache.get<DomainRecord>(cacheKey);

  if (!domainRecord) {
    // Cache miss - query database
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("vendor_domains")
      .select("vendor_id, is_active, verified")
      .eq("domain", domain)
      .eq("verified", true)
      .eq("is_active", true)
      .single();

    if (data && !error) {
      domainRecord = data;
      // Cache for 5 minutes
      await cache.set(cacheKey, domainRecord, DOMAIN_CACHE_TTL);
    }
  }

  // Rest of middleware logic...
}
```

**Cache invalidation:**
```typescript
// app/api/vendor/domains/route.ts
export async function POST(request: NextRequest) {
  const { domain, vendor_id } = await request.json();

  // Update domain in database
  await supabase.from('vendor_domains').insert({ domain, vendor_id });

  // Invalidate cache
  await cache.del(`domain:${domain}`);

  return NextResponse.json({ success: true });
}
```

**Validation:**
- [ ] Domain lookups cached
- [ ] Cache invalidated on updates
- [ ] Response time <10ms (cache hit)
- [ ] Graceful fallback if Redis down

**Expected Impact:**
- Before: 1000 requests = 1000 database queries (~50-100ms each)
- After: 1000 requests = 1 database query (~50ms) + 999 cache hits (~1ms each)
- **Improvement: ~50x faster middleware**

---

### Task 3.1.2: Optimize Vendor Session Lookup
**Priority:** P1 - HIGH
**Effort:** 4 hours

**Add caching to auth checks:**
```typescript
// lib/auth/middleware.ts
import { cache } from '@/lib/redis-client';

export async function requireVendor(request: NextRequest) {
  const token = request.cookies.get('whaletools-auth-token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check cache first
  const cacheKey = `session:${token}`;
  let session = await cache.get<Session>(cacheKey);

  if (!session) {
    // Cache miss - verify with Supabase
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    session = {
      userId: data.user.id,
      vendorId: data.user.user_metadata.vendor_id,
      role: data.user.user_metadata.role
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, session, 300);
  }

  return session;
}
```

**Validation:**
- [ ] Session lookups cached
- [ ] Cache cleared on logout
- [ ] Auth checks <5ms

---

## 3.2 Database Query Optimization (P0 - CRITICAL) 🗄️

### Task 3.2.1: Fix N+1 Query in Products Endpoint
**Priority:** P0 - CRITICAL
**Effort:** 6 hours
**Files Affected:** `app/api/products/route.ts:65-82`

**Current Problem:**
```typescript
// ❌ BAD - Transforms data in JavaScript
const productsWithPricing = (productsResult.data || []).map((product: any) => {
  const pricingData = product.pricing_data || {};
  const pricingTiers: any[] = [];
  (pricingData.tiers || []).forEach((tier: any) => {
    // Complex transformation in memory
  });
});
```

**Optimized Solution:**
```typescript
// ✅ GOOD - Database does the work
const { data: products, error } = await supabase
  .from('products')
  .select(`
    id,
    name,
    sku,
    description,
    regular_price,
    sale_price,
    image_url,
    category:categories(id, name, slug),
    pricing_tiers:product_pricing_tiers(
      id,
      name,
      quantity,
      price,
      discount_percentage
    ),
    pricing_blueprint:pricing_tier_blueprints(
      id,
      name,
      quality_tier
    )
  `)
  .eq('vendor_id', vendorId)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(limit)
  .range(offset, offset + limit - 1);

// Data already in correct shape - no transformation needed!
return NextResponse.json({ success: true, data: products });
```

**Add database indexes:**
```sql
-- supabase/migrations/20250112_optimize_products.sql

-- Index for vendor product queries
CREATE INDEX IF NOT EXISTS idx_products_vendor_status
  ON products(vendor_id, status, created_at DESC);

-- Index for category lookups
CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(primary_category_id);

-- Composite index for search
CREATE INDEX IF NOT EXISTS idx_products_search
  ON products USING gin(to_tsvector('english', name || ' ' || description));
```

**Validation:**
- [ ] Single database query instead of N+1
- [ ] Response time <100ms for 50 products
- [ ] Proper pagination
- [ ] Indexes created

**Expected Impact:**
- Before: 50 products = 1 main query + 50 pricing queries + 50 category queries = 101 queries (~5 seconds)
- After: 50 products = 1 query with joins (~100ms)
- **Improvement: ~50x faster**

---

### Task 3.2.2: Add Query Result Caching
**Priority:** P1 - HIGH
**Effort:** 6 hours

**Cache expensive queries:**
```typescript
// lib/query-cache.ts
import { cache } from '@/lib/redis-client';
import { logger } from './logger';

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    logger.debug('Cache hit', { key });
    return cached;
  }

  // Cache miss - execute query
  logger.debug('Cache miss', { key });
  const startTime = Date.now();
  const result = await queryFn();

  // Cache result
  await cache.set(key, result, ttlSeconds);

  logger.measure(`Query ${key}`, startTime);
  return result;
}

// Usage in API routes
export async function GET(request: NextRequest) {
  const vendorId = request.headers.get('x-vendor-id');

  const products = await cachedQuery(
    `products:vendor:${vendorId}:page:1`,
    async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId);
      return data;
    },
    300 // Cache for 5 minutes
  );

  return NextResponse.json({ data: products });
}
```

**Smart cache invalidation:**
```typescript
// app/api/vendor/products/update/route.ts
export async function PUT(request: NextRequest) {
  const { productId, ...updates } = await request.json();

  // Update product
  await supabase
    .from('products')
    .update(updates)
    .eq('id', productId);

  // Invalidate related caches
  await cache.invalidatePattern(`products:vendor:${vendorId}:*`);
  await cache.invalidatePattern(`product:${productId}:*`);

  return NextResponse.json({ success: true });
}
```

**Validation:**
- [ ] Expensive queries cached
- [ ] Cache invalidated on updates
- [ ] Cache hit rate >80%

---

## 3.3 React Performance (P1 - HIGH) ⚛️

### Task 3.3.1: Add Memoization to Expensive Calculations
**Priority:** P1 - HIGH
**Effort:** 4 hours
**Files Affected:** `components/analytics/AdvancedFiltersPanel.tsx:112-121`

**Current Problem:**
```typescript
// ❌ BAD - Recalculates on every render
const getActiveFilterCount = () => {
  return (
    localFilters.locationIds.length +
    localFilters.categoryIds.length +
    localFilters.employeeIds.length +
    (localFilters.dateRange ? 1 : 0) +
    (localFilters.minAmount ? 1 : 0)
  );
};
```

**Optimized Solution:**
```typescript
// ✅ GOOD - Only recalculates when filters change
const activeFilterCount = useMemo(() => {
  return (
    localFilters.locationIds.length +
    localFilters.categoryIds.length +
    localFilters.employeeIds.length +
    (localFilters.dateRange ? 1 : 0) +
    (localFilters.minAmount ? 1 : 0)
  );
}, [localFilters]);
```

**Find all candidates:**
```bash
# Find functions called in render
grep -r "const get.*= () =>" components/
grep -r "function get.*{" components/
```

**Validation:**
- [ ] Expensive calculations memoized
- [ ] No unnecessary re-renders
- [ ] React DevTools Profiler shows improvement

---

### Task 3.3.2: Add React.memo to Heavy Components
**Priority:** P1 - HIGH
**Effort:** 4 hours

**Identify heavy components:**
```typescript
// components/ProductCard.tsx
import { memo } from 'react';

// ❌ BAD - Re-renders even when props unchanged
export function ProductCard({ product, onAddToCart }) {
  return (
    <div>
      {/* Complex rendering logic */}
    </div>
  );
}

// ✅ GOOD - Only re-renders when props change
export const ProductCard = memo(function ProductCard({ product, onAddToCart }) {
  return (
    <div>
      {/* Complex rendering logic */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if product ID changes
  return prevProps.product.id === nextProps.product.id;
});
```

**Validation:**
- [ ] Heavy components wrapped in memo
- [ ] Custom comparison functions where needed
- [ ] Render count reduced in DevTools

---

## 3.4 Bundle Size Optimization (P1 - HIGH) 📦

### Task 3.4.1: Analyze and Reduce Bundle Size
**Priority:** P1 - HIGH
**Effort:** 6 hours

**Run bundle analyzer:**
```bash
ANALYZE=true npm run build
```

**Common optimizations:**
```typescript
// ❌ BAD - Imports entire library
import _ from 'lodash';
import moment from 'moment';

// ✅ GOOD - Import only what you need
import { debounce, throttle } from 'lodash-es';
import { formatDistance } from 'date-fns';

// ❌ BAD - Monaco editor in main bundle
import MonacoEditor from '@monaco-editor/react';

// ✅ GOOD - Dynamic import
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div>Loading editor...</div>
});
```

**Target bundle sizes:**
- Main bundle: <200KB gzipped
- Vendor bundle: <300KB gzipped
- Route bundles: <50KB each

**Validation:**
- [ ] Bundle analysis complete
- [ ] Heavy libraries dynamic imported
- [ ] Total bundle size <500KB gzipped

---

## 3.5 Image Optimization (P2 - MEDIUM) 🖼️

### Task 3.5.1: Implement Responsive Images
**Priority:** P2 - MEDIUM
**Effort:** 4 hours

**Current:**
```typescript
<img src={product.image_url} alt={product.name} />
```

**Optimized:**
```typescript
import Image from 'next/image';

<Image
  src={product.image_url}
  alt={product.name}
  width={400}
  height={400}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={index < 3} // LCP optimization for first 3 images
  placeholder="blur"
  blurDataURL={product.blur_data_url}
/>
```

**Generate blur placeholders:**
```typescript
// lib/image-blur.ts
import sharp from 'sharp';

export async function generateBlurDataURL(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();

  const blurBuffer = await sharp(Buffer.from(buffer))
    .resize(10, 10)
    .blur()
    .toBuffer();

  return `data:image/jpeg;base64,${blurBuffer.toString('base64')}`;
}
```

**Validation:**
- [ ] All images use Next Image
- [ ] Blur placeholders generated
- [ ] Lighthouse image score >90

---

## 3.6 Phase 3 Deliverables Checklist

- [ ] **Caching**
  - [ ] Domain lookups cached (Redis)
  - [ ] Session lookups cached
  - [ ] Query results cached
  - [ ] Cache invalidation working

- [ ] **Database**
  - [ ] N+1 queries eliminated
  - [ ] Proper indexes created
  - [ ] Query response times <100ms
  - [ ] Pagination implemented

- [ ] **React**
  - [ ] Expensive calculations memoized
  - [ ] Heavy components wrapped in memo
  - [ ] No unnecessary re-renders

- [ ] **Bundle**
  - [ ] Bundle size analyzed
  - [ ] Heavy libraries dynamic imported
  - [ ] Total size <500KB gzipped

**Phase 3 Success Metrics:**
- ✅ API response times <100ms (avg)
- ✅ Cache hit rate >80%
- ✅ Zero N+1 queries
- ✅ Bundle size reduced by 30%
- ✅ Lighthouse Performance score >90

---

# PHASE 4: TESTING & DOCUMENTATION (Week 7-8)

**Goal:** Achieve 80% test coverage and comprehensive documentation
**Success Criteria:** All critical paths tested, API docs generated
**Estimated Effort:** 80 hours

## 4.1 Unit Testing (P0 - CRITICAL) 🧪

### Task 4.1.1: Set Up Testing Infrastructure
**Priority:** P0 - CRITICAL
**Effort:** 4 hours

**Install dependencies:**
```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Create vitest config:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Setup file:**
```typescript
// tests/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

**Update package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Validation:**
- [ ] Vitest configured
- [ ] Test setup working
- [ ] Can run `npm test`

---

### Task 4.1.2: Test Utility Functions (80% Coverage Target)
**Priority:** P0 - CRITICAL
**Effort:** 12 hours

**Example: Test logger:**
```typescript
// lib/logger.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';
import * as Sentry from '@sentry/nextjs';

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('info()', () => {
    it('should log info message', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      logger.info('Test message', { userId: '123' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[INFO] Test message',
        { userId: '123' }
      );
    });

    it('should add Sentry breadcrumb', () => {
      logger.info('Test message', { userId: '123' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'info',
        message: 'Test message',
        level: 'info',
        data: { userId: '123' }
      });
    });
  });

  describe('error()', () => {
    it('should log error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');

      logger.error('Error occurred', error, { endpoint: '/api/test' });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should capture exception in Sentry', () => {
      const error = new Error('Test error');

      logger.error('Error occurred', error, { endpoint: '/api/test' });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          contexts: { details: { endpoint: '/api/test' } }
        })
      );
    });
  });

  describe('measure()', () => {
    it('should calculate duration correctly', () => {
      const startTime = Date.now() - 1000; // 1 second ago

      logger.measure('Test operation', startTime);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance',
          message: expect.stringContaining('Test operation'),
        })
      );
    });

    it('should warn on slow operations', () => {
      const startTime = Date.now() - 2000; // 2 seconds ago
      const warnSpy = vi.spyOn(logger, 'warn');

      logger.measure('Slow operation', startTime);

      expect(warnSpy).toHaveBeenCalledWith(
        'Slow operation detected: Slow operation',
        expect.objectContaining({ duration: expect.any(Number) })
      );
    });
  });
});
```

**Test cache service:**
```typescript
// lib/redis-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheService } from './redis-client';

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  })),
}));

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = CacheService.getInstance();
    vi.clearAllMocks();
  });

  describe('get()', () => {
    it('should retrieve cached value', async () => {
      const mockRedis = (cache as any).redis;
      mockRedis.get.mockResolvedValue({ userId: '123' });

      const result = await cache.get('user:123');

      expect(result).toEqual({ userId: '123' });
      expect(mockRedis.get).toHaveBeenCalledWith('user:123');
    });

    it('should return null if key not found', async () => {
      const mockRedis = (cache as any).redis;
      mockRedis.get.mockResolvedValue(null);

      const result = await cache.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should fail gracefully on Redis error', async () => {
      const mockRedis = (cache as any).redis;
      mockRedis.get.mockRejectedValue(new Error('Redis down'));

      const result = await cache.get('user:123');

      expect(result).toBeNull(); // Graceful failure
    });
  });

  describe('set()', () => {
    it('should set value with TTL', async () => {
      const mockRedis = (cache as any).redis;
      mockRedis.setex.mockResolvedValue('OK');

      await cache.set('user:123', { name: 'John' }, 300);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'user:123',
        300,
        JSON.stringify({ name: 'John' })
      );
    });

    it('should set value without TTL', async () => {
      const mockRedis = (cache as any).redis;
      mockRedis.set.mockResolvedValue('OK');

      await cache.set('user:123', { name: 'John' });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'user:123',
        JSON.stringify({ name: 'John' })
      );
    });
  });
});
```

**Priority files to test:**
1. `lib/logger.ts` - Core logging
2. `lib/redis-client.ts` - Caching
3. `lib/validation/auth.ts` - Validation schemas
4. `lib/api-wrapper.ts` - API error handling
5. `lib/utils.ts` - Utility functions

**Validation:**
- [ ] 80%+ coverage on lib/* files
- [ ] All edge cases tested
- [ ] Mocks properly configured

---

### Task 4.1.3: API Route Testing
**Priority:** P0 - CRITICAL
**Effort:** 16 hours

**Example: Test auth endpoint:**
```typescript
// app/api/auth/register/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/client', () => ({
  getServiceSupabase: () => ({
    auth: {
      signUp: vi.fn(),
    },
  }),
}));

describe('POST /api/auth/register', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register user with valid data', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject invalid email', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toContainEqual(
      expect.objectContaining({
        field: 'email',
        message: expect.stringContaining('email'),
      })
    );
  });

  it('should reject weak password', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.details).toContainEqual(
      expect.objectContaining({
        field: 'password',
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    const { getServiceSupabase } = await import('@/lib/supabase/client');
    vi.mocked(getServiceSupabase).mockReturnValue({
      auth: {
        signUp: vi.fn().mockRejectedValue(new Error('Database error')),
      },
    } as any);

    mockRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      }),
    });

    const response = await POST(mockRequest);

    expect(response.status).toBe(500);
  });
});
```

**Test coverage targets:**
- Auth endpoints: 100% (critical)
- Vendor endpoints: 80%
- Product endpoints: 80%
- Admin endpoints: 80%

**Validation:**
- [ ] All API routes have tests
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Edge cases covered

---

## 4.2 Component Testing (P1 - HIGH) ⚛️

### Task 4.2.1: Test React Components
**Priority:** P1 - HIGH
**Effort:** 12 hours

**Example: Test ProductCard:**
```typescript
// components/ProductCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

const mockProduct = {
  id: '123',
  name: 'Test Product',
  price: 29.99,
  image_url: '/test-image.jpg',
  description: 'Test description',
};

describe('ProductCard', () => {
  it('should render product information', () => {
    render(<ProductCard product={mockProduct} onAddToCart={vi.fn()} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('should call onAddToCart when button clicked', () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(button);

    expect(onAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('should display sale price if available', () => {
    const productOnSale = {
      ...mockProduct,
      sale_price: 19.99,
    };

    render(<ProductCard product={productOnSale} onAddToCart={vi.fn()} />);

    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toHaveClass('line-through');
  });

  it('should show out of stock badge', () => {
    const outOfStockProduct = {
      ...mockProduct,
      stock_quantity: 0,
    };

    render(<ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />);

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });
});
```

**Priority components to test:**
1. ProductCard
2. Cart components
3. Checkout flow
4. Analytics charts
5. Form components

**Validation:**
- [ ] 60%+ component coverage
- [ ] User interactions tested
- [ ] Accessibility tested

---

## 4.3 E2E Testing (P1 - HIGH) 🎭

### Task 4.3.1: Expand Playwright Test Suite
**Priority:** P1 - HIGH
**Effort:** 16 hours

**Critical user flows to test:**
```typescript
// tests/e2e/checkout-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should complete purchase successfully', async ({ page }) => {
    // 1. Navigate to products
    await page.goto('/products');
    await expect(page).toHaveTitle(/Products/);

    // 2. Add product to cart
    await page.click('[data-testid="product-card-123"] button:has-text("Add to Cart")');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    // 3. Go to cart
    await page.click('[data-testid="cart-button"]');
    await expect(page).toHaveURL(/.*cart/);

    // 4. Verify cart contents
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    const total = await page.locator('[data-testid="cart-total"]').textContent();
    expect(total).toContain('$29.99');

    // 5. Proceed to checkout
    await page.click('button:has-text("Checkout")');
    await expect(page).toHaveURL(/.*checkout/);

    // 6. Fill shipping information
    await page.fill('[name="email"]', 'customer@example.com');
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="address"]', '123 Main St');
    await page.fill('[name="city"]', 'New York');
    await page.fill('[name="zip"]', '10001');

    // 7. Fill payment information (test mode)
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvc"]', '123');

    // 8. Submit order
    await page.click('button:has-text("Place Order")');

    // 9. Verify success
    await expect(page).toHaveURL(/.*order-confirmation/);
    await expect(page.locator('h1')).toContainText('Order Confirmed');
  });

  test('should show validation errors for invalid payment', async ({ page }) => {
    await page.goto('/checkout');

    await page.fill('[name="cardNumber"]', '4000000000000002'); // Declined card
    await page.click('button:has-text("Place Order")');

    await expect(page.locator('[role="alert"]')).toContainText(
      'Your card was declined'
    );
  });
});
```

**Test critical flows:**
1. User registration & login
2. Product browsing & search
3. Add to cart & checkout
4. Vendor dashboard operations
5. Admin panel functions
6. POS transactions

**Validation:**
- [ ] Critical flows tested end-to-end
- [ ] Error scenarios covered
- [ ] Mobile viewport tested
- [ ] All tests passing in CI

---

## 4.4 Documentation (P1 - HIGH) 📚

### Task 4.4.1: Generate API Documentation
**Priority:** P1 - HIGH
**Effort:** 8 hours

**Install OpenAPI generator:**
```bash
npm install --save-dev @openapitools/openapi-generator-cli swagger-ui-react
```

**Create OpenAPI spec:**
```typescript
// lib/openapi.ts
import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'WhaleTools API',
    version: '1.0.0',
    description: 'Cannabis operations platform API',
  },
  servers: [
    {
      url: 'https://yachtclub.vip/api',
      description: 'Production',
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Development',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'SecurePass123!',
                  },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        userId: { type: 'string' },
                        email: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          message: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Add all other endpoints...
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
};
```

**Create API docs page:**
```typescript
// app/api-docs/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { openApiSpec } from '@/lib/openapi';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  return (
    <div>
      <SwaggerUI spec={openApiSpec} />
    </div>
  );
}
```

**Validation:**
- [ ] All API endpoints documented
- [ ] Request/response examples included
- [ ] Authentication documented
- [ ] Accessible at /api-docs

---

### Task 4.4.2: Add JSDoc Comments
**Priority:** P1 - HIGH
**Effort:** 8 hours

**Add comprehensive JSDoc:**
```typescript
/**
 * Validates and registers a new user account
 *
 * @param email - User's email address (must be unique)
 * @param password - User's password (min 8 chars, must contain uppercase, lowercase, number, and special char)
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Promise resolving to user ID and session token
 * @throws {ValidationError} If input validation fails
 * @throws {DuplicateEmailError} If email already exists
 * @throws {DatabaseError} If database operation fails
 *
 * @example
 * ```typescript
 * const user = await registerUser({
 *   email: 'john@example.com',
 *   password: 'SecurePass123!',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 * console.log(user.userId); // "uuid-here"
 * ```
 */
export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ userId: string; token: string }> {
  // Implementation...
}
```

**Priority files for JSDoc:**
1. All public API functions
2. Utility functions in lib/
3. Custom hooks
4. Component props interfaces

**Validation:**
- [ ] All public functions documented
- [ ] Parameters explained
- [ ] Return values documented
- [ ] Examples provided

---

## 4.5 Phase 4 Deliverables Checklist

- [ ] **Testing**
  - [ ] Vitest configured and running
  - [ ] 80%+ coverage on lib/* files
  - [ ] API routes tested (60%+ coverage)
  - [ ] Components tested (60%+ coverage)
  - [ ] E2E tests for critical flows
  - [ ] All tests passing in CI

- [ ] **Documentation**
  - [ ] OpenAPI spec generated
  - [ ] API docs accessible
  - [ ] JSDoc comments added
  - [ ] README updated

- [ ] **Code Quality**
  - [ ] ESLint passing
  - [ ] TypeScript strict mode
  - [ ] No console.log in production
  - [ ] All TODOs addressed

**Phase 4 Success Metrics:**
- ✅ 80%+ test coverage overall
- ✅ All critical flows E2E tested
- ✅ API documentation complete
- ✅ Zero TypeScript errors
- ✅ Production-ready codebase

---

# FINAL ASSESSMENT

## Before Phases
**Grade: C+ (72/100)**
- Security vulnerabilities
- Type safety issues
- Performance problems
- Inadequate testing

## After All 4 Phases
**Expected Grade: A (92/100)**
- ✅ Zero security vulnerabilities
- ✅ Full type safety
- ✅ Optimized performance
- ✅ Comprehensive testing
- ✅ Production-ready

## Total Effort Summary

| Phase | Hours | Duration | Team Size |
|-------|-------|----------|-----------|
| Phase 1 | 80 | 2 weeks | 2 engineers |
| Phase 2 | 80 | 2 weeks | 2 engineers |
| Phase 3 | 80 | 2 weeks | 2 engineers |
| Phase 4 | 80 | 2 weeks | 2 engineers |
| **Total** | **320** | **8 weeks** | **2 engineers** |

## Recommended Team Structure
- **Senior Engineer (Phase 1-2):** Security & architecture fixes
- **Mid-Level Engineer (Phase 3-4):** Performance & testing
- **Code Review:** Both engineers review each other's work

---

# TRACKING & MONITORING

## Weekly Check-ins
- Monday: Sprint planning, assign tasks
- Wednesday: Progress check, blockers discussion
- Friday: Code review, update roadmap

## Success Metrics Dashboard

Create this in your monitoring tool:

```typescript
// lib/metrics.ts
export const qualityMetrics = {
  security: {
    vulnerabilities: 0, // Target: 0
    authCoverage: 85, // Target: 100%
  },
  performance: {
    apiResponseTime: 100, // Target: <100ms
    cacheHitRate: 80, // Target: >80%
    bundleSize: 450, // Target: <500KB
  },
  quality: {
    testCoverage: 80, // Target: >80%
    typeErrors: 0, // Target: 0
    eslintErrors: 0, // Target: 0
  },
  reliability: {
    errorRate: 0.001, // Target: <0.1%
    uptime: 99.9, // Target: >99.9%
  },
};
```

## Git Workflow
```bash
# Feature branch naming
git checkout -b phase-1/fix-security-vulnerabilities
git checkout -b phase-2/add-type-safety
git checkout -b phase-3/optimize-performance
git checkout -b phase-4/add-testing

# Commit messages
git commit -m "fix(security): rotate database credentials and remove from git history"
git commit -m "feat(types): replace all any types with proper TypeScript types"
git commit -m "perf(cache): add Redis caching to domain lookups"
git commit -m "test(api): add comprehensive tests for auth endpoints"
```

---

**This roadmap will transform your codebase from C+ to A-grade Apple engineering standards.**

**Start Date:** TBD
**Target Completion:** 8 weeks from start
**Good luck! You got this. 🚀**
