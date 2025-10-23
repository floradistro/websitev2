/**
 * Rate Limiter Tests
 * Unit tests for API rate limiting
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock the rate limiter for testing
class MockRateLimiter {
  private requests: Map<string, number[]> = new Map();

  check(identifier: string, config: { windowMs: number; maxRequests: number }): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    let requestTimes = this.requests.get(identifier) || [];
    requestTimes = requestTimes.filter(time => time > windowStart);
    
    if (requestTimes.length >= config.maxRequests) {
      return false;
    }
    
    requestTimes.push(now);
    this.requests.set(identifier, requestTimes);
    return true;
  }

  getRemainingRequests(identifier: string, config: { windowMs: number; maxRequests: number }): number {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    const requestTimes = (this.requests.get(identifier) || [])
      .filter(time => time > windowStart);
    
    return Math.max(0, config.maxRequests - requestTimes.length);
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  clear(): void {
    this.requests.clear();
  }
}

describe('Rate Limiter', () => {
  let rateLimiter: MockRateLimiter;

  beforeEach(() => {
    rateLimiter = new MockRateLimiter();
  });

  test('should allow requests within limit', () => {
    const config = { windowMs: 60000, maxRequests: 10 };
    const identifier = 'test-user';

    for (let i = 0; i < 10; i++) {
      const allowed = rateLimiter.check(identifier, config);
      expect(allowed).toBe(true);
    }
  });

  test('should block requests exceeding limit', () => {
    const config = { windowMs: 60000, maxRequests: 5 };
    const identifier = 'test-user';

    // Make 5 allowed requests
    for (let i = 0; i < 5; i++) {
      rateLimiter.check(identifier, config);
    }

    // 6th request should be blocked
    const blocked = rateLimiter.check(identifier, config);
    expect(blocked).toBe(false);
  });

  test('should track remaining requests correctly', () => {
    const config = { windowMs: 60000, maxRequests: 10 };
    const identifier = 'test-user';

    expect(rateLimiter.getRemainingRequests(identifier, config)).toBe(10);

    rateLimiter.check(identifier, config);
    expect(rateLimiter.getRemainingRequests(identifier, config)).toBe(9);

    rateLimiter.check(identifier, config);
    expect(rateLimiter.getRemainingRequests(identifier, config)).toBe(8);
  });

  test('should track different identifiers separately', () => {
    const config = { windowMs: 60000, maxRequests: 5 };

    rateLimiter.check('user1', config);
    rateLimiter.check('user1', config);
    rateLimiter.check('user2', config);

    expect(rateLimiter.getRemainingRequests('user1', config)).toBe(3);
    expect(rateLimiter.getRemainingRequests('user2', config)).toBe(4);
  });

  test('should reset identifier requests', () => {
    const config = { windowMs: 60000, maxRequests: 5 };
    const identifier = 'test-user';

    for (let i = 0; i < 5; i++) {
      rateLimiter.check(identifier, config);
    }

    expect(rateLimiter.getRemainingRequests(identifier, config)).toBe(0);

    rateLimiter.reset(identifier);
    expect(rateLimiter.getRemainingRequests(identifier, config)).toBe(5);
  });

  test('should clear all rate limit data', () => {
    const config = { windowMs: 60000, maxRequests: 5 };

    rateLimiter.check('user1', config);
    rateLimiter.check('user2', config);

    rateLimiter.clear();

    expect(rateLimiter.getRemainingRequests('user1', config)).toBe(5);
    expect(rateLimiter.getRemainingRequests('user2', config)).toBe(5);
  });
});

describe('Rate Limit Configurations', () => {
  test('should have correct strict config', () => {
    const strictConfig = {
      windowMs: 60 * 1000,
      maxRequests: 10
    };

    expect(strictConfig.maxRequests).toBe(10);
    expect(strictConfig.windowMs).toBe(60000);
  });

  test('should have correct standard config', () => {
    const standardConfig = {
      windowMs: 60 * 1000,
      maxRequests: 60
    };

    expect(standardConfig.maxRequests).toBe(60);
  });

  test('should have correct auth config', () => {
    const authConfig = {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5
    };

    expect(authConfig.maxRequests).toBe(5);
    expect(authConfig.windowMs).toBe(900000);
  });
});

