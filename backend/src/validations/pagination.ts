import { z } from 'zod';

// Pagination (Day 47) — para sa lahat ng listahan: ?page=2&limit=20
// z.coerce: galing sa URL ang query, kaya laging TEXT ("2") → gawing numero (2)
export const paginationSchema = z.object({
  // .int() ng Zod 4 = "safe integer" lang (≤ 9,007,199,254,740,991) — kaya ang ?page=1e20 ay tinatanggihan na,
  // at kasya pa sa bigint ng Postgres ang pinakamalaking OFFSET (sinubukan, Day 47).
  // Ang max na ito ay para sa bilis: binabasa at nilalaktawan ng Postgres ang bawat row ng OFFSET, kaya ang
  // napakalalim na page ay mabagal sa malaking table. Walang may kailangan ng milyong page
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  // Laging may limit ang listahan: kung wala, ang ?limit=999999 ay magpapabagal sa server at database
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;
