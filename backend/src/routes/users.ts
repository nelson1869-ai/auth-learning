import { Router } from 'express';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

const router = Router();

// Bilang lang, hindi ang listahan — hindi dapat makita ng kahit sino ang email ng lahat
router.get('/users/count', async (_req, res) => {
  const count = await db.$count(users); // SELECT count(*) FROM users
  res.json({ count });
});

export default router;
