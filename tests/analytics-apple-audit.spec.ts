import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Apple-Level Analytics UX Audit
 *
 * This test examines the analytics page through the lens of:
 * - Steve Jobs: Obsessive simplicity, intuitive design, "it just works"
 * - Tim Cook: Data precision, operational excellence, insights that drive decisions
 *
 * We're asking: Would Apple executives use this to run their business?
 */

const TEST_EMAIL = process.env.TEST_EMAIL || 'darioncdjr@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Smallpenis123!!';

// Apple's design principles
const APPLE_PRINCIPLES = {
  CLARITY: 'Content is king - UI should never compete with data',
  DEFERENCE: 'The interface should recede, letting data shine',
  DEPTH: 'Visual layers and realistic motion convey hierarchy',
  SIMPLICITY: 'Complex data made simple through thoughtful design',
  CONSISTENCY: 'Familiar patterns, predictable interactions',
  FEEDBACK: 'Immediate, clear response to every action',
  DELIGHT: 'Small animations and details that bring joy',
};

interface AuditFinding {
  principle: string;
  severity: 'critical' | 'major' | 'minor' | 'enhancement';
  issue: string;
  recommendation: string;
  example?: string;
}

interface AppleAuditReport {
  timestamp: string;
  overallScore: number;
  findings: AuditFinding[];
  whatAppleWouldAdd: string[];
  whatAppleWouldRemove: string[];
  whatTimCookWouldAsk: string[];
  whatSteveJobsWouldSay: string[];
}

