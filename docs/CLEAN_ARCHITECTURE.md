# Whaletools Native - Clean Architecture

## Philosophy

**Start fresh, start right.** This is NOT a port - it's a **v2 rewrite** using battle-tested patterns.

### Core Principles

1. **No Bloat** - Only add what you need, when you need it
2. **No Duplication** - DRY from day 1
3. **Type Safe** - TypeScript strict mode
4. **Testable** - Clean separation of concerns
5. **Scalable** - Easy to add features without breaking things

---

## Project Structure

```
whaletools-native/
├── src/
│   ├── app/                          # Expo Router (screens)
│   │   ├── (auth)/                   # Auth stack
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── vendor-login.tsx
│   │   │
│   │   ├── (vendor)/                 # Vendor app
│   │   │   ├── _layout.tsx           # Tab navigation
│   │   │   ├── dashboard.tsx
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── settings.tsx
│   │   │
│   │   ├── (pos)/                    # POS app
│   │   │   ├── _layout.tsx
│   │   │   └── register.tsx
│   │   │
│   │   └── _layout.tsx               # Root layout
│   │
│   ├── components/                   # Reusable UI
│   │   ├── ui/                       # Base components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts             # Barrel export
│   │   │
│   │   ├── pos/                      # Feature-specific
│   │   │   ├── Cart.tsx
│   │   │   ├── Scanner.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── vendor/                   # Feature-specific
│   │       ├── ProductCard.tsx
│   │       └── index.ts
│   │
│   ├── features/                     # Business logic (isolated)
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── pos/
│   │   │   ├── hooks/
│   │   │   │   ├── useCart.ts
│   │   │   │   └── useScanner.ts
│   │   │   ├── services/
│   │   │   │   ├── cart.service.ts
│   │   │   │   └── payment.service.ts
│   │   │   └── types.ts
│   │   │
│   │   └── products/
│   │       ├── hooks/
│   │       │   └── useProducts.ts
│   │       ├── services/
│   │       │   └── products.service.ts
│   │       └── types.ts
│   │
│   ├── lib/                          # Shared utilities
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabase config
│   │   │   └── types.ts             # DB types
│   │   │
│   │   ├── utils/
│   │   │   ├── currency.ts
│   │   │   ├── date.ts
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   │
│   │   └── constants/
│   │       ├── colors.ts
│   │       ├── spacing.ts
│   │       └── config.ts
│   │
│   ├── types/                        # Global types
│   │   ├── database.ts              # Supabase generated
│   │   ├── api.ts
│   │   └── models.ts
│   │
│   └── stores/                       # Global state (Zustand)
│       ├── auth.store.ts
│       ├── cart.store.ts
│       └── settings.store.ts
│
├── assets/
│   ├── images/
│   └── fonts/
│
├── app.json                          # Expo config
├── eas.json                          # Build config
├── tsconfig.json                     # TypeScript config
└── package.json
```

---

## Architecture Layers

### **1. Presentation Layer** (`/src/app`, `/src/components`)

**Responsibility:** UI only. No business logic.

```tsx
// ✅ GOOD - UI component, no business logic
export function ProductCard({ product, onAddToCart }) {
  return (
    <Card>
      <Text>{product.name}</Text>
      <Button onPress={() => onAddToCart(product)}>
        Add to Cart
      </Button>
    </Card>
  )
}
```

```tsx
// ❌ BAD - Business logic in component
export function ProductCard({ product }) {
  const addToCart = async () => {
    const response = await fetch('/api/cart', { /* ... */ })
    // NO! Move to service layer
  }
}
```

### **2. Feature Layer** (`/src/features`)

**Responsibility:** Business logic, hooks, services

```tsx
// /src/features/pos/services/cart.service.ts
export class CartService {
  static async addItem(cartId: string, item: CartItem) {
    const { data, error } = await supabase
      .from('cart_items')
      .insert({ cart_id: cartId, ...item })

    if (error) throw error
    return data
  }
}

// /src/features/pos/hooks/useCart.ts
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = async (item: Product) => {
    const cartItem = await CartService.addItem(cartId, item)
    setItems([...items, cartItem])
  }

  return { items, addItem }
}
```

### **3. Infrastructure Layer** (`/src/lib`)

**Responsibility:** External services, utilities

```tsx
// /src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## Design Patterns

### **1. Service Pattern**

Encapsulate API calls in services:

```tsx
// /src/features/products/services/products.service.ts
export class ProductsService {
  static async getAll(vendorId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)

    if (error) throw error
    return data
  }

  static async create(product: CreateProductDTO) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
