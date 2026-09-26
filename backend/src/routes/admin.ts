import { Router } from 'express';
import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { requireRole } from '../middleware/requireRole.ts';
import { paginationSchema, type Pagination } from '../validations/pagination.ts';

const router = Router();

// LAHAT ng /api/admin/* ay dumadaan dito muna: sino ka (401) → admin ka ba (403).
// Isang lugar lang — hindi makakalimutan sa bagong admin route
router.use('/admin', requireAuth, requireRole('admin'));

// Ang `db` mismo, o isang transaction (ginagamit ng test para nakapirmi ang data)
type Reader = Pick<typeof db, 'select' | '$count'>;

// Isang page ng users + ang kabuuang bilang (Day 47)
export async function listUsers(database: Reader, { page, limit }: Pagination) {
  const [list, total] = await Promise.all([
    database
      .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
      .from(users)
      // Pinakabago muna. Laging iisang ayos (id ay natatangi) — kung wala, puwedeng magpalit ang ayos
      // sa pagitan ng mga page at may lalaktawan o uulitin
      .orderBy(desc(users.id))
      .limit(limit)
      .offset((page - 1) * limit), // page 1 → laktawan ang 0 · page 2 → laktawan ang 20 ...
    database.$count(users),
  ]);
  return { users: list, page, limit, total, totalPages: Math.ceil(total / limit) };
}

// GET /api/admin/users?page=1&limit=20
router.get('/admin/users', async (req, res) => {
  const result = paginationSchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', fields: z.flattenError(result.error).fieldErrors });
  }
  res.json(await listUsers(db, result.data));
});

export default router;