test.describe('Analytics: Apple Executive Audit', () => {
  let page: Page;
  const findings: AuditFinding[] = [];
  const screenshots: string[] = [];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Login
    await page.goto('http://localhost:3000/vendor/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/vendor/dashboard', { timeout: 10000 });

    // Navigate to analytics
    await page.goto('http://localhost:3000/vendor/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Let animations settle
  });

  test('1. FIRST IMPRESSION: The 3-Second Test', async () => {
    /**
     * Steve Jobs: "People judge a book by its cover. We may have the best product,
     * but if we present it in a slipshod manner, they'll assume it's slipshod."
     */

    const screenshot = await page.screenshot({
      path: '.cursor/screenshots/analytics-first-impression.png',
      fullPage: false
    });
    screenshots.push('analytics-first-impression.png');

    // What can the user understand in 3 seconds?
    const title = await page.textContent('h1');
    const kpiCards = await page.locator('[class*="StatCard"], [class*="stat-card"]').count();
    const visibleCharts = await page.locator('canvas, svg[class*="recharts"]').count();

    console.log('\n📊 FIRST IMPRESSION ANALYSIS');
    console.log('===========================');
    console.log(`Title: ${title}`);
    console.log(`KPI Cards Visible: ${kpiCards}`);
    console.log(`Charts Visible: ${visibleCharts}`);

    // Apple Standard: User should understand the page purpose in 3 seconds
    if (!title || title.length === 0) {
      findings.push({
        principle: APPLE_PRINCIPLES.CLARITY,
        severity: 'critical',
        issue: 'No clear page title visible',
        recommendation: 'Add a prominent, clear title that explains what data is shown',
      });
    }

    // Apple Standard: Key metrics should be immediately visible
    if (kpiCards < 4) {
      findings.push({
        principle: APPLE_PRINCIPLES.CLARITY,
        severity: 'major',
        issue: 'Not enough KPIs visible above the fold',
        recommendation: 'Show 4-6 key metrics prominently at the top',
        example: 'Revenue, Profit, Orders, Average Order Value',
      });
    }

    console.log(`✓ First impression captured\n`);
  });

  test('2. DATA HIERARCHY: Can I find what matters?', async () => {
    /**
     * Tim Cook: "I want to see the most important number first,
     * then drill down into why it changed."
     */

    console.log('\n🎯 DATA HIERARCHY ANALYSIS');
    console.log('==========================');

    // Check visual hierarchy
    const h1Size = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? window.getComputedStyle(h1).fontSize : null;
    });

    const bodySize = await page.evaluate(() => {
      const body = document.querySelector('body');
      return body ? window.getComputedStyle(body).fontSize : null;
    });

    console.log(`H1 size: ${h1Size}`);
    console.log(`Body size: ${bodySize}`);

    // Apple Standard: Clear typographic hierarchy
    const h1Pixels = parseInt(h1Size || '0');
    const bodyPixels = parseInt(bodySize || '0');

    if (h1Pixels / bodyPixels < 1.5) {
      findings.push({
        principle: APPLE_PRINCIPLES.DEPTH,
        severity: 'minor',
        issue: 'Typography hierarchy could be stronger',
        recommendation: 'Increase size difference between headings and body text',
        example: 'Apple uses 1.8-2.5x size ratio for headlines',
      });
    }

    // Check if most important metrics have visual prominence
    const kpiValues = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[class*="stat"], [class*="kpi"]'));
      return cards.map(card => {
        const value = card.querySelector('[class*="value"]');
        const fontSize = value ? window.getComputedStyle(value).fontSize : '0px';
        return parseInt(fontSize);
      });
    });

    console.log(`KPI value sizes: ${kpiValues.join(', ')}px`);

    // Apple Standard: Metrics should be large and readable
    if (Math.max(...kpiValues) < 24) {
      findings.push({
        principle: APPLE_PRINCIPLES.CLARITY,
        severity: 'major',
        issue: 'Key metrics are too small',
        recommendation: 'Increase font size of primary metrics to 28-36px',
        example: 'Apple Health app shows step count at 36px',
      });
    }

    console.log(`✓ Hierarchy analyzed\n`);
  });

  test('3. INTERACTIONS: Is every tap delightful?', async () => {
    /**
     * Steve Jobs: "Design is not just what it looks like and feels like.
     * Design is how it works."
     */

    console.log('\n✨ INTERACTION ANALYSIS');
    console.log('=======================');

    // Test filters dropdown
    const filtersButton = page.locator('button:has-text("Filters")').first();
    await filtersButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: '.cursor/screenshots/analytics-filters-open.png'
    });
    screenshots.push('analytics-filters-open.png');

    // Check for animation
    const hasAnimation = await page.evaluate(() => {
      const dropdown = document.querySelector('[class*="absolute"][class*="z-"]');
      if (!dropdown) return false;
      const style = window.getComputedStyle(dropdown);
      return style.animation !== 'none' || style.transition !== 'none';
    });

    console.log(`Filters dropdown animated: ${hasAnimation}`);

    if (!hasAnimation) {
      findings.push({
        principle: APPLE_PRINCIPLES.DELIGHT,
        severity: 'minor',
        issue: 'Dropdown appears instantly without animation',
        recommendation: 'Add smooth slide-in animation (250-300ms ease-out)',
        example: 'iOS menus slide in with spring physics',
      });
    }

    // Test filter interaction
    const firstCheckbox = page.locator('[class*="FilterCheckbox"], button:has(svg)').first();
    await firstCheckbox.click();
    await page.waitForTimeout(300);

    // Check if there's visual feedback
    const hasHoverState = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      let hasHover = false;
      buttons.forEach(btn => {
        const style = window.getComputedStyle(btn);
        if (style.cursor === 'pointer') hasHover = true;
      });
      return hasHover;
    });

    console.log(`Interactive elements have hover states: ${hasHoverState}`);

    // Close filters
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    console.log(`✓ Interactions tested\n`);
  });

  test('4. DATA VISUALIZATION: Do charts tell a story?', async () => {
    /**
     * Tim Cook: "Data should answer questions before I ask them."
     */

    console.log('\n📈 VISUALIZATION ANALYSIS');
    console.log('=========================');

    // Take screenshot of main chart
    await page.screenshot({
      path: '.cursor/screenshots/analytics-main-chart.png',
      fullPage: false
    });
    screenshots.push('analytics-main-chart.png');

    // Check chart interactivity
    const charts = await page.locator('canvas, svg[class*="recharts"]').all();
    console.log(`Found ${charts.length} charts`);

    if (charts.length > 0) {
      // Test chart hover
      const firstChart = charts[0];
      const box = await firstChart.boundingBox();

      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        // Check if tooltip appears
        const tooltip = await page.locator('[class*="tooltip"], [role="tooltip"]').isVisible();
        console.log(`Chart has hover tooltip: ${tooltip}`);

        if (!tooltip) {
          findings.push({
            principle: APPLE_PRINCIPLES.FEEDBACK,
            severity: 'major',
            issue: 'Charts lack interactive tooltips',
            recommendation: 'Add hover tooltips showing exact values on charts',
            example: 'Apple Stocks app shows detailed data on hover',
          });
        }
      }
    }

    // Check color usage
    const chartColors = await page.evaluate(() => {
      const svg = document.querySelector('svg[class*="recharts"]');
      if (!svg) return [];
      const paths = svg.querySelectorAll('path[stroke], line[stroke]');
      return Array.from(paths).map(p => p.getAttribute('stroke')).filter(Boolean);
    });

    console.log(`Chart colors used: ${chartColors.length} unique colors`);

    // Apple Standard: Limited, purposeful color palette
    if (chartColors.length > 6) {
      findings.push({
        principle: APPLE_PRINCIPLES.SIMPLICITY,
        severity: 'minor',
        issue: 'Too many colors in charts',
        recommendation: 'Limit to 3-5 semantic colors (positive, negative, neutral)',
        example: 'Apple Health uses green, red, and blue',
      });
    }

    console.log(`✓ Visualizations analyzed\n`);
  });

  test('5. TABS: Can I navigate without thinking?', async () => {
    /**
     * Steve Jobs: "Simple can be harder than complex...
     * But it's worth it in the end because once you get there,
     * you can move mountains."
     */

    console.log('\n🗂️  NAVIGATION ANALYSIS');
    console.log('======================');

    const tabs = await page.locator('[role="tab"], button[class*="tab"]').all();
    console.log(`Found ${tabs.length} tabs`);

    if (tabs.length > 0) {
      // Test tab switching
      const secondTab = tabs[1] || tabs[0];
      await secondTab.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: '.cursor/screenshots/analytics-second-tab.png'
      });
      screenshots.push('analytics-second-tab.png');

      // Check if transition is smooth
      const hasTransition = await page.evaluate(() => {
        const content = document.querySelector('[class*="tab-content"], [role="tabpanel"]');
        if (!content) return false;
        const style = window.getComputedStyle(content);
        return style.transition !== 'none' || style.animation !== 'none';
      });

      console.log(`Tab content has transition: ${hasTransition}`);

      if (!hasTransition) {
        findings.push({
          principle: APPLE_PRINCIPLES.DELIGHT,
          severity: 'minor',
          issue: 'Tab switching lacks animation',
          recommendation: 'Add subtle fade or slide transition between tabs',
          example: 'iOS tabs fade content in/out smoothly',
        });
      }
    }

    // Check tab count
    if (tabs.length > 8) {
      findings.push({
        principle: APPLE_PRINCIPLES.SIMPLICITY,
        severity: 'major',
        issue: 'Too many tabs - overwhelming choice',
        recommendation: 'Consolidate to 5-7 primary tabs, move others to overflow menu',
        example: 'Apple Music has 5 main tabs',
      });
    }

    console.log(`✓ Navigation tested\n`);
  });

  test('6. RESPONSIVE: Does it adapt beautifully?', async () => {
    /**
     * Apple designs for every screen size, not just desktop.
     */

    console.log('\n📱 RESPONSIVENESS ANALYSIS');
    console.log('==========================');

    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop XL' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 812, name: 'Mobile' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `.cursor/screenshots/analytics-${viewport.name.toLowerCase().replace(' ', '-')}.png`
      });
      screenshots.push(`analytics-${viewport.name.toLowerCase().replace(' ', '-')}.png`);

      // Check if layout breaks
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): ${hasOverflow ? '⚠️ Horizontal scroll' : '✓ Fits'}`);

      if (hasOverflow && viewport.width >= 768) {
        findings.push({
          principle: APPLE_PRINCIPLES.CONSISTENCY,
          severity: 'major',
          issue: `Horizontal scrolling on ${viewport.name}`,
          recommendation: 'Ensure all content fits within viewport width',
          example: 'Apple.com never requires horizontal scrolling',
        });
      }
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log(`✓ Responsiveness tested\n`);
  });

  test('7. PERFORMANCE: Is it instant?', async () => {
    /**
     * Steve Jobs: "We have always been shameless about stealing great ideas."
     * Apple steals the idea that fast = good UX.
     */

    console.log('\n⚡ PERFORMANCE ANALYSIS');
    console.log('=======================');

    // Measure page load time
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);

    // Apple Standard: < 1 second for data to appear
    if (loadTime > 1000) {
      findings.push({
        principle: APPLE_PRINCIPLES.FEEDBACK,
        severity: 'major',
        issue: 'Slow page load',
        recommendation: 'Show skeleton loaders immediately, load data progressively',
        example: 'Apple Music shows UI instantly, streams data',
      });
    }

    // Check for loading states
    const hasSkeletons = await page.locator('[class*="skeleton"], [class*="loading"]').count();
    console.log(`Loading skeletons present: ${hasSkeletons > 0}`);

    if (hasSkeletons === 0 && loadTime > 500) {
      findings.push({
        principle: APPLE_PRINCIPLES.FEEDBACK,
        severity: 'minor',
        issue: 'No loading state shown',
        recommendation: 'Add skeleton screens for perceived performance',
        example: 'Apple News shows article layout before content loads',
      });
    }

    console.log(`✓ Performance measured\n`);
  });

  test('8. ACCESSIBILITY: Can everyone use it?', async () => {
    /**
     * Tim Cook: "We believe technology should be accessible to everyone."
     */

    console.log('\n♿ ACCESSIBILITY ANALYSIS');
    console.log('=========================');

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`First focusable element: ${firstFocus}`);

    // Tab through interactive elements
    let tabCount = 0;
    const maxTabs = 20;
    const focusedElements: string[] = [];

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}${el.className ? '.' + el.className.split(' ')[0] : ''}` : null;
      });
      if (focused) {
        focusedElements.push(focused);
        tabCount++;
      }
    }

    console.log(`Keyboard navigable elements: ${tabCount}`);
    console.log(`Elements: ${[...new Set(focusedElements)].join(', ')}`);

    // Check ARIA labels
    const ariaElements = await page.locator('[aria-label], [aria-labelledby], [role]').count();
    console.log(`Elements with ARIA attributes: ${ariaElements}`);

    if (ariaElements < 10) {
      findings.push({
        principle: APPLE_PRINCIPLES.CONSISTENCY,
        severity: 'major',
        issue: 'Insufficient accessibility attributes',
        recommendation: 'Add aria-label to all interactive elements and charts',
        example: 'Apple.com has extensive ARIA markup',
      });
    }

    // Check color contrast
    const contrastIssues = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let issues = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const textColor = style.color;
        // Simplified check - just looking for low opacity
        if (textColor.includes('rgba') && textColor.includes('0.')) {
          const opacity = parseFloat(textColor.split('0.')[1]);
          if (opacity < 0.5) issues++;
        }
      });
      return issues;
    });

    console.log(`Potential contrast issues: ${contrastIssues}`);

    if (contrastIssues > 5) {
      findings.push({
        principle: APPLE_PRINCIPLES.CLARITY,
        severity: 'minor',
        issue: 'Some text may have low contrast',
        recommendation: 'Ensure 4.5:1 contrast ratio for all text',
        example: 'Apple uses WCAG AAA standard (7:1)',
      });
    }

    console.log(`✓ Accessibility checked\n`);
  });

  test('9. GENERATE APPLE EXECUTIVE REPORT', async () => {
    console.log('\n📋 GENERATING EXECUTIVE REPORT');
    console.log('================================\n');

    // Calculate overall score
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const majorCount = findings.filter(f => f.severity === 'major').length;
    const minorCount = findings.filter(f => f.severity === 'minor').length;

    // Apple's grading: Start at 100, deduct points
    let score = 100;
    score -= criticalCount * 20;
    score -= majorCount * 10;
    score -= minorCount * 5;
    score = Math.max(0, score);

    // What Apple would add (based on their apps)
    const whatAppleWouldAdd = [
      '📊 Sparklines in KPI cards - Quick visual trend without clicking',
      '🎯 Smart Insights - AI-powered "why did revenue drop?" explanations',
      '⚡ Quick Actions - "Export to Numbers", "Share via Messages" buttons',
      '🔍 Search Everything - Spotlight-style search: "show me June sales"',
      '⏰ Time Machine - Scrub through historical data with a slider',
      '🎨 Chart Customization - Let users choose chart types (line, bar, area)',
      '📱 Today Widget - Key metrics in iOS/macOS notification center',
      '🗂️  Smart Folders - Save custom filter combinations as presets',
      '📊 Comparison Mode - Compare any two time periods side-by-side',
      '🎯 Goals & Targets - Show progress toward monthly/quarterly goals',
      '🔔 Intelligent Alerts - "Sales dropped 15% - tap to investigate"',
      '📈 Trend Analysis - Automatic detection of patterns and anomalies',
    ];

    // What Apple would remove
    const whatAppleWouldRemove = [
      '❌ Unnecessary borders - Apple minimizes visual clutter',
      '❌ Too many font weights - Stick to Regular and Semibold',
      '❌ Redundant labels - If it\'s obvious, don\'t label it',
      '❌ Generic icons - Use custom, meaningful icons',
      '❌ Overly rounded corners - Apple uses 8-12px, not 20px+',
      '❌ Multiple shades of gray - Define 3-4 levels maximum',
    ];

    // Questions Tim Cook would ask
    const whatTimCookWouldAsk = [
      '"Can I see profit margin by product category?"',
      '"What\'s our inventory turn rate?"',
      '"Show me year-over-year growth by quarter"',
      '"Which products have declining sales velocity?"',
      '"What\'s the customer acquisition cost trend?"',
      '"Can I export this data to our CFO in one click?"',
      '"How do margins compare across our locations?"',
      '"What percentage of revenue is from repeat customers?"',
    ];

    // What Steve Jobs would say
    const whatSteveJobsWouldSay = [
      '"Why do I need to click three times to see what I want?"',
      '"The charts are boring. Make them come alive."',
      '"Every pixel matters. This spacing is off by 2 pixels."',
      '"I should be able to understand everything in 5 seconds."',
      '"Remove everything that doesn\'t make the data clearer."',
      '"The animations are too slow. Make them snappy - 200ms max."',
      '"Why can\'t I just say \'show me last quarter\'?"',
      '"This is good. Let\'s make it insanely great."',
    ];

    const report: AppleAuditReport = {
      timestamp: new Date().toISOString(),
      overallScore: score,
      findings,
      whatAppleWouldAdd,
      whatAppleWouldRemove,
      whatTimCookWouldAsk,
      whatSteveJobsWouldSay,
    };

    // Generate markdown report
    const reportMarkdown = `# Analytics Page - Apple Executive Audit

**Generated:** ${new Date().toLocaleString()}
**Overall Score:** ${score}/100

${score >= 80 ? '🟢 **SHIP IT** - Meets Apple standards' :
  score >= 60 ? '🟡 **NEEDS WORK** - Good foundation, needs polish' :
  '🔴 **NOT READY** - Significant improvements required'}

---

## Executive Summary

${score >= 80
  ? 'This analytics page demonstrates Apple-level attention to detail and would be suitable for executive decision-making.'
  : score >= 60
  ? 'The page has a solid foundation but lacks the refinement and insight depth that Apple executives expect.'
  : 'This page needs substantial improvements before it can be trusted for business-critical decisions.'}

**Critical Issues:** ${criticalCount}
**Major Issues:** ${majorCount}
**Minor Issues:** ${minorCount}

---

## Findings

${findings.map((f, i) => `
### ${i + 1}. ${f.issue}

**Principle Violated:** ${f.principle}
**Severity:** ${f.severity.toUpperCase()}

**Recommendation:**
${f.recommendation}

${f.example ? `**Apple Example:**
${f.example}` : ''}
`).join('\n')}

---

## What Apple Would Add 🍎

${whatAppleWouldAdd.map(item => `- ${item}`).join('\n')}

---

## What Apple Would Remove 🗑️

${whatAppleWouldRemove.map(item => `- ${item}`).join('\n')}

---

## What Tim Cook Would Ask 💼

${whatTimCookWouldAsk.map(item => `- ${item}`).join('\n')}

---

## What Steve Jobs Would Say 🎭

${whatSteveJobsWouldSay.map(item => `- ${item}`).join('\n')}

---

## Screenshots

${screenshots.map(s => `- ${s}`).join('\n')}

---

## Next Steps

### Immediate (This Sprint)
1. Fix all critical issues
2. Add loading states and skeleton screens
3. Improve keyboard navigation and accessibility
4. Add chart hover tooltips

### Short Term (Next Sprint)
1. Add sparklines to KPI cards
2. Implement smooth tab transitions
3. Create smart insights feature
4. Add export functionality

### Long Term (Roadmap)
1. AI-powered anomaly detection
2. Natural language search
3. Custom dashboard builder
4. Mobile companion app

---

*"Insanely great products start with insanely great attention to detail."* - Steve Jobs
`;

    // Write report
    fs.writeFileSync(
      path.join(process.cwd(), '.cursor', 'ANALYTICS_APPLE_AUDIT.md'),
      reportMarkdown
    );

    console.log(`\n✅ Report generated: .cursor/ANALYTICS_APPLE_AUDIT.md\n`);
    console.log(`📊 Final Score: ${score}/100\n`);
    console.log(`Critical: ${criticalCount} | Major: ${majorCount} | Minor: ${minorCount}\n`);
  });

  test.afterAll(async () => {
    await page.close();
  });
});
