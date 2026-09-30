import type { RequestHandler } from 'express';
import { countUsers } from '../services/users.service.ts';

// GET /api/users/count (Day 9) — HTTP lang (Day 76)
export const usersCount: RequestHandler = async (_req, res) => {
  const { count, source } = await countUsers();
  // Day 92b: saan galing ang sagot — HIT (Redis), MISS (database, tapos itinabi), BYPASS (walang Redis o patay ito)
  res.set('X-Cache', source.toUpperCase()).json({ count });
};
