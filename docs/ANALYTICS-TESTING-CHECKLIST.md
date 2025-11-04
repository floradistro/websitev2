# Analytics Testing Checklist

## ✅ Pre-Deployment Testing

Use this checklist to verify everything works before deploying to production.

---

## 🧪 Marketing Analytics (`/vendor/marketing/analytics`)

### **Visual Tests**
- [ ] Page loads without errors
- [ ] No console errors in browser DevTools
- [ ] All stat cards display properly
- [ ] Time-series chart renders with animations
- [ ] Metric switcher buttons work (sent/opened/clicked/revenue)
- [ ] Chart switches smoothly between metrics
- [ ] All numbers formatted correctly (currency, percentages)

### **Data Tests**
- [ ] Trend indicators show real percentages (NOT 12%, 8%, 3%, 24%)
- [ ] Trend arrows point correct direction (up/down/neutral)
- [ ] Revenue numbers match campaign data
- [ ] Open rate calculation is correct
- [ ] Click rate calculation is correct
- [ ] Top campaigns sorted by revenue
- [ ] Channel performance splits email/SMS correctly

### **Interaction Tests**
- [ ] Time range selector works (7d, 30d, 90d, all)
- [ ] Channel filter works (all, email, sms)
- [ ] Data updates when changing filters
- [ ] Hover states work on all interactive elements
- [ ] Chart tooltip shows on hover

### **Loading & Error Tests**
- [ ] Loading spinner appears on initial load
- [ ] Loading state clears when data arrives
- [ ] Error message shows if API fails (test by killing server)
- [ ] Retry button works
- [ ] Empty state shows if no campaigns exist

### **Performance Tests**
- [ ] Page loads in < 2 seconds
- [ ] Chart animation is smooth (60fps)
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] Re-renders are minimal (check React DevTools Profiler)

---

## 🧪 Vendor Analytics (`/vendor/analytics`)

### **Visual Tests**
- [ ] Page loads without errors
- [ ] No console errors in browser DevTools
- [ ] All 4 stat cards display (Revenue, Profit Margin, Turnover, Avg Order)
- [ ] Revenue trend chart renders
- [ ] Top products list displays
- [ ] Cost analysis card shows
- [ ] Inventory health card shows

### **Data Tests**
- [ ] Revenue total formatted as currency
- [ ] Profit margin shows as percentage
- [ ] Turnover rate shows as multiplier (e.g., "2.5x")
- [ ] Average order value formatted as currency
- [ ] Product revenues formatted correctly
- [ ] Product margins show as percentages
- [ ] Low stock count shows or "All Good"

### **Interaction Tests**
- [ ] Time range selector works (7D, 30D, 90D, 1Y)
- [ ] Data updates when changing time range
- [ ] Product hover states work
- [ ] All formatting is consistent

### **Loading & Error Tests**
- [ ] Loading spinner appears on initial load
- [ ] Loading state clears when data arrives
- [ ] Error message shows if API fails
- [ ] Retry button works
- [ ] Empty state shows if no data

### **Performance Tests**
- [ ] Page loads in < 2 seconds
- [ ] Chart animation is smooth
- [ ] No memory leaks
- [ ] Re-renders are minimal

---

## 🔒 Error Boundary Tests

### **Test Scenarios**
1. **Trigger React Error:**
   - [ ] Temporarily throw error in component
   - [ ] Verify error boundary catches it
   - [ ] Error message displays properly
   - [ ] "Try Again" button appears
   - [ ] "Reload Page" button works
   - [ ] Error details shown in development only

2. **API Error:**
   - [ ] Kill API server
   - [ ] Verify graceful error handling
   - [ ] Retry button makes new request
   - [ ] Page doesn't crash

3. **Invalid Data:**
   - [ ] Mock API to return invalid data structure
   - [ ] Verify app handles it gracefully
   - [ ] Error boundary prevents crash

---

## 💾 Memory Leak Tests

### **useVendorData Hook**
1. **Cache Size Limit:**
   - [ ] Make 60+ different API requests
   - [ ] Verify cache doesn't exceed 50 entries
   - [ ] Check DevTools Memory tab for stable memory

2. **Periodic Cleanup:**
   - [ ] Wait 5+ minutes on page
   - [ ] Verify expired entries are removed
   - [ ] Memory doesn't grow unbounded

