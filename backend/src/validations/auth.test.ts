import { describe, it, expect } from 'vitest';
import { registerSchema } from './auth.ts';

// Unit test: sinusubok ang schema nang mag-isa — walang server, walang database
describe('registerSchema', () => {
  it('lowercases and trims the email', () => {
    // parse (hindi safeParse): nagtatapon kapag mali — kaya alam ng TypeScript na may data dito
    const data = registerSchema.parse({ email: '  Ana@Example.COM ', password: 'password123' });
    // kung mawala ang lowercase, dalawang account ang "Ana@" at "ana@" (Day 14)
    expect(data.email).toBe('ana@example.com');
  });

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({ email: 'ana@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('drops unknown fields like role (mass assignment)', () => {
    const data = registerSchema.parse({
      email: 'ana@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(data).not.toHaveProperty('role');
  });
});
