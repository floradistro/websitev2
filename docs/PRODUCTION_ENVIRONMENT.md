# Production Environment Configuration

## Required Environment Variables

### Critical (Must Have)

```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://uaednwpxursknmwdeejn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL=https://fine-thrush-32035.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX0jAAIncDJkMjQyOWU1NmExMDE0YjMxYWJlNDVlMGQxOGZiZTgyOHAyMzIwMzU

# Node Environment
NODE_ENV=production
```

### Important (Highly Recommended)

```bash
# Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://f4add3d27acaad32544e61edfb63b86b@o4510333066674176.ingest.us.sentry.io/4510333080698880
SENTRY_ORG=whaletools
SENTRY_PROJECT=javascript-nextjs

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yachtclub.vip
NEXT_PUBLIC_APP_URL=https://yachtclub.vip
APP_NAME=whaletools

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-...
EXASEARCH_API_KEY=c6064aa5-e664-4bb7-9de9-d09ff153aa53
```

### Optional (Feature-Specific)

```bash
# WordPress Integration (for payments)
WORDPRESS_API_URL=https://api.floradistro.com
WORDPRESS_CONSUMER_KEY=ck_...
WORDPRESS_CONSUMER_SECRET=cs_...

# Image Processing
REMOVE_BG_API_KEY=CTYgh57QAP1FvqrEAHAwzFqG
REPLICATE_API_TOKEN=r8_...

# Alpine IQ Integration
ALPINEIQ_API_KEY=U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw
ALPINEIQ_API_URL=https://lab.alpineiq.com
ALPINEIQ_USER_ID=3999

# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23lirDxqTpsPNKBJyd
GITHUB_CLIENT_ID=Ov23lirDxqTpsPNKBJyd
GITHUB_CLIENT_SECRET=9119b7045fd4d57a7917bedc63607462f5ddb748

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyB29Ebv0A4fYIY-ZB08khDUQ227oTqevaE

# Apple Wallet
APPLE_PASS_TYPE_ID=pass.com.whaletools.wallet
APPLE_TEAM_ID=Y9Q7L7SGR3
APPLE_WALLET_CERT_PASSWORD=test1234
```

## Vercel Deployment Configuration

### Environment Variables Setup

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all variables from "Critical" section
3. Add variables from "Important" section
4. Add optional variables as needed
5. Set environment to "Production"

### Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Environment-Specific Variables

**Production:**
- `NODE_ENV=production`
- `NEXT_PUBLIC_SITE_URL=https://yachtclub.vip`

**Preview:**
- `NODE_ENV=preview`
- `NEXT_PUBLIC_SITE_URL=https://preview.yachtclub.vip`

**Development:**
- `NODE_ENV=development`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

## Security Checklist

### ✅ Completed
- [x] Service role keys are NOT exposed as NEXT_PUBLIC_*
- [x] Redis cache configured with Upstash REST API
- [x] Rate limiting enabled on all auth/vendor routes
- [x] Error handling with structured logging
- [x] Cache namespacing configured
- [x] Connection pooling for database
- [x] DRY wrappers on 5 high-value routes

### ⏳ To Verify Before Deploy
- [ ] Verify CORS configuration in production
- [ ] Test rate limiting in production environment
- [ ] Verify Sentry error tracking works
- [ ] Check Redis connection in production
- [ ] Verify all critical routes have authentication
- [ ] Test cache invalidation strategies

## Performance Configuration

### Caching Strategy

**Redis (Upstash):**
- Multi-tier caching (L1 memory → L2 Redis → L3 database)
- TTL: 120s (inventory) to 600s (vendor data)
- Automatic fallback to in-memory cache
- Cache key namespacing: `whaletools:production:{key}`

**Rate Limiting:**
- Auth endpoints: 10 req/15min
- API endpoints: 100 req/min
- Admin endpoints: 50 req/min
- Public endpoints: 30 req/min

### Database Connection

**Supabase:**
- Connection pooling enabled
- Row-level security (RLS) policies active
- Read replicas for analytics queries
- Automatic vacuum and analyze

## Monitoring & Observability

### Error Tracking (Sentry)
- Real-time error alerts
- Performance monitoring
- Release tracking
- User feedback integration

### Performance Monitoring
- Redis cache hit rates
- Database query performance
- API response times
- Route handler execution time

### Logs
- Structured JSON logging
- Error context propagation
- Request ID tracking
- Vendor ID tracking

## Deployment Checklist

### Pre-Deployment
1. ✅ Run `npm run build` locally - should succeed
2. ✅ Run `npm test` - all tests passing
3. ✅ Run security audit - no critical issues
4. ✅ Verify environment variables in Vercel
5. ✅ Check Redis connection
6. ⏳ Run smoke tests against staging

### Deployment
1. ⏳ Deploy to Vercel production
2. ⏳ Verify build succeeds
3. ⏳ Check deployment logs
4. ⏳ Run post-deployment smoke tests
5. ⏳ Monitor error rates in Sentry

### Post-Deployment
1. ⏳ Test critical user flows (login, checkout, inventory)
2. ⏳ Verify cache is working (check Redis)
3. ⏳ Verify rate limiting is working
4. ⏳ Check performance metrics
5. ⏳ Monitor for errors in first hour

## Rollback Plan

### If Issues Occur:
1. Revert to previous deployment in Vercel
2. Check error logs in Sentry
3. Verify environment variables
4. Test in preview environment first
5. Re-deploy after fixes

### Health Check Endpoints:
- `/api/health` - Basic health check
- `/api/health/redis` - Redis connection check
- `/api/health/database` - Database connection check

## Contact & Support

**Critical Issues:**
- Check Sentry for error details
- Review Vercel deployment logs
- Check Redis status at Upstash dashboard
- Review Supabase logs

**Team:**
- Primary: Your team contact
- Backup: Secondary contact
- Escalation: Manager/Lead

---

**Status:** Ready for production deployment
**Date:** January 10, 2025
**Version:** 2.0 (Post Phase 2 DRY Migration)
