import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { registerSchema } from '../validations/auth.js';

const router = Router();

router.post('/auth/register', async (req, res) => {
  // Suriin at linisin ang input BAGO gamitin — maling input = 400, hindi 500
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid input',
      fields: z.flattenError(result.error).fieldErrors,
    });
  }
  const { email, password, name } = result.data; // ang NALINIS na data, hindi req.body

  // Hash BAGO i-save — hindi kailanman plain text sa database
  const passwordHash = await argon2.hash(password);

  try {
    // INSERT agad, walang "SELECT muna" — ang UNIQUE ng database ang huling bantay (kahit sabay ang 2 request)
    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash })
      // Piling column lang — hindi dapat lumabas ang password_hash kahit hash pa
      .returning({ id: users.id, email: users.email, name: users.name });
    res.status(201).json({ user });
  } catch (err) {
    // 23505 = unique violation ng Postgres. Nasa err.cause, hindi err.code (binabalot ni Drizzle)
    if (err.cause?.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err; // ibang error → hayaan si Express (500)
  }
});

export default router;
