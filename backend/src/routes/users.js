import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

const router = Router();

// Bilang lang, hindi ang listahan — hindi dapat makita ng kahit sino ang email ng lahat
router.get('/users/count', async (req, res) => {
  const count = await db.$count(users); // SELECT count(*) FROM users
  res.json({ count });
});

export default router;
