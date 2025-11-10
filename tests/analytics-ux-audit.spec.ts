import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOTS_DIR = '.cursor/analytics-ux-audit';

test.describe('Analytics UI/UX Audit - Steve Jobs Edition', () => {
  test.beforeAll(() => {
    // Create screenshots directory
    try {
      mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    } catch (e) {}
  });

  test('Full Analytics Dashboard Audit', async ({ page }) => {
    // Login as Flora Distro vendor
    await page.goto('http://localhost:3000/vendor/login');
    await page.fill('input[type="email"]', 'flora@floradistro.com');
    await page.fill('input[type="password"]', 'Flora2024!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/vendor/dashboard');

    // Navigate to Analytics
    await page.goto('http://localhost:3000/vendor/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Let everything load

    const analysis = {
      timestamp: new Date().toISOString(),
      issues: [] as any[],
      recommendations: [] as any[],
      screenshots: {} as any,
    };

    // ==================================================
    // 1. OVERVIEW TAB
    // ==================================================
    console.log('📊 Analyzing Overview Tab...');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-overview.png`, fullPage: true });

    // Check KPI layout
    const kpiCards = await page.locator('[class*="card"], [class*="stat"]').count();
    const kpiPositions = await page.locator('[class*="card"], [class*="stat"]').all();

    // Check if date range picker exists
    const hasDateRange = await page.locator('input[type="date"], [class*="date"]').count() > 0;
    const dateRangeButtons = await page.locator('button:has-text("DAYS"), button:has-text("7"), button:has-text("30")').count();

    analysis.issues.push({
      tab: 'Overview',
      severity: hasDateRange ? 'low' : 'high',
      issue: hasDateRange ? 'Date range exists but may need custom picker' : 'No custom date range picker',
      location: 'Top toolbar',
      recommendation: 'Add Apple-style date range picker with quick presets (Today, 7D, 30D, 90D, Custom)',
    });

    // Check scroll behavior
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.viewportSize()?.height || 0;
    const needsScroll = pageHeight > viewportHeight;

    if (needsScroll) {
      analysis.issues.push({
        tab: 'Overview',
        severity: 'medium',
        issue: 'Entire page scrolls together - no independent scroll regions',
        location: 'Layout',
        recommendation: 'Use fixed header with independent scrolling content areas',
      });
    }

    // ==================================================
    // 2. SALES BY DAY TAB
    // ==================================================
    console.log('📈 Analyzing Sales by Day...');
    await page.click('button:has-text("SALES BY DAY"), [role="tab"]:has-text("DAY")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-by-day.png`, fullPage: true });

    // Check if table has fixed headers
    const tableHeaders = await page.locator('table thead, [role="columnheader"]').count();
    if (tableHeaders > 0) {
      const headerSticky = await page.locator('table thead').evaluate((el) => {
        return window.getComputedStyle(el).position === 'sticky';
      }).catch(() => false);

      if (!headerSticky) {
        analysis.issues.push({
          tab: 'Sales by Day',
          severity: 'medium',
          issue: 'Table headers scroll away with content',
          location: 'Data table',
          recommendation: 'Make table headers sticky (position: sticky; top: 0)',
        });
      }
    }

    // ==================================================
    // 3. LOCATIONS TAB
    // ==================================================
    console.log('📍 Analyzing Locations...');
    await page.click('button:has-text("LOCATIONS"), [role="tab"]:has-text("LOCATION")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-locations.png`, fullPage: true });

    // ==================================================
    // 4. EMPLOYEES TAB
    // ==================================================
    console.log('👥 Analyzing Employees...');
    await page.click('button:has-text("EMPLOYEES"), [role="tab"]:has-text("EMPLOYEE")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-employees.png`, fullPage: true });

    // Check for empty states
    const hasNoDataMessage = await page.locator('text=/no data|empty|no results/i').count() > 0;

    // ==================================================
    // 5. PRODUCTS TAB
    // ==================================================
    console.log('📦 Analyzing Products...');
    await page.click('button:has-text("PRODUCTS"), [role="tab"]:has-text("PRODUCT")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-products.png`, fullPage: true });

    // ==================================================
    // 6. CATEGORIES TAB
    // ==================================================
    console.log('🏷️ Analyzing Categories...');
    await page.click('button:has-text("CATEGORIES"), [role="tab"]:has-text("CATEGOR")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-categories.png`, fullPage: true });

    // ==================================================
    // 7. PAYMENT METHODS TAB
    // ==================================================
    console.log('💳 Analyzing Payment Methods...');
    await page.click('button:has-text("PAYMENT"), [role="tab"]:has-text("PAYMENT")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-payment-methods.png`, fullPage: true });

    // ==================================================
    // 8. P&L STATEMENT TAB
    // ==================================================
    console.log('💰 Analyzing P&L Statement...');
    await page.click('button:has-text("P&L"), [role="tab"]:has-text("STATEMENT")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-pl-statement.png`, fullPage: true });

    // ==================================================
    // 9. ITEMIZED SALES TAB
    // ==================================================
    console.log('📋 Analyzing Itemized Sales...');
    await page.click('button:has-text("ITEMIZED"), [role="tab"]:has-text("ITEMIZED")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-itemized.png`, fullPage: true });

    // Check for pagination
    const hasPagination = await page.locator('[role="navigation"], button:has-text("Next"), button:has-text("Previous")').count() > 0;

    // ==================================================
    // 10. POS SESSIONS TAB
    // ==================================================
    console.log('🏪 Analyzing POS Sessions...');
    await page.click('button:has-text("POS"), [role="tab"]:has-text("SESSION")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/10-pos-sessions.png`, fullPage: true });

    // ==================================================
    // GENERAL UI ANALYSIS
    // ==================================================
    console.log('🎨 Analyzing General UI...');

    // Go back to overview for general checks
    await page.click('button:has-text("OVERVIEW"), [role="tab"]:has-text("OVERVIEW")');
    await page.waitForTimeout(1000);

    // Check color contrast
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    const isDarkMode = bodyBg.includes('rgb(0, 0, 0)') || bodyBg.includes('rgb(17, 17, 17)');

    // Check for visual hierarchy
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();

    // Check for loading states
    await page.click('button:has-text("30 DAYS")');
    const hasLoadingIndicator = await page.locator('[class*="loading"], [class*="spinner"], [role="progressbar"]').count() > 0;

    if (!hasLoadingIndicator) {
      analysis.issues.push({
        tab: 'All',
        severity: 'medium',
        issue: 'No visible loading states when switching date ranges',
        location: 'Global',
        recommendation: 'Add skeleton loaders or progress indicators during data fetching',
      });
    }

    // ==================================================
    // CRITICAL ISSUES CHECK
    // ==================================================

    // Check if KPIs are below data (user complaint)
    await page.click('button:has-text("EMPLOYEES"), [role="tab"]:has-text("EMPLOYEE")');
    await page.waitForTimeout(1000);

    const employeeTable = await page.locator('table, [role="table"]').first();
    const summaryCards = await page.locator('[class*="summary"], [class*="total"]').all();

    if (employeeTable && summaryCards.length > 0) {
      const tableBox = await employeeTable.boundingBox();
      const summaryBox = await summaryCards[0].boundingBox();

      if (tableBox && summaryBox && summaryBox.y > tableBox.y + tableBox.height) {
        analysis.issues.push({
          tab: 'Employees',
          severity: 'critical',
          issue: 'Summary KPIs appear BELOW the data table',
          location: 'Layout',
          recommendation: 'Move summary cards to top, above the table. This is a critical UX issue.',
          appleFix: 'Apple always shows totals at the top, not buried at the bottom',
        });
      }
    }

    // ==================================================
    // WRITE ANALYSIS REPORT
    // ==================================================
    console.log('📝 Writing analysis report...');

    // Add Apple-style recommendations
    analysis.recommendations = [
      {
        priority: 'P0 - Critical',
        category: 'Layout',
        issue: 'KPIs and summaries below data tables',
        appleWay: 'Summary at top, data below. Always. No scrolling to see totals.',
        implementation: 'Restructure layout: Header → KPI Cards → Filters → Data → Pagination',
      },
      {
        priority: 'P0 - Critical',
        category: 'Date Picker',
        issue: 'Limited date range options',
        appleWay: 'Beautiful, minimal date picker with presets and custom range',
        implementation: 'Add DateRangePicker component: Today, 7D, 30D, 90D, YTD, Custom (calendar popup)',
      },
      {
        priority: 'P1 - High',
        category: 'Scrolling',
        issue: 'Entire page scrolls together',
        appleWay: 'Fixed header, independent scroll areas, sticky elements',
        implementation: 'position: sticky on header and KPIs, overflow-y: auto on data area',
      },
      {
        priority: 'P1 - High',
        category: 'Visual Hierarchy',
        issue: 'Unclear information hierarchy',
        appleWay: 'Clear typography scale, generous whitespace, card-based design',
        implementation: 'Use SF Pro font stack, 8px grid system, elevation with shadows',
      },
      {
        priority: 'P1 - High',
        category: 'Loading States',
        issue: 'Data appears/disappears without feedback',
        appleWay: 'Skeleton screens, smooth transitions, never leave user wondering',
        implementation: 'Add skeleton loaders, 200ms fade transitions, optimistic UI updates',
      },
      {
        priority: 'P2 - Medium',
        category: 'Export',
        issue: 'Export functionality not prominent',
        appleWay: 'Share button (with icon) in top-right of each section',
        implementation: 'Add export buttons to each tab: CSV, PDF, Excel with Apple-style share icon',
      },
      {
        priority: 'P2 - Medium',
        category: 'Comparison',
        issue: 'No period-over-period comparison',
        appleWay: 'Show trends with sparklines and percentage changes',
        implementation: 'Add "vs Previous Period" indicators, mini charts in KPI cards',
      },
      {
        priority: 'P3 - Nice to Have',
        category: 'Animations',
        issue: 'Static, no delight',
        appleWay: 'Subtle, meaningful animations that guide attention',
        implementation: 'Number count-up animations, smooth chart transitions, card hover effects',
      },
    ];

    const report = `# Analytics Dashboard UX Audit
**Date**: ${new Date().toISOString()}
**Auditor**: Steve Jobs AI Edition 🍎

## Executive Summary

${analysis.issues.length} issues found across ${Object.keys(analysis.screenshots).length} screens.

**Critical Issues**: ${analysis.issues.filter(i => i.severity === 'critical').length}
**High Priority**: ${analysis.issues.filter(i => i.severity === 'high').length}
**Medium Priority**: ${analysis.issues.filter(i => i.severity === 'medium').length}

---

## The Apple Way: Key Principles

1. **Information Hierarchy**: Most important info at top, always visible
2. **Clarity**: One clear action per screen, no confusion
3. **Feedback**: System always responds, never leaves user wondering
4. **Beauty**: Function through form, not decoration
5. **Restraint**: Only what's necessary, nothing more

---

## Critical Issues Found

${analysis.issues.map((issue, i) => `
### ${i + 1}. ${issue.issue}
- **Tab**: ${issue.tab}
- **Severity**: ${issue.severity.toUpperCase()}
- **Location**: ${issue.location}
- **Recommendation**: ${issue.recommendation}
${issue.appleFix ? `- **🍎 Apple Fix**: ${issue.appleFix}` : ''}
`).join('\n')}

---

## Apple-Style Recommendations

${analysis.recommendations.map((rec, i) => `
### ${rec.priority}: ${rec.category}

**Current Issue**: ${rec.issue}

**How Apple Would Do It**: ${rec.appleWay}

**Implementation**:
\`\`\`
${rec.implementation}
\`\`\`
`).join('\n')}

---

## Screenshots

All screenshots saved to: \`${SCREENSHOTS_DIR}/\`

1. Overview Tab
2. Sales by Day
3. Locations
4. Employees
5. Products
6. Categories
7. Payment Methods
8. P&L Statement
9. Itemized Sales
10. POS Sessions

---

## Next Steps

### Phase 1: Critical Fixes (Week 1)
- [ ] Move all KPI cards above data tables
- [ ] Implement custom date range picker
- [ ] Fix scroll behavior (sticky headers)

### Phase 2: Polish (Week 2)
- [ ] Add loading states and skeleton screens
- [ ] Implement visual hierarchy (typography, spacing)
- [ ] Add export functionality

### Phase 3: Delight (Week 3)
- [ ] Add period-over-period comparisons
- [ ] Implement smooth animations
- [ ] Add mini charts/sparklines to KPIs

---

## Steve Jobs Quote

> "Design is not just what it looks like and feels like. Design is how it works."

Your analytics work, but they don't **feel** right yet. Let's make them insanely great.
`;

    writeFileSync(`${SCREENSHOTS_DIR}/ANALYSIS_REPORT.md`, report);
    console.log('✅ Analysis complete! Report written to:', `${SCREENSHOTS_DIR}/ANALYSIS_REPORT.md`);

    // Write JSON for programmatic access
    writeFileSync(`${SCREENSHOTS_DIR}/analysis.json`, JSON.stringify(analysis, null, 2));
  });
});
