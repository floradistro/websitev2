/**
 * Comprehensive Unit Tests for Validation Schemas
 * Tests all validation rules, edge cases, and security constraints
 */

import {
  RegisterSchema,
  LoginSchema,
  validateData,
} from '@/lib/validation/schemas';

describe('RegisterSchema Validation', () => {
  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user_123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        const result = validateData(RegisterSchema, {
          email,
          password: 'ValidPassword123!',
          firstName: 'John',
          lastName: 'Doe',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user..double@example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = validateData(RegisterSchema, {
          email,
          password: 'ValidPassword123!',
          firstName: 'John',
          lastName: 'Doe',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.details.some((e) => e.field === 'email')).toBe(true);
        }
      });
    });

    it('should reject empty email', () => {
      const result = validateData(RegisterSchema, {
        email: '',
        password: 'ValidPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });

    it('should reject email longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateData(RegisterSchema, {
        email: longEmail,
        password: 'ValidPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });

    it('should normalize email to lowercase', () => {
      const result = validateData(RegisterSchema, {
        email: 'USER@EXAMPLE.COM',
        password: 'ValidPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('should trim whitespace from email', () => {
      const result = validateData(RegisterSchema, {
        email: '  user@example.com  ',
        password: 'ValidPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });
  });

  describe('Password Validation', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'ValidPassword123!',
        'SecureP@ssw0rd',
        'MyP@ssw0rd123',
        'C0mpl3x!Pass',
      ];

      validPasswords.forEach((password) => {
        const result = validateData(RegisterSchema, {
          email: 'user@example.com',
          password,
          firstName: 'John',
          lastName: 'Doe',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject password shorter than 12 characters', () => {
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'Short1!',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.details.some((e) => e.message.includes('at least 12'))
        ).toBe(true);
      }
    });

    it('should reject password without uppercase letter', () => {
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'lowercase123!',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.details.some((e) => e.message.includes('uppercase'))
        ).toBe(true);
      }
    });

    it('should reject password without lowercase letter', () => {
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'UPPERCASE123!',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.details.some((e) => e.message.includes('lowercase'))
        ).toBe(true);
      }
    });

    it('should reject password without number', () => {
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'NoNumbersHere!',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.details.some((e) => e.message.includes('number'))).toBe(
          true
        );
      }
    });

    it('should reject password without special character', () => {
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'NoSpecial123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.details.some((e) => e.message.includes('special'))
        ).toBe(true);
      }
    });

    it('should reject password longer than 128 characters', () => {
      const longPassword = 'A1!' + 'a'.repeat(130);
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: longPassword,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });

    it('should return multiple validation errors for weak password', () => {
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.details.length).toBeGreaterThanOrEqual(4);
        expect(result.details.some((e) => e.field === 'password')).toBe(true);
      }
    });
  });

  describe('Name Validation', () => {
    it('should accept valid names', () => {
      const validNames = [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: "O'Brien", lastName: 'Smith' },
        { firstName: 'Mary-Jane', lastName: 'Parker' },
        { firstName: 'Jean', lastName: "D'Arc" },
      ];

      validNames.forEach(({ firstName, lastName }) => {
        const result = validateData(RegisterSchema, {
          email: 'user@example.com',
          password: 'ValidPassword123!',
          firstName,
          lastName,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject names with numbers', () => {
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'ValidPassword123!',
        firstName: 'John123',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });

    it('should reject names with special characters (except apostrophe and hyphen)', () => {
      const invalidNames = ['John@Doe', 'John$Doe', 'John#Doe'];

      invalidNames.forEach((name) => {
        const result = validateData(RegisterSchema, {
          email: 'user@example.com',
          password: 'ValidPassword123!',
          firstName: name,
          lastName: 'Doe',
        });
        expect(result.success).toBe(false);
      });
    });

    it('should reject names longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'ValidPassword123!',
        firstName: longName,
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from names', () => {
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'ValidPassword123!',
        firstName: '  John  ',
        lastName: '  Doe  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('John');
        expect(result.data.lastName).toBe('Doe');
      }
    });

    it('should reject empty names', () => {
      const result = validateData(RegisterSchema, {
        email: 'user@example.com',
        password: 'ValidPassword123!',
        firstName: '',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Security: XSS Prevention', () => {
    it('should reject XSS attempts in name fields', () => {
      const xssPayloads = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<svg onload=alert(1)>',
      ];

      xssPayloads.forEach((payload) => {
        const result = validateData(RegisterSchema, {
          email: 'user@example.com',
          password: 'ValidPassword123!',
          firstName: payload,
          lastName: 'Doe',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Security: SQL Injection Prevention', () => {
    it('should reject SQL injection attempts in email', () => {
      const sqlPayloads = [
        "admin@example.com' OR '1'='1",
        'admin@example.com--',
        "admin@example.com; DROP TABLE users--",
        "admin@example.com' UNION SELECT * FROM users--",
      ];

      sqlPayloads.forEach((payload) => {
        const result = validateData(RegisterSchema, {
          email: payload,
          password: 'ValidPassword123!',
          firstName: 'John',
          lastName: 'Doe',
        });
        expect(result.success).toBe(false);
      });
    });
  });
});

describe('LoginSchema Validation', () => {
  it('should accept valid login credentials', () => {
    const result = validateData(LoginSchema, {
      email: 'user@example.com',
      password: 'ValidPassword123!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = validateData(LoginSchema, {
      email: 'notanemail',
      password: 'ValidPassword123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = validateData(LoginSchema, {
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('should normalize email for login', () => {
    const result = validateData(LoginSchema, {
      email: '  USER@EXAMPLE.COM  ',
      password: 'ValidPassword123!',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });
});

describe('validateData Helper Function', () => {
  it('should return success for valid data', () => {
    const result = validateData(RegisterSchema, {
      email: 'user@example.com',
      password: 'ValidPassword123!',
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should return error details for invalid data', () => {
    const result = validateData(RegisterSchema, {
      email: 'invalid',
      password: 'weak',
      firstName: '',
      lastName: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
      expect(Array.isArray(result.details)).toBe(true);
      expect(result.details.length).toBeGreaterThan(0);
    }
  });

  it('should handle non-Zod errors gracefully', () => {
    const badSchema: any = {
      parse: () => {
        throw new Error('Random error');
      },
    };
    const result = validateData(badSchema, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid input data');
    }
  });
});

describe('Edge Cases', () => {
  it('should handle null values', () => {
    const result = validateData(RegisterSchema, {
      email: null,
      password: null,
      firstName: null,
      lastName: null,
    } as any);
    expect(result.success).toBe(false);
  });

  it('should handle undefined values', () => {
    const result = validateData(RegisterSchema, {
      email: undefined,
      password: undefined,
      firstName: undefined,
      lastName: undefined,
    } as any);
    expect(result.success).toBe(false);
  });

  it('should handle missing required fields', () => {
    const result = validateData(RegisterSchema, {
      email: 'user@example.com',
    } as any);
    expect(result.success).toBe(false);
  });

  it('should handle extra fields gracefully', () => {
    const result = validateData(RegisterSchema, {
      email: 'user@example.com',
      password: 'ValidPassword123!',
      firstName: 'John',
      lastName: 'Doe',
      extraField: 'should be ignored',
    } as any);
    expect(result.success).toBe(true);
  });
});
