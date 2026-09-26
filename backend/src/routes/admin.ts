import { Router } from 'express';
import { desc } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { requireRole } from '../middleware/requireRole.ts';

const router = Router();

// LAHAT ng /api/admin/* ay dumadaan dito muna: sino ka (401) → admin ka ba (403).
// Isang lugar lang — hindi makakalimutan sa bagong admin route
router.use('/admin', requireAuth, requireRole('admin'));

// Mga pinakabagong user (Day 46). Laging may limit — sa Day 47: page at limit mula sa query
router.get('/admin/users', async (_req, res) => {
  const list = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.id))
    .limit(20);
  res.json({ users: list });
});

export default router;
