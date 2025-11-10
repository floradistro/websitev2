/**
 * AI Layout Optimizer - Rule-based smart layout engine
 * Analyzes display constraints and product data to generate optimal layouts
 */

export interface DisplayProfile {
  screenWidthInches: number;
  screenHeightInches: number;
  resolutionWidth: number;
  resolutionHeight: number;
  viewingDistanceFeet: number;
  locationType: "checkout" | "entrance" | "waiting" | "wall_menu";
  ambientLighting: "bright" | "medium" | "dim";
  dwellTimeSeconds: number;
}

export interface ProductData {
  totalProducts: number;
  avgFieldsPerProduct: number; // THC, CBD, price tiers, etc.
  hasImages: boolean;
  hasTieredPricing: boolean;
  activePromotions: number;
  categories: string[];
}

export interface OptimalLayout {
  displayMode: "dense" | "carousel";
  gridColumns: number;
  gridRows: number;
  productsPerPage: number;

  typography: {
    productNameSize: number;
    priceSize: number;
    detailsSize: number;
    minReadableSize: number;
  };

  spacing: {
    cardPadding: number;
    gridGap: number;
    margins: number;
  };

  contentStrategy: {
    showImages: boolean;
    showDescriptions: boolean;
    emphasizePromotions: boolean;
    maxTiersToShow: number;
  };

  carouselConfig?: {
    rotationSpeed: number; // seconds
    transitionDuration: number;
  };

  reasoning: string[];
  confidenceScore: number; // 0-100
}

export class LayoutOptimizer {
  /**
   * Main optimization function
   */
  static optimize(
    display: DisplayProfile,
    products: ProductData,
  ): OptimalLayout {
    const reasoning: string[] = [];

    // Calculate optimal font size based on viewing distance
    const minFontSize = this.calculateMinReadableFont(
      display.viewingDistanceFeet,
    );
    reasoning.push(
      `Minimum readable font: ${minFontSize}px (viewing distance: ${display.viewingDistanceFeet}ft)`,
    );

    // Calculate pixels per inch for this display
    const ppi = this.calculatePPI(display);
    reasoning.push(`Display PPI: ${ppi.toFixed(1)}`);

    // Determine if we can fit all products or need carousel
    const maxComfortableProducts = this.calculateMaxProducts(
      display,
      products,
      minFontSize,
    );
    const needsCarousel = products.totalProducts > maxComfortableProducts;

    if (needsCarousel) {
      reasoning.push(
        `${products.totalProducts} products exceed comfortable limit of ${maxComfortableProducts} - using carousel mode`,
      );
    } else {
      reasoning.push(
        `${products.totalProducts} products fit comfortably - using dense mode`,
      );
    }

    // Calculate optimal grid layout
    const grid = this.calculateOptimalGrid(
      display,
      needsCarousel ? maxComfortableProducts : products.totalProducts,
      products,
    );
    reasoning.push(
      `Optimal grid: ${grid.columns}x${grid.rows} (${grid.columns * grid.rows} products per page)`,
    );

    // Adjust typography based on display characteristics
    const typography = this.calculateTypography(
      display,
      products,
      grid,
      minFontSize,
    );

    // Determine content strategy
    const contentStrategy = this.determineContentStrategy(
      display,
      products,
      grid,
    );
    if (!contentStrategy.showImages) {
      reasoning.push("Hiding images to maximize product count and readability");
    }
    if (contentStrategy.emphasizePromotions) {
      reasoning.push("Emphasizing promotions due to active deals");
    }

    // Calculate spacing for optimal readability
    const spacing = this.calculateSpacing(display, grid);

    // Carousel configuration if needed
    let carouselConfig;
    if (needsCarousel) {
      carouselConfig = this.calculateCarouselTiming(display, products);
      reasoning.push(
        `Carousel: ${carouselConfig.rotationSpeed}s per page (${display.dwellTimeSeconds}s avg dwell time)`,
      );
    }

    // Calculate confidence score
    const confidence = this.calculateConfidence(
      display,
      products,
      grid,
      needsCarousel,
    );
    reasoning.push(`Confidence: ${confidence}%`);

    return {
      displayMode: needsCarousel ? "carousel" : "dense",
      gridColumns: grid.columns,
      gridRows: grid.rows,
      productsPerPage: grid.columns * grid.rows,
      typography,
      spacing,
      contentStrategy,
      carouselConfig,
      reasoning,
      confidenceScore: confidence,
    };
  }

  /**
   * Calculate minimum readable font size based on viewing distance
   * Rule of thumb: 1 inch of letter height per 10 feet of viewing distance
   */
  private static calculateMinReadableFont(viewingDistanceFeet: number): number {
    // Base calculation
    const minInches = viewingDistanceFeet / 10;
    const minPixels = minInches * 72; // Approximate pixels per inch

    // Clamp to reasonable bounds
    return Math.max(16, Math.min(48, Math.round(minPixels)));
  }

