# WhaleTools

> The first complete operations platform built specifically for cannabis retailers, distributors, and brands.

WhaleTools is a multi-tenant SaaS platform that provides dispensaries, distributors, and brands with everything they need to run their cannabis operations—from point-of-sale systems and online menus to inventory management, compliance tracking, wholesale ordering, and marketing automation.

## 🚀 Features

- **Point of Sale (POS)**: Complete POS system with register management, cash movements, and session tracking
- **E-Commerce**: Online menus, product catalogs, shopping cart, and checkout
- **Inventory Management**: Real-time inventory tracking across multiple locations
- **Compliance**: COA (Certificate of Analysis) tracking, age verification, and regulatory compliance
- **Wholesale B2B**: Multi-vendor marketplace with bulk ordering and commission tracking
- **Analytics & Reporting**: Real-time dashboards, sales trends, and product analytics
- **Marketing Tools**: Customer loyalty programs, email campaigns, and Apple Wallet passes
- **TV Displays**: Digital menu boards for in-store display
- **AI-Powered Features**: Automated product tagging, strain data autofill, and content generation

## 🛠 Tech Stack

### Core

- **Framework**: [Next.js 15](https://nextjs.org/) (React 19, App Router)
- **Language**: TypeScript 5
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)

### Infrastructure

