/**
 * Advanced Rate Limiter for Remove.bg API
 * Based on: https://www.remove.bg/api#api-changelog
 *
 * Rate Limit: 500 images/minute (resolution-dependent)
 * Adaptive concurrency with exponential backoff
 */

interface RateLimitState {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number | null;
}

interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  priority: number;
  retries: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RemoveBgRateLimiter {
  private state: RateLimitState = {
    limit: 500, // 500 images/minute
    remaining: 500,
    reset: Date.now() + 60000,
    retryAfter: null,
  };

  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private maxConcurrency = 50; // Start high, will auto-adjust
  private minConcurrency = 5;
  private processing = false;

  /**
   * Update rate limit state from API response headers
   */
  updateFromHeaders(headers: any) {
    if (headers["x-ratelimit-limit"]) {
      this.state.limit = parseInt(headers["x-ratelimit-limit"]);
    }
    if (headers["x-ratelimit-remaining"]) {
      this.state.remaining = parseInt(headers["x-ratelimit-remaining"]);
    }
    if (headers["x-ratelimit-reset"]) {
      this.state.reset = parseInt(headers["x-ratelimit-reset"]) * 1000;
    }
    if (headers["retry-after"]) {
      this.state.retryAfter = parseInt(headers["retry-after"]) * 1000;
    }

    // Auto-adjust concurrency based on remaining quota
    this.adjustConcurrency();
  }

  /**
   * Adaptive concurrency adjustment
   */
  private adjustConcurrency() {
    const quotaPercentage = (this.state.remaining / this.state.limit) * 100;

    if (quotaPercentage > 80) {
      // High quota - aggressive concurrency
      this.maxConcurrency = 50;
    } else if (quotaPercentage > 50) {
      // Medium quota - moderate concurrency
      this.maxConcurrency = 30;
    } else if (quotaPercentage > 20) {
      // Low quota - conservative concurrency
      this.maxConcurrency = 15;
    } else {
      // Very low quota - minimal concurrency
      this.maxConcurrency = 5;
    }
  }

  /**
   * Calculate optimal batch size based on resolution
   */
  calculateBatchSize(imageSize: "preview" | "full" | "auto" = "full"): number {
    // Resolution affects rate limit differently
    // Full/50MP images count more than preview
    const creditMultiplier = imageSize === "full" ? 1 : 0.5;

    // Calculate how many we can process in current window
    const timeUntilReset = this.state.reset - Date.now();
    const safeMargin = 0.8; // Use 80% of quota for safety

    const availableInWindow = Math.floor((this.state.remaining * safeMargin) / creditMultiplier);

    return Math.min(availableInWindow, this.maxConcurrency);
  }

  /**
   * Exponential backoff with jitter (as recommended by API docs)
   */
  private async exponentialBackoff(retries: number): Promise<void> {
    const maxRetries = 5;
    if (retries >= maxRetries) {
      throw new Error("Max retries exceeded");
    }

    // Exponential backoff: 2^retries + random jitter
    const baseDelay = Math.pow(2, retries) * 1000;
    const jitter = Math.random() * 1000;
    const delay = baseDelay + jitter;

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Queue a request with priority
   */
  async enqueue<T>(id: string, execute: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        execute,
        priority,
        retries: 0,
        resolve,
        reject,
      });

      // Sort by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority);

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the request queue with adaptive concurrency
   */
  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      // Check if we need to wait for rate limit reset
      if (this.state.remaining <= 0 || this.state.retryAfter) {
        const waitTime = this.state.retryAfter || this.state.reset - Date.now();
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          this.state.remaining = this.state.limit;
          this.state.retryAfter = null;
        }
      }

      // Process requests up to max concurrency
      while (
        this.queue.length > 0 &&
        this.activeRequests < this.maxConcurrency &&
        this.state.remaining > 0
      ) {
        const request = this.queue.shift();
        if (!request) break;

        this.activeRequests++;
        this.state.remaining--;

        // Execute with retry logic
        this.executeWithRetry(request).finally(() => {
          this.activeRequests--;
        });

        // Small delay between requests to avoid burst
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Wait a bit before checking queue again
      if (this.queue.length > 0 && this.activeRequests >= this.maxConcurrency) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Exit if queue is empty and no active requests
      if (this.queue.length === 0 && this.activeRequests === 0) {
        break;
      }
    }

    this.processing = false;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(request: QueuedRequest) {
    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error: any) {
      // Check if it's a rate limit error (429)
      if (error.response?.status === 429 || error.message.includes("rate limit")) {
        if (request.retries < 5) {
          // Update state from headers
          if (error.response?.headers) {
            this.updateFromHeaders(error.response.headers);
          }

          // Apply exponential backoff
          await this.exponentialBackoff(request.retries);

          // Re-queue with higher priority
          request.retries++;
          request.priority += 10;
          this.queue.unshift(request); // Add to front
        } else {
          request.reject(new Error(`Rate limit exceeded after ${request.retries} retries`));
        }
      } else {
        // Other error - reject
        request.reject(error);
      }
    }
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrency: this.maxConcurrency,
      remaining: this.state.remaining,
      limit: this.state.limit,
      quotaPercentage: ((this.state.remaining / this.state.limit) * 100).toFixed(1),
    };
  }

  /**
   * Reset limiter (for testing)
   */
  reset() {
    this.queue = [];
    this.activeRequests = 0;
    this.state.remaining = this.state.limit;
    this.state.retryAfter = null;
  }
}

// Singleton instance
export const removeBgRateLimiter = new RemoveBgRateLimiter();
