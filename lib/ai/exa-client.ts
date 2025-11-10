/**
 * Exa AI Search Client
 * Deep web research for component generation
 *
 * Exa finds high-quality, relevant content across the web
 * Perfect for: design inspiration, best practices, competitor analysis
 */

import Exa from "exa-js";

export interface ExaSearchOptions {
  query: string;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  useAutoprompt?: boolean;
  type?: "keyword" | "neural" | "magic";
}

export interface ExaResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  text: string;
  highlights: string[];
  summary?: any;
}

export class ExaClient {
  private client: Exa;

  constructor(apiKey?: string) {
    this.client = new Exa(apiKey || process.env.EXA_API_KEY!);
  }

  /**
   * Search for design inspiration
   *
   * @example
   * searchDesignInspiration('luxury cannabis storefront design')
   */
  async searchDesignInspiration(query: string, industry?: string): Promise<ExaResult[]> {
    const enhancedQuery = industry
      ? `best ${industry} website design inspiration 2025 ${query}`
      : `best website design inspiration 2025 ${query}`;

    const results = await this.client.searchAndContents(enhancedQuery, {
      numResults: 5,
      useAutoprompt: true,
      type: "neural",
      text: { maxCharacters: 1000 },
      highlights: { numSentences: 3 },
    });

    return results.results.map((r) => ({
      title: r.title || "",
      url: r.url,
      publishedDate: r.publishedDate,
      author: r.author,
      score: r.score,
      text: r.text || "",
      highlights: (r as any).highlights || [],
      summary: (r as any).summary,
    }));
  }

  /**
   * Research e-commerce best practices
   */
  async searchBestPractices(topic: string, industry?: string): Promise<ExaResult[]> {
    const query = industry
      ? `${industry} ${topic} best practices 2025 conversion optimization`
      : `${topic} best practices 2025 e-commerce`;

    const results = await this.client.searchAndContents(query, {
      numResults: 5,
      useAutoprompt: true,
      type: "neural",
      text: { maxCharacters: 1500 },
      includeDomains: [
        "shopify.com",
        "baymard.org",
        "nngroup.com",
        "smashingmagazine.com",
        "css-tricks.com",
        "web.dev",
      ],
    });

    return results.results.map((r) => ({
      title: r.title || "",
      url: r.url,
      publishedDate: r.publishedDate,
      score: r.score,
      text: r.text || "",
      highlights: (r as any).highlights || [],
    }));
  }

  /**
   * Analyze competitor websites
   */
  async analyzeCompetitors(industry: string, location?: string): Promise<ExaResult[]> {
    const query = location
      ? `top ${industry} companies ${location} website design`
      : `best ${industry} websites 2025`;

    const results = await this.client.searchAndContents(query, {
      numResults: 10,
      useAutoprompt: true,
      type: "neural",
      text: { maxCharacters: 800 },
    });

    return results.results.map((r) => ({
      title: r.title || "",
      url: r.url,
      score: r.score,
      text: r.text || "",
      highlights: [],
    }));
  }

  /**
   * Find specific design patterns
   */
  async findDesignPatterns(pattern: string): Promise<ExaResult[]> {
    const results = await this.client.searchAndContents(
      `${pattern} design pattern examples codepen dribbble`,
      {
        numResults: 8,
        useAutoprompt: true,
        type: "neural",
        text: { maxCharacters: 500 },
        includeDomains: [
          "codepen.io",
          "dribbble.com",
          "behance.net",
          "awwwards.com",
          "cssdesignawards.com",
        ],
      },
    );

    return results.results.map((r) => ({
      title: r.title || "",
      url: r.url,
      score: r.score,
      text: r.text || "",
      highlights: [],
    }));
  }

  /**
   * Research industry trends
   */
  async researchTrends(industry: string, year = 2025): Promise<ExaResult[]> {
    const results = await this.client.searchAndContents(
      `${industry} industry trends ${year} design UX`,
      {
        numResults: 6,
        useAutoprompt: true,
        type: "neural",
        text: { maxCharacters: 1200 },
        startPublishedDate: `${year - 1}-01-01`,
      },
    );

    return results.results.map((r) => ({
      title: r.title || "",
      url: r.url,
      publishedDate: r.publishedDate,
      score: r.score,
      text: r.text || "",
      highlights: (r as any).highlights || [],
    }));
  }

