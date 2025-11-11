/**
 * Unit Tests for API Logger
 * Tests sensitive data redaction, request correlation, and logging functionality
 */

import { NextRequest } from 'next/server';
import {
  generateRequestId,
  logApiRequest,
  logApiResponse,
  logApiError,
  logSecurityEvent,
  createRequestContext,
} from '@/lib/api-logger';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { logger } from '@/lib/logger';

describe('generateRequestId', () => {
  it('should generate a 16-character request ID', () => {
    const id = generateRequestId();
    expect(id).toHaveLength(16);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateRequestId());
    }
    expect(ids.size).toBe(1000); // All unique
  });

  it('should generate alphanumeric IDs', () => {
    const id = generateRequestId();
    expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
  });
});

describe('Sensitive Data Sanitization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redact password field', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const body = {
      email: 'user@example.com',
      password: 'SecretPassword123!',
    };

    logApiRequest(mockRequest, body);

    expect(logger.info).toHaveBeenCalled();
    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.body.password).toBe('[REDACTED]');
    expect(logCall.body.email).toBe('user@example.com');
  });

  it('should redact token fields', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const body = {
      token: 'secret-token-123',
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
    };

    logApiRequest(mockRequest, body);

    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.body.token).toBe('[REDACTED]');
    expect(logCall.body.accessToken).toBe('[REDACTED]');
    expect(logCall.body.refreshToken).toBe('[REDACTED]');
  });

  it('should redact API keys', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const body = {
      apiKey: 'sk-1234567890',
      api_key: 'pk-0987654321',
    };

    logApiRequest(mockRequest, body);

    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.body.apiKey).toBe('[REDACTED]');
    expect(logCall.body.api_key).toBe('[REDACTED]');
  });

  it('should redact credit card data', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const body = {
      creditCard: '4111111111111111',
      credit_card: '4111111111111111',
      cvv: '123',
    };

    logApiRequest(mockRequest, body);

    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.body.creditCard).toBe('[REDACTED]');
    expect(logCall.body.credit_card).toBe('[REDACTED]');
    expect(logCall.body.cvv).toBe('[REDACTED]');
  });

  it('should redact sensitive fields in nested objects', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const body = {
      user: {
        email: 'user@example.com',
        password: 'secret',
        profile: {
          ssn: '123-45-6789',
        },
      },
    };

    logApiRequest(mockRequest, body);

    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.body.user.email).toBe('user@example.com');
    expect(logCall.body.user.password).toBe('[REDACTED]');
    expect(logCall.body.user.profile.ssn).toBe('[REDACTED]');
  });

  it('should redact sensitive fields in arrays', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const body = {
      users: [
        { email: 'user1@example.com', password: 'secret1' },
        { email: 'user2@example.com', password: 'secret2' },
      ],
    };

    logApiRequest(mockRequest, body);

    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.body.users[0].password).toBe('[REDACTED]');
    expect(logCall.body.users[1].password).toBe('[REDACTED]');
    expect(logCall.body.users[0].email).toBe('user1@example.com');
  });

  it('should handle deep nesting without stack overflow', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');

    // Create deeply nested object
    let deepObj: any = { value: 'leaf' };
    for (let i = 0; i < 15; i++) {
      deepObj = { nested: deepObj };
    }

    const body = { data: deepObj };

    expect(() => logApiRequest(mockRequest, body)).not.toThrow();
  });
});

describe('Request Correlation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include request ID in log', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const requestId = 'test-request-id-123';

    logApiRequest(mockRequest, {}, requestId);

    expect(logger.info).toHaveBeenCalled();
    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.requestId).toBe(requestId);
  });

  it('should generate request ID if not provided', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');

    const requestId = logApiRequest(mockRequest);

    expect(requestId).toBeDefined();
    expect(requestId).toHaveLength(16);
  });

  it('should correlate request and response logs', () => {
    const requestId = 'correlated-id-123';
    const endpoint = '/api/test';
    const method = 'POST';

    logApiResponse(requestId, endpoint, method, 200, { success: true }, 100);

    expect(logger.info).toHaveBeenCalled();
    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.requestId).toBe(requestId);
    expect(logCall.endpoint).toBe(endpoint);
    expect(logCall.method).toBe(method);
  });
});

