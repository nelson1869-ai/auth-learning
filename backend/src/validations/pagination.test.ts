import { describe, it, expect } from 'vitest';
import { paginationSchema } from './pagination.ts';

// Pagination query (Day 47) — ang query ay laging text mula sa URL
describe('paginationSchema', () => {
  it('uses page 1 and limit 20 when nothing is given', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 20 });
  });

  it('turns text from the URL into numbers', () => {
    expect(paginationSchema.parse({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
  });

  it('accepts the maximum limit (100)', () => {
    expect(paginationSchema.parse({ limit: '100' }).limit).toBe(100);
  });

  it.each([
    ['limit too big', { limit: '101' }],
    ['limit 0', { limit: '0' }],
    ['page 0', { page: '0' }],
    ['not a number', { page: 'abc' }],
    ['a fraction', { limit: '2.5' }],
    ['empty', { page: '' }],
    ['a page over our maximum (1,000,000)', { page: '1000001' }],
    // Zod 4 mismo ang tumatanggi: hindi "safe integer" (hindi dahil sa max natin)
    ['a number too big for JavaScript', { page: '1e20' }],
  ])('rejects %s', (_label, query) => {
    expect(paginationSchema.safeParse(query).success).toBe(false);
  });
});
