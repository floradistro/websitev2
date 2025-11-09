/**
 * Visual Analyzer - Playwright Screenshots + Analysis
 * AI can take screenshots of websites and analyze design
 */

import { chromium } from 'playwright';
import sharp from 'sharp';

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
    onProgress?: (status: string) => void;
    manualMode?: boolean; // NEW: Opens visible browser for manual interaction
  }): Promise<ScreenshotAnalysis> {
    const viewport = options?.viewport || { width: 1920, height: 1080 };
    const onProgress = options?.onProgress || ((status: string) => console.log(status));
    const manualMode = options?.manualMode || false;
    
    
    if (manualMode) {
      onProgress('👁️ Opening visible browser - YOU interact with it!');
    } else {
      onProgress('🚀 Launching Chromium browser...');
    }
    
    const launchOptions = { 
      headless: !manualMode, // Show browser if manual mode
      slowMo: manualMode ? 100 : 0 // Slow down actions in manual mode for visibility
    };
    
    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2 // Retina quality
    });
    
    const page = await context.newPage();
    
    try {
      // Navigate to page
      onProgress(`🌐 Navigating to ${url}...`);
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      onProgress('✅ Page loaded successfully');
      
      // MANUAL MODE: Let user interact with the page themselves
      if (manualMode) {
        console.log('(Extend the wait time if you need more)');
        
        onProgress('⏳ Waiting 30s for YOU to manually interact with the page...');
        
        // Wait 30 seconds for user to manually interact
        // Send progress updates every 5s to keep stream alive
        for (let i = 0; i < 30; i += 5) {
          await page.waitForTimeout(5000);
          const remaining = 30 - i - 5;
          if (remaining > 0) {
            onProgress(`⏳ ${remaining}s remaining - interact with the browser now...`);
          }
        }
        
        onProgress('✅ Manual interaction time complete - taking screenshot now!');
      } else {
        // AUTO MODE: Try to bypass age gates automatically
        onProgress('🔍 Checking for age gates and pop-ups...');
        
        // Try multiple times with different strategies
        let dismissed = false;
        const maxAttempts = 5;
        
        // Try a more aggressive approach - click ALL buttons on the page if it looks like an age gate
      try {
        await page.waitForTimeout(2000); // Wait for age gate to appear
        
        // Check if page looks like an age gate (has very few elements)
        const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
        const isAgeGate = bodyText.includes('age') || bodyText.includes('21') || bodyText.includes('verify') || 
                         bodyText.includes('enter') || bodyText.includes('confirm');
        
        if (isAgeGate) {
          onProgress('🔍 Age verification detected, attempting to bypass...');
          
          // Get all buttons and try clicking each one
          const buttons = await page.locator('button, a[role="button"], input[type="submit"]').all();
          
          for (let i = 0; i < buttons.length && !dismissed; i++) {
            try {
              const btn = buttons[i];
              const isVisible = await btn.isVisible({ timeout: 500 });
              
              if (isVisible) {
                
                // Try clicking
                await btn.click({ timeout: 2000, force: true });
                
                // Wait a bit to see if page changes
                await page.waitForTimeout(2000);
                
                // Check if we're past the age gate (page changed significantly)
                const newBodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
                if (newBodyText !== bodyText && !newBodyText.includes('age') && !newBodyText.includes('verify')) {
                  dismissed = true;
                  break;
                }
              }
            } catch (e) {
              // Try next button
              continue;
            }
          }
        }
      } catch (e: any) {
      }
      
        if (dismissed) {
          onProgress('✅ Age gate bypassed, loading full site...');
          await page.waitForTimeout(5000); // Extra wait for content to fully load
        } else {
          onProgress('⏩ Proceeding (age gate may still be visible)...');
          // Take screenshot anyway - might still be useful or user can remove reference URL
        }
        
        // Wait for content to load
        if (options?.waitFor) {
          onProgress('⏳ Waiting for animations and lazy content...');
          await page.waitForTimeout(options.waitFor);
        }
      }
      
      // Get page metadata
      const title = await page.title();
      const colorScheme = await page.evaluate(() => {
        const bg = window.getComputedStyle(document.body).backgroundColor;
        // Simple check: if background is dark
        return bg.includes('0, 0, 0') || bg.includes('rgb(0') ? 'dark' : 'light';
      });
      
      // Scroll through page to load lazy images and content (viewport will capture hero)
      onProgress('📜 Scrolling to load content...');
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= scrollHeight){
              clearInterval(timer);
              window.scrollTo(0, 0); // Scroll back to top
              setTimeout(resolve, 1000); // Wait 1s after scrolling back
            }
          }, 100);
        });
      });
      
      // DEEP page structure analysis - Extract EVERYTHING (do this before screenshot)
      onProgress('📊 Analyzing page structure and design...');
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
      
      onProgress('📸 Taking screenshot (viewport-only for speed)...');
      
      // CURSOR AI APPROACH: Viewport-only screenshot (never fullPage for reliability)
      // This avoids dimension issues and is faster
      let screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 75,
        fullPage: false // CRITICAL: Viewport only, like Cursor AI
      });
      
      let sizeKB = screenshot.length / 1024;
      
      // Get metadata to show dimensions
      const metadata = await sharp(screenshot).metadata();
      console.log(`✅ Screenshot captured: ${metadata.width}x${metadata.height} (${sizeKB.toFixed(1)}KB)`);
      onProgress(`✅ Captured: ${metadata.width}x${metadata.height}px (${sizeKB.toFixed(1)}KB)`);
      
      // Resize to safe dimensions (1280px max width, like Cursor AI)
      let imageBuffer = screenshot;
      const targetWidth = 1280; // Cursor AI uses ~1280px for Claude API
      
      if (metadata.width && metadata.width > targetWidth) {
        onProgress(`🔧 Resizing to ${targetWidth}px width for optimal quality...`);
        
        imageBuffer = await sharp(screenshot)
          .resize(targetWidth, null, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        const newMetadata = await sharp(imageBuffer).metadata();
        sizeKB = imageBuffer.length / 1024;
        console.log(`✅ Resized to ${newMetadata.width}x${newMetadata.height} (${sizeKB.toFixed(1)}KB)`);
        onProgress(`✅ Optimized: ${newMetadata.width}x${newMetadata.height}px (${sizeKB.toFixed(1)}KB)`);
      }
      
      const screenshotBase64 = imageBuffer.toString('base64');
      
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
Screenshot: Above-the-fold viewport (hero section)
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

NOTE: Focus on recreating the hero/above-fold design you see in the screenshot.
Use the color palette, typography, and layout patterns detected above.

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

