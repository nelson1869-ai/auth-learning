import type { RequestHandler } from 'express';
import { countUsers } from '../services/users.service.ts';

// GET /api/users/count (Day 9) — HTTP lang (Day 76)
export const usersCount: RequestHandler = async (_req, res) => {
  res.json({ count: await countUsers() });
};