  /**
   * Calculate pixels per inch for the display
   */
  private static calculatePPI(display: DisplayProfile): number {
    const diagonalInches = Math.sqrt(
      display.screenWidthInches ** 2 + display.screenHeightInches ** 2,
    );
    const diagonalPixels = Math.sqrt(
      display.resolutionWidth ** 2 + display.resolutionHeight ** 2,
    );
    return diagonalPixels / diagonalInches;
  }

  /**
   * Calculate maximum products that can comfortably fit on screen
   */
  private static calculateMaxProducts(
    display: DisplayProfile,
    products: ProductData,
    minFontSize: number,
  ): number {
    // Estimate card height based on content
    const baseCardHeight = minFontSize * 12; // Rough estimate
    const cardHeight = baseCardHeight * (products.avgFieldsPerProduct / 4);

    // Calculate how many fit vertically
    const availableHeight = display.resolutionHeight * 0.85; // Leave margin
    const maxRows = Math.floor(availableHeight / cardHeight);

    // Calculate how many fit horizontally
    const minCardWidth = 200; // Minimum readable card width
    const availableWidth = display.resolutionWidth * 0.95;
    const maxColumns = Math.floor(availableWidth / minCardWidth);

    return Math.max(12, maxRows * maxColumns);
  }

  /**
   * Calculate optimal grid dimensions
   */
  private static calculateOptimalGrid(
    display: DisplayProfile,
    targetProducts: number,
    products: ProductData,
  ): { columns: number; rows: number } {
    const aspectRatio = display.resolutionWidth / display.resolutionHeight;

    // Start with square root for balanced grid
    let columns = Math.ceil(Math.sqrt(targetProducts * aspectRatio));
    let rows = Math.ceil(targetProducts / columns);

    // Adjust based on location type
    if (display.locationType === "checkout") {
      // Checkout: Wider, shorter (people are close)
      columns = Math.min(columns + 1, 8);
      rows = Math.ceil(targetProducts / columns);
    } else if (display.locationType === "entrance") {
      // Entrance: Fewer items, bigger cards (quick glance)
      columns = Math.max(3, Math.floor(columns * 0.75));
      rows = Math.max(2, Math.floor(rows * 0.75));
    }

    // Clamp to reasonable bounds
    columns = Math.max(2, Math.min(8, columns));
    rows = Math.max(2, Math.min(6, rows));

    return { columns, rows };
  }

  /**
   * Calculate typography scale
   */
  private static calculateTypography(
    display: DisplayProfile,
    products: ProductData,
    grid: { columns: number; rows: number },
    minFontSize: number,
  ) {
    // More products = smaller fonts
    const densityFactor = (grid.columns * grid.rows) / 12;
    const scaleFactor = 1 / Math.sqrt(densityFactor);

    return {
      productNameSize: Math.round(minFontSize * 1.2 * scaleFactor),
      priceSize: Math.round(minFontSize * 1.8 * scaleFactor),
      detailsSize: Math.round(minFontSize * 0.8 * scaleFactor),
      minReadableSize: minFontSize,
    };
  }

  /**
   * Determine content strategy (what to show/hide)
   */
  private static determineContentStrategy(
    display: DisplayProfile,
    products: ProductData,
    grid: { columns: number; rows: number },
  ) {
    const density = grid.columns * grid.rows;

    return {
      showImages: density <= 12 && products.hasImages,
      showDescriptions: density <= 8,
      emphasizePromotions: products.activePromotions > 0,
      maxTiersToShow: density <= 12 ? 4 : density <= 20 ? 3 : 2,
    };
  }

  /**
   * Calculate spacing for optimal readability
   */
  private static calculateSpacing(
    display: DisplayProfile,
    grid: { columns: number; rows: number },
  ) {
    const density = grid.columns * grid.rows;
    const basePadding = 16;

    return {
      cardPadding: Math.round(basePadding / Math.sqrt(density / 12)),
      gridGap: Math.round((basePadding * 1.5) / Math.sqrt(density / 12)),
      margins: Math.round(basePadding * 2),
    };
  }

  /**
   * Calculate carousel timing based on dwell time
   */
  private static calculateCarouselTiming(
    display: DisplayProfile,
    products: ProductData,
  ) {
    // Rule: Give 50% of dwell time per page
    const rotationSpeed = Math.max(
      10,
      Math.round(display.dwellTimeSeconds * 0.5),
    );

    return {
      rotationSpeed,
      transitionDuration: 1000, // 1 second transition
    };
  }

  /**
   * Calculate confidence score for this layout
   */
  private static calculateConfidence(
    display: DisplayProfile,
    products: ProductData,
    grid: { columns: number; rows: number },
    needsCarousel: boolean,
  ): number {
    let score = 100;

    // Deduct for very high density
    const density = grid.columns * grid.rows;
    if (density > 30) score -= 20;
    else if (density > 20) score -= 10;

    // Deduct for very low density (wasted space)
    if (density < 6) score -= 15;

    // Deduct if carousel is needed (less ideal)
    if (needsCarousel) score -= 10;

    // Deduct for very short viewing distance with many products
    if (display.viewingDistanceFeet < 5 && density > 15) score -= 15;

    // Bonus for optimal conditions
    if (density >= 8 && density <= 16 && !needsCarousel) score += 10;

    return Math.max(0, Math.min(100, score));
  }
}