  /**
   * Find accessibility best practices
   */
  async searchAccessibility(componentType: string): Promise<ExaResult[]> {
    const results = await this.client.searchAndContents(
      `${componentType} accessibility WCAG ARIA best practices`,
      {
        numResults: 5,
        useAutoprompt: true,
        type: "neural",
        text: { maxCharacters: 1000 },
        includeDomains: ["w3.org", "webaim.org", "a11yproject.com", "developer.mozilla.org"],
      },
    );

    return results.results.map((r) => ({
      title: r.title || "",
      url: r.url,
      score: r.score,
      text: r.text || "",
      highlights: (r as any).highlights || [],
    }));
  }

  /**
   * Smart search - auto-categorizes and searches appropriately
   */
  async smartSearch(
    query: string,
    context?: {
      industry?: string;
      goal?: "inspiration" | "best-practices" | "trends" | "competitors";
    },
  ): Promise<ExaResult[]> {
    const { industry, goal } = context || {};

    switch (goal) {
      case "inspiration":
        return this.searchDesignInspiration(query, industry);
      case "best-practices":
        return this.searchBestPractices(query, industry);
      case "trends":
        return this.researchTrends(industry || query);
      case "competitors":
        return this.analyzeCompetitors(industry || query);
      default:
        // Auto-detect intent
        if (query.includes("design") || query.includes("inspiration")) {
          return this.searchDesignInspiration(query, industry);
        } else if (query.includes("best practice") || query.includes("how to")) {
          return this.searchBestPractices(query, industry);
        } else {
          return this.researchTrends(query);
        }
    }
  }
}

/**
 * Helper: Format Exa results for AI context
 */
export function formatExaResultsForAI(results: ExaResult[]): string {
  if (results.length === 0) {
    return "No relevant research found.";
  }

  let formatted = "📚 RESEARCH FINDINGS:\n\n";

  results.forEach((result, i) => {
    formatted += `${i + 1}. ${result.title}\n`;
    formatted += `   URL: ${result.url}\n`;
    formatted += `   Score: ${result.score?.toFixed(2) || "N/A"}\n`;

    if (result.highlights && result.highlights.length > 0) {
      formatted += `   Key Points:\n`;
      result.highlights.forEach((h) => {
        formatted += `   • ${h}\n`;
      });
    } else if (result.text) {
      formatted += `   Summary: ${result.text.substring(0, 300)}...\n`;
    }

    formatted += "\n";
  });

  return formatted;
}

/**
 * Helper: Extract design insights from Exa results
 */
export function extractDesignInsights(results: ExaResult[]): {
  colorSchemes: string[];
  layoutPatterns: string[];
  typography: string[];
  animations: string[];
  bestPractices: string[];
} {
  const insights = {
    colorSchemes: [] as string[],
    layoutPatterns: [] as string[],
    typography: [] as string[],
    animations: [] as string[],
    bestPractices: [] as string[],
  };

  results.forEach((result) => {
    const text = (result.text || "").toLowerCase();

    // Extract color mentions
    const colors = text.match(
      /(?:color|palette|scheme)[^.]*(?:black|white|red|blue|green|gold|purple|orange|gradient)[^.]*/g,
    );
    if (colors) insights.colorSchemes.push(...colors.slice(0, 2));

    // Extract layout patterns
    const layouts = text.match(/(?:grid|flex|layout|column|row|sidebar)[^.]*/g);
    if (layouts) insights.layoutPatterns.push(...layouts.slice(0, 2));

    // Extract typography
    const typo = text.match(/(?:font|typography|heading|text)[^.]*/g);
    if (typo) insights.typography.push(...typo.slice(0, 2));

    // Extract animation mentions
    const anims = text.match(/(?:animation|transition|hover|scroll|fade|slide)[^.]*/g);
    if (anims) insights.animations.push(...anims.slice(0, 2));

    // Extract best practices
    if (result.highlights) {
      insights.bestPractices.push(...result.highlights.slice(0, 3));
    }
  });

  return insights;
}
