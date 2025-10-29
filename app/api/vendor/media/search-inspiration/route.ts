import { NextRequest, NextResponse } from 'next/server';
import Exa from 'exa-js';

const exa = new Exa('c6064aa5-e664-4bb7-9de9-d09ff153aa53');

/**
 * POST /api/vendor/media/search-inspiration
 * Search for visual inspiration using Exa
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const body = await request.json();
    const { query, numResults = 5 } = body;

    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    console.log('🔍 Searching for inspiration with Exa:', query);

    // Search with Exa
    const searchResults = await exa.searchAndContents(query, {
      type: 'neural',
      useAutoprompt: true,
      numResults: numResults,
      text: true,
      highlights: true,
    });

    // Extract relevant information
    const inspiration = searchResults.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.text?.substring(0, 200) || '',
      highlights: result.highlights || [],
      score: result.score,
    }));

    console.log(`✅ Found ${inspiration.length} inspiration sources`);

    return NextResponse.json({
      success: true,
      query,
      results: inspiration,
      count: inspiration.length,
    });
  } catch (error: any) {
    console.error('❌ Exa search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search for inspiration' },
      { status: 500 }
    );
  }
}