- **Hosting**: Vercel (Edge Functions + Serverless)
- **Storage**: Supabase Storage + Cloudinary
- **Caching**: Upstash Redis
- **Monitoring**: [Sentry](https://sentry.io/)
- **Analytics**: Custom analytics engine

### Key Libraries

- **UI Components**: Headless UI, Lucide Icons, Framer Motion
- **State Management**: React Query (TanStack Query), SWR
- **Forms & Validation**: Zod schemas
- **AI/ML**: Anthropic Claude API, Exa search
- **Payment Processing**: Authorize.Net, Dejavoo
- **Barcode Scanning**: Scandit
- **Charts**: Recharts
- **PDF/Excel**: Sharp, XLSX, Passkit Generator

## 📋 Prerequisites

- Node.js 20.x or later
- npm or yarn
- Supabase account (for database)
- Sentry account (for error tracking)
- Anthropic API key (for AI features)

## 🏁 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd whaletools
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (for direct connections)
DATABASE_URL=postgresql://user:password@host:port/database

# Sentry
SENTRY_AUTH_TOKEN=your_sentry_auth_token
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# AI Services
ANTHROPIC_API_KEY=your_anthropic_api_key
EXA_API_KEY=your_exa_api_key

# Payment Processors
AUTHORIZE_NET_API_LOGIN_ID=your_api_login
AUTHORIZE_NET_TRANSACTION_KEY=your_transaction_key

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Database Setup

Run the Supabase migrations:

```bash
# Apply migrations from supabase/migrations/
# You can use Supabase CLI or run them directly in your Supabase dashboard
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

For HTTPS development (required for Apple Pay, Apple Wallet, etc.):

```bash
npm run dev:https
```

This will run the app at [https://localhost:3443](https://localhost:3443)

## 📁 Project Structure

```
whaletools/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API routes
│   │   ├── admin/        # Admin-only endpoints
│   │   ├── vendor/       # Vendor management endpoints
│   │   ├── pos/          # Point of Sale endpoints
│   │   └── ...
│   ├── admin/            # Admin dashboard pages
│   ├── vendor/           # Vendor dashboard pages
│   ├── pos/              # POS interface pages
│   └── ...
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── vendor/           # Vendor-specific components
│   └── ...
├── lib/                   # Utility functions and configurations
│   ├── supabase/         # Supabase client configuration
│   ├── ai/               # AI utilities (Claude, autofill, etc.)
│   ├── payment-processors/ # Payment processing
│   ├── logger.ts         # Structured logging (Sentry integration)
│   └── ...
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── supabase/             # Supabase migrations and config
├── scripts/              # Utility scripts
├── tests/                # Playwright E2E tests
└── public/               # Static assets
```

## 🏗 Architecture

### Multi-Tenancy

WhaleTools is a multi-tenant platform where each vendor has:

- Isolated data via Supabase Row Level Security (RLS)
- Multiple locations with inventory sync
- Custom branding and domain configuration
- Role-based access control (RBAC)

### Authentication Flow

1. **Admin**: bcrypt-hashed credentials stored in PostgreSQL
2. **Vendor Users**: Supabase Auth with email/password
3. **Customers**: Optional account creation or guest checkout
4. **POS Registers**: Terminal-based authentication with session management

### Data Flow

```
Client → Next.js App Router → API Routes → Supabase → PostgreSQL
                           ↓
                        Redis Cache
                           ↓
                      Sentry Logging
```

### Real-time Features

- Inventory updates across locations
- Live POS session synchronization
- Order status updates
- Analytics dashboard refresh

## 🎨 Development Conventions

### Logging

**Always use the structured logger instead of console.\***

```typescript
import { logger } from "@/lib/logger";

// ✅ Good
logger.info("User logged in", { userId: "123", email: "user@example.com" });
logger.error("Payment failed", error, { orderId: "456", amount: 99.99 });

// ❌ Bad
console.log("User logged in");
console.error("Payment failed:", error);
```

Logger levels:

- `logger.trace()` - Extremely detailed debugging (dev only)
- `logger.debug()` - Detailed debugging (dev only)
- `logger.info()` - Normal operational messages
- `logger.warn()` - Warnings for potential issues
- `logger.error()` - Error conditions (recoverable)
- `logger.fatal()` - Critical system failures

### Component Guidelines

1. **Server Components by Default**: Use server components unless client interactivity is required
2. **"use client" Only When Needed**: Add `"use client"` directive only for components that need:
   - Event handlers (onClick, onChange, etc.)
   - React hooks (useState, useEffect, etc.)
   - Browser APIs (localStorage, window, etc.)
   - Animation libraries (Framer Motion, etc.)

3. **Type Safety**: Always define proper TypeScript types
4. **Error Handling**: Use try-catch blocks and log errors with context
5. **Loading States**: Show loading indicators for async operations

### Code Style

- **Formatting**: Prettier (run `npm run format`)
- **Linting**: ESLint (run `npm run lint`)
- **Type Checking**: TypeScript (run `npm run type-check`)

Pre-commit hooks automatically format and lint your code.

### API Routes

All API routes follow this pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    // Perform operation
    // Return response

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("API error description", error, { endpoint: "/api/..." });
    return NextResponse.json({ error: "User-friendly error message" }, { status: 500 });
  }
}
```

## 🧪 Testing

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### E2E Tests

```bash
npx playwright test
```

## 📜 Available Scripts

| Script                        | Description                                 |
| ----------------------------- | ------------------------------------------- |
| `npm run dev`                 | Start development server on port 3000       |
| `npm run dev:https`           | Start HTTPS development server on port 3443 |
| `npm run build`               | Build production bundle                     |
| `npm start`                   | Start production server                     |
| `npm run type-check`          | Run TypeScript type checking                |
| `npm run lint`                | Run ESLint                                  |
| `npm run lint:fix`            | Run ESLint and auto-fix issues              |
| `npm run format`              | Format code with Prettier                   |
| `npm run format:check`        | Check code formatting                       |
| `npm run generate:admin-hash` | Generate admin password hash                |
| `npm run db:optimize`         | Run database optimization                   |
| `npm run analyze`             | Analyze bundle size                         |
| `npm run nightly`             | Run nightly maintenance tasks               |

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy!

Vercel automatically:

- Builds and deploys on every push
- Provides preview deployments for pull requests
- Handles edge functions and serverless functions
- Configures CDN and caching

### Environment Variables

Make sure all required environment variables are set in your Vercel project settings.

## 🤝 Contributing

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes
3. Run tests and linting: `npm run lint && npm run type-check`
4. Commit with descriptive messages
5. Push and create a pull request
6. Request code review
7. Merge after approval

### Commit Messages

Follow conventional commits:

```
feat: Add wholesale ordering system
fix: Correct inventory sync issue
docs: Update README with setup instructions
refactor: Simplify product query logic
perf: Optimize image loading
```

## 📝 Code Quality Checklist

Before submitting a PR, ensure:

- [ ] TypeScript types are properly defined
- [ ] All console._ calls replaced with logger._
- [ ] Error handling is implemented
- [ ] Loading states are shown for async operations
- [ ] Code is formatted with Prettier
- [ ] ESLint passes with no errors
- [ ] TypeScript compiles with no errors
- [ ] Component uses server component unless client features needed
- [ ] API routes have proper error handling and logging
- [ ] Sensitive data is not logged or exposed

## 📚 Additional Documentation

- [API Documentation](./docs/API.md) _(coming soon)_
- [Database Schema](./docs/SCHEMA.md) _(coming soon)_
- [Deployment Guide](./docs/DEPLOYMENT.md) _(coming soon)_
- [Architecture Decision Records](./docs/ADR.md) _(coming soon)_

## 🐛 Troubleshooting

### Common Issues

**Port already in use**

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

**Database connection issues**

- Verify your Supabase credentials
- Check that RLS policies are configured correctly
- Ensure your IP is allowed in Supabase settings

**Build errors**

- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run type-check`

## 📚 Documentation

### Quick Start
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Detailed setup and configuration guide

### Current Status
- **[Test Reports](docs/current/)** - Latest testing results and production readiness
- **[docs/INDEX.md](docs/INDEX.md)** - Complete documentation index

### Archive
- **[Completed Fixes](docs/archive/fixes/)** - All P0/P1 fixes (12 files)
- **[Deployment Guides](docs/archive/deployment/)** - Migration deployment steps (8 files)
- **[Analysis](docs/archive/analysis/)** - Architecture and system analysis (10 files)

**Total Documentation:** 34 organized files covering all aspects of the system.

---

## 📄 License

Proprietary - All Rights Reserved

## 🙋 Support

For issues and questions:

- Create a GitHub issue
- Contact: support@whaletools.com

---

Built with ❤️ for the cannabis industry
