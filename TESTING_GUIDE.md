# 🧪 PERFORMANCE TESTING GUIDE

## How to Verify Optimizations

### 1. Development Testing

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

**What to check:**
- ✅ Pages load fast
- ✅ No console errors
- ✅ Images load progressively
- ✅ Smooth scrolling
- ✅ Cart updates instantly
- ✅ Filters respond quickly

---

### 2. Production Build Test

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Check build output for:**
- ✅ Bundle sizes (should be ~300KB total)
- ✅ Static pages generated
- ✅ Image optimization messages
- ✅ No build errors

---

### 3. Lighthouse Testing

**Chrome DevTools:**
1. Open site in Chrome
2. Right-click → Inspect
3. Lighthouse tab
4. Select "Desktop" or "Mobile"
5. Click "Generate report"

**Target Scores:**
- Performance: 90+ ✅
- Accessibility: 95+ ✅
- Best Practices: 95+ ✅
- SEO: 100 ✅

**Key Metrics:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

---

### 4. Network Throttling Test

**Chrome DevTools:**
1. Open DevTools (F12)
2. Network tab
3. Throttling dropdown → "Fast 3G"
4. Reload page

**What to check:**
- Homepage loads in < 3 seconds
- Images load progressively
- Content appears quickly
- No layout shifts

---

### 5. WebPageTest

**Online Testing:**
1. Visit https://www.webpagetest.org/
2. Enter your URL
3. Select location: "Virginia, USA"
4. Select device: "Moto G4"
5. Click "Start Test"

**Target Results:**
- First Contentful Paint: < 1.8s
- Speed Index: < 3.0s
- Total Blocking Time: < 200ms
- Largest Contentful Paint: < 2.5s

---

### 6. Real Device Testing

**Mobile Testing:**
1. Deploy to Vercel
2. Test on real iPhone/Android
3. Check on slow 3G connection
4. Test in airplane mode (cached)

**What to check:**
- Fast load times
- Smooth scrolling
- Touch interactions work well
- Images optimized for mobile

---

### 7. Cache Verification

**Test ISR Caching:**
```bash
# First load (fresh data from API)
curl -I https://your-site.com/

# Check headers:
# Cache-Control: s-maxage=300, stale-while-revalidate
# X-Vercel-Cache: MISS (first load)

# Second load (from cache)
curl -I https://your-site.com/

# X-Vercel-Cache: HIT (cached!)
```

---

### 8. Image Optimization Check

**Verify WebP/AVIF:**
1. Open site
2. Right-click on product image
3. "Open image in new tab"
4. Check URL: `/_next/image?url=...&w=384&q=85`

**In DevTools Network tab:**
- Images should be WebP or AVIF
- Size should be 60-80% smaller
- Status: 200 (first load) or 304 (cached)

---

### 9. Bundle Size Analysis

**Analyze JavaScript bundles:**
```bash
npm run build

# Check output for:
# ○ Static pages (pre-rendered as static)
# ƒ Dynamic pages (server-side generated)
# Λ ISR pages (static with revalidation)
```

**Install bundle analyzer (optional):**
```bash
npm install -D @next/bundle-analyzer

# Add to next.config.ts:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })
# module.exports = withBundleAnalyzer(nextConfig)

# Run analysis:
ANALYZE=true npm run build
```

---

### 10. Performance Monitoring

**Vercel Analytics (Recommended):**
```bash
npm install @vercel/analytics

# Add to app/layout.tsx:
# import { Analytics } from '@vercel/analytics/react';
# <Analytics />
```

**Real User Monitoring:**
- LCP, FID, CLS tracked automatically
- View in Vercel Dashboard → Analytics
- See real user performance data

---

## 🎯 Performance Checklist

Before deploying, verify:

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Lighthouse score 90+
- [ ] Images load as WebP/AVIF
- [ ] Pages cached (check headers)
- [ ] Fast load on mobile
- [ ] Smooth scrolling
- [ ] Cart works correctly
- [ ] Filters respond quickly
- [ ] Search works fast
- [ ] All images optimized

---

## 🐛 Common Issues & Fixes

### Issue: Images not optimizing
**Fix:** Check that images are using Next.js `Image` component, not `<img>` tags

### Issue: Pages not caching
**Fix:** Verify `export const revalidate = 300` is present in page files

### Issue: Slow API responses
**Fix:** Check WordPress API is reachable and responding quickly

### Issue: Large bundle size
**Fix:** Ensure dynamic imports are working (`const Component = dynamic(...)`)

### Issue: Layout shifts (high CLS)
**Fix:** Add width/height to images, or use `fill` with proper container

---

## 📊 Expected Results

### Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LCP | 4.5s | 1.5s | 67% ⬇️ |
| FID | 300ms | 80ms | 73% ⬇️ |
| CLS | 0.15 | 0.05 | 67% ⬇️ |
| TTI | 6s | 2s | 67% ⬇️ |
| Bundle | 800KB | 300KB | 62% ⬇️ |
| Load Time | 8s | 2s | 75% ⬇️ |

---

## 🚀 Deploy

```bash
# Push to GitHub (triggers Vercel deploy)
git add .
git commit -m "Performance optimizations complete"
git push origin main

# Verify deployment in Vercel Dashboard
```

**Post-Deploy:**
1. Test production URL
2. Run Lighthouse on live site
3. Check Vercel Analytics
4. Monitor for errors in logs

---

## ✅ Success Criteria

Your optimizations are successful if:

1. ✅ Lighthouse Performance score: 90+
2. ✅ Core Web Vitals: All green
3. ✅ Homepage loads in < 2s on 3G
4. ✅ No console errors
5. ✅ Images automatically optimized
6. ✅ Pages cached at edge
7. ✅ Smooth user interactions
8. ✅ Mobile experience excellent

**If all checks pass: 🎉 READY FOR PRODUCTION!**