describe('logApiError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log errors with full context', () => {
    const requestId = 'error-request-123';
    const endpoint = '/api/test';
    const method = 'POST';
    const error = new Error('Test error');
    const body = { test: 'data' };

    logApiError(requestId, endpoint, method, error, body, 150);

    expect(logger.error).toHaveBeenCalled();
    const errorCall = (logger.error as jest.Mock).mock.calls[0];
    expect(errorCall[0]).toContain(endpoint);
    expect(errorCall[1]).toBe(error);
    expect(errorCall[2].requestId).toBe(requestId);
    expect(errorCall[2].errorMessage).toBe('Test error');
  });

  it('should include stack trace in error log', () => {
    const error = new Error('Test error');
    logApiError('id', '/api/test', 'POST', error);

    const errorCall = (logger.error as jest.Mock).mock.calls[0];
    expect(errorCall[2].stack).toBeDefined();
  });
});

describe('logSecurityEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log security events with details', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Test Agent',
      },
    });

    logSecurityEvent('Rate limit exceeded', mockRequest, {
      limit: 'auth',
      attempts: 5,
    });

    expect(logger.warn).toHaveBeenCalled();
    const logCall = (logger.warn as jest.Mock).mock.calls[0][1];
    expect(logCall.event).toBe('Rate limit exceeded');
    expect(logCall.limit).toBe('auth');
    expect(logCall.attempts).toBe(5);
  });
});

describe('createRequestContext', () => {
  it('should create request context with all fields', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0',
      },
    });

    const context = createRequestContext(mockRequest);

    expect(context).toHaveProperty('requestId');
    expect(context).toHaveProperty('endpoint');
    expect(context).toHaveProperty('method');
    expect(context).toHaveProperty('ip');
    expect(context).toHaveProperty('userAgent');
    expect(context).toHaveProperty('startTime');
    expect(context.method).toBe('POST');
    expect(context.endpoint).toBe('/api/test');
  });

  it('should accept custom request ID', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');
    const customId = 'custom-id-123';

    const context = createRequestContext(mockRequest, customId);

    expect(context.requestId).toBe(customId);
  });
});

describe('Client IP Extraction', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '203.0.113.1, 192.168.1.1',
      },
    });

    logApiRequest(mockRequest);

    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.ip).toBe('203.0.113.1');
  });

  it('should extract IP from x-real-ip header if x-forwarded-for missing', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-real-ip': '203.0.113.2',
      },
    });

    logApiRequest(mockRequest);

    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.ip).toBe('203.0.113.2');
  });

  it('should handle missing IP headers gracefully', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/test');

    expect(() => logApiRequest(mockRequest)).not.toThrow();
  });
});

describe('Performance Logging', () => {
  it('should log response duration', () => {
    const duration = 123.45;
    logApiResponse('id', '/api/test', 'GET', 200, {}, duration);

    const logCall = (logger.info as jest.Mock).mock.calls[0][1];
    expect(logCall.duration).toBe('123.45ms');
  });

  it('should handle missing duration gracefully', () => {
    logApiResponse('id', '/api/test', 'GET', 200, {});

    expect(logger.info).toHaveBeenCalled();
  });
});

describe('HTTP Status Code Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log 2xx responses as info', () => {
    logApiResponse('id', '/api/test', 'GET', 200, {});
    expect(logger.info).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should log 4xx responses as warn', () => {
    logApiResponse('id', '/api/test', 'GET', 400, {});
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should log 5xx responses as error', () => {
    logApiResponse('id', '/api/test', 'GET', 500, {});
    expect(logger.error).toHaveBeenCalled();
  });
});
