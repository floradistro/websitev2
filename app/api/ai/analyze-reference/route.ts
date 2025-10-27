/**
 * Analyze Reference Website
 * Takes screenshots and analyzes design of a reference URL
 * Used by AI to understand and replicate design patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { VisualAnalyzer } from '@/lib/ai/visual-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { url, viewport } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }
    
    console.log(`📸 Analyzing reference site: ${url}`);
    
    const analyzer = new VisualAnalyzer();
    const analysis = await analyzer.analyzeWebsite(url, { viewport });
    
    console.log(`✅ Analysis complete for ${analysis.metadata.title}`);
    
    return NextResponse.json({
      success: true,
      analysis: {
        url: analysis.url,
        title: analysis.metadata.title,
        colorScheme: analysis.metadata.colorScheme,
        screenshot: `data:image/png;base64,${analysis.screenshot}`,
        insights: analysis.insights
      }
    });
    
  } catch (error: any) {
    console.error('❌ Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze website' },
      { status: 500 }
    );
  }
}

