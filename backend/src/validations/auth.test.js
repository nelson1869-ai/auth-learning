import { describe, it, expect } from 'vitest';
import { registerSchema } from './auth.js';

// Unit test: sinusubok ang schema nang mag-isa — walang server, walang database
describe('registerSchema', () => {
  it('lowercases and trims the email', () => {
    // Arrange + Act
    const result = registerSchema.safeParse({ email: '  Ana@Example.COM ', password: 'password123' });
    // Assert — kung mawala ang lowercase, dalawang account ang "Ana@" at "ana@" (Day 14)
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('ana@example.com');
  });

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({ email: 'ana@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('drops unknown fields like role (mass assignment)', () => {
    const result = registerSchema.safeParse({
      email: 'ana@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('role');
  });
});