3. **Page Unload:**
   - [ ] Navigate to analytics page
   - [ ] Navigate away
   - [ ] Verify cleanup runs (check console if logging added)
   - [ ] No memory retained

---

## 🎨 UI/UX Tests

### **Responsive Design**
- [ ] Desktop (1920x1080): All elements visible
- [ ] Laptop (1366x768): No horizontal scroll
- [ ] Tablet (768px): Stat cards stack properly
- [ ] Mobile (375px): All content accessible

### **Dark Theme**
- [ ] All text is readable
- [ ] Contrast ratios meet WCAG AA
- [ ] Glass effects render correctly
- [ ] Charts are visible

### **Animations**
- [ ] Chart animations are smooth
- [ ] Hover transitions work
- [ ] Loading spinner spins
- [ ] No janky animations

---

## 🔍 Type Safety Tests

### **TypeScript Compilation**
```bash
npm run build
```
- [ ] No TypeScript errors
- [ ] No warnings about `any` types
- [ ] Build completes successfully

### **IntelliSense**
- [ ] Open analytics files in VS Code
- [ ] Verify autocomplete works
- [ ] Hover over variables to see types
- [ ] No `any` types in IntelliSense

---

## 📊 Data Accuracy Tests

### **Marketing Analytics**
1. **Create Test Campaign:**
   - Sent: 100 emails
   - Opened: 25 emails
   - Clicked: 5 emails
   - Revenue: $500

2. **Verify Calculations:**
   - [ ] Open rate: 25%
   - [ ] Click rate: 5%
   - [ ] Revenue: $500
   - [ ] Trend shows change from previous period

### **Vendor Analytics**
1. **Create Test Orders:**
   - 10 orders
   - Total revenue: $1,000
   - Average: $100/order

2. **Verify Calculations:**
   - [ ] Revenue total: $1,000
   - [ ] Avg order: $100
   - [ ] Chart shows correct daily breakdown

---

## 🚀 Performance Benchmarks

### **Load Time**
- [ ] Marketing analytics: < 2s first load
- [ ] Vendor analytics: < 2s first load
- [ ] Subsequent loads: < 500ms (cached)

### **Bundle Size**
```bash
npm run build
# Check .next/static/chunks/
```
- [ ] Analytics chunks < 100KB gzipped
- [ ] No duplicate code
- [ ] Tree-shaking working

### **Runtime Performance**
- [ ] First Contentful Paint: < 1.5s
- [ ] Time to Interactive: < 3s
- [ ] No layout shifts
- [ ] 60fps scrolling

---

## 🔧 Developer Experience Tests

### **Documentation**
- [ ] README is up to date
- [ ] Quick reference guide is accurate
- [ ] Code examples work
- [ ] Type definitions are clear

### **Code Quality**
- [ ] ESLint passes
- [ ] Prettier formatting consistent
- [ ] No unused imports
- [ ] No dead code

---

## ✅ Final Checklist

Before marking complete, verify:

### **Code**
- [ ] All analytics files use TypeScript
- [ ] No `any` types
- [ ] No `console.log` in production code
- [ ] All imports are used
- [ ] Error boundaries in place
- [ ] Memory leak fixed

### **Features**
- [ ] Real trend calculations
- [ ] Beautiful charts
- [ ] Proper error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Retry mechanisms

### **Documentation**
- [ ] Refactor summary complete
- [ ] Quick reference complete
- [ ] Optimization report complete
- [ ] Testing checklist complete

### **Testing**
- [ ] Marketing analytics tested
- [ ] Vendor analytics tested
- [ ] Error boundaries tested
- [ ] Memory leaks tested
- [ ] Performance benchmarks met

---

## 🎯 Sign-Off

Once all items are checked:

- [ ] **Developer Sign-Off:** Code reviewed and tested
- [ ] **Product Sign-Off:** UX reviewed and approved
- [ ] **Security Sign-Off:** No vulnerabilities found
- [ ] **Performance Sign-Off:** Benchmarks met

**Ready for Production:** ✅

---

## 📝 Notes

Use this space for any testing notes or issues found:

```
Date: _______________
Tester: _____________

Issues Found:
1.
2.
3.

Resolved:
1.
2.
3.

Notes:


```

---

**When all boxes are checked, your analytics platform is production-ready.** 🚀
