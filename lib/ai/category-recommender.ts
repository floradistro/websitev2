/**
 * AI Category Recommender
 * Suggests which categories to display based on location type and business goals
 */

export interface LocationProfile {
  locationType: "checkout" | "entrance" | "waiting" | "wall_menu" | "other";
  dwellTimeSeconds: number;
  viewingDistanceFeet: number;
  businessGoals: string[];
}

export interface CategoryRecommendation {
  recommended: string[];
  reasoning: string;
  alternatives: Array<{
    name: string;
    categories: string[];
    rationale: string;
  }>;
}

export class CategoryRecommender {
  /**
   * Recommend categories based on display location and context
   */
  static recommend(
    location: LocationProfile,
    availableCategories: string[],
    productCounts: { [category: string]: number },
  ): CategoryRecommendation {
    const { locationType, dwellTimeSeconds, businessGoals } = location;

    // Location-specific strategies
    const strategies = {
      checkout: {
        focus: "impulse",
        categories: this.getImpulseCategories(availableCategories),
        reasoning:
          "Checkout displays should show quick-decision, impulse buy items like edibles, beverages, and accessories.",
      },
      entrance: {
        focus: "popular",
        categories: this.getPopularCategories(
          availableCategories,
          productCounts,
        ),
        reasoning:
          "Entrance displays create first impressions. Show your most popular categories to draw customers in.",
      },
      waiting: {
        focus: "educational",
        categories: availableCategories, // Show everything
        reasoning:
          "Waiting areas have longer viewing times. Display full product range with educational content.",
      },
      wall_menu: {
        focus: "comprehensive",
        categories: availableCategories, // Show everything
        reasoning:
          "Main wall menus serve as primary product browser. Display all categories.",
      },
      other: {
        focus: "custom",
        categories: this.getBalancedSelection(availableCategories),
        reasoning: "Balanced category mix for general viewing.",
      },
    };

    const strategy = strategies[locationType] || strategies.other;

    // Adjust based on dwell time
    let finalCategories = strategy.categories;
    if (dwellTimeSeconds < 15 && finalCategories.length > 3) {
      // Short dwell time = fewer categories
      finalCategories = finalCategories.slice(0, 3);
      strategy.reasoning +=
        " Limited to 3 categories due to short viewing time.";
    }

    // Adjust based on business goals
    if (businessGoals.includes("Increase high-margin sales")) {
      finalCategories = this.prioritizeHighMargin(finalCategories);
      strategy.reasoning += " Prioritized high-margin categories.";
    }

    if (businessGoals.includes("Clear old inventory")) {
      // Could filter to categories with excess inventory
      strategy.reasoning += " Consider showing categories with excess stock.";
    }

    // Generate alternatives
    const alternatives = this.generateAlternatives(
      availableCategories,
      locationType,
      productCounts,
    );

    return {
      recommended: finalCategories,
      reasoning: strategy.reasoning,
      alternatives,
    };
  }

  /**
   * Get impulse buy categories
   */
  private static getImpulseCategories(categories: string[]): string[] {
    const impulseTypes = [
      "edibles",
      "beverages",
      "accessories",
      "pre-rolls",
      "tinctures",
    ];
    return categories.filter((cat) =>
      impulseTypes.some((type) => cat.toLowerCase().includes(type)),
    );
  }

  /**
   * Get popular categories (those with most products)
   */
  private static getPopularCategories(
    categories: string[],
    productCounts: { [category: string]: number },
  ): string[] {
    return categories
      .sort((a, b) => (productCounts[b] || 0) - (productCounts[a] || 0))
      .slice(0, 3); // Top 3
  }

  /**
   * Get balanced selection across product types
   */
  private static getBalancedSelection(categories: string[]): string[] {
    // Try to get one from each major type
    const types = {
      flower: categories.find((c) => c.toLowerCase().includes("flower")),
      edible: categories.find((c) => c.toLowerCase().includes("edible")),
      concentrate: categories.find((c) =>
        c.toLowerCase().includes("concentrate"),
      ),
      other: categories.find(
        (c) =>
          !c.toLowerCase().includes("flower") &&
          !c.toLowerCase().includes("edible") &&
          !c.toLowerCase().includes("concentrate"),
      ),
    };

    return Object.values(types).filter(Boolean) as string[];
  }

  /**
   * Prioritize high-margin categories
   */
  private static prioritizeHighMargin(categories: string[]): string[] {
    // In a real system, would query actual margin data
    // For now, assume concentrates/edibles have higher margins
    const highMargin = ["concentrates", "edibles", "tinctures", "vapes"];

    const prioritized = categories.filter((cat) =>
      highMargin.some((type) => cat.toLowerCase().includes(type)),
    );

    return prioritized.length > 0 ? prioritized : categories;
  }

  /**
   * Generate alternative category combinations
   */
  private static generateAlternatives(
    categories: string[],
    locationType: string,
    productCounts: { [category: string]: number },
  ): Array<{ name: string; categories: string[]; rationale: string }> {
    const alternatives = [];

    // Alternative 1: Single category focus
    const topCategory = Object.entries(productCounts).sort(
      ([, a], [, b]) => b - a,
    )[0]?.[0];

    if (topCategory) {
      alternatives.push({
        name: "Single Category Focus",
        categories: [topCategory],
        rationale: `Focus exclusively on ${topCategory} for maximum impact and simplicity.`,
      });
    }

    // Alternative 2: Top performers only
    const topThree = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    if (topThree.length >= 2) {
      alternatives.push({
        name: "Best Sellers",
        categories: topThree,
        rationale:
          "Display only your top-selling categories to maximize conversion.",
      });
    }

    // Alternative 3: Premium only
    const premium = categories.filter((cat) =>
      ["concentrate", "vape", "tincture"].some((type) =>
        cat.toLowerCase().includes(type),
      ),
    );

    if (premium.length > 0) {
      alternatives.push({
        name: "Premium Products",
        categories: premium,
        rationale:
          "Showcase high-margin premium products for increased revenue.",
      });
    }

    return alternatives;
  }
}