```

### **2. Custom Hooks Pattern**

Wrap services in hooks for React integration:

```tsx
// /src/features/products/hooks/useProducts.ts
export function useProducts(vendorId: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [vendorId])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await ProductsService.getAll(vendorId)
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { products, loading, error, refetch: loadProducts }
}
```

### **3. Store Pattern (Zustand)**

Global state for cross-cutting concerns:

```tsx
// /src/stores/auth.store.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  vendorId: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  vendorId: null,

  login: async (email, password) => {
    const user = await AuthService.login(email, password)
    set({ user, vendorId: user.vendor_id })
  },

  logout: async () => {
    await AuthService.logout()
    set({ user: null, vendorId: null })
  }
}))
```

---

## Naming Conventions

### **Files**

- Components: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
- Hooks: `use*.ts` (e.g., `useProducts.ts`)
- Services: `*.service.ts` (e.g., `products.service.ts`)
- Types: `*.types.ts` or `types.ts`
- Utils: `camelCase.ts` (e.g., `currency.ts`)

### **Variables**

- Components: `PascalCase` (e.g., `ProductCard`)
- Functions: `camelCase` (e.g., `addToCart`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_URL`)
- Types/Interfaces: `PascalCase` (e.g., `Product`, `CartItem`)

---

## Type Safety

### **Use Supabase Generated Types**

```bash
# Generate types from your Supabase schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

```tsx
// /src/types/database.ts (generated)
export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          price: number
          // ...
        }
      }
    }
  }
}

// Use in your code
import { Database } from '@/types/database'
type Product = Database['public']['Tables']['products']['Row']
```

### **DTOs for API Boundaries**

```tsx
// /src/features/products/types.ts
export interface CreateProductDTO {
  name: string
  price: number
  vendor_id: string
  category_id: string
}

export interface UpdateProductDTO {
  id: string
  name?: string
  price?: number
}
```

---

## Error Handling

### **Consistent Error Pattern**

```tsx
// /src/lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}
```

```tsx
// In services
static async getById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new AppError(error.message, 'DB_ERROR')
  if (!data) throw new NotFoundError('Product')

  return data
}
```

---

## Component Guidelines

### **1. Single Responsibility**

Each component does ONE thing:

```tsx
// ✅ GOOD - Single purpose
export function ProductImage({ uri }: { uri: string }) {
  return (
    <Image source={{ uri }} style={styles.image} resizeMode="cover" />
  )
}

export function ProductPrice({ price }: { price: number }) {
  return <Text style={styles.price}>{formatCurrency(price)}</Text>
}

export function ProductCard({ product }) {
  return (
    <Card>
      <ProductImage uri={product.image} />
      <ProductPrice price={product.price} />
    </Card>
  )
}
```

### **2. Props Interface**

Always define props interface:

```tsx
interface ProductCardProps {
  product: Product
  onPress?: () => void
  showActions?: boolean
}

export function ProductCard({
  product,
  onPress,
  showActions = true
}: ProductCardProps) {
  // ...
}
```

### **3. Barrel Exports**

Use index.ts for clean imports:

```tsx
// /src/components/ui/index.ts
export { Button } from './Button'
export { Input } from './Input'
export { Card } from './Card'

// Usage
import { Button, Input, Card } from '@/components/ui'
```

---

## Testing Strategy

### **Unit Tests**

Test services and utilities:

```tsx
// /src/features/products/services/__tests__/products.service.test.ts
describe('ProductsService', () => {
  it('should fetch all products', async () => {
    const products = await ProductsService.getAll('vendor-123')
    expect(products).toHaveLength(10)
  })
})
```

### **Integration Tests**

Test hooks with services:

```tsx
// /src/features/products/hooks/__tests__/useProducts.test.ts
describe('useProducts', () => {
  it('should load products on mount', async () => {
    const { result } = renderHook(() => useProducts('vendor-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.products).toHaveLength(10)
    })
  })
})
```

---

## Performance Optimizations

### **1. Memoization**

```tsx
import { memo, useMemo } from 'react'

export const ProductCard = memo(function ProductCard({ product }) {
  const formattedPrice = useMemo(
    () => formatCurrency(product.price),
    [product.price]
  )

  return <Card>{/* ... */}</Card>
})
```

### **2. Lazy Loading**

```tsx
// /src/app/(vendor)/analytics.tsx
import { lazy } from 'react'

const AnalyticsChart = lazy(() => import('@/components/charts/AnalyticsChart'))

export default function AnalyticsScreen() {
  return (
    <Suspense fallback={<Loading />}>
      <AnalyticsChart />
    </Suspense>
  )
}
```

### **3. List Optimization**

```tsx
import { FlashList } from '@shopify/flash-list'

<FlashList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  estimatedItemSize={100}
  keyExtractor={(item) => item.id}
/>
```

---

## Configuration

### **Environment Variables**

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_API_URL=https://api.whaletools.com
```

```tsx
// /src/lib/constants/config.ts
export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  },
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  },
} as const
```

---

## Migration from Web

### **What to Copy**

✅ Copy these directly:
- `lib/id-scanner/aamva-parser.ts` → `/src/lib/utils/aamva.ts`
- Business logic from services
- Validation schemas
- Type definitions

### **What to Rewrite**

🔨 Rewrite these:
- All components (styling conversion)
- Navigation
- Platform-specific features (camera, file upload)

### **What to Skip**

❌ Leave behind:
- Duplicate code
- Unused components
- Tech debt
- Experimental features

---

## Next Steps

1. ✅ Create project structure
2. ✅ Set up base UI components
3. ✅ Configure Supabase
4. ✅ Build auth flow
5. ✅ Start with POS (highest value)

This is your foundation for a **production-grade** app!
