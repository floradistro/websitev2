/**
 * Visual Analyzer - Playwright Screenshots + Analysis
 * AI can take screenshots of websites and analyze design
 */

import { chromium } from 'playwright';

export interface ScreenshotAnalysis {
  url: string;
  screenshot: string; // Base64
  metadata: {
    title: string;
    viewport: { width: number; height: number };
    colorScheme: 'light' | 'dark';
    timestamp: Date;
  };
  insights: {
    dominantColors: string[];
    layout: string;
    typography: string[];
    spacing: string;
    components: string[];
  };
}

export class VisualAnalyzer {
  /**
   * Take screenshot of a website and analyze it
   */
  async analyzeWebsite(url: string, options?: {
    viewport?: { width: number; height: number };
    waitFor?: number;
  }): Promise<ScreenshotAnalysis> {
    const viewport = options?.viewport || { width: 1920, height: 1080 };
    
    console.log(`📸 Taking screenshot of ${url}...`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2 // Retina quality
    });
    
    const page = await context.newPage();
    
    try {
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for content to load
      if (options?.waitFor) {
        await page.waitForTimeout(options.waitFor);
      }
      
      // Get page metadata
      const title = await page.title();
      const colorScheme = await page.evaluate(() => {
        const bg = window.getComputedStyle(document.body).backgroundColor;
        // Simple check: if background is dark
        return bg.includes('0, 0, 0') || bg.includes('rgb(0') ? 'dark' : 'light';
      });
      
      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false // Just above the fold
      });
      
      const screenshotBase64 = screenshot.toString('base64');
      
      console.log(`✅ Screenshot captured (${(screenshot.length / 1024).toFixed(1)}KB)`);
      
      // DEEP page structure analysis - Extract EVERYTHING
      const analysis = await page.evaluate(() => {
        // Extract ALL colors (background, text, borders)
        const colors: string[] = [];
        const elements = document.querySelectorAll('*');
        const colorSet = new Set<string>();
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          
          // Background colors
          if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            colorSet.add(`BG: ${style.backgroundColor}`);
          }
          
          // Text colors
          if (style.color) {
            colorSet.add(`Text: ${style.color}`);
          }
          
          // Border colors
          if (style.borderColor && style.borderColor !== 'rgba(0, 0, 0, 0)') {
            colorSet.add(`Border: ${style.borderColor}`);
          }
        });
        
        colors.push(...Array.from(colorSet).slice(0, 20)); // More colors
        
        // Detect layout
        const hasGrid = Array.from(document.querySelectorAll('*')).some(el => 
          window.getComputedStyle(el).display.includes('grid')
        );
        const hasFlex = Array.from(document.querySelectorAll('*')).some(el => 
          window.getComputedStyle(el).display.includes('flex')
        );
        
        const layout = hasGrid ? 'CSS Grid' : hasFlex ? 'Flexbox' : 'Traditional';
        
        // Extract typography
        const fonts: string[] = [];
        const fontSet = new Set<string>();
        
        document.querySelectorAll('h1, h2, h3, p, span').forEach(el => {
          const style = window.getComputedStyle(el);
          fontSet.add(style.fontFamily);
        });
        
        fonts.push(...Array.from(fontSet).slice(0, 5));
        
        // Detect spacing system
        const paddings: number[] = [];
        document.querySelectorAll('div, section').forEach(el => {
          const style = window.getComputedStyle(el);
          const padding = parseInt(style.paddingTop || '0');
          if (padding > 0) paddings.push(padding);
        });
        
        const avgPadding = paddings.length > 0 
          ? Math.round(paddings.reduce((a, b) => a + b, 0) / paddings.length)
          : 16;
        
        const spacing = `${avgPadding}px average (${Math.min(...paddings)}px - ${Math.max(...paddings)}px range)`;
        
        // Detect ALL components and page structure
        const components: string[] = [];
        const pageStructure: string[] = [];
        
        // Major sections
        if (document.querySelector('nav')) components.push('Navigation');
        if (document.querySelector('header')) components.push('Header');
        if (document.querySelector('footer')) components.push('Footer');
        
        // Count elements
        const buttons = document.querySelectorAll('button, a[role="button"]').length;
        const images = document.querySelectorAll('img').length;
        const headings = {
          h1: document.querySelectorAll('h1').length,
          h2: document.querySelectorAll('h2').length,
          h3: document.querySelectorAll('h3').length
        };
        const forms = document.querySelectorAll('form, input').length;
        
        if (buttons > 0) components.push(`Buttons (${buttons})`);
        if (images > 0) components.push(`Images (${images})`);
        if (forms > 0) components.push(`Forms/Inputs (${forms})`);
        
        // Detect page sections by looking for major divs/sections
        const sections = document.querySelectorAll('section, div[class*="section"], main > div, body > div > div');
        sections.forEach((section, i) => {
          if (section.clientHeight > 200) { // Only substantial sections
            const h1 = section.querySelector('h1, h2');
            const title = h1 ? h1.textContent?.substring(0, 50) : `Section ${i + 1}`;
            const hasImages = section.querySelectorAll('img').length;
            const hasButtons = section.querySelectorAll('button').length;
            pageStructure.push(`Section ${i + 1}: ${title} (${hasImages} images, ${hasButtons} buttons)`);
          }
        });
        
        // Extract actual text content from headings
        const headingTexts: string[] = [];
        document.querySelectorAll('h1, h2').forEach((h, i) => {
          if (i < 10) { // First 10 headings
            headingTexts.push(`${h.tagName}: "${h.textContent?.trim().substring(0, 100) || ''}"`);
          }
        });
        
        // Button text
        const buttonTexts: string[] = [];
        document.querySelectorAll('button, a[role="button"]').forEach((btn, i) => {
          if (i < 10) {
            buttonTexts.push(`"${btn.textContent?.trim() || ''}"`);
          }
        });
        
        return {
          dominantColors: colors,
          layout,
          typography: fonts,
          spacing,
          components,
          pageStructure,
          headingTexts,
          buttonTexts,
          headingCounts: headings
        };
      });
      
      await browser.close();
      
      return {
        url,
        screenshot: screenshotBase64,
        metadata: {
          title,
          viewport,
          colorScheme,
          timestamp: new Date()
        },
        insights: analysis
      };
      
    } catch (error: any) {
      await browser.close();
      throw new Error(`Failed to analyze ${url}: ${error.message}`);
    }
  }

  /**
   * Analyze multiple sites in parallel
   */
  async analyzeMultipleSites(urls: string[]): Promise<ScreenshotAnalysis[]> {
    console.log(`📸 Analyzing ${urls.length} sites in parallel...`);
    
    const results = await Promise.all(
      urls.map(url => this.analyzeWebsite(url).catch(err => {
        console.error(`Failed to analyze ${url}:`, err.message);
        return null;
      }))
    );
    
    return results.filter(r => r !== null) as ScreenshotAnalysis[];
  }

  /**
   * Format analysis for AI consumption
   */
  formatForAI(analysis: ScreenshotAnalysis): string {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 VISUAL ANALYSIS: ${analysis.metadata.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL: ${analysis.url}
Color Scheme: ${analysis.metadata.colorScheme}
Layout System: ${analysis.insights.layout}

🎨 Dominant Colors:
${analysis.insights.dominantColors.slice(0, 5).map(c => `• ${c}`).join('\n')}

✍️ Typography:
${analysis.insights.typography.slice(0, 3).map(f => `• ${f}`).join('\n')}

📐 Spacing System:
• ${analysis.insights.spacing}

🧩 Components Detected:
${analysis.insights.components.map(c => `• ${c}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
}

/**
 * Quick helper to analyze and format
 */
export async function analyzeAndFormat(url: string): Promise<{
  analysis: ScreenshotAnalysis;
  formatted: string;
  screenshot: string;
}> {
  const analyzer = new VisualAnalyzer();
  const analysis = await analyzer.analyzeWebsite(url);
  const formatted = analyzer.formatForAI(analysis);
  
  return {
    analysis,
    formatted,
    screenshot: `data:image/png;base64,${analysis.screenshot}`
  };
}

